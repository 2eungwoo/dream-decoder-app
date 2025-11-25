import { Injectable, NotFoundException } from "@nestjs/common";

import { InterpretationStatusClearedException } from "../exceptions/status-cleared.exception";
import { InterpretationStatusRecord } from "../../messages/interfaces/message.types";

@Injectable()
export class InterpretationStatusValidator {
  public validateRawExists(raw: Record<string, string>) {
    if (!raw || Object.keys(raw).length === 0) {
      throw new InterpretationStatusClearedException();
    }
  }

  public validateOwner(record: InterpretationStatusRecord, userId: string) {
    if (record.userId !== userId) {
      throw new NotFoundException("<!> 요청 ID를 찾을 수 없습니다.");
    }
  }
}
