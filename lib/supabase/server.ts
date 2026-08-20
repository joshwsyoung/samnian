import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function supabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are not set. Copy .env.example to .env.local and fill them in from your Supabase project's Settings > API."
    );
  }
  return { url, anonKey };
}

/**
 * A Supabase client for use in Server Components, Server Actions, and
 * Route Handlers. Reads/writes the auth session via cookies.
 *
 * Server Components can't set cookies, so a token refresh that happens
 * during a plain page render can't persist there — `middleware.ts` covers
 * that by refreshing the session on every request before it reaches a page.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = supabaseEnv();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component render, where cookies can't be
          // written — fine, middleware.ts refreshes the session instead.
        }
      },
    },
  });
}
