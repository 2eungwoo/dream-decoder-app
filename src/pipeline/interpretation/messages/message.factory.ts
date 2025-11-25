import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import {
  InterpretationMessage,
  InterpretationPayload,
  InterpretationUserContext,
} from "./interfaces/message.types";

@Injectable()
export class InterpretationMessageFactory {
  public create(
    user: InterpretationUserContext,
    payload: InterpretationPayload
  ): InterpretationMessage {
    return {
      requestId: randomUUID(),
      payload,
      userId: user.id,
      username: user.username,
      createdAt: new Date().toISOString(),
      retryCount: 0,
    };
  }

  public withRetry(
    original: InterpretationMessage,
    retryCount: number
  ): InterpretationMessage {
    return {
      ...original,
      createdAt: new Date().toISOString(),
      retryCount,
    };
  }
}
