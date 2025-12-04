import { Module } from "@nestjs/common";
import { RedisModule } from "../infra/redis/redis.module";
import { MongoModule } from "../infra/mongo/mongo.module";
import { InterpretationStreamWriter } from "./interpretation/streams/stream.writer";
import { InterpretationStreamReader } from "./interpretation/streams/stream.reader";
import { InterpretationStatusStore } from "./interpretation/status/status.store";
import { InterpretationStatusValidator } from "./interpretation/status/validation/status.validator";
import { InterpretationStatusRepository } from "./interpretation/status/status.repository";
import { InterpretationStatusLogger } from "./interpretation/status/status.logger";
import { InterpretationRequestPublisher } from "./interpretation/publisher/request.publisher";
import { InterpretationMessageFactory } from "./interpretation/messages/message.factory";
import { InterpretationMessageSerializer } from "./interpretation/messages/message.serializer";
import { InterpretationPayloadParser } from "./interpretation/messages/helpers/interpretation-payload.parser";
import { InterpretationDlqWriter } from "./interpretation/dlq/dlq.writer";
import { InterpretationDlqService } from "./interpretation/dlq/dlq.service";
import { DlqValidator } from "./interpretation/dlq/validation/dlq.validator";
import { DlqEntryParser } from "./interpretation/dlq/helpers/dlq-entry.parser";
import { RedisStreamService } from "./redis-stream.service";
import { InterpretationStreamLogService } from "./interpretation/logging/stream-log.service";
import { FailureArchiveStore } from "./interpretation/archive/failure-archive.store";
import { RequestBackupStore } from "./interpretation/archive/request-backup.store";
import { RequestRecoveryWorker } from "./interpretation/recovery/request-recovery.service";

@Module({
  imports: [
    RedisModule,
    MongoModule,
  ],
  providers: [
    RedisStreamService,
    InterpretationStreamLogService,
    InterpretationStreamWriter,
    InterpretationStreamReader,
    InterpretationStatusRepository,
    InterpretationStatusStore,
    InterpretationStatusValidator,
    InterpretationStatusLogger,
    InterpretationStatusValidator,
    InterpretationRequestPublisher,
    InterpretationMessageFactory,
    InterpretationMessageSerializer,
    InterpretationPayloadParser,
    InterpretationDlqWriter,
    FailureArchiveStore,
    RequestBackupStore,
    RequestRecoveryWorker,
    InterpretationDlqService,
    DlqValidator,
    DlqEntryParser,
  ],
  exports: [
    RedisStreamService,
    InterpretationStreamLogService,
    InterpretationStreamWriter,
    InterpretationStreamReader,
    InterpretationStatusRepository,
    InterpretationStatusStore,
    InterpretationStatusValidator,
    InterpretationStatusLogger,
    InterpretationRequestPublisher,
    InterpretationMessageFactory,
    InterpretationMessageSerializer,
    InterpretationPayloadParser,
    InterpretationDlqWriter,
    FailureArchiveStore,
    RequestBackupStore,
    RequestRecoveryWorker,
    InterpretationDlqService,
    DlqValidator,
    DlqEntryParser,
  ],
})
export class RedisStreamModule {}
