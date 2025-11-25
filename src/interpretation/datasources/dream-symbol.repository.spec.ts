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
        archetypeId: "FRUIT",
        archetypeName: "과일",
        coreMeanings: '["성숙","풍요"]',
        symbolExamples: ["사과", "배"],
        symbol: "사과",
        symbolMeanings: ["선택", "건강"],
        scenarioTitle: "사과를 따는 꿈",
        scenarioDerivedMeanings: '["결실","선택 임박"]',
        advice: "주저했던 선택을 정리하세요",
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
    expect(row.archetypeId).toBe("FRUIT");
    expect(row.archetypeName).toBe("과일");
    expect(row.coreMeanings).toEqual(["성숙", "풍요"]);
    expect(row.symbolExamples).toEqual(["사과", "배"]);
    expect(row.symbol).toBe("사과");
    expect(row.symbolMeanings).toEqual(["선택", "건강"]);
    expect(row.scenarioTitle).toBe("사과를 따는 꿈");
    expect(row.scenarioDerivedMeanings).toEqual(["결실", "선택 임박"]);
    expect(row.advice).toBe("주저했던 선택을 정리하세요");
  });
});
