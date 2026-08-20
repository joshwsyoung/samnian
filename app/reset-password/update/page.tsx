import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import PasswordInput from "@/components/PasswordInput";
import { updatePasswordAction } from "../actions";

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
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card border-danger">
              <div className="card-header">
                <h4 className="mb-0">Link Expired</h4>
              </div>
              <div className="card-body text-center">
                <h5 className="mt-3">This password reset link is invalid or has expired</h5>
                <p className="mb-4">The link you&rsquo;re trying to use is no longer active.</p>
                <Link href="/reset-password/request" className="btn btn-primary">Request New Reset Link</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <h2>Reset Your Password</h2>

      {error === "nomatch" && <div className="alert alert-danger">Passwords do not match. Please try again.</div>}
      {error === "missing" && <div className="alert alert-danger">Please fill in both password fields.</div>}
      {error && error !== "nomatch" && error !== "missing" && <div className="alert alert-danger">{error}</div>}

      <form action={updatePasswordAction}>
        <PasswordInput name="password" label="New Password" autoComplete="new-password" />
        <PasswordInput name="confirm_password" label="Confirm New Password" enforcePattern={false} autoComplete="new-password" />
        <button type="submit" className="btn">Reset Password</button>
      </form>
    </div>
  );
}
