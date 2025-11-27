import { Injectable } from "@nestjs/common";
import {
  INTERPRETATION_WORKER_BATCH_SIZE,
  INTERPRETATION_WORKER_BLOCK_MS,
  INTERPRETATION_WORKER_GROUP,
  INTERPRETATION_WORKER_IDLE_CLAIM_MS,
} from "../config/worker.config";
import { INTERPRETATION_STREAM_KEY } from "../config/storage.config";
import { RedisStreamService } from "../../redis-stream.service";

@Injectable()
export class InterpretationStreamReader {
  constructor(private readonly redisStream: RedisStreamService) {}

  public async readNext(
    consumerName: string
  ): Promise<Array<[string, string[]]> | null> {
    return this.redisStream.readGroup({
      stream: INTERPRETATION_STREAM_KEY,
      group: INTERPRETATION_WORKER_GROUP,
      consumer: consumerName,
      count: INTERPRETATION_WORKER_BATCH_SIZE,
      blockMs: INTERPRETATION_WORKER_BLOCK_MS,
    });
  }

  public async claimIdle(
    consumerName: string
  ): Promise<Array<[string, string[]]>> {
    return this.redisStream.claimIdle({
      stream: INTERPRETATION_STREAM_KEY,
      group: INTERPRETATION_WORKER_GROUP,
      consumer: consumerName,
      minIdleTime: INTERPRETATION_WORKER_IDLE_CLAIM_MS,
      count: INTERPRETATION_WORKER_BATCH_SIZE,
    });
  }
}
