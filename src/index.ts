import { Hono } from "hono";
import { Gnosis } from "./gnosis";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

// Define types
export type Bindings = {
  AI: Ai;
  VECTORIZE: VectorizeIndex;
};

type Variables = {
  gnosis: Gnosis;
};

// Create Hono app
const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Initialize Gnosis for each request
app.use("*", async (c, next) => {
  const gnosis = new Gnosis(c.env.AI, c.env.VECTORIZE);
  c.set("gnosis", gnosis);
  await next();
});

// Validation schemas
const addMemorySchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["system", "user", "assistant"]),
      content: z.string(),
    })
  ),
  userId: z.string(),
  namespace: z.string(),
});

const updateMemorySchema = z.object({
  text: z.string(),
});

const searchSchema = z.object({
  query: z.string(),
  userId: z.string(),
  namespace: z.string(),
  limit: z.number().optional().default(100),
});

// Routes
app.post("/v1/memories", zValidator("json", addMemorySchema), async (c) => {
  const gnosis = c.get("gnosis");
  const { messages, userId, namespace } = c.req.valid("json");

  try {
    const result = await gnosis.add(userId, messages, namespace);
    return c.json(result);
  } catch (err) {
    const error = err as Error;
    return c.json({ error: error.message }, 500);
  }
});

app.get("/v1/memories/:id", async (c) => {
  const gnosis = c.get("gnosis");
  const id = c.req.param("id");

  try {
    const memory = await gnosis.get(id);
    if (!memory) {
      return c.json({ error: "Memory not found" }, 404);
    }
    return c.json(memory);
  } catch (err) {
    const error = err as Error;
    return c.json({ error: error.message }, 500);
  }
});

app.get("/v1/memories", async (c) => {
  const gnosis = c.get("gnosis");
  const userId = c.req.query("userId");
  const namespace = c.req.query("namespace");
  const limit = parseInt(c.req.query("limit") || "100");

  if (!userId || !namespace) {
    return c.json({ error: "userId and namespace are required" }, 400);
  }

  try {
    const memories = await gnosis.getAll(userId, namespace, limit);
    return c.json(memories);
  } catch (err) {
    const error = err as Error;
    return c.json({ error: error.message }, 500);
  }
});

app.post("/v1/memories/search", zValidator("json", searchSchema), async (c) => {
  const gnosis = c.get("gnosis");
  const { query, userId, namespace, limit } = c.req.valid("json");

  try {
    const results = await gnosis.search(query, userId, namespace, limit);
    return c.json(results);
  } catch (err) {
    const error = err as Error;
    return c.json({ error: error.message }, 500);
  }
});

app.put(
  "/v1/memories/:id",
  zValidator("json", updateMemorySchema),
  async (c) => {
    const gnosis = c.get("gnosis");
    const id = c.req.param("id");
    const { text } = c.req.valid("json");

    try {
      const result = await gnosis.update(id, text);
      return c.json(result);
    } catch (err) {
      const error = err as Error;
      if (error.message.includes("not found")) {
        return c.json({ error: error.message }, 404);
      }
      return c.json({ error: error.message }, 500);
    }
  }
);

app.delete("/v1/memories/:id", async (c) => {
  const gnosis = c.get("gnosis");
  const id = c.req.param("id");

  try {
    const result = await gnosis.delete(id);
    return c.json(result);
  } catch (err) {
    const error = err as Error;
    return c.json({ error: error.message }, 500);
  }
});

app.delete("/v1/memories", async (c) => {
  const gnosis = c.get("gnosis");
  const userId = c.req.query("userId");
  const namespace = c.req.query("namespace");

  if (!userId || !namespace) {
    return c.json({ error: "userId and namespace are required" }, 400);
  }

  try {
    const result = await gnosis.deleteAll(userId, namespace);
    return c.json(result);
  } catch (err) {
    const error = err as Error;
    return c.json({ error: error.message }, 500);
  }
});

// Health check endpoint
app.get("/v1/ping", (c) => {
  return c.json({ status: "ok" });
});

export default app;
