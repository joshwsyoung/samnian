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
  await db()
    .insert(users)
    .values({ id: data.user.id, name, email })
    .onConflictDoNothing({ target: users.id });

  // If email confirmation is off in this Supabase project, signUp already
  // returns a live session — skip straight in instead of asking to verify.
  if (data.session) {
    redirect("/dashboard");
  }

  redirect(`/verify-email?email=${encodeURIComponent(email)}`);
}
