import { Injectable } from "@nestjs/common";
import { InterpretDreamRequestDto } from "../dto/interpret-dream-request.dto";
import { InterpretationEmbeddingService } from "./embedding/interpretation-embedding.service";
import { InterpretationSymbolRankingService } from "./processing/interpretation-symbol-ranking.service";
import { InterpretationPromptService } from "./prompt/interpretation-prompt.service";
import { InterpretationLlmService } from "./interpretation-llm.service";

@Injectable()
export class InterpretationGenerator {
  constructor(
    private readonly embeddingService: InterpretationEmbeddingService,
    private readonly rankingService: InterpretationSymbolRankingService,
    private readonly promptService: InterpretationPromptService,
    private readonly llmService: InterpretationLlmService
  ) {}


  // 임베딩 -> 전처리 -> 프롬프팅
  public async generate(request: InterpretDreamRequestDto): Promise<string> {

    const embedding = await this.embeddingService.generateEmbedding(request);
    const rankedSymbols = await this.rankingService.rankSymbols(request, embedding);
    const messages = this.promptService.buildMessages(request, rankedSymbols);
    return this.llmService.generate(messages);
  }
}
