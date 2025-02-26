import { Hono } from "hono";
import type { Variables, Bindings } from "../types";
import companiesRouter from "./companies";
import memoriesRouter from "./memories";
import promptsRouter from "./prompts";
import healthRouter from "./health";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Mount all routes under /v1
app.route("/v1/companies", companiesRouter);
app.route("/v1/memories", memoriesRouter);
app.route("/v1/companies/:id/prompt", promptsRouter);
app.route("/v1/ping", healthRouter);

// Add a catch-all for 404 errors
app.notFound((c) => {
  console.log(`404 Not Found: ${c.req.method} ${c.req.path}`);
  return c.json({ error: "Route not found" }, 404);
});

export default app;
