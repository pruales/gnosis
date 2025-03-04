import { Gnosis } from "./gnosis";
import type { DB } from "db";
import Memory from "./lib/ai/memory";
import { ModelId } from "./lib/ai/llm";
export type Bindings = {
  AI: Ai;
  VECTORIZE: VectorizeIndex;
  OPENAI_API_KEY: string;
  ADMIN_API_KEY: string;
  HYPERDRIVE: Hyperdrive;
  CLERK_SECRET_KEY: string;
  CLERK_PUBLISHABLE_KEY: string;
  MODEL_ID: ModelId;
};

export type Variables = {
  gnosis: Gnosis;
  db: DB;
  memory: Memory;
  companyId?: string;
  creator?: string;
};
