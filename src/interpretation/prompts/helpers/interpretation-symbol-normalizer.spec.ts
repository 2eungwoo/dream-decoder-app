import { describe, expect, it } from "@jest/globals";
import { InterpretationSymbolNormalizer } from "./interpretation-symbol-normalizer";
import { DreamSymbolDto } from "../../types/dream-symbol.dto";

const baseSymbol: DreamSymbolDto = {
  archetypeId: "FRUIT",
  archetypeName: "과일",
  symbol: "사과",
  symbolMeanings: ["선택", "지식", "새로운 시작"],
  action: "먹는다",
  derivedMeanings: ["에너지를 채우고 싶음", "새로운 자극 흡수"],
  advice: "끌리는 선택을 작게 시도하세요.",
};

describe("InterpretationSymbolNormalizer", () => {
  const normalizer = new InterpretationSymbolNormalizer({
    symbolMeanings: 1,
    derivedMeanings: 1,
    adviceLength: 10,
  });

  it("지정한 limit만큼 목록 자르고 advice가 잘려서 나오는지 ", () => {
    // given & when
    const result = normalizer.normalize({
      ...baseSymbol,
      symbolMeanings: ["선택", "지식"],
      derivedMeanings: ["첫 번째", "두 번째"],
      advice: "엄청나게 긴 advice 문자열 ㄹㄴㅇㄹㅇㄴㄹㄴㅇㅇ",
    });

    // then
    expect(result.symbolMeanings).toEqual(["선택"]);
    expect(result.derivedMeanings).toEqual(["첫 번째"]);
    expect(result.advice).toBe("긴 조언 문…"); // 잘린 advice
  });

  it("필드가 비었으면 undefined/[] 반환하는지 테스트", () => {
    // given & when
    const result = normalizer.normalize({
      ...baseSymbol,
      symbolMeanings: [],
      derivedMeanings: [],
      advice: "",
    });

    // then
    expect(result.symbolMeanings).toEqual([]);
    expect(result.derivedMeanings).toEqual([]);
    expect(result.advice).toBeUndefined();
  });
});
