import Link from "next/link";
import { requestResetAction } from "../actions";
import "../../design-system.css";

export default function ResetRequestPage() {
  return (
    <div className="sm-scope sm-auth-shell">
      <div className="sm-page-head">
        <div className="sm-greeting">Reset your password</div>
        <div className="sm-sub">We&rsquo;ll email you a link to set a new one.</div>
      </div>

      <form action={requestResetAction} className="sm-card">
        <div className="sm-field-stack">
          <div className="sm-field">
            <label htmlFor="email">Email</label>
            <input id="email" className="sm-input" type="email" name="email" placeholder="you@example.com" required />
          </div>
        </div>
        <button className="sm-btn sm-btn-primary" type="submit" style={{ width: "100%" }}>Send reset link</button>
      </form>

      <p className="sm-auth-note">
        <Link href="/login">Back to login</Link>
      </p>
    </div>
  );
}
