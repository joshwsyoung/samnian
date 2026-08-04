import { redirect } from "next/navigation";
import CodeInput from "@/components/CodeInput";
import { resendCodeAction, verifyCodeAction } from "./actions";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; error?: string; success?: string }>;
}) {
  const { email, error, success } = await searchParams;

  if (!email) redirect("/register?error=missing_email");

  return (
    <div className="container mt-5 mb-4">
      <h2 className="display-6 mb-3">Email Verification</h2>

      {success === "resent" && (
        <div className="alert alert-success">
          Verification code resent to <strong>{email}</strong>.
        </div>
      )}
      {error === "invalid_code" && <div className="alert alert-danger">That code didn&rsquo;t match. Please try again.</div>}
      {error === "missing" && <div className="alert alert-danger">Please enter the code.</div>}
      {error === "user_not_found" && <div className="alert alert-danger">Something went wrong. Please register again.</div>}

      <p>
        A 4-digit code has been sent to <strong>{email}</strong>. Please enter it below to verify your account.
      </p>

      <form action={verifyCodeAction} className="mt-3">
        <input type="hidden" name="email" value={email} />
        <CodeInput name="code" length={4} />
        <button type="submit" className="btn">Verify</button>
      </form>

      <form action={resendCodeAction} className="d-inline mt-2">
        <input type="hidden" name="email" value={email} />
        <button type="submit" className="btn btn-link ps-0">Resend Code</button>
      </form>
    </div>
  );
}
