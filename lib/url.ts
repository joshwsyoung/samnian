import "server-only";
import { headers } from "next/headers";

// Keep this in sync with Supabase Auth's Redirect URLs allowlist. Building
// email links from the request's Host header instead breaks confirmation/
// reset links the moment someone submits the form from any of this
// project's other live aliases (old preview URLs, the legacy
// tabletalk-eosin.vercel.app domain, etc.) that aren't allow-listed there —
// Supabase rejects that redirect_to and falls back to a bare, code-only
// landing on Site URL instead of our /auth/confirm page.
const PRODUCTION_URL = "https://samnian.vercel.app";

/** Best-effort absolute origin for building links inside emails. */
export async function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;

  const h = await headers();
  const host = h.get("host");

  // Local dev: trust the request's own host so links work against
  // localhost. Everywhere else, always use the one canonical production
  // URL — regardless of which alias served this particular request — so
  // email links stay consistent with what's actually allow-listed.
  if (host?.startsWith("localhost") || host?.startsWith("127.0.0.1")) {
    const proto = h.get("x-forwarded-proto") ?? "http";
    return `${proto}://${host}`;
  }

  return PRODUCTION_URL;
}
