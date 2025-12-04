import { Injectable, Logger } from "@nestjs/common";
import { MongoService } from "../../../infra/mongo/mongo.service";
import { MongoTtlManager } from "../../../infra/mongo/mongo-ttl.manager";
import { InterpretationMessage } from "../messages/interfaces/message.types";
import { FailedEntry } from "../dlq/interfaces/failed-entry.interface";
import { interpretationArchiveConfig } from "../config/archive.config";

interface FailureArchiveDocument {
  requestId: string;
  userId: string;
  username: string;
  payload: string;
  failedAt: string;
  errorMessage: string;
  storedAt: string;
}

@Injectable()
export class FailureArchiveStore {
  private readonly logger = new Logger(FailureArchiveStore.name);
  private readonly fallbackStore = new Map<string, FailureArchiveDocument>();
  private readonly collectionName = "interpretation_failures";
  private readonly ttlSeconds: number;

  constructor(
    private readonly mongoService: MongoService,
    private readonly ttlManager: MongoTtlManager
  ) {
    const ttlDays = interpretationArchiveConfig.failureTtlDays ?? 0;
    this.ttlSeconds = ttlDays > 0 ? ttlDays * 24 * 60 * 60 : 0;
  }

  public async saveFailure(message: InterpretationMessage, reason: string) {
    const entry: FailureArchiveDocument = {
      requestId: message.requestId,
      userId: message.userId,
      username: message.username,
      payload: JSON.stringify(message.payload),
      failedAt: new Date().toISOString(),
      errorMessage: reason,
      storedAt: new Date().toISOString(),
    };

    const collection = await this.getCollectionWithTtl();
    if (!collection) {
      this.storeFallback(entry);
      return;
    }

    try {
      await collection.updateOne(
        { requestId: entry.requestId },
        { $set: entry },
        { upsert: true }
      );
    } catch (error) {
      this.logger.error(
        `[FailureArchiveStore] 요청 ${entry.requestId} 저장 실패 – fallback 저장`,
        (error as Error)?.message
      );
      this.storeFallback(entry);
    }
  }

  public async listByUser(userId: string, limit: number): Promise<FailedEntry[]> {
    const collection = await this.getCollectionWithTtl();
    if (!collection) {
      return this.listFromFallback(userId, limit);
    }

    try {
      const docs: FailureArchiveDocument[] = await collection
        .find({ userId })
        .sort({ failedAt: -1 })
        .limit(limit)
        .toArray();
      return docs.map((doc) => this.toFailedEntry(doc));
    } catch (error) {
      this.logger.error(
        "[FailureArchiveStore] MongoDB 조회 실패 – fallback 사용",
        (error as Error)?.message
      );
      return this.listFromFallback(userId, limit);
    }
  }

  public async findByRequestId(requestId: string): Promise<FailedEntry | undefined> {
    const collection = await this.getCollectionWithTtl();
    if (!collection) {
      return this.fromFallback(requestId);
    }

    try {
      const doc = (await collection.findOne({ requestId })) as | FailureArchiveDocument | null;
      if (!doc) {
        return this.fromFallback(requestId);
      }
      return this.toFailedEntry(doc);
    } catch (error) {
      this.logger.error(
        `[FailureArchiveStore] MongoDB 조회 실패 (requestId=${requestId})`,
        (error as Error)?.message
      );
      return this.fromFallback(requestId);
    }
  }

  public async delete(requestId: string) {
    const collection = await this.getCollectionWithTtl();
    try {
      if (collection) {
        await collection.deleteOne({ requestId });
      }
    } catch (error) {
      this.logger.error(
        `[FailureArchiveStore] MongoDB 삭제 실패 (requestId=${requestId})`
      );
    } finally {
      this.fallbackStore.delete(requestId);
    }
  }

  private async getCollectionWithTtl() {
    const collection = this.mongoService.getCollection(this.collectionName);
    if (!collection) {
      return null;
    }
    await this.ttlManager.ensureIndex(collection, "failedAt", this.ttlSeconds);
    return collection;
  }

  // mongo 조차 안될때를 위한 fallback : 메모리 저장
  private storeFallback(entry: FailureArchiveDocument) {
    this.fallbackStore.set(entry.requestId, entry);
  }

  private listFromFallback(userId: string, limit: number): FailedEntry[] {
    return [...this.fallbackStore.values()]
      .filter((entry) => entry.userId === userId)
      .sort(
        (a, b) =>
          new Date(b.failedAt).getTime() - new Date(a.failedAt).getTime()
      )
      .slice(0, limit)
      .map((entry) => this.toFailedEntry(entry));
  }

  private fromFallback(requestId: string): FailedEntry | undefined {
    const entry = this.fallbackStore.get(requestId);
    return entry ? this.toFailedEntry(entry) : undefined;
  }

  private toFailedEntry(doc: FailureArchiveDocument): FailedEntry {
    return {
      streamId: `archive:${doc.requestId}`,
      requestId: doc.requestId,
      userId: doc.userId,
      username: doc.username,
      errorMessage: doc.errorMessage,
      failedAt: doc.failedAt,
      payload: JSON.parse(doc.payload),
    };
  }
}
