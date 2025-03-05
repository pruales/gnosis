import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { Variables, Bindings } from "../types";
import type { Context } from "hono";
import { successResponse, errorResponse } from "../utils/response";

const memoryRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// =========================================
// Memories Management
// =========================================

const addMemorySchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["system", "user", "assistant"]),
      content: z.string(),
    })
  ),
  userId: z.string(),
});

const searchMemoriesSchema = z.object({
  query: z.string(),
  userId: z.string(),
  limit: z.number().optional(),
});

const listMemoriesSchema = z.object({
  userId: z.string().optional(),
  agentId: z.string().optional(),
  limit: z.coerce
    .number()
    .optional()
    .default(50)
    .refine((val) => val >= 1 && val <= 100, {
      message: "Limit must be between 1 and 100",
    }),
  starting_after: z.string().uuid().optional(),
  ending_before: z.string().uuid().optional(),
});

/**
 * Utility function to verify a memory belongs to the company
 * Returns the memory if it exists and belongs to the company, otherwise handles the error response
 */
async function verifyMemoryOwnership(
  c: Context<{ Bindings: Bindings; Variables: Variables }>,
  memoryId: string
) {
  const gnosis = c.get("gnosis");
  const companyId = c.get("companyId");

  const memory = await gnosis.get(memoryId);
  if (!memory || memory.orgId !== companyId) {
    throw new Error("Memory not found or does not belong to this company");
  }

  return memory;
}

/**
 * Add a new memory for a company
 * Route: POST /api/v1/memories
 */
memoryRoutes.post("/", zValidator("json", addMemorySchema), async (c) => {
  const gnosis = c.get("gnosis");
  const { messages, userId } = c.req.valid("json");

  try {
    const result = await gnosis.add(
      userId,
      messages,
      c.get("companyId") as string
    );
    return successResponse(c, result);
  } catch (err) {
    const error = err as Error;
    console.error(error);
    return errorResponse(c, error.message, 500);
  }
});

/**
 * Search memories for a company
 * Route: POST /api/v1/memories/search
 */
memoryRoutes.post(
  "/search",
  zValidator("json", searchMemoriesSchema),
  async (c) => {
    const gnosis = c.get("gnosis");
    const { query, userId, limit = 20 } = c.req.valid("json");
    const companyId = c.get("companyId") as string;

    try {
      const memories = await gnosis.search(query, userId, companyId, limit);
      return successResponse(c, memories);
    } catch (err) {
      const error = err as Error;
      return errorResponse(c, error.message, 500);
    }
  }
);

/**
 * List memories with optional filtering by userId and/or agentId
 * - All filters are combined with AND logic when provided
 * - Company's orgId is automatically applied for security
 * - If no filters are provided, returns all memories for the company
 * - Uses cursor-based pagination to paginate through results
 * Route: GET /api/v1/memories/list
 */
memoryRoutes.get(
  "/list",
  zValidator("query", listMemoriesSchema),
  async (c) => {
    const memory = c.get("memory");
    const { userId, agentId, limit, starting_after, ending_before } =
      c.req.valid("query");
    const companyId = c.get("companyId") as string;

    console.log("[INCOMING REQUEST PARAMS]", c.req.query());

    try {
      // Ensure starting_after and ending_before are not used together
      if (starting_after && ending_before) {
        return errorResponse(
          c,
          "The parameters starting_after and ending_before cannot be used simultaneously",
          400
        );
      }

      const filterCriteria = {
        userId,
        agentId,
        orgId: companyId,
      };

      const result = await memory.getByFilters(
        filterCriteria,
        limit,
        false,
        starting_after,
        ending_before
      );

      return successResponse(c, {
        data: result.data,
        has_more: result.has_more,
      });
    } catch (err) {
      const error = err as Error;
      console.error("Error listing memories:", error);
      return errorResponse(c, error.message, 500);
    }
  }
);

/**
 * Retrieve a memory by ID for a company
 * Route: GET /api/v1/memories/{memory_id}
 */
memoryRoutes.get("/:memory_id", async (c) => {
  const memoryId = c.req.param("memory_id");

  try {
    // Use the utility function to verify and retrieve the memory
    const memory = await verifyMemoryOwnership(c, memoryId);
    return successResponse(c, memory);
  } catch (err) {
    return errorResponse(c, "Memory not found", 404);
  }
});

/**
 * Update a memory for a company
 * Route: PUT /api/v1/memories/{memory_id}
 */
memoryRoutes.put(
  "/:memory_id",
  zValidator("json", z.object({ text: z.string() })),
  async (c) => {
    const gnosis = c.get("gnosis");
    const memoryId = c.req.param("memory_id");
    const { text } = c.req.valid("json");

    try {
      // Verify the memory belongs to the company
      await verifyMemoryOwnership(c, memoryId);

      // Update the memory
      await gnosis.update(memoryId, text);
      return successResponse(c, { message: "Memory updated successfully" });
    } catch (err) {
      return errorResponse(c, "Memory not found", 404);
    }
  }
);

/**
 * Delete a memory for a company
 * Route: DELETE /api/v1/memories/{memory_id}
 */
memoryRoutes.delete("/:memory_id", async (c) => {
  const gnosis = c.get("gnosis");
  const memoryId = c.req.param("memory_id");

  try {
    // Verify the memory belongs to the company
    await verifyMemoryOwnership(c, memoryId);

    // Delete the memory
    await gnosis.delete(memoryId);
    return successResponse(c, { message: "Memory deleted successfully" });
  } catch (err) {
    const error = err as Error;
    console.error(error);
    return errorResponse(c, "Memory not found", 404);
  }
});

export default memoryRoutes;
