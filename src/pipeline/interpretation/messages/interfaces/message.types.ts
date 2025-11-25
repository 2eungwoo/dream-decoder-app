export interface InterpretationPayload {
  dream: string;
  emotions?: string[];
  mbti?: string;
  extraContext?: string;
}

export interface InterpretationUserContext {
  id: string;
  username: string;
}

export interface InterpretationMessage {
  requestId: string;
  payload: InterpretationPayload;
  userId: string;
  username: string;
  createdAt: string;
  retryCount: number;
}

export enum InterpretationStatus {
  Pending = "pending",
  Running = "running",
  Completed = "completed",
  Failed = "failed",
}

export interface InterpretationStatusRecord {
  requestId: string;
  userId: string;
  username: string;
  payload: InterpretationPayload;
  status: InterpretationStatus;
  interpretation?: string;
  errorMessage?: string;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
  fromCache?: boolean;
}
