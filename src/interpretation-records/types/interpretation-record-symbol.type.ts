export interface InterpretationRecordSymbol {
  symbol: string;
  categories?: string[];
  description?: string;
  emotions?: string[];
  interpretations?: string[];
  advice?: string | null;
}
