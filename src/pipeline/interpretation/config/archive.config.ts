export const interpretationArchiveConfig = {
  requestTtlDays: 7,
  failureTtlDays: 30,
} as const;

export const interpretationRecoveryConfig = {
  intervalMs: 3000,
  batchLimit: 20,
} as const;
