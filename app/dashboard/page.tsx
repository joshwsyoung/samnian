import Image from "next/image";
import Link from "next/link";
import { and, eq, gte } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  conversations,
  events,
  eventInterest,
  groupMembers,
  groups,
  interests,
  personalityScores,
  userInterests,
  users,
} from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { firstNameFrom, getGreeting } from "@/lib/greeting";
import { formatEventDayMonth, formatSlot } from "@/lib/format";
import "../editorial.css";

export const dynamic = "force-dynamic";

const TRAITS = [
  { key: "openness", label: "Openness" },
  { key: "conscientiousness", label: "Conscient." },
  { key: "extraversion", label: "Extraversion" },
  { key: "agreeableness", label: "Agreeable" },
  { key: "neuroticism", label: "Neuroticism" },
] as const;

// Post-login landing: a member "dossier" (who you are) next to a "table
// plan" (what's next) — replaces the old bare redirect to /events, so
// logging in lands somewhere personal instead of the same public grid
// every visitor sees. /profile is still where every detail gets edited;
// this page is the glanceable summary + edit link into it.
export default async function DashboardPage() {
  const session = await requireUser();
  const userId = session.id;

  const [user] = await db().select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) {
    return (
      <div className="ed-scope">
        <div className="ed-wash" />
        <div className="ed-grain" />
        <div className="ed-band"><p>User not found.</p></div>
      </div>
    );
  }

  const [scores] = await db().select().from(personalityScores).where(eq(personalityScores.userId, userId)).limit(1);

  const selectedInterestNames = (
    await db()
      .select({ name: interests.name })
      .from(userInterests)
      .innerJoin(interests, eq(userInterests.interestId, interests.id))
      .where(eq(userInterests.userId, userId))
  ).map((r) => r.name);

  const today = new Date().toISOString().slice(0, 10);

  // Every table (group) this user has ever been placed at, admin-approved
  // or not — past ones count toward "dinners attended"; future ones mark
  // that event as confirmed ("Going") rather than just RSVP'd, below.
  const myGroupRows = await db()
    .select({
      eventId: groups.eventId,
      eventDate: events.eventDate,
      conversationId: conversations.id,
    })
    .from(groupMembers)
    .innerJoin(groups, eq(groupMembers.groupId, groups.id))
    .innerJoin(events, eq(groups.eventId, events.id))
    .leftJoin(conversations, eq(conversations.groupId, groups.id))
    .where(eq(groupMembers.userId, userId));

  let pastDinnersCount = 0;
  const goingByEvent = new Map<number, { conversationId: number | null }>();
  for (const row of myGroupRows) {
    if (row.eventDate < today) {
      pastDinnersCount += 1;
    } else {
      goingByEvent.set(row.eventId, { conversationId: row.conversationId });
    }
  }

  const interestedEventIds = new Set(
    (
      await db()
        .select({ eventId: eventInterest.eventId })
        .from(eventInterest)
        .where(eq(eventInterest.userId, userId))
    ).map((r) => r.eventId)
  );

  const upcoming = (
    await db()
      .select()
      .from(events)
      .where(and(eq(events.published, true), gte(events.eventDate, today)))
  ).sort((a, b) => a.eventDate.localeCompare(b.eventDate));

  // Same definition of "complete" as /profile uses, so the two pages never
  // disagree about it.
  const requiredFields = [user.name, user.email, user.phone, user.age, user.city, user.profileImage];
  const profileComplete = requiredFields.every((f) => f !== null && f !== undefined && f !== "");

  const greeting = `${getGreeting()}${firstNameFrom(user.name)}.`;
  const initials = (user.name ?? "?")
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const memberSince = user.createdAt.toLocaleDateString("en-GB", { month: "short", year: "numeric" });

  return (
    <div className="ed-scope">
      <div className="ed-wash" />
      <div className="ed-grain" />
      <div className="ed-page" style={{ minHeight: "auto" }}>
        <div className="ed-dash-head">
          <div className="ed-lang">Welcome back</div>
          <h1>{greeting}</h1>
          {!profileComplete && (
            <p className="ed-dash-notice">
              Your profile&rsquo;s missing a few details &mdash; <Link href="/profile">finish it</Link> so we can match your table well.
            </p>
          )}
        </div>

        <div className="ed-dash-grid">
          <aside className="ed-dash-card">
            <div className="ed-dash-top">
              {user.profileImage ? (
                <Image src={user.profileImage} width={64} height={64} className="ed-dash-avatar" alt="" />
              ) : (
                <div className="ed-dash-avatar">{initials || "?"}</div>
              )}
              <div>
                <div className="ed-dash-name">{user.name}</div>
                <div className="ed-dash-loc">{user.city || "Location not set"} &middot; joined {memberSince}</div>
              </div>
            </div>

            <div className="ed-dash-quick">
              {user.age ?? "—"} &middot; {user.city || "—"} &middot; {pastDinnersCount} dinner{pastDinnersCount === 1 ? "" : "s"} attended
            </div>

            <div className="ed-dash-more">
              <hr className="ed-dash-rule" />

              <dl className="ed-dash-facts">
                <div className="ed-dash-frow"><dt>Age</dt><dd>{user.age ?? "—"}</dd></div>
                <div className="ed-dash-frow"><dt>Email</dt><dd>{user.email}</dd></div>
                <div className="ed-dash-frow"><dt>Dinners</dt><dd>{pastDinnersCount} attended</dd></div>
              </dl>

              {selectedInterestNames.length > 0 ? (
                <div className="ed-dash-tags">
                  {selectedInterestNames.map((name) => (
                    <span key={name}>{name}</span>
                  ))}
                </div>
              ) : (
                <p className="ed-dash-empty-note">No interests picked yet &mdash; <Link href="/profile">add some</Link>.</p>
              )}

              <hr className="ed-dash-rule" />

              {scores ? (
                <div className="ed-dash-traits">
                  {TRAITS.map((t) => (
                    <div className="ed-dash-trait-row" key={t.key}>
                      <span>{t.label}</span>
                      <div className="ed-dash-trait-track">
                        <div className="ed-dash-trait-fill" style={{ width: `${(scores[t.key] / 5) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="ed-dash-quiz-cta">
                  <p>Take the two-minute quiz so we can match your table.</p>
                  <Link href="/ocean-test">Take the quiz &rarr;</Link>
                </div>
              )}
            </div>

            <Link className="ed-dash-edit" href="/profile">Edit profile &amp; interests</Link>
          </aside>

          <div>
            <div className="ed-dash-plan-head">
              <h2>Upcoming dinners</h2>
              <span className="ed-dash-plan-aside">
                {upcoming.length} {upcoming.length === 1 ? "dinner" : "dinners"} ahead
              </span>
            </div>

            {upcoming.length === 0 ? (
              <div className="ed-dash-empty">No events on the books yet &mdash; check back soon.</div>
            ) : (
              <>
                {upcoming.map((e) => {
                  const { day, month } = formatEventDayMonth(e.eventDate);
                  const going = goingByEvent.get(e.id);
                  const interested = interestedEventIds.has(e.id);
                  return (
                    <div className="ed-dash-entry" key={e.id}>
                      <div className="ed-dash-entry-num">
                        {day}
                        <small>{month}</small>
                      </div>
                      <div>
                        <Link className="ed-dash-entry-title" href={`/events/${e.id}`}>{e.title}</Link>
                        <div className="ed-dash-entry-sub">{e.restaurantName}</div>
                        <div className="ed-dash-entry-meta">
                          <b>{formatSlot(e.slot)}</b>
                          {e.address && <> &nbsp;&middot;&nbsp; {e.address}</>}
                          {e.cuisine && <> &nbsp;&middot;&nbsp; {e.cuisine}</>}
                        </div>
                      </div>
                      <div className="ed-dash-entry-action">
                        {going ? (
                          <>
                            <span className="ed-dash-pill is-going"><span className="dot" />Going</span>
                            {going.conversationId && (
                              <Link className="ed-dash-chat-link" href={`/messages?conversation_id=${going.conversationId}`}>
                                Open chat &rarr;
                              </Link>
                            )}
                          </>
                        ) : interested ? (
                          <span className="ed-dash-pill"><span className="dot" />You&rsquo;re in</span>
                        ) : (
                          <Link className="ed-dash-rsvp" href={`/events/${e.id}`}>RSVP &rarr;</Link>
                        )}
                      </div>
                    </div>
                  );
                })}

                <div className="ed-dash-plan-foot">
                  <Link href="/events">Browse every upcoming dinner &rarr;</Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
