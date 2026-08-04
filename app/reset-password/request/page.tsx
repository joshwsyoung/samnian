import { requestResetAction } from "../actions";

export default function ResetRequestPage() {
  return (
    <div className="container mt-5">
      <h2>Reset Password</h2>
      <form action={requestResetAction}>
        <div className="mb-3">
          <label htmlFor="email" className="form-label">Email</label>
          <input id="email" className="form-control" type="email" name="email" placeholder="Enter your email" required />
        </div>
        <button className="btn" type="submit">Send Reset Link</button>
      </form>
    </div>
  );
}
