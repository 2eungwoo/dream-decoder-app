import "reflect-metadata";
import { Test, TestingModule } from "@nestjs/testing";
import { beforeEach, describe, expect, it } from "@jest/globals";
import { anything, instance, mock, reset, verify, when } from "ts-mockito";

import { InterpretationService } from "./interpretation.service";
import { InterpretationCacheService } from "./cache/interpretation-cache.service";
import { InvalidDreamException } from "./exceptions/invalid-dream.exception";
import { InterpretationGenerator } from "./interpretation.generator";

describe("InterpretationService (ts-mockito)", () => {
  let service: InterpretationService;

  const cacheServiceMock = mock(InterpretationCacheService);
  const generatorMock = mock(InterpretationGenerator);

  const CACHE_KEY = "cache-key";
  const REQUEST = {
    dream: "이상한 복도를 걸어다녔어요",
    emotions: ["혼란"],
    mbti: "INFJ",
    extraContext: "새 직장 준비 중",
  };
  const GENERATED_RESPONSE = "해몽 결과는 어쩌구 저쩌구 입니다";

  beforeEach(async () => {
    // 테스트마다 모킹상태 reset해서
    // 각 테스트마다 독립 컨텍스트로 실행되는 환경으로 해주기
    reset(cacheServiceMock);
    reset(generatorMock);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InterpretationService,
        {
          provide: InterpretationCacheService,
          useValue: instance(cacheServiceMock),
        },
        { provide: InterpretationGenerator, useValue: instance(generatorMock) },
      ],
    }).compile();

    service = module.get(InterpretationService);
  });

  it("캐시 미스 시 generator가 실행되고 캐시에 저장된다", async () => {
    // given & when
    when(cacheServiceMock.createKey(REQUEST as any)).thenReturn(CACHE_KEY);
    when(cacheServiceMock.get(CACHE_KEY)).thenReturn(null);
    when(generatorMock.generate(REQUEST as any)).thenResolve(GENERATED_RESPONSE);
    const response = await service.generateInterpretation(REQUEST as never);

    // then
    verify(generatorMock.generate(REQUEST as any)).once();
    verify(cacheServiceMock.set(CACHE_KEY, GENERATED_RESPONSE)).once();
    expect(response.interpretation).toBe(GENERATED_RESPONSE);
    expect(response.fromCache).toBe(false);
  });

  it("꿈 내용이 비면 InvalidDreamException 터짐", async () => {
    // given
    const BLANK_REQUEST = "";

    // when & then
    await expect(
      service.generateInterpretation({ dream: BLANK_REQUEST } as never)
    ).rejects.toBeInstanceOf(InvalidDreamException);
  });

  it("캐시된 데이터가 있으면 generator 호출 없이 바로 반환한다", async () => {
    // given & when
    const CACHED = "CACHED!";
    when(cacheServiceMock.createKey(REQUEST as any)).thenReturn(CACHE_KEY);
    when(cacheServiceMock.get(CACHE_KEY)).thenReturn(CACHED);
    const response = await service.generateInterpretation(REQUEST as never);

    // then
    expect(response.interpretation).toBe(CACHED);
    expect(response.fromCache).toBe(true);
    verify(generatorMock.generate(anything())).never();
  });
});
