import { Inject, Injectable, Logger } from "@nestjs/common";
import { InterpretDreamRequestDto } from "../dto/interpret-dream-request.dto";
import { DreamSymbolDto } from "../types/dream-symbol.dto";
import { INTERPRETATION_USER_GUIDANCE } from "./interpretation-user-prompt.guidance";
import { ConfigType } from "@nestjs/config";
import {
  DEFAULT_INTERPRETATION_CONFIG,
  interpretationConfig,
} from "../config/interpretation.config";
import { InterpretationSymbolNormalizer } from "./helpers/interpretation-symbol-normalizer";
import { InterpretationSymbolFormatter } from "./helpers/interpretation-symbol-formatter";

@Injectable()
export class InterpretationUserPromptBuilder {
  private readonly logger = new Logger(InterpretationUserPromptBuilder.name);

  constructor(
    @Inject(interpretationConfig.KEY)
    private readonly config: ConfigType<
      typeof interpretationConfig
    > = DEFAULT_INTERPRETATION_CONFIG
  ) {
    const limits =
      this.config?.promptLimits ?? DEFAULT_INTERPRETATION_CONFIG.promptLimits;
    this.symbolNormalizer = new InterpretationSymbolNormalizer(limits);
    this.symbolFormatter = new InterpretationSymbolFormatter();
  }

  private readonly symbolNormalizer: InterpretationSymbolNormalizer;
  private readonly symbolFormatter: InterpretationSymbolFormatter;

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

    const prompt = parts.filter(Boolean).join("\n\n");

    this.logger.debug(
      `[Prompt] symbols=${symbols.length}, length=${prompt.length}`
    );

    return prompt;
  }

  private formatSymbol(symbol: DreamSymbolDto): string {
    const normalized = this.symbolNormalizer.normalize(symbol);
    return this.symbolFormatter.format(normalized);
  }

  private optionalLine(label: string, value?: string | null): string | null {
    if (!value || !value.trim()) return null;
    return `${label}: ${value.trim()}`;
  }
}
