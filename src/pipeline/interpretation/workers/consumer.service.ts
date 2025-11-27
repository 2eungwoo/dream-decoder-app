import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import {
  INTERPRETATION_WORKER_GROUP,
  INTERPRETATION_WORKER_IDLE_CLAIM_MS,
} from "../config/worker.config";
import { InterpretationMessageHandler } from "./message.handler";
import { InterpretationMessageSerializer } from "../messages/message.serializer";
import { InterpretationStreamReader } from "../streams/stream.reader";
import { INTERPRETATION_STREAM_KEY } from "../config/storage.config";
import { RedisStreamService } from "../../redis-stream.service";

@Injectable()
export class InterpretationConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(InterpretationConsumer.name);
  private readonly consumerName = `worker:${process.pid}:${
    randomUUID().split("-")[0]
  }`;
  private stopRequested = false;
  private loopPromise?: Promise<void>;
  private reclaimInterval?: NodeJS.Timeout;

  constructor(
    private readonly redisStream: RedisStreamService,
    private readonly messageHandler: InterpretationMessageHandler,
    private readonly streamReader: InterpretationStreamReader,
    private readonly serializer: InterpretationMessageSerializer
  ) {}

  async onModuleInit() {
    await this.redisStream.ensureGroup(
      INTERPRETATION_STREAM_KEY,
      INTERPRETATION_WORKER_GROUP
    );
    this.loopPromise = this.consumeLoop();
    this.reclaimInterval = setInterval(() => {
      void this.claimIdle();
    }, INTERPRETATION_WORKER_IDLE_CLAIM_MS);
    this.reclaimInterval.unref();
  }

  async onModuleDestroy() {
    this.stopRequested = true;
    if (this.reclaimInterval) {
      clearInterval(this.reclaimInterval);
    }
    if (this.loopPromise) {
      await this.loopPromise;
    }
  }

  private async consumeLoop() {
    while (!this.stopRequested) {
      try {
        const entries = await this.streamReader.readNext(this.consumerName);
        if (!entries) {
          continue;
        }

        for (const [id, fields] of entries) {
          if (this.stopRequested) {
            break;
          }
          await this.handleEntry(id, fields);
        }
      } catch (error) {
        if (this.stopRequested) {
          break;
        }
        this.logger.warn(
          `[Stream - Consumer(Worker)] worker 루프 에러 메세지 : ${(error as Error)?.message}`
        );
        await this.delay(1000);
      }
    }
  }

  private async claimIdle() {
    try {
      const entries = await this.streamReader.claimIdle(this.consumerName);
      for (const [id, fields] of entries) {
        await this.handleEntry(id, fields);
      }
    } catch (error) {
      this.logger.warn(
        `[Stream - Consumer] claim idle 에러 메세지: ${(error as Error)?.message}`
      );
    }
  }

  private async handleEntry(id: string, fields: string[]) {
    const message = this.serializer.fromStreamFields(fields);
    if (!message) {
      await this.redisStream.ack(
        INTERPRETATION_STREAM_KEY,
        INTERPRETATION_WORKER_GROUP,
        id
      );
      return;
    }

    this.logger.log(
      `[Stream - Consumer] 요청ID : ${message.requestId} 가 stream에 들어갔음`
    );
    try {
      await this.messageHandler.handle(message);
      this.logger.log(
        `[Stream - Consumer] 요청ID ${message.requestId} 담당 컨슈머 : [${this.consumerName}] `
      );
    } catch (error) {
      this.logger.error(
        `[Stream - Consumer] 요청 메세지 컨슈밍 중 에러 발생, 요청ID: ${message.requestId}: ${
          (error as Error)?.message
        }`
      );
    } finally {
      await this.redisStream.ack(
        INTERPRETATION_STREAM_KEY,
        INTERPRETATION_WORKER_GROUP,
        id
      );
    }
  }

  private delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
