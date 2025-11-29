import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiResponseFactory } from "../shared/dto/api-response.dto";
import { InterpretAuthGuard } from "../interpretation/guards/interpret-auth.guard";
import { SaveInterpretationRecordDto } from "./dto/save-interpretation-record.dto";
import { InterpretationRecordService } from "./interpretation-record.service";
import {
  CurrentUser,
  RequestUser,
} from "../shared/decorators/current-user.decorator";

@Controller()
@UseGuards(InterpretAuthGuard)
export class InterpretationRecordController {
  constructor(
    private readonly interpretationRecordService: InterpretationRecordService
  ) {}

  @Post("interpret/logs")
  public async saveInterpretation(
    @Body() payload: SaveInterpretationRecordDto,
    @CurrentUser() user: RequestUser
  ) {
    const savedId = await this.interpretationRecordService.saveRecord(
      user.id,
      payload
    );
    return ApiResponseFactory.success(
      { id: savedId },
      "해몽 기록이 저장되었습니다."
    );
  }

  @Get("interpret/logs")
  public async listInterpretations(@CurrentUser() user: RequestUser) {
    const records = await this.interpretationRecordService.listRecords(user.id);
    return ApiResponseFactory.success(records);
  }

  @Get("interpret/logs/:id")
  public async findDetail(
    @Param("id") id: string,
    @CurrentUser() user: RequestUser
  ) {
    const record = await this.interpretationRecordService.findRecord(
      user.id,
      id
    );

    return ApiResponseFactory.success(record);
  }
}
