import { Injectable } from "@nestjs/common";
import { INTERPRETATION_DLQ_KEY } from "../config/storage.config";
import { InterpretationRequestPublisher } from "../publisher/request.publisher";
import { InterpretationUserContext } from "../messages/interfaces/message.types";
import { FailedEntry } from "./interfaces/failed-entry.interface";
import { DlqEntryParser } from "./helpers/dlq-entry.parser";
import { DlqValidator } from "./validation/dlq.validator";
import { RedisStreamService } from "../../redis-stream.service";
import { InterpretationFailureArchiveService } from "./interpretation-failure-archive.service";

@Injectable()
export class InterpretationDlqService {
  constructor(
    private readonly redisStream: RedisStreamService,
    private readonly requestPublisher: InterpretationRequestPublisher,
    private readonly validator: DlqValidator,
    private readonly parser: DlqEntryParser,
    private readonly failureArchive: InterpretationFailureArchiveService
  ) {}

  public async listByUser(userId: string, limit = 50): Promise<FailedEntry[]> {
    const entries = await this.redisStream.reverseRange(
      INTERPRETATION_DLQ_KEY,
      limit
    );
    const redisEntries = entries
      .map(([streamId, fields]) => this.parser.parse(streamId, fields))
      .filter((entry): entry is FailedEntry => Boolean(entry))
      .filter((entry) => entry.userId === userId);
    const archivedEntries = await this.failureArchive.listByUser(
      userId,
      limit
    );

    return [...redisEntries, ...archivedEntries]
      .sort(
        (a, b) =>
          new Date(b.failedAt).getTime() - new Date(a.failedAt).getTime()
      )
      .slice(0, limit);
  }

  public async retryEntry(
    user: InterpretationUserContext,
    requestId: string
  ): Promise<string> {
    const located = await this.findEntryByRequestId(requestId);
    this.validator.validateEntryExists(located?.entry);
    this.validator.validateOwner(located?.entry, user.id);

    const { requestId: newRequestId } = await this.requestPublisher.publish(
      user,
      located!.entry.payload
    );

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

  private async findEntryByRequestId(
    requestId: string
  ): Promise<{ entry: FailedEntry; source: "redis" | "archive" } | undefined> {
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
