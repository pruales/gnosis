import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { ApiKeyService } from "../services/api-key";
import { schema } from "db";
import type { Variables, Bindings } from "../types";
import { successResponse, errorResponse } from "../utils/response";

const apiKeyRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// =========================================
// API Key Management
// =========================================

/**
 * List all API keys for a company
 * Route: GET /api/v1/api_keys
 */
apiKeyRoutes.get("/", async (c) => {
  const db = c.get("db");
  const companyId = c.get("companyId");

  if (!companyId) {
    return errorResponse(c, "Company ID not found", 500);
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
  return successResponse(c, { keys });
});

/**
 * Create new API key for a company
 * Route: POST /api/v1/api_keys
 */
apiKeyRoutes.post("/", async (c) => {
  const db = c.get("db");
  const apiKeyService = new ApiKeyService(db);

  const companyId = c.get("companyId") as string;

  console.log(`Creating API key for company: ${companyId}`);
  const apiKey = await apiKeyService.create(companyId);
  return successResponse(c, { apiKey }, 201);
});

/**
 * Revoke a specific API key for a company
 * Route: DELETE /api/v1/api_keys/{key_id}
 */
apiKeyRoutes.delete("/:key_id", async (c) => {
  const db = c.get("db");
  const apiKeyService = new ApiKeyService(db);
  const companyId = c.get("companyId");
  const keyId = c.req.param("key_id");

  if (!companyId) {
    return errorResponse(c, "Company ID not found", 500);
  }

  // Verify the key belongs to the company
  const [key] = await db
    .select()
    .from(schema.apiKeys)
    .where(
      and(eq(schema.apiKeys.id, keyId), eq(schema.apiKeys.companyId, companyId))
    )
    .limit(1);

  if (!key) {
    return errorResponse(c, "API key not found", 404);
  }

  await apiKeyService.revoke(keyId);
  return successResponse(c, { message: "API key revoked successfully" });
});

export default apiKeyRoutes;
