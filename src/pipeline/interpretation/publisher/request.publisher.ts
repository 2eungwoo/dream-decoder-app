import { Injectable, InternalServerErrorException } from "@nestjs/common";
import {
  InterpretationPayload,
  InterpretationUserContext,
} from "../messages/interfaces/message.types";
import { InterpretationStatusStore } from "../status/status.store";
import { InterpretationStreamWriter } from "../streams/stream.writer";
import { InterpretationMessageFactory } from "../messages/message.factory";
import { RequestBackupStore } from "../archive/request-backup.store";

@Injectable()
export class InterpretationRequestPublisher {
  constructor(
    private readonly statusStore: InterpretationStatusStore,
    private readonly messageFactory: InterpretationMessageFactory,
    private readonly streamWriter: InterpretationStreamWriter,
    private readonly requestBackupStore: RequestBackupStore
  ) {}

  public async publish(user: InterpretationUserContext, payload: InterpretationPayload) {
    const message = this.messageFactory.create(user, payload);
    await this.statusStore.initialize(message.requestId, user, payload);
    await this.requestBackupStore.savePendingRequest(message);

    try {
      await this.streamWriter.write(message);
    } catch (error) {
      await this.requestBackupStore.markBacklog(
        message.requestId,
        (error as Error)?.message ??
          "<!> Redis Stream 쓰기 실패 -> backup store로 적재함 (mongo)"
      );
      await this.statusStore.markFailed(
        message.requestId,
        "<!> 해몽 요청 스트림에 기록하지 못했습니다. 자동 복구를 시도합니다."
      );
      throw new InternalServerErrorException(
        "<!> 해몽 요청을 접수하지 못했습니다. 잠시 후 다시 시도해주세요."
      );
    }

    return { requestId: message.requestId };
  }
}
