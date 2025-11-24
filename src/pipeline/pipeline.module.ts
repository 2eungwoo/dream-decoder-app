import { Module } from "@nestjs/common";
import { RedisModule } from "../infra/redis/redis.module";
import { InterpretationStreamWriter } from "./interpretation/streams/stream.writer";
import { InterpretationStatusStore } from "./interpretation/status/status.store";
import { InterpretationMessageFactory } from "./interpretation/messages/message.factory";
import { InterpretationDlqWriter } from "./interpretation/dlq/dlq.writer";
import { InterpretationRequestPublisher } from "./interpretation/publisher/request.publisher";
import { InterpretationMessageSerializer } from "./interpretation/messages/message.serializer";
import { InterpretationStreamReader } from "./interpretation/streams/stream.reader";

@Module({
  imports: [RedisModule],
  providers: [
    InterpretationStreamWriter,
    InterpretationStatusStore,
    InterpretationMessageFactory,
    InterpretationDlqWriter,
    InterpretationMessageSerializer,
    InterpretationStreamReader,
    InterpretationRequestPublisher,
  ],
  exports: [
    InterpretationStreamWriter,
    InterpretationStatusStore,
    InterpretationMessageFactory,
    InterpretationDlqWriter,
    InterpretationMessageSerializer,
    InterpretationStreamReader,
    InterpretationRequestPublisher,
  ],
})
export class PipelineModule {}
