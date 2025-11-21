import { CallHandler, ExecutionContext } from "@nestjs/common";
import { describe, beforeEach, it, expect, jest } from "@jest/globals";
import { Test, TestingModule } from "@nestjs/testing";
import { of, firstValueFrom } from "rxjs";
import { RedisService } from "../../infra/redis/redis.service";
import { InterpretationSemaphoreInterceptor } from "./interpretation-semaphore.interceptor";
import { InterpretationThrottleException } from "../exceptions/interpretation-throttle.exception";

describe("InterpretationSemaphoreInterceptor", () => {
  let interceptor: InterpretationSemaphoreInterceptor;

  // redis client 오픈
  const redisService = { getClient: jest.fn() };
  const redisClient = {
    // ioredis의 각 연산 리턴을 jest 러너의 Mock 타입으로 맞춰주기
    // mockResolvedValueOnce 사용에서 요구함
    incr: jest.fn() as jest.MockedFunction<any>,
    decr: jest.fn() as jest.MockedFunction<any>,
    expire: jest.fn() as jest.MockedFunction<any>,
  };
  const context = {} as ExecutionContext;

  /*  
    // 인터셉터의 다음 실행 mocking
    intercept(context, next) {
      return next.handle();   // -> Observable
      // controller or 다음 interceptor 으로 가는걸 ok처리
    }
  */
  const next: CallHandler = { handle: jest.fn(() => of("OK")) };

  beforeEach(async () => {
    jest.clearAllMocks();
    redisService.getClient.mockReturnValue(redisClient);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InterpretationSemaphoreInterceptor,
        {
          provide: RedisService,
          useValue: redisService,
        },
      ],
    }).compile();

    interceptor = module.get(InterpretationSemaphoreInterceptor);
  });

  it("semaphore 허용량 이내면 pass", async () => {
    redisClient.incr.mockResolvedValueOnce(1); // 첫번째, ttl설정
    redisClient.expire.mockResolvedValueOnce(null);
    redisClient.decr.mockResolvedValueOnce(null);

    await firstValueFrom(interceptor.intercept(context, next));

    expect(next.handle).toHaveBeenCalled();
    expect(redisClient.decr).toHaveBeenCalled();
  });

  it("semaphore 획득 실패하면 InterpretationThrottleException 터짐", async () => {
    redisClient.incr.mockResolvedValueOnce(999);
    redisClient.decr.mockResolvedValueOnce(null);

    await expect(
      firstValueFrom(interceptor.intercept(context, next))
    ).rejects.toBeInstanceOf(InterpretationThrottleException);
  });
});
