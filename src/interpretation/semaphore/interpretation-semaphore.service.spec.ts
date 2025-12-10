import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { InterpretationSemaphoreService } from "./interpretation-semaphore.service";
import { RedisSemaphoreService } from "../../infra/redis/redis-semaphore.service";

describe("InterpretationSemaphoreService", () => {
  let redisSemaphore: jest.Mocked<Pick<RedisSemaphoreService, "acquire" | "release">>;
  let service: InterpretationSemaphoreService;
  const SEMAPHORE_KEY = "interpretation:semaphore";

  beforeEach(() => {
    redisSemaphore = {
      acquire: jest.fn(),
      release: jest.fn(),
    };
    service = new InterpretationSemaphoreService(
      redisSemaphore as unknown as RedisSemaphoreService
    );
  });

  it("SemaphoreService에서 acquire면 Redis세마포어서비스.acquire 호출 -> true 리턴", async () => {

    // given
    redisSemaphore.acquire.mockResolvedValueOnce(true);
    const expectedLimit = Number(5); // 임의값
    const expectedTtl = Number(10); // 임의값

    // when
    const result = await service.acquire();

    // then
    expect(redisSemaphore.acquire).toHaveBeenCalledWith(
      SEMAPHORE_KEY,
      expectedLimit,
      expectedTtl
    );
    expect(result).toBe(true);
  });

  it("SemaphoreService에서 실패면 Redis세마포어서비스.acquire 호출 -> false 리턴", async () => {
    // given
    redisSemaphore.acquire.mockResolvedValueOnce(false);

    // when
    const result = await service.acquire();

    // then
    expect(redisSemaphore.acquire).toHaveBeenCalled();
    expect(result).toBe(false);
  });

  it("세마포어 release -> semaphoreService.release에 똑같은 키 넘어감", async () => {
    // when
    await service.release();

    // then
    expect(redisSemaphore.release).toHaveBeenCalledWith(SEMAPHORE_KEY);
  });
});
