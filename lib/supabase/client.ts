"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * A Supabase client for use in Client Components — reads/writes the auth
 * session via document.cookie directly in the browser.
 *
 * OAuth sign-in (see components/GoogleSignInButton.tsx) needs to run here
 * rather than in a Server Action: the PKCE code verifier Supabase generates
 * has to be saved somewhere the browser can read it back once Google
 * redirects the user home, and a Server Action's Set-Cookie on its redirect
 * response isn't a reliable way to guarantee that before the browser
 * navigates off to accounts.google.com. Setting it directly via
 * document.cookie in the same click that starts the redirect is.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
