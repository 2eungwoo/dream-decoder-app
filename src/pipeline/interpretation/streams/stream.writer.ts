import { Injectable } from "@nestjs/common";
import { Redis } from "ioredis";
import { RedisService } from "../../../infra/redis/redis.service";
import { InterpretationMessage } from "../messages/types/message.types";
import {
  INTERPRETATION_STREAM_KEY,
  interpretationStatusKey,
} from "../config/storage.config";

@Injectable()
export class InterpretationStreamWriter {
  constructor(private readonly redisService: RedisService) {}

  private get client(): Redis {
    return this.redisService.getClient();
  }

  public async write(message: InterpretationMessage) {
    await this.client.xadd(
      INTERPRETATION_STREAM_KEY,
      "*",
      "requestId",
      message.requestId,
      "userId",
      message.userId,
      "username",
      message.username,
      "payload",
      JSON.stringify(message.payload),
      "createdAt",
      message.createdAt,
      "retryCount",
      message.retryCount.toString(),
      "statusKey",
      interpretationStatusKey(message.requestId)
    );
  }
}
