import { Hono } from "hono";
import type { Variables, Bindings } from "../types";
import { adminAuth } from "../middleware/auth";
import { eq, and } from "drizzle-orm";
import { schema } from "db";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { successResponse, errorResponse } from "../utils/response";

const adminRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

adminRoutes.use("*", adminAuth);

// Schema for requests that include companyId in the body
const companyIdSchema = z.object({
  companyId: z.string(),
});

/**
 * Revoke all API keys for a specific company (Admin only)
 * Route: DELETE /api/v1/admin/api_keys/revoke
 */
adminRoutes.delete(
  "/api_keys/revoke",
  zValidator("json", companyIdSchema),
  async (c) => {
    const db = c.get("db");
    const { companyId } = c.req.valid("json");

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
      return successResponse(c, {
        message: "No active API keys found for this company",
      });
    }

    // Revoke all keys
    await db
      .update(schema.apiKeys)
      .set({ revoked: true })
      .where(eq(schema.apiKeys.companyId, companyId));

    return successResponse(c, {
      message: `Successfully revoked ${keys.length} API key(s)`,
      revokedCount: keys.length,
    });
  }
);

export default adminRoutes;
