import Link from "next/link";

export default function ResetSentPage() {
  return (
    <div className="container mt-5">
      <h2>Reset Link Sent</h2>
      <p>If that email is associated with an account, we&rsquo;ve sent a reset link. Please check your inbox.</p>
      <Link href="/login" className="btn mt-3">Back to Login</Link>
    </div>
  );
}
