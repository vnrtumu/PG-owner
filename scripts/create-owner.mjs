import pg from "pg";
import bcrypt from "bcryptjs";
const [email, name] = process.argv.slice(2);
const password = process.env.OWNER_PASSWORD;
if (!email || !name || !password || password.length < 12)
  throw Error(
    'Usage: OWNER_PASSWORD=<12+ characters> npm run owner:create -- email "Owner name"',
  );
const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
await db.connect();
try {
  await db.query(
    "INSERT INTO users(name,email,password_hash,role) VALUES($1,$2,$3,'owner')",
    [name, email.toLowerCase(), await bcrypt.hash(password, 12)],
  );
  console.log("Owner created.");
} finally {
  await db.end();
}
