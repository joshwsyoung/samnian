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
import { CITIES } from "@/lib/constants";
import ConfirmButton from "@/components/ConfirmButton";
import PasswordInput from "@/components/PasswordInput";
import DashModal from "@/components/dash/DashModal";
import InterestChipPicker from "@/components/dash/InterestChipPicker";
import {
  deleteAccountAction,
  updateEmailAction,
  updateInterestsAction,
  updatePasswordAction,
  updateProfileAction,
} from "./actions";
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
// every visitor sees. Everything /profile used to manage lives here now
// too, behind pop-up modals rather than its own page.
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const session = await requireUser();
  const userId = session.id;
  const { success, error } = await searchParams;

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

  const allInterests = await db().select().from(interests);
  const selectedInterestRows = await db()
    .select({ name: interests.name })
    .from(userInterests)
    .innerJoin(interests, eq(userInterests.interestId, interests.id))
    .where(eq(userInterests.userId, userId));
  const selectedInterestNames = selectedInterestRows.map((r) => r.name);

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

  // Same definition of "complete" /profile used to, so nothing changes
  // meaning by moving here.
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
              Your profile&rsquo;s missing a few details &mdash;{" "}
              <DashModal
                triggerLabel="finish it"
                triggerClassName="ed-dash-inline-trigger"
                title="Edit profile"
                action={updateProfileAction}
                encType="multipart/form-data"
                saveLabel="Save changes"
              >
                <ProfileFields user={user} />
              </DashModal>{" "}
              so we can match your table well.
            </p>
          )}
          {success && <div className="sm-scope sm-flash success" style={{ marginTop: 12, maxWidth: 480 }}>{success}</div>}
          {error && <div className="sm-scope sm-flash error" style={{ marginTop: 12, maxWidth: 480 }}>{error}</div>}
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
                <p className="ed-dash-empty-note">
                  No interests picked yet &mdash;{" "}
                  <DashModal
                    triggerLabel="add some"
                    triggerClassName="ed-dash-inline-trigger"
                    title="Edit interests"
                    action={updateInterestsAction}
                    saveLabel="Save interests"
                  >
                    <InterestChipPicker interests={allInterests} defaultSelected={selectedInterestNames} fieldName="selected_interests" />
                  </DashModal>
                  .
                </p>
              )}

              <hr className="ed-dash-rule" />

              {scores ? (
                <>
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
                  <details className="ed-dash-details">
                    <summary>What do these mean?</summary>
                    <div className="ed-dash-details-body">
                      <p><strong>Openness</strong> — curious and imaginative vs. practical and routine-loving.</p>
                      <p><strong>Conscientiousness</strong> — organized and plans ahead vs. spontaneous and loose.</p>
                      <p><strong>Extraversion</strong> — outgoing and energized by people vs. reserved.</p>
                      <p><strong>Agreeableness</strong> — compassionate and trusting vs. competitive and skeptical.</p>
                      <p><strong>Neuroticism</strong> — emotionally reactive vs. calm and resilient.</p>
                    </div>
                  </details>
                </>
              ) : (
                <div className="ed-dash-quiz-cta">
                  <p>Take the two-minute quiz so we can match your table.</p>
                  <Link href="/ocean-test">Take the quiz &rarr;</Link>
                </div>
              )}
            </div>

            <div className="ed-dash-actions">
              <DashModal
                triggerLabel="Edit profile"
                title="Edit profile"
                action={updateProfileAction}
                encType="multipart/form-data"
                saveLabel="Save changes"
              >
                <ProfileFields user={user} />
              </DashModal>
              <DashModal
                triggerLabel="Edit interests"
                title="Edit interests"
                action={updateInterestsAction}
                saveLabel="Save interests"
              >
                <InterestChipPicker interests={allInterests} defaultSelected={selectedInterestNames} fieldName="selected_interests" />
              </DashModal>
              <DashModal triggerLabel="Account settings" title="Account settings">
                <AccountSettingsFields email={user.email} isAdmin={session.role === "admin"} />
              </DashModal>
            </div>
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

function ProfileFields({ user }: { user: typeof users.$inferSelect }) {
  return (
    <div className="sm-field-row">
      <div className="sm-field">
        <label htmlFor="name">Name</label>
        <input type="text" id="name" name="name" className="sm-input" defaultValue={user.name} required />
      </div>
      <div className="sm-field">
        <label htmlFor="phone">Phone</label>
        <input type="text" id="phone" name="phone" className="sm-input" defaultValue={user.phone ?? ""} required />
      </div>
      <div className="sm-field">
        <label htmlFor="age">Age</label>
        <input type="number" id="age" name="age" className="sm-input" defaultValue={user.age ?? ""} required />
      </div>
      <div className="sm-field">
        <label htmlFor="city">City</label>
        <select id="city" name="city" className="sm-input" defaultValue={user.city ?? ""} required>
          <option value="" disabled>Select city</option>
          {CITIES.map((city) => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>
      </div>
      <div className="sm-field">
        <label htmlFor="profile_image">Photo</label>
        <input type="file" id="profile_image" name="profile_image" className="sm-input" accept="image/*" />
      </div>
    </div>
  );
}

// The "Account settings" modal has no single action of its own — it holds
// three independent forms (email, password, delete) side by side, each
// with its own submit button, plus a plain link out to /admin.
function AccountSettingsFields({ email, isAdmin }: { email: string; isAdmin: boolean }) {
  return (
    <div>
      <form action={updateEmailAction} className="sm-field-row" style={{ alignItems: "flex-end", marginBottom: 4 }}>
        <div className="sm-field" style={{ flex: 1, minWidth: 180 }}>
          <label htmlFor="dash-email">Email</label>
          <input type="email" id="dash-email" name="email" className="sm-input" defaultValue={email} required />
        </div>
        <button type="submit" className="sm-btn sm-btn-primary">Update</button>
      </form>

      <hr style={{ border: 0, borderTop: "1px dashed var(--sm-border)", margin: "18px 0" }} />

      <form action={updatePasswordAction}>
        <div className="sm-field-stack" style={{ marginBottom: 12 }}>
          <PasswordInput name="password" label="New password" autoComplete="new-password" />
          <PasswordInput name="confirm_password" label="Confirm new password" enforcePattern={false} autoComplete="new-password" />
        </div>
        <button type="submit" className="sm-btn sm-btn-primary">Update password</button>
      </form>

      {isAdmin && (
        <div className="sm-settings-strip" style={{ marginTop: 18 }}>
          <span>Admin</span>
          <Link className="sm-btn-link" href="/admin">Admin dashboard &rarr;</Link>
        </div>
      )}

      <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px dashed var(--sm-border)" }}>
        <p className="sm-price-note" style={{ marginTop: 0 }}>Deleting your account removes your profile, RSVPs, and chat history for good.</p>
        <form action={deleteAccountAction}>
          <ConfirmButton
            message="Are you sure you want to delete your account? This cannot be undone."
            className="sm-btn-danger"
          >
            Delete account
          </ConfirmButton>
        </form>
      </div>
    </div>
  );
}
