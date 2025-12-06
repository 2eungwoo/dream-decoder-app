import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { EmbeddingClient } from "../external/embedding/embedding.client";
import { OpenAIClient } from "../external/openai/openai.client";
import { InterpretDreamRequestDto } from "./dto/interpret-dream-request.dto";
import { EmbeddingInputFactory } from "./factories/embedding-input.factory";
import { DreamSymbolRepository } from "./datasources/dream-symbol.repository";
import { InterpretationUserPromptBuilder } from "./prompts/interpretation-user-prompt.builder";
import { InvalidDreamException } from "./exceptions/invalid-dream.exception";
import { InterpretationCacheService } from "./cache/interpretation-cache.service";
import { DreamSymbolDto } from "./types/dream-symbol.dto";
import { InterpretationSimilarityEvaluator } from "./rankings/interpretation-similarity.evaluator";
import { INTERPRETATION_SYSTEM_PROMPT } from "./prompts/interpretation-system.prompt";
import { ConfigType } from "@nestjs/config";
import {
  DEFAULT_INTERPRETATION_CONFIG,
  interpretationConfig,
} from "./config/interpretation.config";
import {InterpretationGenerator} from "./interpretation.generator";

@Injectable()
export class InterpretationService {
  constructor(
    private readonly cacheService: InterpretationCacheService,
    private readonly generator: InterpretationGenerator,
  ) {}

  public async generateInterpretation(request: InterpretDreamRequestDto) {
    if (!request?.dream?.trim()) {
      throw new InvalidDreamException();
    }

    const cacheKey = this.cacheService.createKey(request);
    const cached = this.cacheService.get(cacheKey);
    if (cached) {
      return {
        interpretation: cached,
        fromCache: true,
      };
    }

    // generator : 임베딩 -> 전처리 -> ai호출
    const generatedInterpretation = await this.generator.generate(request);

    this.cacheService.set(cacheKey, generatedInterpretation);
    return {
      interpretation: generatedInterpretation,
      fromCache: false,
    };
  }
}
