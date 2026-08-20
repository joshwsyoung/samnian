import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client — bypasses RLS and can manage other users' auth
 * records (admin.deleteUser, admin.updateUserById). Never expose this
 * client or its key to the browser.
 */
export function createAdminClient() {
  // See the matching comment in lib/supabase/server.ts — NEXT_PUBLIC_* vars
  // are inlined at build time, so a dashboard edit needs a genuinely fresh
  // build (not a cached-output redeploy) to actually take effect.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set. Copy .env.example to .env.local and fill them in from your Supabase project's Settings > API (the service_role secret, not the anon key)."
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
