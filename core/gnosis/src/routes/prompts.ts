import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { PromptService } from "../services/prompt";
import type { Variables, Bindings } from "../types";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

const setPromptSchema = z.object({
  promptContent: z.array(
    z.object({
      role: z.enum(["system", "user", "assistant"]),
      content: z.string(),
    })
  ),
});

app.post("/:id", zValidator("json", setPromptSchema), async (c) => {
  const db = c.get("db");
  const promptService = new PromptService(db);
  const { promptContent } = c.req.valid("json");
  const companyId = c.req.param("id");

  await promptService.setFactExtraction(companyId, promptContent);
  return c.json({ message: "Fact extraction prompt updated successfully" });
});

export default app;
