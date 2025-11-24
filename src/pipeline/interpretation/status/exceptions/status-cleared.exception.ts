import { NotFoundException } from "@nestjs/common";

export class InterpretationStatusClearedException extends NotFoundException {
  constructor() {
    super(
      "이 해몽은 이미 저장되어 상태 기록이 사라졌어요. /list 또는 /detail 명령으로 다시 확인해 보세요."
    );
  }
}
