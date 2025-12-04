import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { InterpretationMessageHandler } from "./message.handler";
import { InterpretationStatusStore } from "../status/status.store";
import { InterpretationProcessor } from "./processor.service";
import { InterpretationStreamWriter } from "../streams/stream.writer";
import { InterpretationDlqWriter } from "../dlq/dlq.writer";
import { InterpretationMessageFactory } from "../messages/message.factory";
import { InterpretationStreamLogService } from "../logging/stream-log.service";
import { InterpretationFailureArchiveService } from "../dlq/interpretation-failure-archive.service";
import { InterpretationMessage } from "../messages/interfaces/message.types";
import { INTERPRETATION_WORKER_MAX_RETRY } from "../config/worker.config";

describe("InterpretationMessageHandler", () => {
  const statusStore = {
    markRunning: jest.fn(),
    markFailed: jest.fn(),
    incrementRetry: jest.fn(),
    markPending: jest.fn(),
  };
  const processor = {
    process: jest.fn() as jest.MockedFunction<
        (msgId: string, payload: InterpretationMessage["payload"]) => Promise<void>
    >,
  };
  const streamWriter = {
    write: jest.fn(),
  };
  const dlqWriter = {
    write: jest.fn(),
  };
  const messageFactory = {
    withRetry: jest.fn(),
  };
  const logger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as InterpretationStreamLogService;
  const failureArchive = {
    save: jest.fn(),
  };

  let handler: InterpretationMessageHandler;

  const baseMessage: InterpretationMessage = {
    requestId: "req-1",
    payload: {
      dream: "테스트 꿈",
      emotions: ["걱정"],
    } as any,
    userId: "user-1",
    username: "test-user",
    createdAt: new Date().toISOString(),
    retryCount: 0,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    handler = new InterpretationMessageHandler(
      statusStore as unknown as InterpretationStatusStore,
      processor as unknown as InterpretationProcessor,
      streamWriter as unknown as InterpretationStreamWriter,
      dlqWriter as unknown as InterpretationDlqWriter,
      failureArchive as unknown as InterpretationFailureArchiveService,
      messageFactory as unknown as InterpretationMessageFactory,
      logger
    );
  });

  it("최대 재시도 초과 하면 MongoDB에 아카이빙", async () => {
    processor.process.mockRejectedValueOnce(new Error("LLM fail"));
    const message = {
      ...baseMessage,
      retryCount: INTERPRETATION_WORKER_MAX_RETRY,
    };

    await handler.handle(message);

    expect(failureArchive.save).toHaveBeenCalledWith(
      message,
      "LLM fail"
    );
    expect(dlqWriter.write).toHaveBeenCalledWith(message, "LLM fail");
    expect(statusStore.markFailed).toHaveBeenCalledWith(
      message.requestId,
      "LLM fail"
    );
  });
});
