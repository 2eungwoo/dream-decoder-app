import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { mock, instance, when, anything } from "ts-mockito";
import { MongoService } from "../../../infra/mongo/mongo.service";
import { MongoTtlManager } from "../../../infra/mongo/mongo-ttl.manager";
import { FailureArchiveStore } from "./failure-archive.store";

describe("FailureArchiveStore", () => {
  let store: FailureArchiveStore;
  const mongoServiceMock = mock(MongoService);
  const ttlManagerMock = mock(MongoTtlManager);
  const collectionMock = {
    updateOne: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    deleteOne: jest.fn(),
  };

  // 공용 given : mongo available
  const givenMongoAvailable = () => {
    when(mongoServiceMock.getCollection("interpretation_failures")).thenReturn(
      collectionMock as any
    );
  };

  // 공용 given : mongo unavailable
  const givenMongoUnavailable = () => {
    when(mongoServiceMock.getCollection("interpretation_failures")).thenReturn(
      null
    );
  };

  // 공용 given : injects 생성용 모킹 di
  const initStore = () => {
    store = new FailureArchiveStore(
      instance(mongoServiceMock),
      instance(ttlManagerMock)
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    givenMongoAvailable();
    when(ttlManagerMock.ensureIndex(anything(), anything(), anything())).thenResolve();
    initStore();
  });

  it("mongo available이면 archive failure save() 호출", async () => {
    // when
    await store.saveFailure(
      {
        requestId: "req-1",
        userId: "user",
        username: "tester",
        payload: { dream: "A" },
        createdAt: "now",
        retryCount: 0,
      } as any,
      "reason"
    );

    // then
    expect(collectionMock.updateOne).toHaveBeenCalledTimes(1);
  });

  it("mongo unavailable이면 메모리 fallback 함수 호출 ", async () => {
    // given
    givenMongoUnavailable();
    initStore();

    // when
    await store.saveFailure(
      {
        requestId: "req-2",
        userId: "user",
        username: "tester",
        payload: { dream: "B" },
        createdAt: "now",
        retryCount: 0,
      } as any,
      "reason"
    );

    // then
    expect(collectionMock.updateOne).not.toHaveBeenCalled();
    const result = await store.listByUser("user", 10);
    expect(result).toHaveLength(1);
    expect(result[0].requestId).toBe("req-2");
  });
});
