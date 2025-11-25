import { Injectable, Logger } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { DreamSymbolDto } from "../types/dream-symbol.dto";

@Injectable()
export class DreamSymbolRepository {
  private readonly logger = new Logger(DreamSymbolRepository.name);

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  public async findNearestByEmbedding(
    vector: number[],
    limit: number
  ): Promise<DreamSymbolDto[]> {
    this.logger.log(
      `[검색] dream_symbols 임베딩 탐색 (차원=${vector.length}, limit=${limit})`
    );
    const vectorLiteral = `[${vector.join(",")}]`;
    const rows: DreamSymbolDto[] = await this.dataSource.query(
      `
        SELECT archetype_id AS "archetypeId",
               archetype_name AS "archetypeName",
               symbol,
               symbol_meanings AS "symbolMeanings",
               action,
               derived_meanings AS "derivedMeanings",
               advice
        FROM dream_symbols
        ORDER BY embedding <=> $1::vector
        LIMIT $2;
      `,
      [vectorLiteral, limit]
    );

    this.logger.log(`[검색] ${rows.length}건 결과 반환`);
    return rows.map((row) => ({
      archetypeId: row.archetypeId,
      archetypeName: row.archetypeName,
      symbol: row.symbol,
      symbolMeanings: this.normalizeArray(row.symbolMeanings),
      action: row.action,
      derivedMeanings: this.normalizeArray(row.derivedMeanings),
      advice: row.advice,
    }));
  }

  private normalizeArray(value: unknown) {
    if (!value) {
      return [];
    }
    if (Array.isArray(value)) {
      return value;
    }
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  }

}
