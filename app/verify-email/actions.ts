"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBaseUrl } from "@/lib/url";
import { safeNextPath } from "@/lib/auth";

export async function resendVerificationAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) redirect("/register");
  const next = safeNextPath(String(formData.get("next") ?? ""), "");

  const supabase = await createClient();
  const baseUrl = await getBaseUrl();
  const oceanNext = `/ocean-test?required=1${next ? `&next=${encodeURIComponent(next)}` : ""}`;

  await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${baseUrl}/auth/confirm?next=${encodeURIComponent(oceanNext)}` },
  });

  redirect(`/verify-email?email=${encodeURIComponent(email)}&success=resent${next ? `&next=${encodeURIComponent(next)}` : ""}`);
}
