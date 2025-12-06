import { Injectable } from "@nestjs/common";
import { OpenAIClient } from "../../external/openai/openai.client";
import { OpenAIMessage } from "../../external/openai/types/openai.types";

@Injectable()
export class InterpretationLlmService {
  constructor(private readonly openAiClient: OpenAIClient) {}

  public async generate(messages: OpenAIMessage[]): Promise<string> {
    return this.openAiClient.generateFromMessages(messages);
  }
}
