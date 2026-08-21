"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBaseUrl } from "@/lib/url";
import { safeNextPath } from "@/lib/auth";

/**
 * Shared by /login and /register — both just want "sign in with Google",
 * and the callback figures out whether that's actually a first-time signup
 * (no profile row yet) or a returning user. `next` (where to land after
 * the OCEAN gate, if any) rides along as a query param on the callback URL
 * since there's no formData on the far side of the OAuth round trip.
 */
export async function signInWithGoogleAction(formData: FormData) {
  const supabase = await createClient();
  const baseUrl = await getBaseUrl();
  const next = safeNextPath(String(formData.get("next") ?? ""), "");

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${baseUrl}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ""}`,
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
