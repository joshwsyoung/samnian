import "server-only";
import { headers } from "next/headers";

/** Best-effort absolute origin for building links inside emails. */
export async function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;

  const h = await headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  if (host) return `${proto}://${host}`;

  return "http://localhost:3000";
}
