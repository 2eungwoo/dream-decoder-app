import { Injectable } from "@nestjs/common";
import {
  InterpretationPayload,
  InterpretationUserContext,
} from "../messages/interfaces/message.types";
import { InterpretationStatusStore } from "../status/status.store";
import { InterpretationStreamWriter } from "../streams/stream.writer";
import { InterpretationMessageFactory } from "../messages/message.factory";
import { RequestBackupStore } from "../archive/request-backup.store";
import { RecoveryFailureCode } from "../recovery/recovery.types";
import { StreamWriterFailedException } from "../exceptions/stream-writer-failed.exception";
import { MetricsService } from "../../../monitoring/metrics.service";

@Injectable()
export class InterpretationRequestPublisher {
  constructor(
    private readonly statusStore: InterpretationStatusStore,
    private readonly messageFactory: InterpretationMessageFactory,
    private readonly streamWriter: InterpretationStreamWriter,
    private readonly requestBackupStore: RequestBackupStore,
    private readonly metricsService: MetricsService
  ) {}

  public async publish(user: InterpretationUserContext, payload: InterpretationPayload) {
    const message = this.messageFactory.create(user, payload);
    await this.statusStore.initialize(message.requestId, user, payload);
    await this.requestBackupStore.savePendingRequest(message);

    try {
      await this.streamWriter.write(message);
      this.metricsService.incrementInterpretationRequestPublished();
    } catch (error) {
      this.metricsService.incrementInterpretationRequestFailed();
      const failureMessage =
        (error as Error)?.message ??
        "<!> Redis Stream 쓰기 실패 -> backup store로 적재함 (mongo)";
      const retryCount = (message.retryCount ?? 0) + 1;
      // backlog + backoff + retryCount => worker retry
      await this.requestBackupStore.markBacklog(
        message.requestId,
        failureMessage,
        RecoveryFailureCode.STREAM_WRITE_FAILED,
        new Date(),
        retryCount
      );
      // 스트림 메세지 레벨에서도 fail처리
      await this.statusStore.markFailed(
        message.requestId,
        "<!> 해몽 요청 스트림에 기록하지 못했습니다. 자동 복구를 시도합니다."
      );
      throw new StreamWriterFailedException();
    }

    return { requestId: message.requestId };
  }
}
