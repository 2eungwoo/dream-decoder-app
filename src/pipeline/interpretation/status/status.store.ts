import { Injectable } from "@nestjs/common";
import { Redis } from "ioredis";
import { RedisService } from "../../../infra/redis/redis.service";

import {
  INTERPRETATION_STATUS_TTL_SECONDS,
  interpretationStatusKey,
} from "../config/storage.config";
import { InterpretationPayloadParser } from "../messages/helpers/interpretation-payload.parser";
import { InterpretationStatusValidator } from "./validation/status.validator";
import {
  InterpretationPayload,
  InterpretationStatus,
  InterpretationStatusRecord,
  InterpretationUserContext,
} from "../messages/interfaces/message.types";

interface StatusUpdate {
  status?: InterpretationStatus;
  interpretation?: string;
  errorMessage?: string;
  retryCount?: number;
  fromCache?: boolean;
}

@Injectable()
export class InterpretationStatusStore {
  constructor(
    private readonly redisService: RedisService,
    private readonly validator: InterpretationStatusValidator,
    private readonly payloadParser: InterpretationPayloadParser
  ) {}

  private get client(): Redis {
    return this.redisService.getClient();
  }

  // 최초 상태 stream에 등록 -> pending
  public async initialize(
    requestId: string,
    user: InterpretationUserContext,
    payload: InterpretationPayload
  ) {
    const timestamp = new Date().toISOString();
    const key = interpretationStatusKey(requestId);

    await this.client.hset(key, {
      requestId,
      userId: user.id,
      username: user.username,
      payload: JSON.stringify(payload),
      status: InterpretationStatus.Pending,
      interpretation: "",
      errorMessage: "",
      retryCount: "0",
      createdAt: timestamp,
      updatedAt: timestamp,
      fromCache: "false",
    });
    await this.client.expire(key, INTERPRETATION_STATUS_TTL_SECONDS);
  }

  public async markPending(requestId: string, errorMessage?: string | null) {
    await this.apply(requestId, {
      status: InterpretationStatus.Pending,
      errorMessage: errorMessage ?? "",
    });
  }

  public async markRunning(requestId: string) {
    await this.apply(requestId, {
      status: InterpretationStatus.Running,
    });
  }

  // completed 체크하고 LLM 응답 포함해서 저장
  public async markCompleted(
    requestId: string,
    interpretation: string,
    options?: { fromCache?: boolean }
  ) {
    await this.apply(requestId, {
      status: InterpretationStatus.Completed,
      interpretation,
      errorMessage: "",
      fromCache: options?.fromCache ?? false,
    });
  }

  public async markFailed(requestId: string, errorMessage: string) {
    await this.apply(requestId, {
      status: InterpretationStatus.Failed,
      errorMessage,
    });
  }

  // 재시도 카운트++
  public async incrementRetry(requestId: string) {
    const key = interpretationStatusKey(requestId);
    await this.client.hincrby(key, "retryCount", 1);
    await this.touch(key);
  }

  // stream에서 requestId + userId로 findByStatue
  public async findStatusByRequest(
    requestId: string,
    userId: string
  ): Promise<InterpretationStatusRecord> {
    const key = interpretationStatusKey(requestId);
    const raw = await this.client.hgetall(key);
    this.validator.validateRawExists(raw);
    const record = this.toRecord(raw);
    this.validator.validateOwner(record, userId);
    return record;
  }

  // Redis Hash에 필드값 update
  private async apply(requestId: string, updates: StatusUpdate) {
    const key = interpretationStatusKey(requestId);
    const timestamp = new Date().toISOString();
    const payload: Record<string, string> = {
      updatedAt: timestamp,
    };

    if (updates.status) {
      payload.status = updates.status;
    }
    if (typeof updates.interpretation === "string") {
      payload.interpretation = updates.interpretation;
    }
    if (typeof updates.errorMessage === "string") {
      payload.errorMessage = updates.errorMessage;
    }
    if (typeof updates.retryCount === "number") {
      payload.retryCount = updates.retryCount.toString();
    }
    if (typeof updates.fromCache === "boolean") {
      payload.fromCache = updates.fromCache ? "true" : "false";
    }

    await this.client.hset(key, payload);
    await this.touch(key);
  }

  // TTL 갱신해서 status 조회 가능 기간 연장
  private async touch(key: string) {
    await this.client.expire(key, INTERPRETATION_STATUS_TTL_SECONDS);
  }

  private toRecord(raw: Record<string, string>): InterpretationStatusRecord {
    return {
      requestId: raw.requestId,
      userId: raw.userId,
      username: raw.username,
      payload: this.payloadParser.parse(raw.payload),
      status: (raw.status ??
        InterpretationStatus.Pending) as InterpretationStatus,
      interpretation: raw.interpretation || undefined,
      errorMessage: raw.errorMessage || undefined,
      retryCount: Number(raw.retryCount ?? "0"),
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      fromCache: raw.fromCache === "true",
    };
  }
}
