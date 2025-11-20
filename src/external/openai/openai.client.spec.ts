import { Test, TestingModule } from "@nestjs/testing";
import { mock, instance, when, verify, capture, reset } from "ts-mockito";
import { OpenAIClient } from "./openai.client";
import { OpenAIRequestFactory } from "./utils/openai.request-factory";
import { OpenAIHttpExecutor } from "./openai.http-executor";
import { OpenAIResponseParser } from "./utils/openai.response-parser";
import { OpenAIMessage } from "./types/openai.types";
import { beforeEach, describe, expect, it } from "@jest/globals";

describe("OpenAIClient", () => {
  let client: OpenAIClient;
  const requestFactory = mock(OpenAIRequestFactory);
  const httpExecutor = mock(OpenAIHttpExecutor);
  const responseParser = mock(OpenAIResponseParser);

  const MESSAGES: OpenAIMessage[] = [{ role: "user", content: "안녕?" }];
  const PAYLOAD = { body: "payload" } as never;
  const ENDPOINT = "https://api.openai.com/v1/chat";
  const HEADERS = { Authorization: "Bearer token" };

  const PARSED_RESPONSE = "parsed 해몽 response";
  const RAW_RESPONSE = "날 것의 response";

  beforeEach(async () => {
    reset(requestFactory);
    reset(httpExecutor);
    reset(responseParser);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpenAIClient,
        { provide: OpenAIRequestFactory, useValue: instance(requestFactory) },
        { provide: OpenAIHttpExecutor, useValue: instance(httpExecutor) },
        { provide: OpenAIResponseParser, useValue: instance(responseParser) },
      ],
    }).compile();

    client = module.get(OpenAIClient);
  });

  it("request factory, executor, response parser 의 실행 검증", async () => {
    // given & when
    when(requestFactory.createPayloadFromMessages(MESSAGES)).thenReturn(
      PAYLOAD
    );
    when(requestFactory.getEndpoint()).thenReturn(ENDPOINT);
    when(requestFactory.createHeaders()).thenReturn(HEADERS as never);
    when(httpExecutor.post(ENDPOINT, HEADERS as never, PAYLOAD)).thenResolve(
      RAW_RESPONSE as never
    );
    when(responseParser.parse(RAW_RESPONSE as never)).thenReturn(
      PARSED_RESPONSE
    );

    // then
    const result = await client.generateFromMessages(MESSAGES);

    verify(requestFactory.createPayloadFromMessages(MESSAGES)).once();
    verify(requestFactory.getEndpoint()).once();
    verify(requestFactory.createHeaders()).once();
    verify(httpExecutor.post(ENDPOINT, HEADERS as never, PAYLOAD)).once();
    verify(responseParser.parse(RAW_RESPONSE as never)).once();

    expect(result).toBe(PARSED_RESPONSE);
    const [payloadArg] = capture(
      requestFactory.createPayloadFromMessages
    ).last();
    expect(payloadArg).toEqual(MESSAGES);
  });
});
