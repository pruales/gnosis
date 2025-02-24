import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { Variables, Bindings } from "../types";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

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

app.post("/", zValidator("json", addMemorySchema), async (c) => {
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

app.get("/:id", async (c) => {
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

export default app;
