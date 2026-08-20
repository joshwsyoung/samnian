import Link from "next/link";
import PasswordInput from "@/components/PasswordInput";
import { registerAction } from "./actions";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="container mt-5">
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

      <form action={registerAction}>
        <div className="mb-3">
          <label htmlFor="name" className="form-label">Name</label>
          <input type="text" className="form-control" id="name" name="name" required />
        </div>

        <div className="mb-3">
          <label htmlFor="email" className="form-label">Email</label>
          <input type="email" className="form-control" id="email" name="email" required />
        </div>

        <PasswordInput name="password" label="Password" autoComplete="new-password" />

        <button type="submit" className="btn">Register</button>
      </form>
    </div>
  );
}
