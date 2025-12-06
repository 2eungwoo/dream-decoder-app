import "reflect-metadata";
import { Test, TestingModule } from "@nestjs/testing";
import { beforeEach, describe, expect, it } from "@jest/globals";
import { anything, instance, mock, reset, verify, when } from "ts-mockito";
import { InternalServerErrorException } from "@nestjs/common";

import { InterpretationEmbeddingService } from "./interpretation-embedding.service";
import { EmbeddingInputFactory } from "../../factories/embedding-input.factory";
import { EmbeddingClient } from "../../../external/embedding/embedding.client";

describe("InterpretationEmbeddingService", () => {
  let service: InterpretationEmbeddingService;
  const inputFactoryMock = mock(EmbeddingInputFactory);
  const embeddingClientMock = mock(EmbeddingClient);

  const REQUEST = {
    dream: "테스트 꿈",
  };

  beforeEach(async () => {
    reset(inputFactoryMock);
    reset(embeddingClientMock);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InterpretationEmbeddingService,
        { provide: EmbeddingInputFactory, useValue: instance(inputFactoryMock) },
        { provide: EmbeddingClient, useValue: instance(embeddingClientMock) },
      ],
    }).compile();

    service = module.get(InterpretationEmbeddingService);
  });

  it("임베딩 성공 후 첫번쨰 벡터 반환", async () => {
    // given
    const EMBEDDING_INPUT = "embedding-input";
    const EMBEDDINGS = [[0.1, 0.2, 0.3]];

    // when
    when(inputFactoryMock.createFromRequest(REQUEST as any)).thenReturn(EMBEDDING_INPUT);
    when(embeddingClientMock.embed(anything())).thenResolve(EMBEDDINGS);

    const result = await service.generateEmbedding(REQUEST as any);

    // then
    expect(result).toEqual(EMBEDDINGS[0]);
    verify(inputFactoryMock.createFromRequest(REQUEST as any)).once();
    verify(embeddingClientMock.embed(anything())).once();
  });

  it("임베딩 비어있으면 예외", async () => {

    // given & when
    when(inputFactoryMock.createFromRequest(REQUEST as any)).thenReturn("input");
    when(embeddingClientMock.embed(anything())).thenResolve([]);

    // then
    await expect(
      service.generateEmbedding(REQUEST as any)
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });
});
