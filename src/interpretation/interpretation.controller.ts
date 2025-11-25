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
import { InterpretationDlqService } from "../pipeline/interpretation/dlq/dlq.service";

@Controller()
@UseGuards(InterpretAuthGuard)
@UseInterpretationSemaphore()
export class InterpretationController {
  constructor(
    private readonly requestPublisher: InterpretationRequestPublisher,
    private readonly statusStore: InterpretationStatusStore,
    private readonly dlqService: InterpretationDlqService
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

  @Get("interpret/failed")
  public async getFailed(@Req() req: Request) {
    if (!req.user) {
      throw new UnauthorizedException("<!> 사용자 인증이 필요합니다.");
    }
    const entries = await this.dlqService.listByUser(req.user.id);
    const data = entries.map((entry) => ({
      requestId: entry.requestId,
      failedAt: entry.failedAt,
      errorMessage: entry.errorMessage,
      dream: entry.payload.dream,
    }));
    return ApiResponseFactory.success(data);
  }

  @Post("interpret/failed/:requestId/retry")
  public async retryFailed(
    @Param("requestId") requestId: string,
    @Req() req: Request
  ) {
    if (!req.user) {
      throw new UnauthorizedException("<!> 사용자 인증이 필요합니다.");
    }

    const newRequestId = await this.dlqService.retryEntry(
      { id: req.user.id, username: req.user.username },
      requestId
    );

    return ApiResponseFactory.success(
      { requestId: newRequestId },
      "실패한 요청을 다시 처리하기 시작했습니다. /status 명령으로 진행 상황을 확인할 수 있습니다."
    );
  }
}
