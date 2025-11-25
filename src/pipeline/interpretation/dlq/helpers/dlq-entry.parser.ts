import { Injectable } from "@nestjs/common";
import { InterpretationPayloadParser } from "../../messages/helpers/interpretation-payload.parser";
import { FailedEntry } from "../interfaces/failed-entry.interface";

@Injectable()
export class DlqEntryParser {
  constructor(private readonly payloadParser: InterpretationPayloadParser) {}

  public parse(streamId: string, fields: string[]): FailedEntry | null {
    if (!fields?.length) {
      return null;
    }

    const record: Record<string, string> = {};
    for (let i = 0; i < fields.length; i += 2) {
      record[fields[i]] = fields[i + 1];
    }

    if (!record.requestId || !record.userId || !record.payload) {
      return null;
    }

    return {
      streamId,
      requestId: record.requestId,
      userId: record.userId,
      username: record.username ?? "",
      errorMessage: record.errorMessage ?? "",
      failedAt: record.failedAt ?? new Date().toISOString(),
      payload: this.payloadParser.parse(record.payload),
    };
  }
}
