import { eq } from "drizzle-orm";
import { DB, schema } from "db";

export class CompanyService {
  constructor(private readonly db: DB) {}

  async create(name: string) {
    const [company] = await this.db
      .insert(schema.companies)
      .values({ name })
      .returning();
    return company;
  }

  async get(id: string) {
    return await this.db
      .select()
      .from(schema.companies)
      .where(eq(schema.companies.id, id))
      .get();
  }
}
