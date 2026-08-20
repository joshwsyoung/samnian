"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBaseUrl } from "@/lib/url";

export async function resendVerificationAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) redirect("/register");

  const supabase = await createClient();
  const baseUrl = await getBaseUrl();

  await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${baseUrl}/auth/confirm?next=/ocean-test%3Frequired%3D1` },
  });

  redirect(`/verify-email?email=${encodeURIComponent(email)}&success=resent`);
}
