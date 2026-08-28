import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { claimFounderNumberAction } from "./actions";
import "../editorial.css";

export const dynamic = "force-dynamic";

// Landing point for a printed ticket's QR code (?n=<the number printed on
// it>) — also reachable with no `n` at all via the "Scan my ticket" nav
// link, for anyone claiming/correcting their number by hand. Logged out,
// this is just a "log in to claim it" prompt threading `n` through via
// `next`, same pattern as the OCEAN-test gate uses for RSVPs.
export default async function FounderPage({
  searchParams,
}: {
  searchParams: Promise<{ n?: string; success?: string; error?: string }>;
}) {
  const { n, success, error } = await searchParams;
  const ticketNumber = n && /^\d+$/.test(n) ? Number(n) : undefined;
  const session = await getSession();

  const nextPath = `/founder${ticketNumber ? `?n=${ticketNumber}` : ""}`;

  if (!session) {
    return (
      <div className="ed-scope">
        <div className="ed-wash" />
        <div className="ed-grain" />
        <div className="ed-founder-shell">
          <div className="ed-dash-card" style={{ textAlign: "center" }}>
            {ticketNumber ? (
              <>
                <div className="ed-lang" style={{ marginBottom: 10 }}>You scanned</div>
                <h1 className="ed-founder-number">No. {ticketNumber}</h1>
                <p className="ed-founder-copy">Log in or create an account to claim this as your Founder Member Number.</p>
              </>
            ) : (
              <>
                <h1 style={{ fontSize: "1.5rem", marginBottom: 10 }}>Claim your founder number</h1>
                <p className="ed-founder-copy">Log in to enter the number printed on your ticket.</p>
              </>
            )}
            <div className="ed-founder-actions">
              <Link className="ed-ticket" href={`/login?next=${encodeURIComponent(nextPath)}`}>Log in</Link>
              <Link className="ed-join" href={`/register?next=${encodeURIComponent(nextPath)}`}>Create an account</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const [user] = await db().select().from(users).where(eq(users.id, session.id)).limit(1);
  const alreadyThis = ticketNumber !== undefined && user?.foundersNumber === ticketNumber;

  return (
    <div className="ed-scope">
      <div className="ed-wash" />
      <div className="ed-grain" />
      <div className="ed-founder-shell">
        {success && <div className="sm-scope sm-flash success" style={{ marginBottom: 14 }}>{success}</div>}
        {error && <div className="sm-scope sm-flash error" style={{ marginBottom: 14 }}>{error}</div>}

        <div className="ed-dash-card" style={{ textAlign: "center" }}>
          {ticketNumber !== undefined ? (
            alreadyThis ? (
              <>
                <div className="ed-lang" style={{ marginBottom: 10 }}>Already yours</div>
                <h1 className="ed-founder-number">No. {ticketNumber}</h1>
                <p className="ed-founder-copy">You&rsquo;re already Founder Member #{ticketNumber}, {session.name.split(" ")[0]}.</p>
              </>
            ) : (
              <>
                <div className="ed-lang" style={{ marginBottom: 10 }}>You scanned</div>
                <h1 className="ed-founder-number">No. {ticketNumber}</h1>
                <p className="ed-founder-copy">
                  Claim this as {session.name}&rsquo;s Founder Member Number?
                  {user?.foundersNumber ? ` This replaces your current number, #${user.foundersNumber}.` : ""}
                </p>
                <form action={claimFounderNumberAction}>
                  <input type="hidden" name="number" value={ticketNumber} />
                  <button type="submit" className="ed-ticket">Claim Founder #{ticketNumber}</button>
                </form>
              </>
            )
          ) : (
            <>
              <h1 style={{ fontSize: "1.5rem", marginBottom: 10 }}>
                {user?.foundersNumber ? `You're Founder Member #${user.foundersNumber}` : "Claim your founder number"}
              </h1>
              <p className="ed-founder-copy">
                {user?.foundersNumber
                  ? "Enter a different number to replace it, or leave this page as it is."
                  : "Enter the number printed on your ticket."}
              </p>
              <form action={claimFounderNumberAction} className="ed-founder-form">
                <input
                  type="number"
                  name="number"
                  min={1}
                  step={1}
                  placeholder="e.g. 42"
                  defaultValue={user?.foundersNumber ?? ""}
                  required
                />
                <button type="submit" className="ed-ticket">Save</button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
