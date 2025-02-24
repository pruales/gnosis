import { eq, and } from "drizzle-orm";
import { DB, schema } from "db";

export class ApiKeyService {
  constructor(private readonly db: DB) {}

  async create(companyId: string) {
    const randomBytes = new Uint8Array(30);
    crypto.getRandomValues(randomBytes);
    const randomString = btoa(String.fromCharCode(...randomBytes))
      .replace(/[+/]/g, "")
      .slice(0, 40);

    const apiKey = `sk-${randomString}`;
    const hashedKey = await this.hashKey(apiKey);

    await this.db.insert(schema.apiKeys).values({
      companyId,
      hashedKey,
    });

    return apiKey;
  }

  async verify(apiKey: string) {
    const hashedKey = await this.hashKey(apiKey);
    const result = await this.db
      .select()
      .from(schema.apiKeys)
      .where(
        and(
          eq(schema.apiKeys.hashedKey, hashedKey),
          eq(schema.apiKeys.revoked, false)
        )
      )
      .get();
    return result;
  }

  async revoke(id: string) {
    await this.db
      .update(schema.apiKeys)
      .set({ revoked: true })
      .where(eq(schema.apiKeys.id, id));
  }

  private async hashKey(key: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(key);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  static extractBearerToken(authHeader?: string): string | null {
    return authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  }
}
