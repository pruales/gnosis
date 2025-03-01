import {
  pgTable,
  text,
  boolean,
  timestamp,
  uuid,
  index,
  vector,
} from "drizzle-orm/pg-core";

export const apiKeys = pgTable(
  "api_keys",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: text("company_id").notNull(),
    hashedKey: text("hashed_key").notNull().unique(),
    name: text("name").default("API Key"),
    creator: text("creator").notNull(),
    revoked: boolean("revoked").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("api_keys_company_id_idx").on(table.companyId),
    index("api_keys_hashed_key_revoked_idx").on(table.hashedKey, table.revoked),
  ]
);

export type ApiKeys = typeof apiKeys.$inferSelect;
export type ApiKeysInsert = typeof apiKeys.$inferInsert;

export const prompts = pgTable("prompts", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: text("company_id").notNull().unique(),
  promptContent: text("prompt_content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Prompts = typeof prompts.$inferSelect;
export type PromptsInsert = typeof prompts.$inferInsert;

export const memories = pgTable(
  "memories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    embedding: vector({ dimensions: 768 }).notNull(),
    userId: text("user_id").notNull(),
    orgId: text("org_id").notNull(),
    memoryText: text("memory_text").notNull(),
    agentId: text("agent_id").default(""),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("memories_user_id_idx").on(table.userId),
    index("memories_org_id_idx").on(table.orgId),
    index("memories_agent_id_idx").on(table.agentId),
    index("embedding_index").using(
      "diskann",
      table.embedding.op("vector_cosine_ops")
    ),
  ]
);

export type Memories = typeof memories.$inferSelect;
export type MemoriesInsert = typeof memories.$inferInsert;
