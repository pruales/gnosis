import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { PromptService } from "../services/prompt";
import type { Variables, Bindings } from "../types";
import { successResponse, errorResponse } from "../utils/response";

const promptRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// =========================================
// Prompts Management
// =========================================

const setPromptSchema = z.object({
  promptContent: z.array(
    z.object({
      role: z.enum(["system", "user", "assistant"]),
      content: z.string(),
    })
  ),
});

/**
 * Get instructions prompt for a company
 * Route: GET /api/v1/prompts/instructions
 */
promptRoutes.get("/instructions", async (c) => {
  const db = c.get("db");
  const promptService = new PromptService(db);
  const companyId = c.get("companyId") as string;

  console.log(`Getting prompt for company ID: ${companyId}`);

  try {
    const prompt = await promptService.getFactExtraction(companyId);
    return successResponse(c, { prompt });
  } catch (error) {
    console.error("Error getting prompt:", error);
    return errorResponse(c, "Failed to retrieve prompt", 500);
  }
});

/**
 * Set instructions prompt for a company
 * Route: POST /api/v1/prompts/instructions
 */
promptRoutes.post(
  "/instructions",
  zValidator("json", setPromptSchema),
  async (c) => {
    const db = c.get("db");
    const promptService = new PromptService(db);
    const { promptContent } = c.req.valid("json");
    const companyId = c.get("companyId") as string;

    try {
      await promptService.setFactExtraction(companyId, promptContent);
      return successResponse(c, {
        message: "Instructions prompt updated successfully",
      });
    } catch (error) {
      console.error("Error setting prompt:", error);
      if (error instanceof Error && error.message.includes("does not exist")) {
        return errorResponse(c, "Company does not exist", 404);
      }
      return errorResponse(c, "Failed to update prompt", 500);
    }
  }
);

/**
 * Reset instructions prompt for a company
 * Route: POST /api/v1/prompts/instructions/reset
 */
promptRoutes.post("/instructions/reset", async (c) => {
  const db = c.get("db");
  const promptService = new PromptService(db);
  const companyId = c.get("companyId") as string;

  try {
    await promptService.resetFactExtraction(companyId);
    return successResponse(c, {
      message: "Instructions prompt reset successfully",
    });
  } catch (error) {
    console.error("Error resetting prompt:", error);
    return errorResponse(c, "Failed to reset prompt", 500);
  }
});

export default promptRoutes;
