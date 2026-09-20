import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { db } from "./db";
export type User = {
  id: string;
  name: string;
  email: string;
  role: "owner" | "manager" | "accountant" | "caretaker";
  session_version?: number;
};
function secret() {
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32)
    throw Error("SESSION_SECRET must contain at least 32 characters");
  return new TextEncoder().encode(process.env.SESSION_SECRET);
}
export async function session(user: User) {
  return new SignJWT({ version: user.session_version ?? 0 })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(secret());
}
export async function currentUser(): Promise<User | null> {
  const token = (await cookies()).get("pg_session")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), {
      algorithms: ["HS256"],
    });
    return (
      (
        await db.query(
          "SELECT id,name,email,role FROM users WHERE id=$1 AND active=true AND session_version=$2",
          [payload.sub, payload.version ?? 0],
        )
      ).rows[0] ?? null
    );
  } catch {
    return null;
  }
}
export async function requireUser() {
  const u = await currentUser();
  if (!u) throw new Error("UNAUTHORIZED");
  return u;
}
export async function propertyAccess(user: User, id: string) {
  if (user.role === "owner") return true;
  return (
    (
      await db.query(
        "SELECT 1 FROM user_properties WHERE user_id=$1 AND property_id=$2",
        [user.id, id],
      )
    ).rowCount! > 0
  );
}
export function originCheck(req: Request) {
  if (
    !process.env.APP_ORIGIN ||
    req.headers.get("origin") !== process.env.APP_ORIGIN
  )
    throw Error("FORBIDDEN");
}
export function apiError(error: unknown) {
  const e = error as { message?: string; code?: string };
  if (e.message === "UNAUTHORIZED")
    return Response.json({ error: "Please sign in." }, { status: 401 });
  if (e.message === "FORBIDDEN")
    return Response.json(
      { error: "You do not have permission for this action." },
      { status: 403 },
    );
  if (e.code === "23505")
    return Response.json(
      { error: "This record already exists, or the bed is already occupied." },
      { status: 409 },
    );
  if (e.code) {
    console.error("Database error", e.code);
    return Response.json(
      {
        error:
          "Could not save this record. Please check the values and try again.",
      },
      { status: 400 },
    );
  }
  return Response.json(
    { error: e.message ?? "Something went wrong." },
    { status: 400 },
  );
}
