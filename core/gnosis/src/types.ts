import { Gnosis } from "./gnosis";
import type { DB } from "db";

export type Bindings = {
  AI: Ai;
  VECTORIZE: VectorizeIndex;
  OPENAI_API_KEY: string;
  ADMIN_API_KEY: string;
  DB: D1Database;
  CLERK_SECRET_KEY: string;
};

export type Variables = {
  gnosis: Gnosis;
  db: DB;
  companyId?: string;
};
