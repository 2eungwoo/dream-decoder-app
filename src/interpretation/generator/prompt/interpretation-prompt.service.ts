import { Injectable } from "@nestjs/common";
import { InterpretationUserPromptBuilder } from "../../prompts/interpretation-user-prompt.builder";
import { InterpretDreamRequestDto } from "../../dto/interpret-dream-request.dto";
import { DreamSymbolDto } from "../../types/dream-symbol.dto";
import { INTERPRETATION_SYSTEM_PROMPT } from "../../prompts/interpretation-system.prompt";
import { OpenAIMessage } from "../../../external/openai/types/openai.types";

@Injectable()
export class InterpretationPromptService {
  constructor(
    private readonly promptBuilder: InterpretationUserPromptBuilder
  ) {}

  public buildMessages(request: InterpretDreamRequestDto, rankedSymbols: DreamSymbolDto[]): OpenAIMessage[] {

    const interpretation_user_prompt = this.promptBuilder.buildUserPrompt(request, rankedSymbols);
    return [
      {
        role: "system",
        content: INTERPRETATION_SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: interpretation_user_prompt,
      },
    ];
  }
}
