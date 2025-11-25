import { Injectable } from "@nestjs/common";
import { InterpretDreamRequestDto } from "../dto/interpret-dream-request.dto";
import { DreamSymbolDto } from "../types/dream-symbol.dto";
import { INTERPRETATION_USER_GUIDANCE } from "./interpretation-user-prompt.guidance";

@Injectable()
export class InterpretationUserPromptBuilder {
  public buildUserPrompt(
    request: InterpretDreamRequestDto,
    symbols: DreamSymbolDto[]
  ) {
    const formattedSymbols = symbols
      .map((symbol) => this.formatSymbol(symbol))
      .filter(Boolean)
      .join("\n\n");

    const parts = [
      `Dream narrative:\n${request.dream.trim()}`,
      this.optionalLine("Dreamer emotions", request.emotions?.join(", ")),
      this.optionalLine("Dreamer MBTI", request.mbti?.toUpperCase()),
      this.optionalLine("Additional context", request.extraContext?.trim()),
      "Symbol insights to weave into the response:",
      formattedSymbols || "No prior references found.",
      INTERPRETATION_USER_GUIDANCE,
    ];

    return parts.filter(Boolean).join("\n\n");
  }

  private formatSymbol(symbol: DreamSymbolDto): string {
    const lines = [
      `Archetype: ${symbol.archetypeName} (${symbol.archetypeId})`,
      this.optionalLine("Core Meanings", this.joinList(symbol.coreMeanings)),
      this.optionalLine(
        "Symbol Examples",
        this.joinList(symbol.symbolExamples)
      ),
      `Focus Symbol: ${symbol.symbol}`,
      this.optionalLine(
        "Symbol Meanings",
        this.joinList(symbol.symbolMeanings)
      ),
      this.optionalLine("Scenario", symbol.scenarioTitle),
      this.formatList("Derived Meanings", symbol.scenarioDerivedMeanings),
      this.optionalLine("Advice", symbol.advice),
    ];

    return lines.filter(Boolean).join("\n");
  }

  private optionalLine(label: string, value?: string | null): string | null {
    if (!value || !value.trim()) return null;
    return `${label}: ${value.trim()}`;
  }

  private formatList(label: string, values?: string[]): string | null {
    if (!values?.length) {
      return null;
    }
    const entries = values.map((line) => `- ${line}`).join("\n");
    return `${label}:\n${entries}`;
  }

  private joinList(values?: string[]) {
    if (!values?.length) {
      return null;
    }
    return values.join(", ");
  }
}
