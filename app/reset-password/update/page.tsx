import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import PasswordInput from "@/components/PasswordInput";
import { updatePasswordAction } from "../actions";
import "../../design-system.css";

export default async function UpdatePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="sm-scope sm-auth-shell">
        <div className="sm-card" style={{ textAlign: "center" }}>
          <span className="sm-status-pill unset" style={{ marginBottom: 12 }}>
            <span className="sm-dot" />Link expired
          </span>
          <h2 style={{ fontSize: "1.2rem", marginBottom: 8 }}>This password reset link is invalid or has expired</h2>
          <p style={{ color: "var(--sm-text-muted)", marginBottom: 18 }}>
            The link you&rsquo;re trying to use is no longer active.
          </p>
          <Link href="/reset-password/request" className="sm-btn sm-btn-primary">Request new reset link</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="sm-scope sm-auth-shell">
      <div className="sm-page-head">
        <div className="sm-greeting">Set a new password</div>
      </div>

      {error === "nomatch" && <div className="sm-flash error">Passwords do not match. Please try again.</div>}
      {error === "missing" && <div className="sm-flash error">Please fill in both password fields.</div>}
      {error && error !== "nomatch" && error !== "missing" && <div className="sm-flash error">{error}</div>}

      <form action={updatePasswordAction} className="sm-card">
        <div className="sm-field-stack">
          <PasswordInput name="password" label="New password" autoComplete="new-password" />
          <PasswordInput name="confirm_password" label="Confirm new password" enforcePattern={false} autoComplete="new-password" />
        </div>
        <button type="submit" className="sm-btn sm-btn-primary" style={{ width: "100%" }}>Reset password</button>
      </form>
    </div>
  );
}
