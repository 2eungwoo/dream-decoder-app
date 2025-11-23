import { Injectable } from "@nestjs/common";
import { InterpretationRecord } from "./interpretation-record.entity";
import { InterpretationRecordNotFoundException } from "./exceptions/interpretation-record-not-found.exception";

@Injectable()
export class InterpretationRecordValidator {
  public validExists(record?: InterpretationRecord | null) {
    if (!record) {
      throw new InterpretationRecordNotFoundException();
    }
    return record;
  }
}
