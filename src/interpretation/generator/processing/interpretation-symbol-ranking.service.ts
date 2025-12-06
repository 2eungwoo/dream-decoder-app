import { Inject, Injectable } from "@nestjs/common";
import { DreamSymbolRepository } from "../../datasources/dream-symbol.repository";
import { InterpretationSimilarityEvaluator } from "../../rankings/interpretation-similarity.evaluator";
import {
  DEFAULT_INTERPRETATION_CONFIG,
  interpretationConfig,
} from "../../config/interpretation.config";
import { ConfigType } from "@nestjs/config";
import { InterpretDreamRequestDto } from "../../dto/interpret-dream-request.dto";
import { DreamSymbolDto } from "../../types/dream-symbol.dto";

@Injectable()
export class InterpretationSymbolRankingService {
  constructor(
    private readonly symbolRepository: DreamSymbolRepository,
    private readonly similarityEvaluator: InterpretationSimilarityEvaluator,
    @Inject(interpretationConfig.KEY)
    private readonly interpretConfig: ConfigType<typeof interpretationConfig> = DEFAULT_INTERPRETATION_CONFIG
  ) {}

  public async rankSymbols(request: InterpretDreamRequestDto, embedding: number[]): Promise<DreamSymbolDto[]> {

    const topN = this.interpretConfig?.topN ?? DEFAULT_INTERPRETATION_CONFIG.topN;
    const relatedSymbols = await this.symbolRepository.findNearestByEmbedding(
      embedding,
      topN
    );
    return this.similarityEvaluator.rank(request, relatedSymbols);
  }
}
