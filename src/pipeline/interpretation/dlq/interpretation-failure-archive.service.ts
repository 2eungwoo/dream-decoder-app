import { Injectable, Logger } from "@nestjs/common";
import { MongoService } from "../../../infra/mongo/mongo.service";
import { InterpretationMessage } from "../messages/interfaces/message.types";
import { FailedEntry } from "./interfaces/failed-entry.interface";

interface ArchivedFailedEntry {
  requestId: string;
  userId: string;
  username: string;
  payload: string;
  failedAt: string;
  errorMessage: string;
  storedAt: string;
}

@Injectable()
export class InterpretationFailureArchiveService {
  private readonly logger = new Logger(InterpretationFailureArchiveService.name);
  private readonly fallbackStore = new Map<string, ArchivedFailedEntry>();
  private readonly collectionName = "interpretation_failures";

  constructor(private readonly mongoService: MongoService) {}

  public async save(message: InterpretationMessage, reason: string) {
    const entry: ArchivedFailedEntry = {
      requestId: message.requestId,
      userId: message.userId,
      username: message.username,
      payload: JSON.stringify(message.payload),
      failedAt: new Date().toISOString(),
      errorMessage: reason,
      storedAt: new Date().toISOString(),
    };

    const collection = this.mongoService.getCollection(this.collectionName);
    if (!collection) {
      this.fallbackStore.set(entry.requestId, entry);
      this.logger.warn(
        `[Archive] MongoDB 미연결 상태이므로 요청 ${entry.requestId} 를 메모리에 임시 보관`
      );
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
        `[Archive] 요청 ${entry.requestId} 저장 실패 – 임시 메모리에 보관`,
        (error as Error)?.message
      );
      this.fallbackStore.set(entry.requestId, entry);
    }
  }

  public async listByUser(
    userId: string,
    limit: number
  ): Promise<FailedEntry[]> {
    const collection = this.mongoService.getCollection(this.collectionName);
    if (!collection) {
      return this.resolveFromFallback(userId, limit);
    }

    try {
      const docs: ArchivedFailedEntry[] = await collection
        .find({ userId })
        .sort({ failedAt: -1 })
        .limit(limit)
        .toArray();
      return docs.map((doc) => this.toFailedEntry(doc));
    } catch (error) {
      this.logger.error(
        "[Archive] MongoDB 조회 실패 – 임시 저장소 이동",
        (error as Error)?.message
      );
      return this.resolveFromFallback(userId, limit);
    }
  }

  public async findByRequestId(
    requestId: string
  ): Promise<FailedEntry | undefined> {
    const collection = this.mongoService.getCollection(this.collectionName);
    if (!collection) {
      return this.fromFallback(requestId);
    }

    try {
      const doc = (await collection.findOne({ requestId })) as
        | ArchivedFailedEntry
        | null;
      if (!doc) {
        return this.fromFallback(requestId);
      }
      return this.toFailedEntry(doc);
    } catch (error) {
      this.logger.error(
        `[Archive] MongoDB 조회 실패 (requestId=${requestId})`,
        (error as Error)?.message
      );
      return this.fromFallback(requestId);
    }
  }

  public async delete(requestId: string) {
    const collection = this.mongoService.getCollection(this.collectionName);
    if (!collection) {
      this.fallbackStore.delete(requestId);
      return;
    }

    try {
      await collection.deleteOne({ requestId });
    } catch (error) {
      this.logger.error(
        `[Archive] MongoDB 삭제 실패 (requestId=${requestId}) – fallback 에서 제거 시도`,
        (error as Error)?.message
      );
    } finally {
      this.fallbackStore.delete(requestId);
    }
  }

  private resolveFromFallback(userId: string, limit: number): FailedEntry[] {
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

  private toFailedEntry(entry: ArchivedFailedEntry): FailedEntry {
    return {
      streamId: `archive:${entry.requestId}`,
      requestId: entry.requestId,
      userId: entry.userId,
      username: entry.username,
      errorMessage: entry.errorMessage,
      failedAt: entry.failedAt,
      payload: JSON.parse(entry.payload),
    };
  }
}
