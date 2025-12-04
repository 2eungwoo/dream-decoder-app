import { Injectable } from "@nestjs/common";
import { INTERPRETATION_DLQ_KEY } from "../config/storage.config";
import { InterpretationRequestPublisher } from "../publisher/request.publisher";
import { InterpretationUserContext } from "../messages/interfaces/message.types";
import { FailedEntry } from "./interfaces/failed-entry.interface";
import { DlqEntryParser } from "./helpers/dlq-entry.parser";
import { DlqValidator } from "./validation/dlq.validator";
import { RedisStreamService } from "../../redis-stream.service";
import { FailureArchiveStore } from "../archive/failure-archive.store";

@Injectable()
export class InterpretationDlqService {
  constructor(
    private readonly redisStream: RedisStreamService,
    private readonly requestPublisher: InterpretationRequestPublisher,
    private readonly validator: DlqValidator,
    private readonly parser: DlqEntryParser,
    private readonly failureArchive: FailureArchiveStore
  ) {}

  public async failedListByUser(userId: string, limit = 50): Promise<FailedEntry[]> {
    // redis 살아있으면 redis에서 fetch
    const redisEntries = await this.fetchFromRedis(userId, limit);
    if (redisEntries.length) {
      return redisEntries;
    }

    // redis 죽어서 못찾아오면 mongo에서 fetch
    return this.failureArchive.listByUser(userId, limit);
  }

  public async retryEntry(user: InterpretationUserContext, requestId: string): Promise<string> {
    const located = await this.findEntryByRequestId(requestId);
    this.validator.validateEntryExists(located?.entry);
    this.validator.validateOwner(located?.entry, user.id);

    const { requestId: newRequestId } = await this.requestPublisher.publish(
      user,
      located!.entry.payload
    );

    // redis 살아있으면
    if (located?.source === "redis") {
      await this.redisStream.delete(
        INTERPRETATION_DLQ_KEY,
        located.entry.streamId
      );
    } else if (located?.source === "archive") {
      await this.failureArchive.delete(located.entry.requestId);
    }
    return newRequestId;
  }

  private async fetchFromRedis(userId: string, limit: number) {
    try {
      const entries = await this.redisStream.reverseRange(
INTERPRETATION_DLQ_KEY,
        limit
      );
      return entries
        .map(([streamId, fields]) => this.parser.parse(streamId, fields))
        .filter((entry): entry is FailedEntry => Boolean(entry))
        .filter((entry) => entry.userId === userId)
        .sort((a, b) =>
            new Date(b.failedAt).getTime() - new Date(a.failedAt).getTime()
        )
        .slice(0, limit);
    } catch (error) {
      return [];
    }
  }

  private async findEntryByRequestId(requestId: string)
      : Promise<{ entry: FailedEntry; source: "redis" | "archive" } | undefined>
  {
    const entries = await this.redisStream.range(
      INTERPRETATION_DLQ_KEY,
      "-",
      "+"
    );
    const redisEntry = entries
      .map(([streamId, fields]) => this.parser.parse(streamId, fields))
      .find((entry) => entry?.requestId === requestId);
    if (redisEntry) {
      return { entry: redisEntry, source: "redis" };
    }

    const archived = await this.failureArchive.findByRequestId(requestId);
    if (archived) {
      return { entry: archived, source: "archive" };
    }

    return undefined;
  }
}
