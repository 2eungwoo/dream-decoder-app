import { Injectable } from "@nestjs/common";
import { InterpretationPayload } from "../interfaces/message.types";

@Injectable()
export class InterpretationPayloadParser {
  // payload -> JSON
  // 없거나 손상되면 기본값
  public parse(rawPayload?: string): InterpretationPayload {
    if (!rawPayload) {
      return {
        dream: "",
        emotions: [],
        mbti: undefined,
        extraContext: undefined,
      };
    }

    try {
      return JSON.parse(rawPayload) as InterpretationPayload;
    } catch {
      return {
        dream: "",
        emotions: [],
        mbti: undefined,
        extraContext: undefined,
      };
    }
  }
}
