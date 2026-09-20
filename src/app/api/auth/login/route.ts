import bcrypt from "bcryptjs";
import { db, transaction } from "@/lib/db";
import { session, originCheck, apiError } from "@/lib/auth";
import { cookies } from "next/headers";
export async function POST(req: Request) {
  try {
    originCheck(req);
    const { email, password } = await req.json();
    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      email.length > 254 ||
      password.length > 128
    )
      throw Error("Enter your email and password.");
    const key = email.toLowerCase().trim();
    const attempts = await transaction(async (c) => {
      await c.query(
        "INSERT INTO login_attempts(key) VALUES($1) ON CONFLICT(key) DO UPDATE SET attempts=CASE WHEN login_attempts.started_at<now()-interval '15 minutes' THEN 1 ELSE login_attempts.attempts+1 END,started_at=CASE WHEN login_attempts.started_at<now()-interval '15 minutes' THEN now() ELSE login_attempts.started_at END",
        [key],
      );
      return (
        await c.query("SELECT attempts FROM login_attempts WHERE key=$1", [key])
      ).rows[0].attempts;
    });
    if (attempts > 10)
      return Response.json(
        { error: "Too many attempts. Try again in 15 minutes." },
        { status: 429 },
      );
    const u = (
      await db.query("SELECT * FROM users WHERE email=$1 AND active=true", [
        key,
      ])
    ).rows[0];
    if (!u || !(await bcrypt.compare(password, u.password_hash)))
      return Response.json(
        { error: "Incorrect email or password." },
        { status: 401 },
      );
    await db.query("DELETE FROM login_attempts WHERE key=$1", [key]);
    (await cookies()).set("pg_session", await session(u), {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === "true",
      sameSite: "lax",
      path: "/",
      maxAge: 43200,
    });
    return Response.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
