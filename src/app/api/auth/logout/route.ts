import { cookies } from "next/headers";
import { originCheck, apiError } from "@/lib/auth";
export async function POST(req: Request) {
  try {
    originCheck(req);
    (await cookies()).delete("pg_session");
    return Response.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
