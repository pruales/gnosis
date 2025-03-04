import { Hono } from "hono";
import type { Variables, Bindings } from "../types";
import apiKeyRoutes from "./api-keys";
import memoriesRouter from "./memories";
import promptsRouter from "./prompts";
import { authMiddleware } from "../middleware/auth";
import { PromptService } from "../services/prompt";
import { Gnosis } from "../gnosis";
import Memory from "../lib/ai/memory";
import { errorResponse } from "../utils/response";

// =========================================
// Authenticated API Routes
// =========================================

const authRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

/**
 * Authentication middleware
 */
authRoutes.use("*", authMiddleware);

/**
 * Gnosis initialization middleware
 * NOTE: guarantees that companyId is set for all routes in this router
 */
authRoutes.use("*", async (c, next) => {
  const db = c.get("db");
  const promptService = new PromptService(db);

  const companyId = c.get("companyId");

  if (!companyId) {
    return errorResponse(c, "Company ID not found", 400);
  }

  const memory = new Memory(c.env.AI, db);
  c.set("memory", memory);

  const gnosis = new Gnosis(
    c.env.AI,
    c.env.OPENAI_API_KEY,
    promptService,
    memory,
    c.env.MODEL_ID
  );

  c.set("gnosis", gnosis);
  await next();
});

// =========================================
// API Route Mounting
// =========================================

/**
 * Mount api key routes
 * Base Path: /api/v1/api_keys
 */
authRoutes.route("/api_keys", apiKeyRoutes);

/**
 * Mount memories routes
 * Base Path: /api/v1/memories
 */
authRoutes.route("/memories", memoriesRouter);

/**
 * Mount prompts routes
 * Base Path: /api/v1/prompts
 */
authRoutes.route("/prompts", promptsRouter);

export default authRoutes;
