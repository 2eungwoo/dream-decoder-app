import { Injectable, Logger } from "@nestjs/common";
import { Interval } from "@nestjs/schedule";
import { MetricsService } from "./metrics.service";
import { RedisService } from "../infra/redis/redis.service";
import { INTERPRETATION_STREAM_KEY } from "../pipeline/interpretation/config/storage.config";
import { INTERPRETATION_WORKER_GROUP } from "../pipeline/interpretation/config/worker.config";

@Injectable()
export class RedisStreamMetricsService {
  private readonly logger = new Logger(RedisStreamMetricsService.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly metricsService: MetricsService
  ) {}

  @Interval(10000)
  public async collectStreamStats() {
    const client = this.redisService.getClient();
    if (!client) {
      return;
    }

    try {
      const backlogSize = await client.xlen(INTERPRETATION_STREAM_KEY);
      this.metricsService.setInterpretationStreamBacklog(backlogSize);
    } catch (error) {
      this.logger.warn(
        `Failed to measure stream backlog: ${(error as Error).message}`
      );
    }

    try {
      const pendingSummary = (await client.xpending(
        INTERPRETATION_STREAM_KEY,
        INTERPRETATION_WORKER_GROUP
      )) as [number];
      const pendingCount = Array.isArray(pendingSummary)
        ? Number(pendingSummary[0] ?? 0)
        : Number(pendingSummary ?? 0);
      this.metricsService.setInterpretationPendingMessages(pendingCount);
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes("NOGROUP") ||
          error.message.includes("XGROUP"))
      ) {
        this.metricsService.setInterpretationPendingMessages(0);
        return;
      }
      this.logger.warn(
        `Failed to measure pending entries: ${(error as Error).message}`
      );
    }
  }
}
