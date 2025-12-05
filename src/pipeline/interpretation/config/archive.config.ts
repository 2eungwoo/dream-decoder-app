export const interpretationArchiveConfig = {
  requestTtlDays: 7,
  failureTtlDays: 30,
} as const;

export const interpretationRecoveryConfig = {
  intervalMs: 3000,
  batchLimit: 20,
  maxRoundsPerTick: 5,
  concurrentRequeues: 5,
  backoff: {
    baseDelayMs: 2_000,
    maxDelayMs: 60_000,
    jitterMs: 500, // 여기다 랜덤값 곱해서 지터개념으로 쓸거임
  },
} as const;
