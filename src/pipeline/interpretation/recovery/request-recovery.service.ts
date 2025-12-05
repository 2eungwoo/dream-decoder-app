import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { interpretationRecoveryConfig } from "../config/archive.config";
import { BacklogRequeueService } from "./services/backlog-requeue.service";
import { RedisHealthChecker } from "./services/redis-health-checker.service";

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
    private readonly backlogRequeue: BacklogRequeueService,
    private readonly redisHealthChecker: RedisHealthChecker
  ) {}

  @Cron(RECOVERY_CRON)
  public async handleRecoveryTick(): Promise<void> {
    if (interpretationRecoveryConfig.intervalMs <= 0) {
      return;
    }

    if (!(await this.redisHealthChecker.isAvailable())) {
      return;
    }

    await this.backlogRequeue.processBacklog();
  }
}
