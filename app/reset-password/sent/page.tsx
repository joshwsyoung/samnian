import Link from "next/link";
import "../../design-system.css";

export default function ResetSentPage() {
  return (
    <div className="sm-scope sm-auth-shell">
      <div className="sm-page-head">
        <div className="sm-greeting">Check your inbox</div>
      </div>

      <div className="sm-card" style={{ textAlign: "center" }}>
        <p style={{ color: "var(--sm-text-muted)", marginBottom: 18 }}>
          If that email is associated with an account, we&rsquo;ve sent a reset link. Please check your inbox.
        </p>
        <Link href="/login" className="sm-btn sm-btn-primary">Back to login</Link>
      </div>
    </div>
  );
}
