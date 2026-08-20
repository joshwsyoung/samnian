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
    options: { emailRedirectTo: `${baseUrl}/auth/confirm?next=/dashboard` },
  });

  if (error || !data.user) {
    redirect("/register?error=" + encodeURIComponent(error?.message ?? "Something went wrong."));
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
      redirect(
        "/register?error=" +
          encodeURIComponent(
            "Registration is misconfigured on this deployment (auth and database aren't pointing at the same Supabase project). Please let the site admin know."
          )
      );
    }
    throw err;
  }

  // If email confirmation is off in this Supabase project, signUp already
  // returns a live session — skip straight in instead of asking to verify.
  if (data.session) {
    redirect("/dashboard");
  }

  redirect(`/verify-email?email=${encodeURIComponent(email)}`);
}
