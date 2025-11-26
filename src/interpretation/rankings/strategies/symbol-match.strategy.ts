import { DreamSymbolDto } from "../../types/dream-symbol.dto";
import { SimilarityMatchStrategy } from "./similarity-match.strategy";
import { computeTextScore } from "../utils/text-match.util";

export class SymbolMatchStrategy implements SimilarityMatchStrategy {
  constructor(private readonly weight: number) {}

  public score(searchText: string, symbol: DreamSymbolDto): number {
    return computeTextScore(
      searchText,
      [symbol.symbol, ...symbol.symbolMeanings],
      this.weight
    );
  }
}
