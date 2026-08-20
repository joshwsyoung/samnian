import Link from "next/link";
import PasswordInput from "@/components/PasswordInput";
import { loginAction } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { error, success } = await searchParams;

  return (
    <div className="container mt-5 mb-4">
      <h2 className="display-6 mb-3">User Login</h2>

      {error === "invalid_credentials" && (
        <div className="alert alert-danger">
          Invalid email or password. <Link href="/reset-password/request">Forgot your password?</Link>
        </div>
      )}
      {error && error !== "invalid_credentials" && <div className="alert alert-danger">{error}</div>}

      {success === "password_reset" && <div className="alert alert-success">Password reset successful! You can now log in.</div>}

      <form action={loginAction} className="mt-4">
        <div className="mb-3">
          <label className="form-label">Email</label>
          <input type="email" name="email" className="form-control" required />
        </div>

        <PasswordInput name="password" label="Password" />

        <button type="submit" className="btn">Log In</button>
      </form>
    </div>
  );
}
