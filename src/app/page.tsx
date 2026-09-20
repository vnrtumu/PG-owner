import { currentUser } from "@/lib/auth";
import Portal from "./portal";
import Login from "./login";
export const dynamic = "force-dynamic";
export default async function Page() {
  const user = await currentUser();
  return user ? <Portal /> : <Login />;
}
