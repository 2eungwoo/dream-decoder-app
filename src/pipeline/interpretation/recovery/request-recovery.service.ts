import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { RequestBackupStore } from "../archive/request-backup.store";
import { InterpretationStreamWriter } from "../streams/stream.writer";
import { interpretationRecoveryConfig } from "../config/archive.config";

@Injectable()
export class RequestRecoveryWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RequestRecoveryWorker.name);
  private timer?: NodeJS.Timeout;

  constructor(
    private readonly backupStore: RequestBackupStore,
    private readonly streamWriter: InterpretationStreamWriter
  ) {}

  onModuleInit() {
    const interval = interpretationRecoveryConfig.intervalMs;
    if (interval <= 0) {
      this.logger.warn(
        "[RequestRecovery] intervalMs >= 0 이므로 자동 복구 워커 비활성화"
      );
      return;
    }

    this.timer = setInterval(() => {
      void this.recoverBackloggedRequests().catch((error) => {
        this.logger.error(
          "[RequestRecovery] 자동 복구 중 오류 발생",
          (error as Error)?.message
        );
      });
    }, interval);
    this.timer.unref();
    this.logger.log(`[RequestRecovery] ${interval}ms 간격으로 자동 복구 활성화`);
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  public async recoverBackloggedRequests(
    limit = interpretationRecoveryConfig.batchLimit
  ): Promise<void> {
    if (limit <= 0) {
      return;
    }

    const backlogEntries = await this.backupStore.listBacklog(limit);
    if (!backlogEntries.length) {
      return;
    }

    for (const entry of backlogEntries) {
      try {
        const message = this.backupStore.toInterpretationMessage(entry);
        await this.streamWriter.write(message);
        await this.backupStore.markRequeued(entry.requestId);
        this.logger.log(
          `[RequestRecovery] 요청 ${entry.requestId} 를 Redis Stream에 재등록했습니다.`
        );
      } catch (error) {
        const reason =
          (error as Error)?.message ??
          "failed to enqueue request during recovery";
        await this.backupStore.markBacklog(entry.requestId, reason);
        this.logger.warn(
          `[RequestRecovery] 요청 ${entry.requestId} 재등록 실패 – ${reason}`
        );
      }
    }
  }
}
