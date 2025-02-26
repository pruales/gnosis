import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { ApiKeyService } from "../services/api-key";
import { adminAuth, companyAuth } from "../middleware/auth";
import { schema } from "db";
import type { Variables, Bindings } from "../types";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Create new API key using authenticated company ID
app.post("/api-keys", async (c) => {
  const db = c.get("db");
  const apiKeyService = new ApiKeyService(db);

  // Get the companyId from context (set by authentication middleware)
  const companyId = c.get("companyId");

  if (!companyId) {
    return c.json({ error: "Not authenticated or company ID not found" }, 401);
  }

  console.log(`Creating API key for company: ${companyId}`);
  const apiKey = await apiKeyService.create(companyId);
  return c.json({ apiKey }, 201);
});

// Revoke all API keys for a company (admin only)
app.delete("/:id/api-keys", adminAuth, async (c) => {
  const db = c.get("db");
  const companyId = c.req.param("id");

  // Get all active keys for the company
  const keys = await db
    .select()
    .from(schema.apiKeys)
    .where(
      and(
        eq(schema.apiKeys.companyId, companyId),
        eq(schema.apiKeys.revoked, false)
      )
    );

  if (keys.length === 0) {
    return c.json({ message: "No active API keys found for this company" });
  }

  // Revoke all keys
  await db
    .update(schema.apiKeys)
    .set({ revoked: true })
    .where(eq(schema.apiKeys.companyId, companyId));

  return c.json({
    message: `Successfully revoked ${keys.length} API key(s)`,
    revokedCount: keys.length,
  });
});

app.get("/api-keys", async (c) => {
  const db = c.get("db");
  const companyId = c.get("companyId");

  if (!companyId) {
    return c.json({ error: "Company ID not found" }, 500);
  }

  const keys = await db
    .select({
      id: schema.apiKeys.id,
      createdAt: schema.apiKeys.createdAt,
      revoked: schema.apiKeys.revoked,
    })
    .from(schema.apiKeys)
    .where(
      and(
        eq(schema.apiKeys.companyId, companyId),
        eq(schema.apiKeys.revoked, false)
      )
    );

  // Return the keys wrapped in an object with a keys property to match API client expectations
  return c.json({ keys });
});

app.delete("/api-keys/:keyId", async (c) => {
  const db = c.get("db");
  const apiKeyService = new ApiKeyService(db);
  const companyId = c.get("companyId");
  const keyId = c.req.param("keyId");

  if (!companyId) {
    return c.json({ error: "Company ID not found" }, 500);
  }

  // Verify the key belongs to the company
  const key = await db
    .select()
    .from(schema.apiKeys)
    .where(
      and(eq(schema.apiKeys.id, keyId), eq(schema.apiKeys.companyId, companyId))
    )
    .get();

  if (!key) {
    return c.json({ error: "API key not found" }, 404);
  }

  await apiKeyService.revoke(keyId);
  return c.json({ message: "API key revoked successfully" });
});

export default app;
