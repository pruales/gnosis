import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { PromptService } from "../services/prompt";
import type { Variables, Bindings } from "../types";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Add a 404 handler to ensure all responses are JSON
app.notFound((c) => {
  return c.json({ error: "Route not found" }, 404);
});

const setPromptSchema = z.object({
  promptContent: z.array(
    z.object({
      role: z.enum(["system", "user", "assistant"]),
      content: z.string(),
    })
  ),
});

app.post("/", zValidator("json", setPromptSchema), async (c) => {
  const db = c.get("db");
  const promptService = new PromptService(db);
  const { promptContent } = c.req.valid("json");
  const companyId = c.req.param("id");

  if (!companyId) {
    return c.json({ error: "Company ID is required" }, 400);
  }

  try {
    await promptService.setFactExtraction(companyId, promptContent);
    return c.json({ message: "Fact extraction prompt updated successfully" });
  } catch (error) {
    console.error("Error setting prompt:", error);
    if (error instanceof Error && error.message.includes("does not exist")) {
      return c.json({ error: "Company does not exist" }, 404);
    }
    return c.json({ error: "Failed to update prompt" }, 500);
  }
});

app.get("/", async (c) => {
  const db = c.get("db");
  const promptService = new PromptService(db);
  const companyId = c.req.param("id");

  if (!companyId) {
    return c.json({ error: "Company ID is required" }, 400);
  }

  console.log(`Getting prompt for company ID: ${companyId}`);

  try {
    const prompt = await promptService.getFactExtraction(companyId);
    return c.json({ prompt });
  } catch (error) {
    console.error("Error getting prompt:", error);
    return c.json({ error: "Failed to retrieve prompt" }, 500);
  }
});

export default app;
