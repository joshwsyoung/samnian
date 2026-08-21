import Link from "next/link";
import PasswordInput from "@/components/PasswordInput";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import { loginAction } from "./actions";
import "../design-system.css";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { error, success } = await searchParams;

  return (
    <div className="sm-scope sm-auth-shell">
      <div className="sm-page-head">
        <div className="sm-greeting">Welcome back</div>
        <div className="sm-sub">Log in to see your table.</div>
      </div>

      {error === "invalid_credentials" && (
        <div className="sm-flash error">
          Invalid email or password. <Link href="/reset-password/request">Forgot your password?</Link>
        </div>
      )}
      {error && error !== "invalid_credentials" && <div className="sm-flash error">{error}</div>}
      {success === "password_reset" && (
        <div className="sm-flash success">Password reset successful! You can now log in.</div>
      )}

      <GoogleSignInButton />

      <div className="sm-auth-divider"><span>or</span></div>

      <form action={loginAction} className="sm-card">
        <div className="sm-field-stack">
          <div className="sm-field">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" name="email" className="sm-input" autoComplete="username" required />
          </div>
          <PasswordInput name="password" label="Password" enforcePattern={false} autoComplete="current-password" />
        </div>
        <button type="submit" className="sm-btn sm-btn-primary" style={{ width: "100%" }}>Log in</button>
      </form>

      <p className="sm-auth-note">
        New here? <Link href="/register">Create an account</Link>
      </p>
    </div>
  );
}
