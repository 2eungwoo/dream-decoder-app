import {Inject, Injectable, InternalServerErrorException} from "@nestjs/common";
import {EmbeddingInputFactory} from "./factories/embedding-input.factory";
import {DreamSymbolRepository} from "./datasources/dream-symbol.repository";
import {EmbeddingClient} from "../external/embedding/embedding.client";
import {InterpretationSimilarityEvaluator} from "./rankings/interpretation-similarity.evaluator";
import {InterpretationUserPromptBuilder} from "./prompts/interpretation-user-prompt.builder";
import {ConfigType} from "@nestjs/config";
import {DEFAULT_INTERPRETATION_CONFIG, interpretationConfig} from "./config/interpretation.config";
import {InterpretDreamRequestDto} from "./dto/interpret-dream-request.dto";
import {DreamSymbolDto} from "./types/dream-symbol.dto";
import {INTERPRETATION_SYSTEM_PROMPT} from "./prompts/interpretation-system.prompt";
import {OpenAIClient} from "../external/openai/openai.client";


@Injectable()
export class InterpretationGenerator {
  constructor(
      private readonly embeddingInputFactory: EmbeddingInputFactory,
      private readonly embeddingClient: EmbeddingClient,
      private readonly symbolRepository: DreamSymbolRepository,
      private readonly promptBuilder: InterpretationUserPromptBuilder,
      private readonly similarityEvaluator: InterpretationSimilarityEvaluator,
      private readonly openAiClient: OpenAIClient,
      @Inject(interpretationConfig.KEY)
      private readonly interpretConfig: ConfigType<typeof interpretationConfig> = DEFAULT_INTERPRETATION_CONFIG
  ) {}

  public async generate(request: InterpretDreamRequestDto): Promise<string> {
    // 1. 임베딩
    const embeddingInput = this.embeddingInputFactory.createFromRequest(request);
    const embeddings = await this.embeddingClient.embed([embeddingInput]);
    if(!embeddings.length) {
      throw new InternalServerErrorException("<!> 임베딩 생성에 실패했습니다.");
    }

    // 2. 전처리
    const TopN = this.interpretConfig?.topN ?? DEFAULT_INTERPRETATION_CONFIG.topN;
    const relatedSymbols: DreamSymbolDto[] = await this.symbolRepository.findNearestByEmbedding(embeddings[0], TopN);
    const ranked = this.similarityEvaluator.rank(request, relatedSymbols);

    // 3. 프롬프팅
    const prompt = this.promptBuilder.buildUserPrompt(request, ranked);
    const interpretation = await this.openAiClient.generateFromMessages([
      {
        role: "system",
        content: INTERPRETATION_SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: prompt, // INTERPRETATION_USER_PROMPT
      },
    ]);

    return interpretation;
  }
}