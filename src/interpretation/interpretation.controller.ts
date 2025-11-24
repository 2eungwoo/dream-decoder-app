import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import { InterpretDreamRequestDto } from "./dto/interpret-dream-request.dto";
import { InterpretAuthGuard } from "./guards/interpret-auth.guard";
import { UseInterpretationSemaphore } from "./semaphore/InterpretationSemaphore.decorator";
import { ApiResponseFactory } from "../shared/dto/api-response.dto";
import { InterpretationRequestPublisher } from "../pipeline/interpretation/publisher/request.publisher";
import { InterpretationStatusStore } from "../pipeline/interpretation/status/status.store";

@Controller()
@UseGuards(InterpretAuthGuard)
@UseInterpretationSemaphore()
export class InterpretationController {
  constructor(
    private readonly requestPublisher: InterpretationRequestPublisher,
    private readonly statusStore: InterpretationStatusStore
  ) {}

  @Post("interpret")
  public async interpret(
    @Body() payload: InterpretDreamRequestDto,
    @Req() req: Request
  ) {
    if (!req.user) {
      throw new UnauthorizedException("<!> 사용자 인증이 필요합니다.");
    }

    const { requestId } = await this.requestPublisher.publish(
      req.user,
      payload
    );

    return ApiResponseFactory.success(
      { requestId },
      "해몽 요청이 접수되었습니다. 상태를 확인해주세요."
    );
  }

  @Get("interpret/status/:requestId")
  public async getStatus(
    @Param("requestId") requestId: string,
    @Req() req: Request
  ) {
    if (!req.user) {
      throw new UnauthorizedException("<!> 사용자 인증이 필요합니다.");
    }

    const status = await this.statusStore.findStatusByRequest(
      requestId,
      req.user.id
    );

    return ApiResponseFactory.success({
      requestId: status.requestId,
      status: status.status,
      interpretation: status.interpretation,
      errorMessage: status.errorMessage,
      retryCount: status.retryCount,
      updatedAt: status.updatedAt,
      createdAt: status.createdAt,
      fromCache: status.fromCache,
    });
  }
}
