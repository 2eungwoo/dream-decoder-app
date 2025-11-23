import {
  Body,
  Controller,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import { ApiResponseFactory } from "../shared/dto/api-response.dto";
import { InterpretAuthGuard } from "../interpretation/guards/interpret-auth.guard";
import { SaveInterpretationRecordDto } from "./dto/save-interpretation-record.dto";
import { InterpretationRecordService } from "./interpretation-record.service";

@Controller("interpret/logs")
@UseGuards(InterpretAuthGuard)
export class InterpretationRecordController {
  constructor(
    private readonly interpretationRecordService: InterpretationRecordService
  ) {}

  @Post()
  public async save(
    @Body() payload: SaveInterpretationRecordDto,
    @Req() req: Request
  ) {
    if (!req.user) {
      throw new UnauthorizedException("<!> 사용자 인증이 필요합니다.");
    }

    const savedId = await this.interpretationRecordService.saveRecord(
      req.user.id,
      payload
    );
    return ApiResponseFactory.success(
      { id: savedId },
      "해몽 기록이 저장되었습니다."
    );
  }
}
