import { DreamSymbolDto } from "../../types/dream-symbol.dto";

export interface SimilarityMatchStrategy {
  score(searchText: string, symbol: DreamSymbolDto): number;
}
