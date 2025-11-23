import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { EmbeddingClient } from "../external/embedding/embedding.client";
import { OpenAIClient } from "../external/openai/openai.client";
import { InterpretDreamRequestDto } from "./dto/interpret-dream-request.dto";
import { ApiResponseFactory } from "../shared/dto/api-response.dto";
import { EmbeddingInputFactory } from "./factories/embedding-input.factory";
import { DreamSymbolRepository } from "./datasources/dream-symbol.repository";
import { InterpretationPromptBuilder } from "./prompts/interpretation-prompt.builder";
import { InvalidDreamException } from "./exceptions/invalid-dream.exception";
import { InterpretationCacheService } from "./cache/interpretation-cache.service";
import { DreamSymbolDto } from "./types/dream-symbol.dto";
import { InterpretationSimilarityEvaluator } from "./rankings/interpretation-similarity.evaluator";

@Injectable()
export class InterpretationService {
  constructor(
    private readonly embeddingInputFactory: EmbeddingInputFactory,
    private readonly embeddingClient: EmbeddingClient,
    private readonly symbolRepository: DreamSymbolRepository,
    private readonly promptBuilder: InterpretationPromptBuilder,
    private readonly openAIClient: OpenAIClient,
    private readonly cacheService: InterpretationCacheService,
    private readonly similarityEvaluator: InterpretationSimilarityEvaluator
  ) {}

  TOP_N = 5;
  public async interpret(request: InterpretDreamRequestDto) {
    if (!request?.dream?.trim()) {
      throw new InvalidDreamException();
    }

    const cacheKey = this.cacheService.createKey(request);
    const cached = this.cacheService.get(cacheKey);
    if (cached) {
      return ApiResponseFactory.success(
        { interpretation: cached },
        "해몽 결과가 캐시에서 불러와졌습니다."
      );
    }

    const embeddingInput =
      this.embeddingInputFactory.createFromRequest(request);
    const embeddings = await this.embeddingClient.embed([embeddingInput]);
    if (!embeddings.length) {
      throw new InternalServerErrorException("<!> 임베딩 생성에 실패했습니다.");
    }

    const relatedSymbols: DreamSymbolDto[] =
      await this.symbolRepository.findNearestByEmbedding(
        embeddings[0],
        this.TOP_N
      );
    const ranked = this.similarityEvaluator.rank(request, relatedSymbols);

    const prompt = this.promptBuilder.buildPrompt(request, ranked);
    const interpretation = await this.openAIClient.generateFromMessages([
      {
        role: "system",
        content:
          "You are Dream Decoder.\n\nUse the retrieved dream symbols to interpret the user's dream.\nBlend the dream narrative, emotions, MBTI and context naturally.\nWrite as a warm, flowing paragraph addressed directly to “당신”, with no headings or numbered lists.\nSpeak as if sharing empathic conversation: first describe what the dream reveals, then segue into gentle, practical suggestions, and casually reference similar dream themes when helpful.\nIf a retrieved symbol was not explicitly mentioned by the dreamer, clearly frame it as “비슷한 사례로는 …” so they understand it is a related reference.\nFocus on the retrieved symbols and keep the answer under 600 characters.",
      },
      {
        role: "user",
        content: prompt,
      },
    ]);

    const response = ApiResponseFactory.success(
      { interpretation },
      "해몽이 완료되었습니다! 아래 내용을 확인해주세요"
    );
    this.cacheService.set(cacheKey, interpretation);
    return response;
  }
}
