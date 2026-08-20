import Link from "next/link";
import PasswordInput from "@/components/PasswordInput";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import { registerAction } from "./actions";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; src?: string }>;
}) {
  const { error, src } = await searchParams;

  return (
    <div className="container mt-5">
      {src === "ticket" && (
        <div className="alert ticket-scan-banner">
          🎟️ Scanned our ticket? Nice one — let&rsquo;s get you signed up.
        </div>
      )}

      <h2>Register</h2>

      {error === "missing_fields" && (
        <div className="alert alert-danger">Please fill in all fields.</div>
      )}
      {error && error !== "missing_fields" && (
        <div className="alert alert-danger">
          {error}
          {error.toLowerCase().includes("registered") && (
            <>
              {" "}Please <Link href="/login">log in</Link> instead.
            </>
          )}
        </div>
      )}

      <GoogleSignInButton />

      <div className="auth-divider my-3"><span>or</span></div>

      <form action={registerAction}>
        <div className="mb-3">
          <label htmlFor="name" className="form-label">Name</label>
          <input type="text" className="form-control" id="name" name="name" required />
        </div>

        <div className="mb-3">
          <label htmlFor="email" className="form-label">Email</label>
          <input type="email" className="form-control" id="email" name="email" autoComplete="username" required />
        </div>

        <PasswordInput name="password" label="Password" autoComplete="new-password" />

        <button type="submit" className="btn">Register</button>
      </form>
    </div>
  );
}
