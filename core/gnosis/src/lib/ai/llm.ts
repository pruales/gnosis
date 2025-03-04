import { createWorkersAI, WorkersAI } from "workers-ai-provider";
import { LanguageModelV1 } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

export type ModelId = "gpt-4o" | "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

export class ModelFactory {
  private workersAI: WorkersAI;
  private openaiApiKey: string;
  private defaultModel: ModelId;

  constructor(
    ai: Ai,
    openaiApiKey: string,
    defaultModel: ModelId = "@cf/meta/llama-3.3-70b-instruct-fp8-fast"
  ) {
    this.workersAI = createWorkersAI({ binding: ai });
    this.openaiApiKey = openaiApiKey;
    this.defaultModel = defaultModel;
  }

  getModel(modelId?: ModelId): LanguageModelV1 {
    const id = modelId ?? this.defaultModel;
    if (id === "gpt-4o") {
      const openai = createOpenAI({
        apiKey: this.openaiApiKey,
        compatibility: "strict",
      });
      return openai("gpt-4o");
    }
    return this.workersAI(id);
  }
}
