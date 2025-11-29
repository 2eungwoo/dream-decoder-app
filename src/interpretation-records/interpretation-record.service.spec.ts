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
import { InterpretationRecordValidator } from "./exceptions/interpretation-record.validator";
import { InterpretationRecordAlreadyExistsException } from "./exceptions/interpretation-record-already-exists.exception";

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
    when(repository.findOne(anything())).thenResolve(null);
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
    const [dupArgs] = capture(repository.findOne).last();
    expect(dupArgs).toMatchObject({
      where: {
        userId,
        dream: dto.dream,
        interpretation: dto.interpretation,
      },
      select: ["id"],
    });
    verify(validator.ensureNotDuplicated(anything())).once();
    const [validatorArg] = capture(validator.ensureNotDuplicated).last();
    expect(validatorArg).toBeNull();
  });
  it("이미 같은 꿈과 해석이 저장돼 있으면 예외 발생", async () => {
    // given
    const dto = {
      dream: "같은 꿈",
      interpretation: "같은 해석",
    };
    const existing = { id: "exists" } as InterpretationRecord;

    // when
    when(repository.findOne(anything())).thenResolve(existing);
    when(validator.ensureNotDuplicated(existing)).thenThrow(
      new InterpretationRecordAlreadyExistsException()
    );

    // then
    await expect(service.saveRecord(userId, dto as any)).rejects.toThrow(
      InterpretationRecordAlreadyExistsException
    );
    verify(repository.save(anything())).never();
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
    const [findArgs] = capture(repository.findOne).last();
    expect(findArgs).toMatchObject({
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

  it("리스트 조회 list-dto로 잘 파싱되나, dream 본문이 16자 이상이면 DTO에서 ... 처리 후 반환되나 테스트", async () => {
    // given
    const records = [
      {
        id: "1",
        dream: "엄청나게긴내용인데16부터잘짤리나보자",
        createdAt: new Date(),
      },
      {
        id: "2",
        dream: "짧은꿈",
        createdAt: new Date(),
      },
    ];

    when(repository.find(anything())).thenResolve(records as any);

    // when
    const list = await service.listRecords(userId);

    // then
    expect(list).toHaveLength(2);
    expect(list[0].dream).toBe("엄청나게긴내용인데16부터잘짤리..."); // 앞 16자 + ...
    expect(list[1].dream).toBe("짧은꿈");

    const [listArgs] = capture(repository.find).last();
    expect(listArgs).toMatchObject({
      where: { userId },
      order: { createdAt: "DESC" },
      select: ["id", "dream", "createdAt"],
    });
    verify(repository.find(anything())).once();
  });
});
