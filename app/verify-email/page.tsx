import { redirect } from "next/navigation";
import { resendVerificationAction } from "./actions";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; success?: string }>;
}) {
  const { email, success } = await searchParams;

  if (!email) redirect("/register");

  return (
    <div className="container mt-5 mb-4">
      <h2 className="display-6 mb-3">Check your email</h2>

      {success === "resent" && (
        <div className="alert alert-success">
          Verification email resent to <strong>{email}</strong>.
        </div>
      )}

      <p>
        We&rsquo;ve sent a confirmation link to <strong>{email}</strong>. Click it to verify your
        account and finish signing in.
      </p>

      <form action={resendVerificationAction} className="mt-3">
        <input type="hidden" name="email" value={email} />
        <button type="submit" className="btn btn-link ps-0">Resend the email</button>
      </form>
    </div>
  );
}
