import { Injectable } from "@nestjs/common";
import { InterpretationMessage, InterpretationPayload } from "./message.types";

@Injectable()
export class InterpretationMessageSerializer {
  public fromStreamFields(fields: string[]): InterpretationMessage | null {
    if (!fields?.length) {
      return null;
    }

    const record: Record<string, string> = {};
    for (let i = 0; i < fields.length; i += 2) {
      const key = fields[i];
      const value = fields[i + 1];
      record[key] = value;
    }

    if (!record.requestId || !record.payload) {
      return null;
    }

    return {
      requestId: record.requestId,
      payload: this.parsePayload(record.payload),
      userId: record.userId,
      username: record.username,
      retryCount: Number(record.retryCount ?? "0"),
      createdAt: record.createdAt ?? new Date().toISOString(),
    };
  }

  private parsePayload(raw: string): InterpretationPayload {
    try {
      return JSON.parse(raw) as InterpretationPayload;
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
