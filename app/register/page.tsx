import Link from "next/link";
import AuthTabs from "@/components/AuthTabs";
import { safeNextPath } from "@/lib/auth";
import "../design-system.css";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; src?: string; next?: string }>;
}) {
  const { error, src, next: rawNext } = await searchParams;
  const next = safeNextPath(rawNext, "");

  return (
    <div className="sm-scope sm-auth-shell">
      <div className="sm-page-head">
        <div className="sm-greeting">Join Samnian</div>
        <div className="sm-sub">Takes about 2 minutes.</div>
      </div>

      {error === "missing_fields" && <div className="sm-flash error">Please fill in all fields.</div>}
      {error && error !== "missing_fields" && (
        <div className="sm-flash error">
          {error}
          {error.toLowerCase().includes("registered") && (
            <>
              {" "}Please <Link href={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`}>log in</Link> instead.
            </>
          )}
        </div>
      )}

      <AuthTabs defaultTab="register" next={next || undefined} ticketSrc={src === "ticket"} />
    </div>
  );
}
