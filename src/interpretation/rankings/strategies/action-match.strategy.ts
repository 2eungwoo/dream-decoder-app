import { DreamSymbolDto } from "../../types/dream-symbol.dto";
import { SimilarityMatchStrategy } from "./similarity-match.strategy";
import { computeTextScore } from "../utils/text-match.util";

export class ActionMatchStrategy implements SimilarityMatchStrategy {
  constructor(private readonly weight: number) {}

  public score(searchText: string, symbol: DreamSymbolDto): number {
    return computeTextScore(
      searchText,
      [symbol.action, symbol.archetypeName, symbol.archetypeId],
      this.weight
    );
  }
}
