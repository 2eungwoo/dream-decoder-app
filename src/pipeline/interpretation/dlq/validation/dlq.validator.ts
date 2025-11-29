import { ForbiddenException, Injectable } from "@nestjs/common";
import { FailedEntry } from "../interfaces/failed-entry.interface";
import { FailedRequestNotFoundException } from "../exceptions/failed-request-not-found.exception";

@Injectable()
export class DlqValidator {
  public validateEntryExists(
    entry?: FailedEntry | null
  ): asserts entry is FailedEntry {
    if (!entry) {
      throw new FailedRequestNotFoundException();
    }
  }

  public validateOwner(entry: FailedEntry, userId: string) {
    if (entry.userId !== userId) {
      throw new ForbiddenException("<!> 자신의 요청만 재시도할 수 있습니다.");
    }
  }
}
