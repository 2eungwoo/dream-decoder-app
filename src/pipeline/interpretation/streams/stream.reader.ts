import { Injectable } from "@nestjs/common";
import { Redis } from "ioredis";
import { RedisService } from "../../../infra/redis/redis.service";
import {
  INTERPRETATION_WORKER_BATCH_SIZE,
  INTERPRETATION_WORKER_BLOCK_MS,
  INTERPRETATION_WORKER_GROUP,
  INTERPRETATION_WORKER_IDLE_CLAIM_MS,
} from "../config/worker.config";
import { INTERPRETATION_STREAM_KEY } from "../config/storage.config";

@Injectable()
export class InterpretationStreamReader {
  constructor(private readonly redisService: RedisService) {}

  private get client(): Redis {
    return this.redisService.getClient();
  }

  public async readNext(
    consumerName: string
  ): Promise<Array<[string, string[]]> | null> {
    const response = (await this.client.xreadgroup(
      "GROUP",
      INTERPRETATION_WORKER_GROUP,
      consumerName,
      "COUNT",
      INTERPRETATION_WORKER_BATCH_SIZE,
      "BLOCK",
      INTERPRETATION_WORKER_BLOCK_MS,
      "STREAMS",
      INTERPRETATION_STREAM_KEY,
      ">"
    )) as [string, [string, string[]][]][] | null;

    if (!response) {
      return null;
    }

    return response[0][1];
  }

  public async claimIdle(
    consumerName: string
  ): Promise<Array<[string, string[]]>> {
    const response = (await this.client.xautoclaim(
      INTERPRETATION_STREAM_KEY,
      INTERPRETATION_WORKER_GROUP,
      consumerName,
      INTERPRETATION_WORKER_IDLE_CLAIM_MS,
      "0-0",
      "COUNT",
      INTERPRETATION_WORKER_BATCH_SIZE
    )) as [string, [string, string[]][]];

    return response[1];
  }
}
