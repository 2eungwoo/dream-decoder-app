import { Injectable } from "@nestjs/common";
import { InterpretationStatusStore } from "../status/status.store";
import { InterpretationProcessor } from "./processor.service";
import { InterpretationStreamWriter } from "../streams/stream.writer";
import { InterpretationDlqWriter } from "../dlq/dlq.writer";
import { InterpretationMessage } from "../messages/interfaces/message.types";
import { InterpretationMessageFactory } from "../messages/message.factory";
import { INTERPRETATION_WORKER_MAX_RETRY } from "../config/worker.config";
import { InterpretationStreamLogService } from "../logging/stream-log.service";
import { InterpretationFailureArchiveService } from "../dlq/interpretation-failure-archive.service";

@Injectable()
export class InterpretationMessageHandler {
  private readonly component = "MessageHandler";

  constructor(
    private readonly statusStore: InterpretationStatusStore,
    private readonly processor: InterpretationProcessor,
    private readonly streamWriter: InterpretationStreamWriter,
    private readonly dlqWriter: InterpretationDlqWriter,
    private readonly failureArchive: InterpretationFailureArchiveService,
    private readonly messageFactory: InterpretationMessageFactory,
    private readonly streamLogger: InterpretationStreamLogService
  ) {}

  public async handle(message: InterpretationMessage) {
    await this.statusStore.markRunning(message.requestId);
    this.streamLogger.info(
      this.component,
      `해몽 요청 ${message.requestId} 실행 시작`
    );
    try {
      await this.processor.process(message.requestId, message.payload);
      this.streamLogger.info(
        this.component,
        `해몽 요청 ${message.requestId} 처리 완료`
      );
    } catch (error) {
      await this.handleFailure(message, error as Error);
    }
  }

  private async handleFailure(message: InterpretationMessage, error: Error) {
    const reason =
      error?.message ??
      "<!> 해몽 생성 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.";
    const nextRetry = message.retryCount + 1;

    if (nextRetry > INTERPRETATION_WORKER_MAX_RETRY) {
      await this.statusStore.markFailed(message.requestId, reason);
      await this.dlqWriter.write(message, reason);
      await this.failureArchive.save(message, reason);
      this.streamLogger.error(
        this.component,
        `${message.requestId} 요청은 ${nextRetry} 시도 후 최종 실패하여 DLQ로 이동 (/failed 명령으로 확인 가능)`
      );
      return;
    }

    await this.statusStore.incrementRetry(message.requestId);
    await this.statusStore.markPending(message.requestId, reason);
    const retryMessage = this.messageFactory.withRetry(message, nextRetry);
    await this.streamWriter.write(retryMessage);
    this.streamLogger.warn(
      this.component,
      `현재 해몽 ID: ${message.requestId} 의 요청, 재시도 ${nextRetry}회 (사유: ${reason}) – 큐에 재등록`
    );
  }
}
