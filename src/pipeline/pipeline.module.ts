import { Module } from "@nestjs/common";
import { RedisModule } from "../infra/redis/redis.module";
import { InterpretationStreamWriter } from "./interpretation/streams/stream.writer";
import { InterpretationStatusStore } from "./interpretation/status/status.store";
import { InterpretationMessageFactory } from "./interpretation/messages/message.factory";
import { InterpretationDlqWriter } from "./interpretation/dlq/dlq.writer";
import { InterpretationRequestPublisher } from "./interpretation/publisher/request.publisher";
import { InterpretationMessageSerializer } from "./interpretation/messages/message.serializer";
import { InterpretationStreamReader } from "./interpretation/streams/stream.reader";
import { InterpretationDlqService } from "./interpretation/dlq/dlq.service";
import { InterpretationStatusValidator } from "./interpretation/status/validation/status.validator";
import { DlqValidator } from "./interpretation/dlq/validation/dlq.validator";
import { InterpretationPayloadParser } from "./interpretation/messages/helpers/interpretation-payload.parser";
import { DlqEntryParser } from "./interpretation/dlq/helpers/dlq-entry.parser";

@Module({
  imports: [RedisModule],
  providers: [
    InterpretationStreamWriter,
    InterpretationPayloadParser,
    InterpretationStatusValidator,
    InterpretationStatusStore,
    InterpretationMessageFactory,
    InterpretationDlqWriter,
    InterpretationMessageSerializer,
    InterpretationStreamReader,
    DlqValidator,
    DlqEntryParser,
    InterpretationRequestPublisher,
    InterpretationDlqService,
  ],
  exports: [
    InterpretationStreamWriter,
    InterpretationPayloadParser,
    InterpretationStatusValidator,
    InterpretationStatusStore,
    InterpretationMessageFactory,
    InterpretationDlqWriter,
    InterpretationMessageSerializer,
    InterpretationStreamReader,
    DlqValidator,
    DlqEntryParser,
    InterpretationRequestPublisher,
    InterpretationDlqService,
  ],
})
export class PipelineModule {}
