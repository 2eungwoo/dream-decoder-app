import { Inject, Injectable } from "@nestjs/common";
import { InterpretDreamRequestDto } from "../dto/interpret-dream-request.dto";
import { DreamSymbolDto } from "../types/dream-symbol.dto";
import { ConfigType } from "@nestjs/config";
import {
  DEFAULT_INTERPRETATION_CONFIG,
  interpretationConfig,
} from "../config/interpretation.config";
import { SimilarityMatchStrategy } from "./strategies/similarity-match.strategy";
import { SymbolMatchStrategy } from "./strategies/symbol-match.strategy";
import { ActionMatchStrategy } from "./strategies/action-match.strategy";
import { DerivedMatchStrategy } from "./strategies/derived-match.strategy";

@Injectable()
export class InterpretationSimilarityEvaluator {
  constructor(
    @Inject(interpretationConfig.KEY)
    private readonly config: ConfigType<typeof interpretationConfig> = DEFAULT_INTERPRETATION_CONFIG
  ) {
    const weights = this.weights;
    this.strategies = [
      new SymbolMatchStrategy(weights.symbol),
      new ActionMatchStrategy(weights.action),
      new DerivedMatchStrategy(weights.derived),
    ];
  }

  private readonly strategies: SimilarityMatchStrategy[];

  public rank(
    request: InterpretDreamRequestDto,
    symbols: DreamSymbolDto[]
  ): DreamSymbolDto[] {
    const searchText = this.buildSearchText(request);
    const scores = symbols.map((symbol) => ({
      doc: symbol,
      total: this.calculateScore(searchText, symbol),
    }));

    return scores.sort((a, b) => b.total - a.total).map((item) => item.doc);
  }

  private calculateScore(searchText: string, symbol: DreamSymbolDto) {
    return this.strategies.reduce(
      (sum, strategy) => sum + strategy.score(searchText, symbol),
      0
    );
  }

  private get weights() {
    return (
      this.config?.similarityWeights ??
      DEFAULT_INTERPRETATION_CONFIG.similarityWeights
    );
  }

  private buildSearchText(request: InterpretDreamRequestDto) {
    const dreamSource = `${request.dream ?? ""} ${
      request.extraContext ?? ""
    }`.trim();
    const emotionSource = (request.emotions ?? []).join(" ").trim();
    return `${dreamSource} ${emotionSource}`.trim();
  }
}
