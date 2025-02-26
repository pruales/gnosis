import { Hono } from "hono";
import { createDb } from "db";
import router from "./routes";
import { authMiddleware } from "./middleware/auth";
import { PromptService } from "./services/prompt";
import { Gnosis } from "./gnosis";
import { Bindings, Variables } from "./types";

const app = new Hono<{
  Bindings: Bindings;
  Variables: Variables & {
    userId?: string;
  };
}>();

// Set up database connection
app.use("*", async (c, next) => {
  const db = createDb(c.env.DB);
  c.set("db", db);
  await next();
});

// Add a simple ping endpoint for health checks
app.get("/ping", (c) => {
  return c.json({ status: "ok" });
});

// Skip auth for specific endpoints
app.use("*", async (c, next) => {
  // Skip authentication for ping endpoint
  if (c.req.path === "/ping") {
    return next();
  }

  // Skip auth for company creation
  if (c.req.path.startsWith("/api/companies") && c.req.method === "POST") {
    return next();
  }

  // Use authentication middleware for everything else
  return authMiddleware(c, next);
});

// Initialize Gnosis with company context (after authentication)
app.use("*", async (c, next) => {
  // Skip Gnosis setup for paths that don't need it
  if (
    c.req.path === "/ping" ||
    (c.req.path.startsWith("/api/companies") && c.req.method === "POST")
  ) {
    return next();
  }

  const db = c.get("db");
  const promptService = new PromptService(db);
  const companyId = c.get("companyId");

  if (!companyId) {
    return c.json({ error: "Company ID not found" }, 500);
  }

  const gnosis = new Gnosis(c.env.AI, c.env.VECTORIZE, c.env.OPENAI_API_KEY);

  // Set custom prompt if available
  const customPrompt = await promptService.getFactExtraction(companyId);
  if (customPrompt) {
    gnosis.setFactExtractionPrompt(customPrompt);
  }

  c.set("gnosis", gnosis);
  await next();
});

app.route("/api", router);

export default app;
