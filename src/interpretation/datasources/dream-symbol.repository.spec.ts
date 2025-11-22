import { beforeEach, describe, expect, it } from "@jest/globals";
import { Test, TestingModule } from "@nestjs/testing";
import { DataSource } from "typeorm";
import {
  mock,
  instance,
  when,
  verify,
  anything,
  deepEqual,
  capture,
} from "ts-mockito";
import { DreamSymbolRepository } from "./dream-symbol.repository";

describe("DreamSymbolRepository", () => {
  let repository: DreamSymbolRepository;
  const dataSourceMock = mock(DataSource);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DreamSymbolRepository,
        { provide: DataSource, useValue: instance(dataSourceMock) },
      ],
    }).compile();

    repository = module.get(DreamSymbolRepository);
  });

  it("pgvector 쿼리가 제대로 매핑 되는지 확인", async () => {
    // given & when
    when(dataSourceMock.query(anything(), anything())).thenResolve([
      {
        symbol: "이빨이 빠지는 꿈",
        categories: ["자존감"],
        description: "자존감/표현 상징",
        emotions: ["불안"],
        mbtiTone: { ENFP: "감정을 표현하세요" },
        interpretations: ["자신감 흔들림"],
        advice: "거울 앞 연습",
      },
    ]);

    // then
    const results = await repository.findNearestByEmbedding([0.1, 0.2], 3);

    // ts-mockito는 deep-equals 비교를 안하므로 테스트 시 호출 여부를 봐야한다??
    // verify(dataSourceMock.query(anything(), anything())).once();

    // capture로 실제 값 확인 후 실제 구조 출력값 보고 deep-equals 비교 가능함
    // const [sql, params] = capture((dataSourceMock as any).query).last();
    // console.log(params);

    verify(
      dataSourceMock.query(anything(), deepEqual(["[0.1,0.2]", 3]))
    ).once();

    const row = results[0];

    expect(results).toHaveLength(1);
    expect(row.symbol).toBe("이빨이 빠지는 꿈");
    expect(row.categories).toEqual(["자존감"]);
    expect(row.description).toBe("자존감/표현 상징");
    expect(row.emotions).toEqual(["불안"]);
    expect(row.mbtiTone).toEqual({ ENFP: "감정을 표현하세요" });
    expect(row.interpretations).toEqual(["자신감 흔들림"]);
    expect(row.advice).toBe("거울 앞 연습");
  });
});
