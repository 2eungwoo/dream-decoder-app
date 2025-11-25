import { Injectable } from '@nestjs/common';
import { InterpretDreamRequestDto } from "../dto/interpret-dream-request.dto";
import { DreamSymbolDto } from "../types/dream-symbol.dto";

@Injectable()
export class EmbeddingInputFactory {
  public createFromRequest(body: InterpretDreamRequestDto) {
    const lines = [
      this.formatLine("Dream", body.dream),
      this.formatLine("Context", body.extraContext),
    ].filter((line): line is string => Boolean(line));

    return lines.join("\n");
  }

  public createFromSymbol(symbol: DreamSymbolDto) {
    const parts = [
      this.formatLine(
        "Archetype",
        `${symbol.archetypeName} (${symbol.archetypeId})`
      ),
      this.formatList("Core Meanings", symbol.coreMeanings),
      this.formatList("Symbol Examples", symbol.symbolExamples),
      this.formatLine("Symbol", symbol.symbol),
      this.formatList("Symbol Meanings", symbol.symbolMeanings),
      this.formatLine("Scenario", symbol.scenarioTitle),
      this.formatList("Derived Meanings", symbol.scenarioDerivedMeanings),
      this.formatLine("Advice", symbol.advice),
    ].filter((line): line is string => Boolean(line));

    return parts.join("\n");
  }

  /*
    - string 또는 string[] 모두 처리 
	  -	trim 처리
    - 빈 배열 혹은 빈 문자열 automatic skip
	  -	null/undefined 자동 skip
  */
  private formatLine(label: string, value?: string | null): string | null {
    if (value == null) return null;

    const trimmed = value.trim();
    return trimmed ? `${label}: ${trimmed}` : null;
  }

  private formatList(label: string, list?: string[]) {
    if (!list || list.length === 0) {
      return null;
    }
    return `${label}:\n${list.map((item) => `- ${item}`).join("\n")}`;
  }
}
