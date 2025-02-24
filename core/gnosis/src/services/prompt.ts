import { eq } from "drizzle-orm";
import { DB, schema } from "db";
import { CoreMessage } from "ai";

export class PromptService {
  constructor(private readonly db: DB) {}

  async setFactExtraction(companyId: string, content: CoreMessage[]) {
    const promptContent = JSON.stringify(content);

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
          updatedAt: new Date().toISOString(),
        },
      });
  }

  async getFactExtraction(companyId: string): Promise<CoreMessage[] | null> {
    const result = await this.db
      .select()
      .from(schema.prompts)
      .where(eq(schema.prompts.companyId, companyId))
      .get();

    if (!result?.promptContent) return null;

    try {
      return JSON.parse(result.promptContent);
    } catch {
      return null;
    }
  }
}
