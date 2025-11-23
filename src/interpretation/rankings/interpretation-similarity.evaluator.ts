import { Injectable } from "@nestjs/common";
import { InterpretDreamRequestDto } from "../dto/interpret-dream-request.dto";
import { DreamSymbolDto } from "../types/dream-symbol.dto";

interface SimilarityScore {
  categories: number;
  emotions: number;
  total: number;
  symbol: DreamSymbolDto;
}

@Injectable()
export class InterpretationSimilarityEvaluator {
  // todo: 가중치는 일단 매직넘버처럼 쓰되 나중에 테스트해보고 .env에서 조율하도록 수정 예정
  private readonly maxCategoryWeight = Number(
    process.env.INTERPRET_CATEGORY_WEIGHT ?? "0.3"
  );
  private readonly maxEmotionWeight = Number(
    process.env.INTERPRET_EMOTION_WEIGHT ?? "0.2"
  );

  // 점수 기반 랭킹 생성
  public rank(
    request: InterpretDreamRequestDto,
    symbols: DreamSymbolDto[]
  ): DreamSymbolDto[] {
    const scores = symbols.map((symbol) => ({
      symbol,
      ...this.calculateSimilarity(request, symbol),
    }));

    // 결과 asc로 정렬하고 매핑, 이걸 RAG 매커니즘에서 쓰도록
    return scores.sort((a, b) => b.total - a.total).map((item) => item.symbol);
  }

  // 유사도 계산
  // 카테고리 점수, 감정 점수, 합 점수
  // SimilarityScore에서 symbol 필드만 제거하고 리턴
  private calculateSimilarity(
    request: InterpretDreamRequestDto,
    symbol: DreamSymbolDto
  ): Omit<SimilarityScore, "symbol"> {
    const categoryScore = this.computeIntersectionScore(
      request.dream,
      symbol.categories,
      this.maxCategoryWeight
    );
    const emotionScore = this.computeArrayScore(
      request.emotions,
      symbol.emotions,
      this.maxEmotionWeight
    );

    return {
      categories: categoryScore,
      emotions: emotionScore,
      total: categoryScore + emotionScore,
    };
  }

  // 교집합 가중치
  private computeIntersectionScore(
    source: string,
    categories: string[],
    maxWeight: number
  ) {
    // 비었으면 걍 0
    if (!source || !categories?.length || maxWeight <= 0) {
      return 0;
    }

    // 원본에서 categories 넘어온거 포함되는거 가져옴
    const normalizedSource = source.toLowerCase();
    const matches = categories.filter((category) =>
      normalizedSource.includes(category.toLowerCase())
    );

    if (!matches.length) {
      return 0;
    }

    // 원본 문자열(source)에서 categories 요소가 얼마나 포함되는지 비율(ratio)
    // (매칭된거 / 전체카테고리) 로 비율 잡아주고
    // 0 < ratio < 1 & maxWeight 하도록 상한선 미니멈 리턴
    // 지금은 없어도 되는데 나중에 .env에 비율값 확장할때 실수하면 방어가능
    const ratio = matches.length / categories.length;
    return Math.min(maxWeight, maxWeight * ratio);
  }

  // value[]랑 target[] 교집합 비율 점수 계산
  private computeArrayScore(
    values: string[] | undefined,
    target: string[] | undefined,
    maxWeight: number
  ) {
    // 비어있으면 걍 0
    if (!values?.length || !target?.length || maxWeight <= 0) {
      return 0;
    }

    // target에서 values에 있는거 필터링하고
    const set = new Set(values.map((value) => value.toLowerCase()));
    const matches = target.filter((candidate) =>
      set.has(candidate.toLowerCase())
    );
    if (!matches.length) {
      return 0;
    }

    const longger = Math.max(values.length, target.length);
    const ratio = matches.length / longger;
    return Math.min(maxWeight, maxWeight * ratio);
  }
}
