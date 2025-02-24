import { Hono } from "hono";
import type { Variables, Bindings } from "../types";
import companiesRouter from "./companies";
import memoriesRouter from "./memories";
import promptsRouter from "./prompts";
import healthRouter from "./health";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.route("/v1/companies", companiesRouter);
app.route("/v1/memories", memoriesRouter);
app.route("/v1/companies/:id/prompt", promptsRouter);
app.route("/v1/ping", healthRouter);

export default app;
