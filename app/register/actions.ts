"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import { getBaseUrl } from "@/lib/url";

export async function registerAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!name || !email || !password) {
    redirect("/register?error=missing_fields");
  }

  const supabase = await createClient();
  const baseUrl = await getBaseUrl();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${baseUrl}/auth/confirm?next=/ocean-test%3Frequired%3D1` },
  });

  if (error || !data.user) {
    redirect("/register?error=" + encodeURIComponent(error?.message ?? "Something went wrong."));
  }

  // Supabase deliberately doesn't error when the email is already registered
  // (so signup can't be used to probe which emails exist) — it returns a
  // fake success instead, with a made-up user whose `identities` array is
  // empty and whose id was never actually persisted. Treat that the same as
  // a real "already registered" error, since proceeding to insert a profile
  // row for that id would otherwise hit a spurious foreign-key violation.
  if (data.user.identities?.length === 0) {
    // Matches the wording Supabase's own signUp() error uses for this case
    // ("User already registered") so the register page's existing
    // registered → show a "log in instead" link logic picks it up here too.
    redirect("/register?error=" + encodeURIComponent("That email is already registered."));
  }

  // Create this app's profile row for the new auth user. onConflictDoNothing
  // covers re-submitting the form for an email that already has one.
  try {
    await db()
      .insert(users)
      .values({ id: data.user.id, name, email })
      .onConflictDoNothing({ target: users.id });
  } catch (err) {
    // 23503 = foreign_key_violation. users.id references auth.users(id), so
    // this specific failure means the account signUp() just created doesn't
    // exist in the auth schema DATABASE_URL is pointed at — i.e.
    // NEXT_PUBLIC_SUPABASE_URL/ANON_KEY and DATABASE_URL are configured
    // against two different Supabase projects. Surface that plainly instead
    // of an opaque 500, since it's an env misconfiguration, not a user error.
    if ((err as { code?: string })?.code === "23503") {
      // Include which Supabase project auth is actually pointed at (the ref
      // is the URL's subdomain) so this is diagnosable from the error page
      // alone, without cross-referencing Vercel env vars against Supabase
      // projects by hand every time this happens.
      const authRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/^https:\/\/([^.]+)\./)?.[1] ?? "unknown";
      redirect(
        "/register?error=" +
          encodeURIComponent(
            `Registration is misconfigured on this deployment: NEXT_PUBLIC_SUPABASE_URL (project "${authRef}") and DATABASE_URL point at different Supabase projects. Please let the site admin know.`
          )
      );
    }
    throw err;
  }

  // If email confirmation is off in this Supabase project, signUp already
  // returns a live session — skip straight in instead of asking to verify.
  // The OCEAN test is mandatory before anything else, so send them there.
  if (data.session) {
    redirect("/ocean-test?required=1");
  }

  redirect(`/verify-email?email=${encodeURIComponent(email)}`);
}
