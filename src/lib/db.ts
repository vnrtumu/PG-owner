import { Pool, PoolClient, types } from "pg";
// PostgreSQL DATE is a calendar date, not a local-time instant.
types.setTypeParser(1082, (value) => value);
const globalDb = globalThis as unknown as { pool?: Pool };
export const db =
  globalDb.pool ??
  new Pool({ connectionString: process.env.DATABASE_URL, max: 8 });
if (process.env.NODE_ENV !== "production") globalDb.pool = db;
export async function transaction<T>(fn: (client: PoolClient) => Promise<T>) {
  const c = await db.connect();
  try {
    await c.query("BEGIN");
    const result = await fn(c);
    await c.query("COMMIT");
    return result;
  } catch (e) {
    await c.query("ROLLBACK");
    throw e;
  } finally {
    c.release();
  }
}
