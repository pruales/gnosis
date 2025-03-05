import { DB, schema } from "db";
import {
  and,
  asc,
  cosineDistance,
  desc,
  eq,
  inArray,
  sql,
  SQL,
} from "drizzle-orm";

export type MemoryMetadata = {
  userId: string;
  memoryText: string;
  orgId?: string;
  agentId?: string;
};

export interface QueryOptions {
  text?: string;
  embedding?: number[];
  limit?: number;
  filters?: {
    userId?: string;
    orgId?: string;
    agentId?: string;
  };
}

export interface MemoryConfig {
  diskAnnSearchListSize?: number; // Default: 100
  diskAnnRescore?: number; // Default: 50
}

export type MemoryMatch = {
  id: string;
  score: number;
  metadata: {
    userId: string;
    orgId: string;
    agentId: string | null;
    memoryText: string;
    categories: string[] | null;
  };
};

export type QueryResult = {
  matches: MemoryMatch[];
};

export class Memory {
  private ai: Ai;
  private db: DB;
  private config: MemoryConfig;

  constructor(
    ai: Ai,
    db: DB,
    config: MemoryConfig = {
      diskAnnSearchListSize: 100,
      diskAnnRescore: 50,
    }
  ) {
    this.ai = ai;
    this.db = db;
    this.config = config;
  }

  async embed(texts: string[]) {
    const embeddings = (
      await this.ai.run("@cf/baai/bge-base-en-v1.5", {
        text: texts,
      })
    ).data;
    if (!embeddings) {
      throw new Error("Unable to embed text");
    }
    return embeddings;
  }

  /**
   * Add memory vectors to the DB
   */
  async add(
    items: {
      id?: string;
      embedding?: number[];
      memory: Pick<
        schema.MemoryInsert,
        "memoryText" | "userId" | "orgId" | "agentId"
      >;
    }[]
  ): Promise<string[]> {
    const missingEmbeddings = items.filter((item) => !item.embedding);
    console.log(
      `Missing embeddings: ${missingEmbeddings.length}`,
      missingEmbeddings
    );
    let embeddingsMap: Map<string, number[]>;
    if (missingEmbeddings.length > 0) {
      const embeddings = await this.embed(
        missingEmbeddings.map((item) => item.memory.memoryText)
      );
      embeddingsMap = new Map<string, number[]>();
      for (const [index, embedding] of embeddings.entries()) {
        embeddingsMap.set(
          missingEmbeddings[index].memory.memoryText,
          embedding
        );
      }
    }
    try {
      console.log(`Adding ${items.length} vectors`);

      const records = items.map((item, i) => {
        const orgId = item.memory.orgId;
        if (!orgId) {
          throw new Error(`Memory ${item.id || "(unknown)"} has no orgId`);
        }

        const rec: schema.MemoryInsert = {
          embedding: item.embedding
            ? item.embedding!
            : embeddingsMap.get(item.memory.memoryText)!,
          userId: item.memory.userId,
          orgId,
          memoryText: item.memory.memoryText,
          agentId: item.memory.agentId || "",
        };
        if (item.id) rec.id = item.id;
        return rec;
      });

      const result = await this.db
        .insert(schema.memories)
        .values(records)
        .onConflictDoUpdate({
          target: schema.memories.id,
          where: inArray(
            schema.memories.id,
            records.filter((r) => r.id).map((r) => r.id!)
          ),
          set: {
            embedding: sql`EXCLUDED.embedding`,
            userId: sql`EXCLUDED.user_id`,
            orgId: sql`EXCLUDED.org_id`,
            memoryText: sql`EXCLUDED.memory_text`,
            agentId: sql`EXCLUDED.agent_id`,
          },
        })
        .returning({ id: schema.memories.id });

      console.log(`Inserted/Updated ${result.length} memories`);
      return result.map((r) => r.id);
    } catch (err) {
      console.error("Error adding memory vectors:", err);
      throw err;
    }
  }

  /**
   * Query for top-k relevant memories for the given text
   */
  async query({
    text,
    embedding,
    limit = 10,
    filters,
  }: QueryOptions): Promise<QueryResult> {
    if (!text && !embedding) {
      throw new Error("text or embedding must be provided");
    }
    try {
      let embeddingVector: number[];
      if (text) {
        const cleanText = text?.trim().replace(/\n/g, " ");
        [embeddingVector] = await this.embed([cleanText]);
      } else {
        embeddingVector = embedding!;
      }
      if (!embeddingVector) {
        throw new Error("embedding values are undefined");
      }

      const conditions: SQL[] = [];
      if (filters?.userId)
        conditions.push(eq(schema.memories.userId, filters.userId));
      if (filters?.orgId)
        conditions.push(eq(schema.memories.orgId, filters.orgId));
      if (filters?.agentId)
        conditions.push(eq(schema.memories.agentId, filters.agentId));

      return await this.db.transaction(async (tx) => {
        //TODO: Tune these globally
        // Optional diskANN settings
        // if (this.config.diskAnnSearchListSize !== undefined) {
        //   await tx.execute(
        //     sql.raw(
        //       `SET LOCAL diskann.query_search_list_size = ${this.config.diskAnnSearchListSize}`
        //     )
        //   );
        // }
        // if (this.config.diskAnnRescore !== undefined) {
        //   await tx.execute(
        //     sql.raw(
        //       `SET LOCAL diskann.query_rescore = ${this.config.diskAnnRescore}`
        //     )
        //   );
        // }

        const results = await tx
          .select({
            id: schema.memories.id,
            userId: schema.memories.userId,
            orgId: schema.memories.orgId,
            memoryText: schema.memories.memoryText,
            categories: schema.memories.categories,
            agentId: schema.memories.agentId,
            similarity: cosineDistance(
              schema.memories.embedding,
              embeddingVector
            ),
          })
          .from(schema.memories)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(cosineDistance(schema.memories.embedding, embeddingVector))
          .limit(limit);

        return {
          matches: results.map((r) => ({
            id: r.id,
            score: 1 - Number(r.similarity),
            metadata: {
              userId: r.userId,
              orgId: r.orgId,
              agentId: r.agentId,
              memoryText: r.memoryText,
              categories: r.categories,
            },
          })),
        };
      });
    } catch (err) {
      console.error("Error querying memory vectors:", err);
      throw err;
    }
  }

