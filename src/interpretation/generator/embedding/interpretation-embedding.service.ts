import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { EmbeddingInputFactory } from "../../factories/embedding-input.factory";
import { EmbeddingClient } from "../../../external/embedding/embedding.client";
import { InterpretDreamRequestDto } from "../../dto/interpret-dream-request.dto";

@Injectable()
export class InterpretationEmbeddingService {
  constructor(
    private readonly embeddingInputFactory: EmbeddingInputFactory,
    private readonly embeddingClient: EmbeddingClient
  ) {}

  public async generateEmbedding(request: InterpretDreamRequestDto): Promise<number[]> {
    const embeddingInput = this.embeddingInputFactory.createFromRequest(request);
    const embeddings = await this.embeddingClient.embed([embeddingInput]);
    if (!embeddings.length) {
      throw new InternalServerErrorException(
        "<!> 임베딩 생성에 실패했습니다."
      );
    }
    return embeddings[0];
  }
}
