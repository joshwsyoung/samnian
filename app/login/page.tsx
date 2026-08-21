import AuthTabs from "@/components/AuthTabs";
import { safeNextPath } from "@/lib/auth";
import "../design-system.css";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string; next?: string }>;
}) {
  const { error, success, next: rawNext } = await searchParams;
  const next = safeNextPath(rawNext, "");

  return (
    <div className="sm-scope sm-auth-shell">
      <div className="sm-page-head">
        <div className="sm-greeting">Welcome back</div>
        <div className="sm-sub">Log in or register — one button either way.</div>
      </div>

      {error === "invalid_credentials" && <div className="sm-flash error">Invalid email or password.</div>}
      {error && error !== "invalid_credentials" && <div className="sm-flash error">{error}</div>}
      {success === "password_reset" && (
        <div className="sm-flash success">Password reset successful! You can now log in.</div>
      )}

      <AuthTabs defaultTab="login" next={next || undefined} />
    </div>
  );
}
