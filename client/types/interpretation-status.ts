export type InterpretationStatusType =
  | "pending"
  | "running"
  | "completed"
  | "failed";

export interface InterpretationStatusResponse {
  [x: string]: any;
  requestId: string;
  status: InterpretationStatusType;
  interpretation?: string;
  errorMessage?: string;
  retryCount: number;
  updatedAt: string;
  createdAt: string;
  fromCache?: boolean;
}
