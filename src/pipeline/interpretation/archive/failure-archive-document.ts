export interface FailureArchiveDocument {
  requestId: string;
  userId: string;
  username: string;
  payload: string;
  failedAt: string;
  errorMessage: string;
  storedAt?: string;
}