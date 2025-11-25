import { InterpretationPayload } from "../types/message.types";

// payload -> JSON
// 없거나 손상되면 기본값
export class InterpretationPayloadParser {
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
