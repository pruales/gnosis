import { createWorkersAI } from "workers-ai-provider";
import { generateObject, LanguageModelV1 } from "ai";
import { z } from "zod";

export class LLM {
  private model: LanguageModelV1;

  constructor(ai: Ai, model: string) {
    const workersAI = createWorkersAI({ binding: ai });
    this.model = workersAI(model);
  }

  async generateStructuredOutput(
    prompt: string,
    schema: z.ZodSchema,
    maxTokens: number,
    temperature: number = 0.1,
    system?: string
  ) {
    const response = await generateObject({
      model: this.model,
      prompt,
      schema,
      maxTokens,
      temperature,
      system,
    });
    return response.object;
  }
}
