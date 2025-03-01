import { Hono } from "hono";
import { createDb } from "db";
import { Bindings, Variables } from "./types";
import authRoutes from "./routes";
import adminRoutes from "./routes/admin";
import { successResponse, errorResponse } from "./utils/response";

const app = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>();

/**
 * Database initialization middleware
 * Sets up the database connection for all routes
 */
app.use("*", async (c, next) => {
  const db = createDb(c.env.HYPERDRIVE.connectionString);
  c.set("db", db);
  await next();
});

// =========================================
// Public routes - no auth required
// =========================================

/**
 * Health check endpoint
 * Route: GET /ping
 */
app.get("/ping", (c) => {
  return successResponse(c, { status: "ok" });
});

app.onError((err, c) => {
  console.error(err);
  return errorResponse(c, "Internal Server Error", 500);
});

// =========================================
// API routes - auth handled at router level
// =========================================

/**
 * Mount authenticated API routes
 * Base Path: /api/v1
 * Routes defined in routes/index.ts following the pattern:
 * /api/v1/[resource]
 */
app.route("/api/v1", authRoutes);

/**
 * Mount admin-only API routes
 * Base Path: /api/v1/admin
 * Routes defined in routes/admin.ts following the pattern:
 * /api/v1/admin/[resource]
 */
app.route("/api/v1/admin", adminRoutes);

export default app;
