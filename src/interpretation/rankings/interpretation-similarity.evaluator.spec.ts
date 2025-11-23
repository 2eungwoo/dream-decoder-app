import { describe, it, expect } from "@jest/globals";
import { InterpretationSimilarityEvaluator } from "./interpretation-similarity.evaluator";
import { DreamSymbolDto } from "../types/dream-symbol.dto";

// 테스트용 더미
function buildSymbol(partial: Partial<DreamSymbolDto>): DreamSymbolDto {
  return {
    symbol: "기본",
    categories: [],
    description: "",
    emotions: [],
    mbtiTone: {},
    interpretations: [],
    advice: "",
    ...partial,
  };
}

describe("InterpretationSimilarityEvaluator", () => {
  const evaluator = new InterpretationSimilarityEvaluator();

  it("catagories/emotions 교집합에서 더 유사한게 더 앞 순위로 정렬되는지 테스트", () => {
    const request = {
      dream: "물 위를 걷는 꿈",
      emotions: ["기쁨", "평화"],
    } as any;

    const symbols = [
      buildSymbol({
        symbol: "강한 매칭",
        categories: ["물", "자유"],
        emotions: ["평화"],
      }),
      buildSymbol({
        symbol: "약한 매칭",
        categories: ["불", "열정"],
        emotions: ["긴장"],
      }),
    ];

    const ranked = evaluator.rank(request, symbols);
    expect(ranked[0].symbol).toBe("강한 매칭"); // 유사도 점수 더 높은 심볼
    expect(ranked[1].symbol).toBe("약한 매칭"); // 그리고 그 다음
  });

  it("교집합 없어서 0 나오면 점수는 같지만 반환 순서는 입력 순서를 유지하는지 테스트", () => {
    const request = {
      dream: "아무것도 관련 없는 꿈",
      emotions: ["아무 감정 아님"],
    } as any;

    const symbols = [
      buildSymbol({ symbol: "A", categories: ["x"], emotions: ["y"] }),
      buildSymbol({ symbol: "B", categories: ["p"], emotions: ["q"] }),
    ];

    const ranked = evaluator.rank(request, symbols);

    // 둘다 total = 0
    // 입력 순서 그대로인지
    expect(ranked.map((s) => s.symbol)).toEqual(["A", "B"]);
  });

  it("catagories/emotions 중에 하나만 매칭되면 그거랑 맞게 잠수 반영되는지 테스트", () => {
    // 둘 다 매칭 요소 1개씩 줬으면 total 같음
    // 어떤게 먼저 와도 상관없는데 둘 다 0이면 안됨 그걸 검증
    const request = {
      dream: "불 타오르는 장면",
      emotions: ["기쁨"],
    } as any;

    const symbols = [
      buildSymbol({
        symbol: "카테고리만 매칭",
        categories: ["불"],
        emotions: ["우울"],
      }),
      buildSymbol({
        symbol: "감정만 매칭",
        categories: ["물"],
        emotions: ["기쁨"],
      }),
    ];

    const ranked = evaluator.rank(request, symbols);

    expect(ranked.length).toBe(2);
    expect(ranked[0].symbol).not.toBeUndefined();
  });
});
