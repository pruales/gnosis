import { DB, schema } from "db";
import {
  eq,
  and,
  inArray,
  sql,
  cosineDistance,
  SQL,
  lte,
  not,
  lt,
  desc,
} from "drizzle-orm";

export type MemoryMetadata = {
  userId: string;
  memoryText: string;
  orgId?: string;
  agentId?: string;
};

export interface QueryOptions {
  userId?: string;
  orgId?: string;
  agentId?: string;
}

export interface MemoryConfig {
  // DiskANN configuration for accuracy vs. speed trade-off
  diskAnnSearchListSize?: number; // Default: 100 - number of additional candidates during graph search
  diskAnnRescore?: number; // Default: 50 - number of elements rescored (0 to disable)
}

export class Memory {
  private ai: Ai;
  private db: DB;
  private config: MemoryConfig;

  constructor(
    ai: Ai,
    db: DB,
    config: MemoryConfig = {
      diskAnnSearchListSize: 100, // Default value
      diskAnnRescore: 50, // Default value
    }
  ) {
    this.ai = ai;
    this.db = db;
    this.config = config;
  }

  async add(
    items: {
      id?: string;
      text: string;
      metadata: MemoryMetadata;
    }[]
  ) {
    try {
      console.log(`Adding ${items.length} vectors`);
      // Generate embeddings for all texts in a single API call
      const embeddings = await this.ai.run("@cf/baai/bge-base-en-v1.5", {
        text: items.map((item) => item.text),
      });

      if (!embeddings.data) throw new Error("embedding values are undefined");

      // Create records for the database
      const records = items.map((item, index) => {
        let orgId = item.metadata.orgId;
        if (!orgId) {
          console.error(`Memory ${item.id} has no orgId`);
          throw new Error(`Memory ${item.id} has no orgId`);
        }
        // Only include id if explicitly provided
        const record: schema.MemoriesInsert = {
          embedding: embeddings.data[index],
          userId: item.metadata.userId,
          orgId: orgId,
          memoryText: item.metadata.memoryText || item.text,
          agentId: item.metadata.agentId || "",
        };

        // Add id only if explicitly provided
        if (item.id) {
          record.id = item.id;
        }

        return record;
      });

      console.log(`Inserting ${records.length} memory records`);

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

      return result.map((r: { id: string }) => r.id);
    } catch (error) {
      console.error("Error adding memory vectors:", error);
      throw error;
    }
  }

  //todo: support reranking
  async query(text: string, k: number = 10, options?: QueryOptions) {
    if (!text) return;

    try {
      const embedding = await this.ai.run("@cf/baai/bge-base-en-v1.5", {
        text: text,
      });

      const values = embedding.data[0];

      if (!values) throw new Error("embedding values are undefined");

      // Build query conditions
      let conditions: SQL[] = [];

      if (options?.userId) {
        conditions.push(eq(schema.memories.userId, options.userId));
      }

      if (options?.orgId) {
        conditions.push(eq(schema.memories.orgId, options.orgId));
      }

      if (options?.agentId) {
        conditions.push(eq(schema.memories.agentId, options.agentId));
      }

      return await this.db.transaction(async (tx) => {
        if (this.config.diskAnnSearchListSize !== undefined) {
          await tx.execute(
            sql.raw(
              `SET LOCAL diskann.query_search_list_size = ${this.config.diskAnnSearchListSize}`
            )
          );
        }

        if (this.config.diskAnnRescore !== undefined) {
          await tx.execute(
            sql.raw(
              `SET LOCAL diskann.query_rescore = ${this.config.diskAnnRescore}`
            )
          );
        }

        // Execute query with the configured parameters
        const queryResults = await tx
          .select({
            id: schema.memories.id,
            userId: schema.memories.userId,
            orgId: schema.memories.orgId,
            memoryText: schema.memories.memoryText,
            agentId: schema.memories.agentId,
            similarity: cosineDistance(schema.memories.embedding, values),
          })
          .from(schema.memories)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(cosineDistance(schema.memories.embedding, values))
          .limit(k);

        return {
          matches: queryResults.map((result) => ({
            id: result.id,
            score: 1 - Number(result.similarity), // Convert cosine distance to similarity score
            metadata: {
              userId: result.userId,
              memoryText: result.memoryText,
              orgId: result.orgId,
              agentId: result.agentId || "",
            },
          })),
        };
      });
    } catch (error) {
      console.error("Error querying memory vectors:", error);
      throw error;
    }
  }

