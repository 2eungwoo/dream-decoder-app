import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { mock, instance, when, verify, anything } from "ts-mockito";
import { MongoService } from "../../../infra/mongo/mongo.service";
import { MongoTtlManager } from "../../../infra/mongo/mongo-ttl.manager";
import { RequestBackupStore } from "./request-backup.store";

describe("RequestBackupStore", () => {
  let store: RequestBackupStore;
  const mongoServiceMock = mock(MongoService);
  const ttlManagerMock = mock(MongoTtlManager);
  const collectionMock = {
    updateOne: jest.fn(),
    deleteOne: jest.fn(),
    find: jest.fn(),
  };

  // 공용 given : mongo available
  const givenMongoAvailable = () => {
    when(mongoServiceMock.getCollection("interpretation_requests")).thenReturn(
      collectionMock as any
    );
  };

  // 공용 given : injects 생성용 모킹 di
  const initStore = () => {
    store = new RequestBackupStore(
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

  it("mongo available이면 archive save 호출", async () => {
    // when
    const payload = {
      requestId: "req-1",
      userId: "user",
      username: "tester",
      payload: { dream: "테스트" },
      createdAt: "2025-01-01",
      retryCount: 0,
    } as any;

    // then
    await store.savePendingRequest(payload);
    verify(ttlManagerMock.ensureIndex(collectionMock as any, "storedAt", anything())).once();
    expect(collectionMock.updateOne).toHaveBeenCalledTimes(1);
  });

  it("backlog 마크하면 status, reason 저장", async () => {
    // when
    await store.markBacklog("req-1", "redis down");

    // then
    expect(collectionMock.updateOne).toHaveBeenCalledWith(
      { requestId: "req-1" },
      expect.objectContaining({
        $set: expect.objectContaining({ status: "backlog" }),
      })
    );
  });

  it("requeued 되면 status -> pending", async () => {
    // when
    await store.markRequeued("req-2");

    // then
    expect(collectionMock.updateOne).toHaveBeenCalledWith(
      { requestId: "req-2" },
      expect.objectContaining({
        $set: expect.objectContaining({ status: "pending" }),
      })
    );
  });

  it("mongo unavailable이면 archive update 호출 안됨", async () => {
    // when
    when(mongoServiceMock.getCollection("interpretation_requests")).thenReturn(null);

    await store.savePendingRequest({
      requestId: "req-3",
      userId: "user",
      username: "tester",
      payload: { dream: "다시" },
      createdAt: "now",
      retryCount: 0,
    } as any);

    // then
    expect(collectionMock.updateOne).not.toHaveBeenCalled();
  });
});
