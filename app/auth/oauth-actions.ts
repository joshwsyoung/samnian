"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBaseUrl } from "@/lib/url";

/**
 * Shared by /login and /register — both just want "sign in with Google",
 * and the callback figures out whether that's actually a first-time signup
 * (no profile row yet) or a returning user.
 */
export async function signInWithGoogleAction() {
  const supabase = await createClient();
  const baseUrl = await getBaseUrl();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${baseUrl}/auth/callback`,
      // We're in a Server Action, not a browser — there's nothing to
      // redirect automatically, so ask Supabase for the URL and redirect
      // to it ourselves.
      skipBrowserRedirect: true,
    },
  });

  if (error || !data.url) {
    redirect(
      "/login?error=" +
        encodeURIComponent(
          error?.message ?? "Google sign-in isn't set up on this deployment yet."
        )
    );
  }

  redirect(data.url);
}