  updateConfig(config: Partial<MemoryConfig>) {
    this.config = { ...this.config, ...config };
  }

  async getAllById(ids: string[]) {
    return await this.db
      .select()
      .from(schema.memories)
      .where(inArray(schema.memories.id, ids));
  }

  async delete(ids: string[]) {
    await this.db
      .delete(schema.memories)
      .where(inArray(schema.memories.id, ids));
  }

  async getByUserId(userId: string, limit: number = 50) {
    return await this.db
      .select()
      .from(schema.memories)
      .where(eq(schema.memories.userId, userId))
      .orderBy(schema.memories.createdAt)
      .limit(limit);
  }

  async getByOrgId(orgId: string, limit: number = 50) {
    return await this.db
      .select()
      .from(schema.memories)
      .where(eq(schema.memories.orgId, orgId))
      .orderBy(schema.memories.createdAt)
      .limit(limit);
  }

  async getByAgentId(agentId: string, limit: number = 50) {
    return await this.db
      .select()
      .from(schema.memories)
      .where(eq(schema.memories.agentId, agentId))
      .orderBy(schema.memories.createdAt)
      .limit(limit);
  }

  /**
   * Get memories by applying multiple filter criteria with cursor-based pagination
   * @param filters Object containing filter criteria (userId, orgId, agentId)
   * @param limit Maximum number of results to return
   * @param cursor Optional cursor for pagination (memory ID to start after)
   * @param includeTotal Whether to include a total count (expensive for large datasets)
   * @returns Paginated memories with cursor information
   */
  async getByFilters(
    filters: {
      userId?: string;
      orgId?: string;
      agentId?: string;
    },
    limit: number = 50,
    cursor?: string,
    includeTotal: boolean = false
  ) {
    // Build query conditions - combine all provided filters with AND logic
    let conditions: SQL[] = [];

    if (filters.userId) {
      conditions.push(eq(schema.memories.userId, filters.userId));
    }

    if (filters.orgId) {
      conditions.push(eq(schema.memories.orgId, filters.orgId));
    }

    if (filters.agentId) {
      conditions.push(eq(schema.memories.agentId, filters.agentId));
    }

    // Calculate total count if requested (expensive operation)
    let totalCount: number | undefined = undefined;
    if (includeTotal) {
      const countQuery = await this.db
        .select({ count: sql`count(*)` })
        .from(schema.memories)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      totalCount = Number(countQuery[0]?.count || 0);
    }

    // First, get records based on the conditions
    let paginatedQuery = this.db
      .select()
      .from(schema.memories)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(schema.memories.createdAt));

    // If we have a cursor, we need to handle pagination
    if (cursor) {
      try {
        // Get the reference record for the cursor
        const [cursorRecord] = await this.db
          .select({ createdAt: schema.memories.createdAt })
          .from(schema.memories)
          .where(eq(schema.memories.id, cursor))
          .limit(1);

        if (cursorRecord) {
          // Add a condition to only get records older than the cursor
          paginatedQuery = this.db
            .select()
            .from(schema.memories)
            .where(
              and(
                ...[
                  ...conditions,
                  lt(schema.memories.createdAt, cursorRecord.createdAt),
                ]
              )
            )
            .orderBy(desc(schema.memories.createdAt));
        }
      } catch (error) {
        console.error("Error finding cursor record:", error);
        // Continue with normal query if cursor record can't be found
      }
    }

    // Execute the query with limit+1 to check if there are more results
    const records = await paginatedQuery.limit(limit + 1);

    // Determine if there are more results
    const hasMore = records.length > limit;
    const results = hasMore ? records.slice(0, limit) : records;

    // Get the next cursor (ID of the last item)
    const nextCursor =
      results.length > 0 ? results[results.length - 1].id : null;

    // Return both results and pagination metadata
    return {
      records: results,
      pagination: {
        has_more: hasMore,
        next_cursor: nextCursor,
        ...(totalCount !== undefined && { total: totalCount }),
        limit,
      },
    };
  }
}

export default Memory;
