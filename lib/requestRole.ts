import { cookies } from "next/headers";
import { verifySessionValue, type Role } from "@/lib/session";

// Route handlers can't see the role the middleware checked, so they re-read
// the signed session cookie when a response depends on who is asking.
export async function getRequestRole(): Promise<Role | null> {
  const jar = await cookies();
  return verifySessionValue(jar.get("session")?.value);
}
