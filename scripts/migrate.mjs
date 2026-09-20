import pg from "pg";
import { readFile } from "node:fs/promises";
const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
await db.connect();
try {
  await db.query("BEGIN");
  await db.query(
    await readFile(new URL("./schema.sql", import.meta.url), "utf8"),
  );
  await db.query("COMMIT");
  console.log("Database schema ready.");
} catch (e) {
  await db.query("ROLLBACK");
  throw e;
} finally {
  await db.end();
}
