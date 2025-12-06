import "reflect-metadata";
import { Test, TestingModule } from "@nestjs/testing";
import { beforeEach, describe, expect, it } from "@jest/globals";
import { instance, mock, reset, verify, when } from "ts-mockito";

import { InterpretationSymbolRankingService } from "./interpretation-symbol-ranking.service";
import { DreamSymbolRepository } from "../../datasources/dream-symbol.repository";
import { InterpretationSimilarityEvaluator } from "../../rankings/interpretation-similarity.evaluator";
import {
  interpretationConfig,
  DEFAULT_INTERPRETATION_CONFIG,
} from "../../config/interpretation.config";

describe("InterpretationSymbolRankingService", () => {
  let service: InterpretationSymbolRankingService;

  const repositoryMock = mock(DreamSymbolRepository);
  const evaluatorMock = mock(InterpretationSimilarityEvaluator);

  const REQUEST = { dream: "테스트" };
  const EMBEDDING = [0.1, 0.2];
  const NEAREST = [{ symbol: "사막" }] as any;
  const RANKED = [{ symbol: "사막", score: 0.9 }] as any;

  const CUSTOM_CONFIG = { topN: 3 };

  beforeEach(async () => {
    reset(repositoryMock);
    reset(evaluatorMock);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InterpretationSymbolRankingService,
        {
          provide: DreamSymbolRepository,
          useValue: instance(repositoryMock),
        },
        {
          provide: InterpretationSimilarityEvaluator,
          useValue: instance(evaluatorMock),
        },
        {
          provide: interpretationConfig.KEY,
          useValue: CUSTOM_CONFIG,
        },
      ],
    }).compile();

    service = module.get(InterpretationSymbolRankingService);
  });

  it("설정한 topn 값으로 문서 조회, 전처리에 넘기는지", async () => {

     // given & when
    when(repositoryMock.findNearestByEmbedding(
        EMBEDDING as any,
        CUSTOM_CONFIG.topN))
    .thenResolve(NEAREST);
    when(evaluatorMock.rank(
        REQUEST as any,
        NEAREST as any))
    .thenReturn(RANKED);

    const result = await service.rankSymbols(REQUEST as any, EMBEDDING as any);

    // then
    expect(result).toEqual(RANKED);
    verify(
      repositoryMock.findNearestByEmbedding(
        EMBEDDING as any,
        CUSTOM_CONFIG.topN
      )
    ).once();
    verify(evaluatorMock.rank(REQUEST as any, NEAREST as any)).once();
  });
});
