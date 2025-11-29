import { NotFoundException } from "@nestjs/common";

export class FailedRequestNotFoundException extends NotFoundException {
  constructor() {
    super(
      "<!> 해당 요청은 이미 정상 처리되어 실패 목록에서 찾을 수 없습니다. /status 명령으로 진행 상황을 다시 확인해 주세요."
    );
  }
}
