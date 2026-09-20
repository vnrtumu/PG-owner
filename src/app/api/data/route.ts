import { requireUser, apiError } from "@/lib/auth";
import { getData } from "@/lib/data";
export async function GET() {
  try {
    return Response.json(await getData(await requireUser()));
  } catch (e) {
    return apiError(e);
  }
}
