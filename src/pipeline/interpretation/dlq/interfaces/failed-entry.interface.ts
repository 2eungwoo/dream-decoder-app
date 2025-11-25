import { InterpretationPayload } from "../../messages/interfaces/message.types";

export interface FailedEntry {
  streamId: string;
  requestId: string;
  userId: string;
  username: string;
  errorMessage: string;
  failedAt: string;
  payload: InterpretationPayload;
}
