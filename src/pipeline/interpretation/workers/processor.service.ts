import { Injectable, Logger } from "@nestjs/common";
import { InterpretationService } from "../../../interpretation/interpretation.service";
import { InterpretationStatusStore } from "../status/status.store";
import { InterpretationPayload } from "../messages/interfaces/message.types";

@Injectable()
export class InterpretationProcessor {
  private readonly logger = new Logger(InterpretationProcessor.name);

  constructor(
    private readonly interpretationService: InterpretationService,
    private readonly statusStore: InterpretationStatusStore
  ) {}

  public async process(requestId: string, payload: InterpretationPayload) {
    const result =
      await this.interpretationService.generateInterpretation(payload);
    await this.statusStore.markCompleted(requestId, result.interpretation, {
      fromCache: result.fromCache,
    });
    this.logger.debug(
      `[Stream : Processor ]해몽 요청 ${requestId} ${result.fromCache ? "cache-hit" : "llm-call"}` +
        ` (payload dream length: ${payload.dream?.length ?? 0})`
    );
  }
}
