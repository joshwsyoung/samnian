import Link from "next/link";
import PasswordInput from "@/components/PasswordInput";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import { registerAction } from "./actions";
import "../design-system.css";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; src?: string }>;
}) {
  const { error, src } = await searchParams;

  return (
    <div className="sm-scope sm-auth-shell">
      <div className="sm-page-head">
        <div className="sm-greeting">Join Samnian</div>
        <div className="sm-sub">Takes about 2 minutes.</div>
      </div>

      {src === "ticket" && (
        <div className="sm-flash info">
          🎟️ Scanned our ticket? Nice one — let&rsquo;s get you signed up.
        </div>
      )}

      {error === "missing_fields" && <div className="sm-flash error">Please fill in all fields.</div>}
      {error && error !== "missing_fields" && (
        <div className="sm-flash error">
          {error}
          {error.toLowerCase().includes("registered") && (
            <>
              {" "}Please <Link href="/login">log in</Link> instead.
            </>
          )}
        </div>
      )}

      <GoogleSignInButton />

      <div className="sm-auth-divider"><span>or</span></div>

      <form action={registerAction} className="sm-card">
        <div className="sm-field-stack">
          <div className="sm-field">
            <label htmlFor="name">Name</label>
            <input type="text" id="name" name="name" className="sm-input" required />
          </div>
          <div className="sm-field">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" name="email" className="sm-input" autoComplete="username" required />
          </div>
          <PasswordInput name="password" label="Password" autoComplete="new-password" />
        </div>
        <button type="submit" className="sm-btn sm-btn-primary" style={{ width: "100%" }}>Register</button>
      </form>

      <p className="sm-auth-note">
        Already have an account? <Link href="/login">Log in</Link>
      </p>
    </div>
  );
}
