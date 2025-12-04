import { Injectable, Logger } from "@nestjs/common";
import { MongoService } from "../../../infra/mongo/mongo.service";
import { MongoTtlManager } from "../../../infra/mongo/mongo-ttl.manager";
import { InterpretationMessage } from "../messages/interfaces/message.types";
import { FailedEntry } from "../dlq/interfaces/failed-entry.interface";
import { interpretationArchiveConfig } from "../config/archive.config";
import {FailureArchiveFallback} from "./failure-archive-fallback";
import {FailureArchiveDocument} from "./failure-archive-document";

@Injectable()
export class FailureArchiveStore {
  private readonly logger = new Logger(FailureArchiveStore.name);
  private readonly fallback = new FailureArchiveFallback();
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
    const entry = this.fallback.toDocument({
      streamId: "", // redis stream id를 컨슈머에서 리턴안했으므로 공백 임시값
      requestId: message.requestId,
      userId: message.userId,
      username: message.username,
      payload: message.payload,
      failedAt: new Date().toISOString(),
      errorMessage: reason,
    });

    const collection = await this.getCollectionWithTtl();
    if (!collection) {
      this.fallback.save(entry);
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
      this.fallback.save(entry);
    }
  }

  public async listByUser(userId: string, limit: number): Promise<FailedEntry[]> {
    const collection = await this.getCollectionWithTtl();
    if (!collection) {
      return this.fallback.listByUser(userId, limit);
    }

    try {
      const docs = (await collection
        .find({ userId })
        .sort({ failedAt: -1 })
        .limit(limit)
        .toArray()) as FailureArchiveDocument[];
      return docs.map((doc) => this.fallback.toFailedEntry(doc));
    } catch (error) {
      this.logger.error(
        "[FailureArchiveStore] MongoDB 조회 실패 – fallback 사용",
        (error as Error)?.message
      );
      return this.fallback.listByUser(userId, limit);
    }
  }

  public async findByRequestId(requestId: string): Promise<FailedEntry | undefined> {
    const collection = await this.getCollectionWithTtl();
    if (!collection) {
      return this.fallback.findByRequestId(requestId);
    }

    try {
      const doc = (await collection.findOne({
        requestId,
      })) as FailureArchiveDocument | null;
      if (!doc) {
        return this.fallback.findByRequestId(requestId);
      }
      return this.fallback.toFailedEntry(doc);
    } catch (error) {
      this.logger.error(
        `[FailureArchiveStore] MongoDB 조회 실패 (requestId=${requestId})`,
        (error as Error)?.message
      );
      return this.fallback.findByRequestId(requestId);
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
      this.fallback.delete(requestId);
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

}
