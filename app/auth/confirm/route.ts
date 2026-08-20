import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const MALFORMED_LINK_ERROR = "That link is invalid or has expired.";
// Shown when the token itself is rejected (as opposed to missing entirely).
// The overwhelmingly common cause isn't a genuinely dead link — it's Gmail/
// Outlook/corporate email security automatically fetching the link to scan
// it for phishing, seconds after it's sent, which consumes the one-time
// token before the recipient ever clicks. The account is almost always
// already confirmed by that same automatic visit, so point at logging in
// rather than implying signup failed.
const TOKEN_REJECTED_ERROR =
  "That link has already been used or has expired. If you just signed up, your account is likely already confirmed — try logging in.";

function escapeAttr(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Landing point for the links Supabase Auth emails out — signup
 * confirmation and password-recovery both arrive here with a token_hash
 * to verify before the destination page can trust there's a session.
 *
 * GET deliberately does NOT verify the token. Automated link scanners
 * (Gmail, Outlook Safe Links, corporate email security gateways) fetch
 * every link in an email to check it for phishing, which — for a
 * single-use token — silently consumes it before the real person ever
 * clicks, leaving them with "invalid or expired" on their first genuine
 * attempt. GET instead renders a page that requires an actual click;
 * only the POST that click submits calls verifyOtp().
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/events";

  if (!tokenHash || !type) {
    redirect(`/login?error=${encodeURIComponent(MALFORMED_LINK_ERROR)}`);
  }

  const isRecovery = type === "recovery";
  const heading = isRecovery ? "Reset your password" : "Confirm your email";
  const buttonLabel = isRecovery ? "Continue to reset password" : "Confirm email";

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${heading} · Samnian</title>
<style>
  body { font-family: system-ui, -apple-system, sans-serif; background: #f8f9fa; margin: 0; padding: 3rem 1rem; }
  .card { max-width: 420px; margin: 0 auto; background: #fff; border-radius: 8px; padding: 2rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); text-align: center; }
  h1 { font-size: 1.4rem; margin-bottom: 0.5rem; }
  p { color: #555; margin-bottom: 1.5rem; }
  button { background: #198754; color: #fff; border: none; border-radius: 6px; padding: 0.75rem 1.5rem; font-size: 1rem; cursor: pointer; }
  button:hover { background: #157347; }
</style>
</head>
<body>
  <div class="card">
    <h1>${heading}</h1>
    <p>For your security this can&rsquo;t complete automatically — click below to continue.</p>
    <form method="POST">
      <input type="hidden" name="token_hash" value="${escapeAttr(tokenHash)}">
      <input type="hidden" name="type" value="${escapeAttr(type)}">
      <input type="hidden" name="next" value="${escapeAttr(next)}">
      <button type="submit">${buttonLabel}</button>
    </form>
  </div>
</body>
</html>`;

  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const tokenHash = String(formData.get("token_hash") ?? "");
  const type = formData.get("type") as EmailOtpType | null;
  const next = String(formData.get("next") ?? "/events");

  if (!tokenHash || !type) {
    redirect(`/login?error=${encodeURIComponent(MALFORMED_LINK_ERROR)}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
  if (!error) {
    redirect(next);
  }
  redirect(`/login?error=${encodeURIComponent(TOKEN_REJECTED_ERROR)}`);
}
