import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from "@nestjs/class-validator";
import { Type } from "@nestjs/class-transformer";
import { InterpretationRecordSymbolDto } from "./interpretation-record-symbol.dto";

export class SaveInterpretationRecordDto {
  @IsString()
  @IsNotEmpty()
  dream!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  emotions?: string[];

  @IsOptional()
  @IsString()
  mbti?: string;

  @IsOptional()
  @IsString()
  extraContext?: string;

  @IsString()
  @IsNotEmpty()
  interpretation!: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => InterpretationRecordSymbolDto)
  symbols?: InterpretationRecordSymbolDto[];

  @IsOptional()
  @IsString()
  userPrompt?: string;
}
