import { ConflictException } from "@nestjs/common";

export class InterpretationRecordAlreadyExistsException extends ConflictException {
  constructor() {
    super(
      "<!> 이미 저장된 해몽입니다. /list 또는 /detail 명령으로 다시 확인해 보세요."
    );
  }
}
