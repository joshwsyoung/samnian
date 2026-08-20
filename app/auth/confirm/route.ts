import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Landing point for the links Supabase Auth emails out — signup
 * confirmation and password-recovery both arrive here with a token_hash
 * to verify before the destination page can trust there's a session.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/dashboard";

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      redirect(next);
    }
    redirect(`/login?error=${encodeURIComponent("That link is invalid or has expired.")}`);
  }

  redirect(`/login?error=${encodeURIComponent("That link is invalid or has expired.")}`);
}
