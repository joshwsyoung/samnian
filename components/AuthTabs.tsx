"use client";

import { useState } from "react";
import Link from "next/link";
import PasswordInput from "@/components/PasswordInput";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import { loginAction } from "@/app/login/actions";
import { registerAction } from "@/app/register/actions";

/**
 * One auth page, two tabs — replaces separate /login and /register designs
 * with a single toggle (defaults to Log in, since Google handles "new or
 * existing" for itself). Both routes still exist and both render this,
 * just with a different `defaultTab`, so a direct link to /register (e.g.
 * the printable ticket's QR code) still opens straight onto that tab.
 */
export default function AuthTabs({
  defaultTab,
  next,
  ticketSrc,
}: {
  defaultTab: "login" | "register";
  next?: string;
  ticketSrc?: boolean;
}) {
  const [tab, setTab] = useState(defaultTab);

  return (
    <>
      {ticketSrc && (
        <div className="sm-flash info">🎟️ Scanned our ticket? Nice one — let&rsquo;s get you signed up.</div>
      )}

      <div className="sm-auth-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === "login"} className={tab === "login" ? "active" : ""} onClick={() => setTab("login")}>
          Log in
        </button>
        <button type="button" role="tab" aria-selected={tab === "register"} className={tab === "register" ? "active" : ""} onClick={() => setTab("register")}>
          Register
        </button>
      </div>

      <GoogleSignInButton next={next} />

      <div className="sm-auth-divider"><span>or</span></div>

      {tab === "login" ? (
        <form action={loginAction} className="sm-card">
          {next && <input type="hidden" name="next" value={next} />}
          <div className="sm-field-stack">
            <div className="sm-field">
              <label htmlFor="login-email">Email</label>
              <input type="email" id="login-email" name="email" className="sm-input" autoComplete="username" required />
            </div>
            <PasswordInput name="password" label="Password" enforcePattern={false} autoComplete="current-password" />
          </div>
          <button type="submit" className="sm-btn sm-btn-primary" style={{ width: "100%" }}>Log in</button>
          <p className="sm-auth-note" style={{ marginTop: 12 }}>
            <Link href={`/reset-password/request${next ? `?next=${encodeURIComponent(next)}` : ""}`}>Forgot your password?</Link>
          </p>
        </form>
      ) : (
        <form action={registerAction} className="sm-card">
          {next && <input type="hidden" name="next" value={next} />}
          <div className="sm-field-stack">
            <div className="sm-field">
              <label htmlFor="register-name">Name</label>
              <input type="text" id="register-name" name="name" className="sm-input" required />
            </div>
            <div className="sm-field">
              <label htmlFor="register-email">Email</label>
              <input type="email" id="register-email" name="email" className="sm-input" autoComplete="username" required />
            </div>
            <PasswordInput name="password" label="Password" autoComplete="new-password" />
          </div>
          <button type="submit" className="sm-btn sm-btn-primary" style={{ width: "100%" }}>Register</button>
        </form>
      )}
    </>
  );
}
