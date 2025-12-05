import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { RequestBackupStore } from "../archive/request-backup.store";
import { InterpretationStreamWriter } from "../streams/stream.writer";
import { interpretationRecoveryConfig } from "../config/archive.config";

const DEFAULT_RECOVERY_INTERVAL_MS = 10_000;
const RECOVERY_INTERVAL_MS =
  interpretationRecoveryConfig.intervalMs > 0
    ? interpretationRecoveryConfig.intervalMs
    : DEFAULT_RECOVERY_INTERVAL_MS;
const RECOVERY_CRON = `*/${Math.max(
  Math.floor(RECOVERY_INTERVAL_MS / 1000),
  1
)} * * * * *`;

@Injectable()
export class RequestRecoveryWorker {
  private readonly logger = new Logger(RequestRecoveryWorker.name);

  constructor(
    private readonly backupStore: RequestBackupStore,
    private readonly streamWriter: InterpretationStreamWriter
  ) {}

  @Cron(RECOVERY_CRON)
  public async handleRecoveryTick(): Promise<void> {
    if (interpretationRecoveryConfig.intervalMs <= 0) {
      return;
    }

    const batchLimit = Math.max(interpretationRecoveryConfig.batchLimit, 1);
    const backlogEntries = await this.backupStore.listBacklog(batchLimit);
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
