import { Injectable } from "@nestjs/common";
import { InterpretDreamRequestDto } from "../dto/interpret-dream-request.dto";
import { DreamSymbolDto } from "../types/dream-symbol.dto";
import { INTERPRETATION_USER_GUIDANCE } from "./interpretation-user-prompt.guidance";
import { PROMPT_LIMITS } from "./interpretation-user-prompt.limits";

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
    const coreMeanings = this.limitList(
      symbol.coreMeanings,
      PROMPT_LIMITS.coreMeanings
    );
    const symbolExamples = this.limitList(
      symbol.symbolExamples,
      PROMPT_LIMITS.symbolExamples
    );
    const symbolMeanings = this.limitList(
      symbol.symbolMeanings,
      PROMPT_LIMITS.symbolMeanings
    );
    const derivedMeanings = this.limitList(
      symbol.scenarioDerivedMeanings,
      PROMPT_LIMITS.derivedMeanings
    );

    const lines = [
      `Archetype: ${symbol.archetypeName} (${symbol.archetypeId})`,
      this.optionalLine("Core Meanings", this.joinList(coreMeanings)),
      this.optionalLine("Symbol Examples", this.joinList(symbolExamples)),
      `Focus Symbol: ${symbol.symbol}`,
      this.optionalLine("Symbol Meanings", this.joinList(symbolMeanings)),
      this.optionalLine("Scenario", symbol.scenarioTitle),
      this.formatList("Derived Meanings", derivedMeanings),
      this.optionalLine(
        "Advice",
        this.truncateText(symbol.advice, PROMPT_LIMITS.adviceLength)
      ),
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

  private limitList(values?: string[], limit?: number) {
    if (!values?.length || !limit || limit <= 0) {
      return values;
    }
    const trimmed = values.filter(Boolean).slice(0, limit);
    return trimmed.length ? trimmed : undefined;
  }

  private truncateText(value?: string | null, maxLength?: number): string | null {
    if (!value?.trim()) {
      return null;
    }
    if (!maxLength || maxLength <= 0 || value.length <= maxLength) {
      return value.trim();
    }
    return `${value.trim().slice(0, maxLength).trim()}…`;
  }
}
