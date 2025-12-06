import "reflect-metadata";
import { Test, TestingModule } from "@nestjs/testing";
import { beforeEach, describe, expect, it } from "@jest/globals";
import { instance, mock, reset, verify, when } from "ts-mockito";

import { InterpretationPromptService } from "./interpretation-prompt.service";
import { InterpretationUserPromptBuilder } from "../../prompts/interpretation-user-prompt.builder";
import { INTERPRETATION_SYSTEM_PROMPT } from "../../prompts/interpretation-system.prompt";

describe("InterpretationPromptService", () => {
  let service: InterpretationPromptService;
  const builderMock = mock(InterpretationUserPromptBuilder);

  const REQUEST = { dream: "테스트" };
  const SYMBOLS = [{ symbol: "사막" }] as any;
  const USER_PROMPT = "user prompt";

  beforeEach(async () => {
    reset(builderMock);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InterpretationPromptService,
        {
          provide: InterpretationUserPromptBuilder,
          useValue: instance(builderMock),
        },
      ],
    }).compile();

    service = module.get(InterpretationPromptService);
  });

  it("system/user 프롬프트 메세지 구성", () => {
    // given & when
    when(builderMock.buildUserPrompt(
        REQUEST as any,
        SYMBOLS as any))
    .thenReturn(USER_PROMPT);

    const messages = service.buildMessages(REQUEST as any, SYMBOLS as any);

    // then
    expect(messages).toEqual([
      { role: "system", content: INTERPRETATION_SYSTEM_PROMPT },
      { role: "user", content: USER_PROMPT },
    ]);
    verify(builderMock.buildUserPrompt(
        REQUEST as any,
        SYMBOLS as any))
    .once();
  });
});
