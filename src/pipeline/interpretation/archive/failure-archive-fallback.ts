import { FailedEntry } from "../dlq/interfaces/failed-entry.interface";
import {FailureArchiveDocument} from "./failure-archive-document";

// mongo 조차 안될때를 위한 fallback : 메모리 저장
export class FailureArchiveFallback {
  private readonly store = new Map<string, FailureArchiveDocument>();

  public save(entry: FailureArchiveDocument) {
    this.store.set(entry.requestId, entry);
  }

  public delete(requestId: string) {
    this.store.delete(requestId);
  }

  public findByRequestId(requestId: string): FailedEntry | undefined {
    const entry = this.store.get(requestId);
    return entry ? this.toFailedEntry(entry) : undefined;
  }

  public listByUser(userId: string, limit: number): FailedEntry[] {
    return [...this.store.values()]
      .filter((entry) => entry.userId === userId)
      .sort(
        (a, b) =>
          new Date(b.failedAt).getTime() - new Date(a.failedAt).getTime()
      )
      .slice(0, limit)
      .map((entry) => this.toFailedEntry(entry));
  }

  public toDocument(entry: FailedEntry): FailureArchiveDocument {
    return {
      requestId: entry.requestId,
      userId: entry.userId,
      username: entry.username,
      payload: JSON.stringify(entry.payload),
      failedAt: entry.failedAt,
      errorMessage: entry.errorMessage,
    };
  }

  public toFailedEntry(entry: FailureArchiveDocument): FailedEntry {
    return {
      streamId: `archive:${entry.requestId}`,
      requestId: entry.requestId,
      userId: entry.userId,
      username: entry.username,
      errorMessage: entry.errorMessage,
      failedAt: entry.failedAt,
      payload: JSON.parse(entry.payload),
    };
  }
}
