import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { InterpretationRecord } from "./interpretation-record.entity";
import { SaveInterpretationRecordDto } from "./dto/save-interpretation-record.dto";

@Injectable()
export class InterpretationRecordService {
  constructor(
    @InjectRepository(InterpretationRecord)
    private readonly recordsRepository: Repository<InterpretationRecord>
  ) {}

  public async saveRecord(
    userId: string,
    payload: SaveInterpretationRecordDto
  ) {
    const record = this.recordsRepository.create({
      userId,
      dream: payload.dream,
      emotions: payload.emotions,
      mbti: payload.mbti,
      extraContext: payload.extraContext,
      interpretation: payload.interpretation,
      symbols: payload.symbols,
      userPrompt: payload.userPrompt,
    });

    this.recordsRepository.save(record);
    return record.id;
  }
}
