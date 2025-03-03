import { ModelFactory, ModelId } from "./util/ai/llm";
import Memory, { MemoryMetadata, QueryOptions } from "./util/ai/memory";
import {
  FACT_EXTRACTION_PROMPT,
  generateMemoryUpdateMessages,
} from "./util/ai/prompts";
import { z } from "zod";
import { CoreMessage, generateObject } from "ai";
import { PromptService } from "./services/prompt";

export class Gnosis {
  private modelFactory: ModelFactory;
  private memory: Memory;
  private static readonly DEFAULT_MAX_TOKENS = 1000;
  private static readonly DEFAULT_TEMPERATURE = 0.1;
  private factExtractionPrompt: CoreMessage[] = FACT_EXTRACTION_PROMPT;
  private promptService: PromptService;

  constructor(
    ai: Ai,
    openaiApiKey: string,
    promptService: PromptService,
    memory: Memory,
    modelId: ModelId
  ) {
    this.modelFactory = new ModelFactory(ai, openaiApiKey, modelId);
    this.memory = memory;
    this.promptService = promptService;
  }

  async add(userId: string, messages: CoreMessage[], orgId: string) {
    let factExtractionPrompt: CoreMessage[] = this.factExtractionPrompt;

    try {
      const customPrompt = await this.promptService.getFactExtraction(orgId);
      if (customPrompt) {
        factExtractionPrompt = customPrompt;
      }
    } catch (error) {
      console.error("Error fetching custom prompt:", error);
    }

    // 1. Extract facts using LLM with properly formatted messages
    const factsResponse = await generateObject({
      model: this.modelFactory.getModel(),
      messages: [...factExtractionPrompt, ...messages],
      schema: z.object({
        facts: z.array(
          z.object({
            fact: z.string(),
            categories: z.array(z.string()),
          })
        ),
      }),
      maxTokens: Gnosis.DEFAULT_MAX_TOKENS,
      temperature: Gnosis.DEFAULT_TEMPERATURE,
    });
    const facts = factsResponse.object;

    // 2. Get similar existing memories - use formatted messages for similarity search
    const queryOptions: QueryOptions = {
      userId: userId,
      orgId: orgId,
    };

    const similarMemories = await this.memory.query(
      messages.map((m) => `${m.role}: ${m.content}`).join("\n"),
      10,
      queryOptions
    );

    // 3. Generate memory update decisions
    // Create a mapping of index to real UUIDs to prevent hallucinations
    const uuidMapping = new Map<string, string>();
    const oldMemories =
      similarMemories?.matches?.map((m, index) => {
        const indexStr = index.toString();
        uuidMapping.set(indexStr, m.id);
        return {
          id: indexStr,
          text: m.metadata.memoryText,
        };
      }) ?? [];

    const oldMemoryJson = JSON.stringify(oldMemories);
    const newFactsJson = JSON.stringify({ facts: facts.facts });

    const memoryUpdatesResponse = await generateObject({
      model: this.modelFactory.getModel("gpt-4o"),
      messages: generateMemoryUpdateMessages(oldMemoryJson, newFactsJson),
      schema: z.object({
        memory: z.array(
          z.object({
            id: z.string().optional(),
            text: z.string(),
            event: z.enum(["ADD", "UPDATE", "DELETE", "NONE"]),
            old_memory: z.string().optional(),
          })
        ),
      }),
      maxTokens: Gnosis.DEFAULT_MAX_TOKENS,
      temperature: Gnosis.DEFAULT_TEMPERATURE,
    });
    const memoryUpdates = memoryUpdatesResponse.object;

    // 4. Process memory updates - map back to real UUIDs
    const updates = [];
    for (const update of memoryUpdates.memory) {
      switch (update.event) {
        case "ADD":
          const ids = await this.memory.add([
            {
              text: update.text,
              metadata: {
                userId,
                memoryText: update.text,
                orgId: orgId,
              },
            },
          ]);
          updates.push({ type: "ADD", text: update.text, id: ids[0] });
          break;

        case "UPDATE":
          if (!update.id) {
            console.warn(`Invalid memory index ${update.id} for update`);
            continue;
          }
          const realUuid = uuidMapping.get(update.id);
          if (!realUuid) {
            console.warn(`Invalid memory index ${update.id} for update`);
            continue;
          }
          await this.memory.add([
            {
              id: realUuid,
              text: update.text,
              metadata: {
                userId,
                memoryText: update.text,
                orgId: orgId,
              },
            },
          ]);
          updates.push({
            type: "UPDATE",
            id: realUuid,
            oldText: update.old_memory,
            newText: update.text,
          });
          break;

        case "DELETE":
          if (!update.id) {
            console.warn(`Invalid memory index ${update.id} for deletion`);
            continue;
          }
          const deleteUuid = uuidMapping.get(update.id);
          if (!deleteUuid) {
            console.warn(`Invalid memory index ${update.id} for deletion`);
            continue;
          }
          await this.memory.delete([deleteUuid]);
          updates.push({ type: "DELETE", id: deleteUuid });
          break;
      }
    }

    return updates;
  }

  async get(memoryId: string) {
    const results = await this.memory.getAllById([memoryId]);
    if (!results || results.length === 0) return null;

    const memory = results[0];
    return {
      id: memory.id,
      text: memory.memoryText,
      userId: memory.userId,
      orgId: memory.orgId,
      agentId: memory.agentId,
    };
  }

  async search(
    query: string,
    userId: string,
    orgId: string,
    limit: number = 100
  ) {
    const queryOptions: QueryOptions = {
      userId: userId,
      orgId: orgId,
    };

    const results = await this.memory.query(query, limit, queryOptions);
    if (!results?.matches) return [];

    return results.matches.map((m) => ({
      id: m.id,
      text: m.metadata.memoryText,
      metadata: m.metadata,
      score: m.score,
    }));
  }

  async update(memoryId: string, text: string) {
    const memory = await this.get(memoryId);
    if (!memory) {
      throw new Error(`Memory ${memoryId} not found`);
    }

    await this.memory.add([
      {
        id: memoryId,
        text,
        metadata: {
          userId: memory.userId,
          memoryText: text,
          orgId: memory.orgId,
        },
      },
    ]);

    return { message: `Memory ${memoryId} updated successfully` };
  }

  async delete(memoryId: string) {
    await this.memory.delete([memoryId]);
    return { message: `Memory ${memoryId} deleted successfully` };
  }
}
