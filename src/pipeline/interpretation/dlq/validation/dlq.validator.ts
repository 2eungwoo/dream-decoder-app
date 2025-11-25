import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { FailedEntry } from "../interfaces/failed-entry.interface";

@Injectable()
export class DlqValidator {
  public validateEntryExists(
    entry?: FailedEntry | null
  ): asserts entry is FailedEntry {
    if (!entry) {
      throw new NotFoundException("<!> 실패한 요청을 찾을 수 없습니다.");
    }
  }

  public validateOwner(entry: FailedEntry, userId: string) {
    if (entry.userId !== userId) {
      throw new ForbiddenException("<!> 자신의 요청만 재시도할 수 있습니다.");
    }
  }
}
