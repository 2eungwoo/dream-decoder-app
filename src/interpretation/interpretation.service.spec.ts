import "reflect-metadata";
import { Test, TestingModule } from "@nestjs/testing";
import { mock, instance, when, verify, anything, reset } from "ts-mockito";
import { beforeEach, describe, expect, it } from "@jest/globals";

import { InterpretationService } from "./interpretation.service";
import { EmbeddingInputFactory } from "./factories/embedding-input.factory";
import { EmbeddingClient } from "../external/embedding/embedding.client";
import { DreamSymbolRepository } from "./datasources/dream-symbol.repository";
import { InterpretationPromptBuilder } from "./prompts/interpretation-prompt.builder";
import { OpenAIClient } from "../external/openai/openai.client";
import { InvalidDreamException } from "./exceptions/invalid-dream.exception";
import { InterpretationCacheService } from "./cache/interpretation-cache.service";
import { InterpretationSimilarityEvaluator } from "./rankings/interpretation-similarity.evaluator";

describe("InterpretationService (ts-mockito)", () => {
  let service: InterpretationService;

  const embeddingInputFactoryMock = mock(EmbeddingInputFactory);
  const embeddingClientMock = mock(EmbeddingClient);
  const symbolRepositoryMock = mock(DreamSymbolRepository);
  const promptBuilderMock = mock(InterpretationPromptBuilder);
  const openAIClientMock = mock(OpenAIClient);
  const cacheServiceMock = mock(InterpretationCacheService);
  const similarityEvaluatorMock = mock(InterpretationSimilarityEvaluator);

  const CACHE_KEY = "cache-key";
  const FORMATTED_PROMPT = "formatted prompt";
  const MOCK_EMBEDDING = [[0.1, 0.2, 0.3]];
  const VECTOR_SEARCH_RESULT = [{ symbol: "끝없는 복도를 걷는 꿈" } as never];

  const REQUEST = {
    dream: "이상한 복도를 걸어다녔어요",
    emotions: ["혼란"],
    mbti: "INFJ",
    extraContext: "새 직장 준비 중",
  };

  const RESPONSE = "해몽 결과는 어쩌구 저쩌구 입니다";

  beforeEach(async () => {
    // 테스트마다 모킹상태를 reset해서 각 테스트마다 독립 컨텍스트로 실행되는 환경으로 해줘야함
    reset(embeddingInputFactoryMock);
    reset(embeddingClientMock);
    reset(symbolRepositoryMock);
    reset(promptBuilderMock);
    reset(openAIClientMock);
    reset(cacheServiceMock);
    reset(similarityEvaluatorMock);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InterpretationService, // 얘만 실제 객체 하위는 싹다 모킹
        {
          provide: EmbeddingInputFactory,
          useValue: instance(embeddingInputFactoryMock),
        },
        {
          provide: EmbeddingClient,
          useValue: instance(embeddingClientMock),
        },
        {
          provide: DreamSymbolRepository,
          useValue: instance(symbolRepositoryMock),
        },
        {
          provide: InterpretationPromptBuilder,
          useValue: instance(promptBuilderMock),
        },
        { provide: OpenAIClient, useValue: instance(openAIClientMock) },
        {
          provide: InterpretationCacheService,
          useValue: instance(cacheServiceMock),
        },
        {
          provide: InterpretationSimilarityEvaluator,
          useValue: instance(similarityEvaluatorMock),
        },
      ],
    }).compile();

    service = module.get(InterpretationService);
  });

  it("사용자 요청 embedding + vectordb 검색 + LLM 호출 오케스트레이션이 이루어져야함", async () => {
    // given & when
    when(cacheServiceMock.createKey(REQUEST as any)).thenReturn(CACHE_KEY);
    when(cacheServiceMock.get(CACHE_KEY)).thenReturn(null);

    when(
      embeddingInputFactoryMock.createFromRequest(REQUEST as any)
    ).thenReturn("embedding-input");

    when(embeddingClientMock.embed(anything())).thenResolve(MOCK_EMBEDDING);
    when(
      symbolRepositoryMock.findNearestByEmbedding(anything(), anything())
    ).thenResolve(VECTOR_SEARCH_RESULT);
    when(
      similarityEvaluatorMock.rank(anything(), anything())
    ).thenReturn(VECTOR_SEARCH_RESULT);

    when(promptBuilderMock.buildPrompt(anything(), anything())).thenReturn(
      FORMATTED_PROMPT
    );

    when(openAIClientMock.generateFromMessages(anything())).thenResolve(
      RESPONSE
    );

    // then
    const response = await service.interpret(REQUEST as never);

    verify(cacheServiceMock.createKey(REQUEST as any)).once();
    verify(cacheServiceMock.get(CACHE_KEY)).once();
    verify(embeddingInputFactoryMock.createFromRequest(REQUEST as any)).once();
    verify(embeddingClientMock.embed(anything())).once();
    verify(
      symbolRepositoryMock.findNearestByEmbedding(anything(), anything())
    ).once();
    verify(similarityEvaluatorMock.rank(anything(), anything())).once();
    verify(promptBuilderMock.buildPrompt(anything(), anything())).once();
    verify(openAIClientMock.generateFromMessages(anything())).once();
    verify(cacheServiceMock.set(CACHE_KEY, RESPONSE)).once();

    expect(response.success).toBe(true);
    expect(response.data?.interpretation).toBe(RESPONSE);
  });

  it("꿈 내용이 비면 InvalidDreamException 터짐", async () => {
    // given
    const BLANK_REQUEST = "";

    // when & then
    await expect(
      service.interpret({ dream: BLANK_REQUEST } as never)
    ).rejects.toBeInstanceOf(InvalidDreamException);
  });

  it("캐시된거 있으면 embed, pgvector, LLM 호출 안나가야함", async () => {
    // given & when
    const CACHED = "CACHED!";
    when(cacheServiceMock.createKey(REQUEST as any)).thenReturn(CACHE_KEY);
    when(cacheServiceMock.get(CACHE_KEY)).thenReturn(CACHED);

    // then
    const response = await service.interpret(REQUEST as never);

    expect(response.data?.interpretation).toBe(CACHED);
    verify(embeddingClientMock.embed(anything())).never();
  });
});
