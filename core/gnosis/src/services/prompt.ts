import { eq, sql } from "drizzle-orm";
import { DB, schema } from "db";
import { CoreMessage } from "ai";
import { FACT_EXTRACTION_PROMPT } from "../util/ai/prompts";

export class PromptService {
  constructor(private readonly db: DB) {}

  async setFactExtraction(companyId: string, content: CoreMessage[]) {
    const promptContent = JSON.stringify(content);

    // Instead of checking for company existence, we'll use a try-catch to handle any potential errors
    try {
      await this.db
        .insert(schema.prompts)
        .values({
          companyId,
          promptContent,
        })
        .onConflictDoUpdate({
          target: [schema.prompts.companyId],
          set: {
            promptContent,
            updatedAt: sql`now()`,
          },
        });
    } catch (error) {
      console.error("Error setting fact extraction prompt:", error);
      throw error;
    }
  }

  async getFactExtraction(companyId: string): Promise<CoreMessage[] | null> {
    try {
      const [prompt] = await this.db
        .select()
        .from(schema.prompts)
        .where(eq(schema.prompts.companyId, companyId))
        .limit(1);

      if (!prompt?.promptContent) {
        const defaultPrompt = FACT_EXTRACTION_PROMPT;
        // Try to save the default prompt, but don't fail if it can't be saved
        try {
          await this.setFactExtraction(companyId, defaultPrompt);
        } catch (error) {
          console.error("Failed to save default prompt:", error);
          // Continue and return the default prompt even if saving failed
        }
        return defaultPrompt;
      }

      return JSON.parse(prompt.promptContent);
    } catch (error) {
      console.error("Error retrieving fact extraction prompt:", error);
      return FACT_EXTRACTION_PROMPT;
    }
  }

  async resetFactExtraction(companyId: string) {
    const defaultPrompt = FACT_EXTRACTION_PROMPT;
    await this.setFactExtraction(companyId, defaultPrompt);
  }
}
