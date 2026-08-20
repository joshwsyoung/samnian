import Link from "next/link";
import { and, eq, gte } from "drizzle-orm";
import { db } from "@/lib/db";
import { availability, conversations, matches, matchUsers, personalityScores, users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { firstNameFrom, getGreeting } from "@/lib/greeting";
import { SLOTS } from "@/lib/constants";
import EditPanel from "@/components/dash/EditPanel";
import OceanSparkline from "@/components/dash/OceanSparkline";
import ThemeSwitch from "@/components/dash/ThemeSwitch";
import { updateAvailabilityAction, updatePreferencesAction, updatePricePointAction } from "./actions";
import "./dashboard.css";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const session = await requireUser();
  const { success, error } = await searchParams;
  const userId = session.id;

  const [user] = await db().select().from(users).where(eq(users.id, userId)).limit(1);
  const [userAvailability] = await db().select().from(availability).where(eq(availability.userId, userId)).limit(1);
  const [scores] = await db().select().from(personalityScores).where(eq(personalityScores.userId, userId)).limit(1);

  const [myMatchLink] = await db().select().from(matchUsers).where(eq(matchUsers.userId, userId)).limit(1);
  const myMatch = myMatchLink
    ? (await db().select().from(matches).where(eq(matches.id, myMatchLink.matchId)).limit(1))[0]
    : undefined;
  const [myConversation] = myMatch
    ? await db().select().from(conversations).where(eq(conversations.matchId, myMatch.id)).limit(1)
    : [];

  const today = new Date().toISOString().slice(0, 10);
  const upcomingMatches = myMatch
    ? []
    : (
        await db()
          .select()
          .from(matches)
          .where(and(gte(matches.eventDate, today), eq(matches.approved, true)))
      ).sort((a, b) => a.eventDate.localeCompare(b.eventDate) || SLOTS.indexOf(a.slot) - SLOTS.indexOf(b.slot));

  const greeting = `${getGreeting()}${firstNameFrom(user?.name)}.`;
  const status: "matched" | "pending" | "unset" = myMatch ? "matched" : userAvailability ? "pending" : "unset";

  return (
    <div className="sm-dash container mt-3">
      <div className="sm-page-head">
        <div className="sm-greeting">{greeting}</div>
        <div className="sm-sub">
          {userAvailability
            ? `Wednesday, ${formatDate(userAvailability.eventDate)}`
            : "Let's find your next table."}
        </div>
      </div>

      {success && <div className="sm-flash success">{success}</div>}
      {error && <div className="sm-flash error">{error}</div>}

      <div className="sm-stack">
        {/* HERO STATUS CARD */}
        <section className="sm-card sm-hero">
          {status === "unset" && (
            <>
              <span className="sm-status-pill unset"><span className="sm-dot" />Not set yet</span>
              <h2>You haven&rsquo;t set a Wednesday.</h2>
              <p className="sm-hero-meta">
                Tell us when you&rsquo;re free and we&rsquo;ll match you with a table once a session opens up.
              </p>
              <div className="sm-actions">
                <EditPanel triggerLabel="Set your availability" action={updateAvailabilityAction}>
                  <AvailabilityFields />
                </EditPanel>
              </div>
            </>
          )}

          {status === "pending" && userAvailability && (
            <>
              <span className="sm-status-pill pending"><span className="sm-dot" />Awaiting a match</span>
              <h2>You&rsquo;re free {formatDate(userAvailability.eventDate)}, {userAvailability.slot}.</h2>
              <p className="sm-hero-meta">
                {upcomingMatches.length > 0
                  ? `${upcomingMatches.length} session${upcomingMatches.length === 1 ? "" : "s"} open right now — pick the one you'd like.`
                  : "No sessions are open yet. Check back once one is."}
              </p>
              <div className="sm-fact-row">
                <div className="sm-fact"><dt>Price point</dt><dd>{user?.priceLevel ?? "—"}</dd></div>
                {user?.city && <div className="sm-fact"><dt>City</dt><dd>{user.city}</dd></div>}
              </div>
              <div className="sm-actions">
                {upcomingMatches.length > 0 && (
                  <EditPanel triggerLabel="Choose your session" action={updatePreferencesAction}>
                    <SessionFields matches={upcomingMatches} />
                  </EditPanel>
                )}
                <EditPanel
                  triggerLabel="Change availability"
                  triggerClassName="sm-btn-link"
                  action={updateAvailabilityAction}
                >
                  <AvailabilityFields defaultDate={userAvailability.eventDate} defaultSlot={userAvailability.slot} />
                </EditPanel>
              </div>
            </>
          )}

          {status === "matched" && myMatch && (
            <>
              <span className="sm-status-pill matched"><span className="sm-dot" />Table confirmed</span>
              <h2>You&rsquo;re booked for {formatDate(myMatch.eventDate)}.</h2>
              <p className="sm-hero-meta">{myMatch.slot} · {myMatch.priceLevel}</p>
              <div className="sm-fact-row">
                <div className="sm-fact"><dt>Time</dt><dd>{myMatch.slot}</dd></div>
                <div className="sm-fact"><dt>Price point</dt><dd>{myMatch.priceLevel}</dd></div>
              </div>
              <div className="sm-actions">
                <Link
                  className="sm-btn sm-btn-primary"
                  href={myConversation ? `/messages?conversation_id=${myConversation.id}` : "/messages"}
                >
                  Open chat with your table
                </Link>
              </div>
            </>
          )}
        </section>

        {/* QUICK FACTS */}
        <div className="sm-quick-row">
          <section className="sm-card sm-quick-card">
            <h3>Price point</h3>
            <form action={updatePricePointAction}>
              <div className="sm-price-chip-group" role="group" aria-label="Price point">
                {(["£", "££", "£££"] as const).map((level) => (
                  <button
                    key={level}
                    type="submit"
                    name="price_point"
                    value={level}
                    aria-pressed={user?.priceLevel === level}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </form>
            <p className="sm-price-note">Tap to change — saves instantly, no confirm step.</p>
          </section>

          <section className="sm-card sm-quick-card">
            <h3>Personality profile</h3>
            {scores ? (
              <div className="sm-ocean-row">
                <OceanSparkline scores={scores} />
                <div className="sm-ocean-copy">
                  <strong>Complete</strong>
                  Matched using your OCEAN results.
                  <div style={{ marginTop: 6 }}>
                    <Link className="sm-btn-link" href="/profile">View full profile →</Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="sm-ocean-copy">
                <strong style={{ color: "var(--sm-text)" }}>Not taken yet</strong>
                We use it to match you with people you&rsquo;ll get on with.
                <div style={{ marginTop: 10 }}>
                  <Link className="sm-btn sm-btn-primary" href="/ocean-test">Take the 2-minute quiz</Link>
                </div>
              </div>
            )}
          </section>
        </div>

        <ThemeSwitch currentTheme={user?.theme ?? "light"} />
      </div>
    </div>
  );
}

function AvailabilityFields({ defaultDate, defaultSlot }: { defaultDate?: string; defaultSlot?: string }) {
  return (
    <div className="sm-field-row">
      <div className="sm-field">
        <label htmlFor="event_date">Wednesday</label>
        <input type="date" id="event_date" name="event_date" defaultValue={defaultDate} required />
      </div>
      <div className="sm-field">
        <label>Time</label>
        <div className="sm-chip-group" role="group" aria-label="Time slot">
          {SLOTS.map((s) => (
            <label key={s} className="sm-chip-radio">
              <input type="radio" name="slot" value={s} defaultChecked={s === defaultSlot} required />
              <span>{s}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

function SessionFields({ matches: upcomingMatches }: { matches: (typeof matches.$inferSelect)[] }) {
  return (
    <div className="sm-field">
      <label>Open sessions</label>
      <div className="sm-chip-group" style={{ marginTop: 8 }}>
        {upcomingMatches.map((m, i) => (
          <label key={m.id} className="sm-chip-radio">
            <input type="radio" name="match_id" value={m.id} defaultChecked={i === 0} required />
            <span>{formatDate(m.eventDate)} · {m.slot} · {m.priceLevel}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function formatDate(isoDate: string) {
  const d = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long" });
}
