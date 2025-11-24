export type InterpretationStatusType =
  | "pending"
  | "running"
  | "completed"
  | "failed";

export interface InterpretationStatusResponse {
  requestId: string;
  status: InterpretationStatusType;
  interpretation?: string;
  errorMessage?: string;
  retryCount: number;
  updatedAt: string;
  createdAt: string;
  fromCache?: boolean;
}
