import { Injectable } from "@nestjs/common";
import { Redis } from "ioredis";
import { RedisService } from "../../../infra/redis/redis.service";
import { InterpretationMessage } from "../messages/interfaces/message.types";
import { INTERPRETATION_DLQ_KEY } from "../config/storage.config";

@Injectable()
export class InterpretationDlqWriter {
  constructor(private readonly redisService: RedisService) {}

  private get client(): Redis {
    return this.redisService.getClient();
  }

  public async write(message: InterpretationMessage, reason: string) {
    await this.client.xadd(
      INTERPRETATION_DLQ_KEY,
      "*",
      "requestId",
      message.requestId,
      "userId",
      message.userId,
      "username",
      message.username,
      "payload",
      JSON.stringify(message.payload),
      "failedAt",
      new Date().toISOString(),
      "errorMessage",
      reason
    );
  }
}
