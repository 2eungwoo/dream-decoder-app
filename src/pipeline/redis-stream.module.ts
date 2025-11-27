import { Module } from "@nestjs/common";
import { RedisModule } from "../infra/redis/redis.module";
import { InterpretationStreamWriter } from "./interpretation/streams/stream.writer";
import { InterpretationStreamReader } from "./interpretation/streams/stream.reader";
import { InterpretationStatusStore } from "./interpretation/status/status.store";
import { InterpretationStatusValidator } from "./interpretation/status/validation/status.validator";
import { InterpretationRequestPublisher } from "./interpretation/publisher/request.publisher";
import { InterpretationMessageFactory } from "./interpretation/messages/message.factory";
import { InterpretationMessageSerializer } from "./interpretation/messages/message.serializer";
import { InterpretationPayloadParser } from "./interpretation/messages/helpers/interpretation-payload.parser";
import { InterpretationDlqWriter } from "./interpretation/dlq/dlq.writer";
import { InterpretationDlqService } from "./interpretation/dlq/dlq.service";
import { DlqValidator } from "./interpretation/dlq/validation/dlq.validator";
import { DlqEntryParser } from "./interpretation/dlq/helpers/dlq-entry.parser";
import { RedisStreamService } from "./redis-stream.service";

@Module({
  imports: [RedisModule],
  providers: [
    RedisStreamService,
    InterpretationStreamWriter,
    InterpretationStreamReader,
    InterpretationStatusStore,
    InterpretationStatusValidator,
    InterpretationStatusValidator,
    InterpretationRequestPublisher,
    InterpretationMessageFactory,
    InterpretationMessageSerializer,
    InterpretationPayloadParser,
    InterpretationDlqWriter,
    InterpretationDlqService,
    DlqValidator,
    DlqEntryParser,
  ],
  exports: [
    RedisStreamService,
    InterpretationStreamWriter,
    InterpretationStreamReader,
    InterpretationStatusStore,
    InterpretationStatusValidator,
    InterpretationRequestPublisher,
    InterpretationMessageFactory,
    InterpretationMessageSerializer,
    InterpretationPayloadParser,
    InterpretationDlqWriter,
    InterpretationDlqService,
    DlqValidator,
    DlqEntryParser,
  ],
})
export class RedisStreamModule {}