  /**
   * Get multiple memories by ID
   */
  async getAllById(ids: string[]) {
    return this.db
      .select()
      .from(schema.memories)
      .where(inArray(schema.memories.id, ids));
  }

  /**
   * Delete memories by IDs
   */
  async delete(ids: string[]) {
    await this.db
      .delete(schema.memories)
      .where(inArray(schema.memories.id, ids));
  }

  /**
   * Bidirectional pagination.
   */
  async getByFilters(
    filters: {
      userId?: string;
      orgId?: string;
      agentId?: string;
    },
    limit: number = 50,
    includeTotal: boolean = false,
    starting_after?: string,
    ending_before?: string
  ): Promise<{
    data: Omit<schema.Memory, "embedding">[];
    has_more: boolean;
  }> {
    // Validate cursor usage
    if (starting_after && ending_before) {
      throw new Error(
        "Cannot use starting_after and ending_before simultaneously."
      );
    }

    const conditions: SQL[] = [];
    if (filters.userId) {
      conditions.push(eq(schema.memories.userId, filters.userId));
    }
    if (filters.orgId) {
      conditions.push(eq(schema.memories.orgId, filters.orgId));
    }
    if (filters.agentId) {
      conditions.push(eq(schema.memories.agentId, filters.agentId));
    }

    // Total count calculation removed

    // Enforce limit bounds
    if (limit < 1) limit = 1;
    if (limit > 100) limit = 100;

    // Determine forward or backward
    const backward = !!ending_before;
    const cursorId = starting_after || ending_before;

    // If we have a cursor, find the reference record's timestamp & ID
    let reference: Pick<schema.Memory, "id" | "createdAt"> | undefined;
    if (cursorId) {
      const refRow = await this.db
        .select({
          id: schema.memories.id,
          createdAt: schema.memories.createdAt,
        })
        .from(schema.memories)
        .where(eq(schema.memories.id, cursorId))
        .limit(1);

      if (!refRow[0]) {
        throw new Error(`Cursor record not found: ${cursorId}`);
      }
      reference = refRow[0];

      console.log(`[PAGINATION DEBUG] Reference record:`, {
        id: reference.id,
        createdAt: reference.createdAt,
        createdAt_raw: reference.createdAt, // Log the raw value
        direction: backward ? "backward" : "forward",
      });
    }

    // Build the query based on pagination direction
    let query;
    if (!backward) {
      // Forward pagination
      if (reference) {
        conditions.push(sql`
          (
            ${schema.memories.createdAt} < ${reference.createdAt}
            OR (
              ${schema.memories.createdAt} = ${reference.createdAt}
              AND ${schema.memories.id} < ${reference.id}
            )
          )
        `);
      }

      query = this.db
        .select({
          id: schema.memories.id,
          userId: schema.memories.userId,
          orgId: schema.memories.orgId,
          agentId: schema.memories.agentId,
          memoryText: schema.memories.memoryText,
          categories: schema.memories.categories,
          createdAt: schema.memories.createdAt,
          updatedAt: schema.memories.updatedAt,
        })
        .from(schema.memories)
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(desc(schema.memories.createdAt), desc(schema.memories.id))
        .limit(limit + 1);
    } else {
      // Backward pagination: fetch in ascending order then reverse the result
      if (reference) {
        conditions.push(sql`
          (
            ${schema.memories.createdAt} > ${reference.createdAt}
            OR (
              ${schema.memories.createdAt} = ${reference.createdAt}
              AND ${schema.memories.id} > ${reference.id}
            )
          )
        `);
      }

      query = this.db
        .select({
          id: schema.memories.id,
          userId: schema.memories.userId,
          orgId: schema.memories.orgId,
          agentId: schema.memories.agentId,
          memoryText: schema.memories.memoryText,
          categories: schema.memories.categories,
          createdAt: schema.memories.createdAt,
          updatedAt: schema.memories.updatedAt,
        })
        .from(schema.memories)
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(asc(schema.memories.createdAt), asc(schema.memories.id))
        .limit(limit + 1);
    }

    // console.log(`[PAGINATION DEBUG] Query:`, query.toSQL());

    let rows = await query;
    console.log(`[PAGINATION DEBUG] Query returned ${rows.length} rows`, rows);

    let hasMore: boolean;
    let sliced: Omit<schema.Memory, "embedding">[];

    if (!backward) {
      // Forward pagination: slice directly
      hasMore = rows.length > limit;
      sliced = rows.slice(0, limit);
    } else {
      // Backward pagination: reverse the result so that the newest memories come first
      sliced = rows.slice(0, limit);
      sliced = sliced.reverse();
      hasMore = true;
      console.log(`[PAGINATION DEBUG] Sliced rows:`, sliced);
    }

    return {
      data: sliced,
      has_more: hasMore,
    };
  }
}

export default Memory;
