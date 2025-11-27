import { Injectable } from "@nestjs/common";
import { InterpretationMessage } from "../messages/interfaces/message.types";
import {
  INTERPRETATION_STREAM_KEY,
  interpretationStatusKey,
} from "../config/storage.config";
import { RedisStreamService } from "../../redis-stream.service";

@Injectable()
export class InterpretationStreamWriter {
  constructor(private readonly redisStream: RedisStreamService) {}

  public async write(message: InterpretationMessage) {
    await this.redisStream.append(INTERPRETATION_STREAM_KEY, {
      requestId: message.requestId,
      userId: message.userId,
      username: message.username,
      payload: JSON.stringify(message.payload),
      createdAt: message.createdAt,
      retryCount: message.retryCount.toString(),
      statusKey: interpretationStatusKey(message.requestId),
    });
  }
}
