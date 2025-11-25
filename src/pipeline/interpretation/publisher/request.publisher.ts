import { Injectable, InternalServerErrorException } from "@nestjs/common";
import {
  InterpretationPayload,
  InterpretationUserContext,
} from "../messages/types/message.types";
import { InterpretationStatusStore } from "../status/status.store";
import { InterpretationStreamWriter } from "../streams/stream.writer";
import { InterpretationMessageFactory } from "../messages/message.factory";

@Injectable()
export class InterpretationRequestPublisher {
  constructor(
    private readonly statusStore: InterpretationStatusStore,
    private readonly messageFactory: InterpretationMessageFactory,
    private readonly streamWriter: InterpretationStreamWriter
  ) {}

  public async publish(
    user: InterpretationUserContext,
    payload: InterpretationPayload
  ) {
    const message = this.messageFactory.create(user, payload);
    await this.statusStore.initialize(message.requestId, user, payload);

    try {
      await this.streamWriter.write(message);
    } catch (error) {
      await this.statusStore.markFailed(
        message.requestId,
        "<!> 해몽 요청 스트림에 기록하지 못했습니다."
      );
      throw new InternalServerErrorException(
        "<!> 해몽 요청을 접수하지 못했습니다. 잠시 후 다시 시도해주세요."
      );
    }

    return { requestId: message.requestId };
  }
}
