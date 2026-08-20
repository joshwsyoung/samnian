import { redirect } from "next/navigation";
import { resendVerificationAction } from "./actions";
import "../design-system.css";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; success?: string }>;
}) {
  const { email, success } = await searchParams;

  if (!email) redirect("/register");

  return (
    <div className="sm-scope sm-auth-shell">
      <div className="sm-page-head">
        <div className="sm-greeting">Check your email</div>
      </div>

      {success === "resent" && (
        <div className="sm-flash success">
          Verification email resent to <strong>{email}</strong>.
        </div>
      )}

      <div className="sm-card" style={{ textAlign: "center" }}>
        <p style={{ color: "var(--sm-text-muted)", marginBottom: 16 }}>
          We&rsquo;ve sent a confirmation link to <strong style={{ color: "var(--sm-text)" }}>{email}</strong>.
          Click it to verify your account and finish signing in.
        </p>
        <form action={resendVerificationAction}>
          <input type="hidden" name="email" value={email} />
          <button type="submit" className="sm-btn-link">Resend the email</button>
        </form>
      </div>
    </div>
  );
}
