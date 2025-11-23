import "reflect-metadata";
import { beforeEach, describe, expect, it } from "@jest/globals";
import { Repository } from "typeorm";
import {
  anything,
  capture,
  instance,
  mock,
  reset,
  verify,
  when,
} from "ts-mockito";
import { InterpretationRecordService } from "./interpretation-record.service";
import { InterpretationRecord } from "./interpretation-record.entity";
import { InterpretationRecordValidator } from "./interpretation-record.validator";

describe("InterpretationRecordService", () => {
  const repository = mock<Repository<InterpretationRecord>>();
  const validator = mock(InterpretationRecordValidator);
  let service: InterpretationRecordService;
  const recordId = "1";
  const userId = "1";

  beforeEach(() => {
    reset(repository);
    reset(validator);
    service = new InterpretationRecordService(
      instance(repository),
      instance(validator)
    );
  });

  it("해몽 응답 저장하고 id 반환", async () => {
    // given
    const dto = {
      dream: "테스트 꿈",
      emotions: ["불안"],
      mbti: "ENFP",
      extraContext: "최근 상황",
      interpretation: "요약",
      symbols: [{ symbol: "별", insight: "희망" }],
    };
    const entity = { id: recordId } as InterpretationRecord;

    // when
    when(repository.create(anything())).thenReturn(entity as any);
    when(repository.save(entity)).thenResolve(entity);
    const savedId = await service.saveRecord(userId, dto as any);

    // then
    expect(savedId).toBe(recordId);
    verify(repository.save(entity)).once();
    const [createArg] = capture(repository.create).last();
    expect(createArg).toMatchObject({
      userId: userId,
      dream: dto.dream,
      interpretation: dto.interpretation,
    });
  });

  it("userId/recordId로 해몽 찾고 projection한 필드만 넣은 dto 반환", async () => {
    // given
    const record = {
      id: recordId,
      dream: "아무 내용",
      emotions: ["불안"],
      mbti: "ENFP",
      extraContext: null,
      interpretation: "요약",
      createdAt: new Date(),
    } as InterpretationRecord;

    // when
    when(repository.findOne(anything())).thenResolve(record);
    when(validator.validExists(record)).thenReturn(record);
    const result = await service.findRecord(userId, recordId);

    // then
    expect(result).toMatchObject({
      id: recordId,
      dream: "아무 내용",
      interpretation: "요약",
    });

    // const result = await service.findRecord(userId, recordId);
    // 캡쳐를 약간 스파이 기능처럼 쓰면 되는듯
    const [args] = capture(repository.findOne).last();
    expect(args).toMatchObject({
      where: { userId, id: recordId },
      select: [
        "id",
        "dream",
        "emotions",
        "mbti",
        "extraContext",
        "interpretation",
        "createdAt",
      ],
    });
    verify(repository.findOne(anything())).once();
    verify(validator.validExists(record)).once();
  });
});
