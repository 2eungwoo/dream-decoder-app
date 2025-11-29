import { Injectable } from "@nestjs/common";
import { InterpretationRecord } from "../interpretation-record.entity";
import { InterpretationRecordNotFoundException } from "./interpretation-record-not-found.exception";
import { InterpretationRecordAlreadyExistsException } from "./interpretation-record-already-exists.exception";

@Injectable()
export class InterpretationRecordValidator {
  public validExists(record?: InterpretationRecord | null) {
    if (!record) {
      throw new InterpretationRecordNotFoundException();
    }
    return record;
  }

  public ensureNotDuplicated(record?: InterpretationRecord | null) {
    if (record) {
      throw new InterpretationRecordAlreadyExistsException();
    }
  }
}
