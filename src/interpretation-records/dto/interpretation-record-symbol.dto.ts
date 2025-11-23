import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "@nestjs/class-validator";

export class InterpretationRecordSymbolDto {
  @IsString()
  @IsNotEmpty()
  symbol!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  emotions?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interpretations?: string[];

  @IsOptional()
  @IsString()
  advice?: string | null;
}
