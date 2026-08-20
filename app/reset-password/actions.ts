"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBaseUrl } from "@/lib/url";

export async function requestResetAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (email) {
    const supabase = await createClient();
    const baseUrl = await getBaseUrl();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${baseUrl}/auth/confirm?next=/reset-password/update`,
    });
  }

  // Always land on the same "check your inbox" page whether or not the
  // address has an account — avoids leaking which emails are registered.
  redirect("/reset-password/sent");
}

export async function updatePasswordAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (!password || !confirmPassword) {
    redirect("/reset-password/update?error=missing");
  }
  if (password !== confirmPassword) {
    redirect("/reset-password/update?error=nomatch");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect(`/reset-password/update?error=${encodeURIComponent(error.message)}`);
  }

  await supabase.auth.signOut();
  redirect("/login?success=password_reset");
}
