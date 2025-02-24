import { Hono } from "hono";
import type { Variables, Bindings } from "../types";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.get("/", (c) => {
  return c.json({ status: "ok" });
});

export default app;
