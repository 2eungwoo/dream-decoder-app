import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { InterpretDreamRequestDto } from "./dto/interpret-dream-request.dto";
import { InterpretAuthGuard } from "./guards/interpret-auth.guard";
import { UseInterpretationSemaphore } from "./semaphore/InterpretationSemaphore.decorator";
import { ApiResponseFactory } from "../shared/dto/api-response.dto";
import { InterpretationRequestPublisher } from "../pipeline/interpretation/publisher/request.publisher";
import { InterpretationStatusStore } from "../pipeline/interpretation/status/status.store";
import { InterpretationDlqService } from "../pipeline/interpretation/dlq/dlq.service";
import {
  CurrentUser,
  RequestUser,
} from "../shared/decorators/current-user.decorator";

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
    @CurrentUser() user: RequestUser
  ) {
    const { requestId } = await this.requestPublisher.publish(user, payload);

    return ApiResponseFactory.success(
      { requestId },
      "해몽 요청이 접수되었습니다. 상태를 확인해주세요."
    );
  }

  @Get("interpret/status/:requestId")
  public async getStatus(
    @Param("requestId") requestId: string,
    @CurrentUser() user: RequestUser
  ) {
    const status = await this.statusStore.findStatusByRequest(
      requestId,
      user.id
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
      payload: status.payload,
    });
  }

  @Get("interpret/failed")
  public async getFailed(@CurrentUser() user: RequestUser) {
    const entries = await this.dlqService.listByUser(user.id);
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
    @CurrentUser() user: RequestUser
  ) {
    const newRequestId = await this.dlqService.retryEntry(
      { id: user.id, username: user.username },
      requestId
    );

    return ApiResponseFactory.success(
      { requestId: newRequestId },
      "실패한 요청을 다시 처리하기 시작했습니다. /status 명령으로 진행 상황을 확인할 수 있습니다."
    );
  }
}
