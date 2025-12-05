import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { RequestRecoveryWorker } from "./request-recovery.service";

describe("RequestRecoveryWorker", () => {
  const backlogRequeue = {
    processBacklog: jest.fn<() => Promise<void>>(),
  };

  const redisHealthChecker = {
    isAvailable: jest.fn<() => Promise<boolean>>(),
  };

  let worker: RequestRecoveryWorker;

  beforeEach(() => {
    jest.clearAllMocks();
    worker = new RequestRecoveryWorker(
        backlogRequeue as any,
        redisHealthChecker as any
    );
  });

  it("Redis가 정상일 때 백로그를 재발행한다", async () => {
    redisHealthChecker.isAvailable.mockResolvedValue(true);
    backlogRequeue.processBacklog.mockResolvedValue(undefined);

    await worker.handleRecoveryTick();

    expect(backlogRequeue.processBacklog).toHaveBeenCalled();
  });

  it("Redis가 비정상이면 재발행을 건너뛴다", async () => {
    redisHealthChecker.isAvailable.mockResolvedValue(false);

    await worker.handleRecoveryTick();

    expect(backlogRequeue.processBacklog).not.toHaveBeenCalled();
  });
});