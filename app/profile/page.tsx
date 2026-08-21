import Image from "next/image";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { conversations, events, eventInterest, groupMembers, groups, interests, personalityScores, userInterests, users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { firstNameFrom, getGreeting } from "@/lib/greeting";
import { CITIES, priceTierLabel } from "@/lib/constants";
import { formatEventDate, formatSlot } from "@/lib/format";
import EditPanel from "@/components/dash/EditPanel";
import InterestChipPicker from "@/components/dash/InterestChipPicker";
import ConfirmButton from "@/components/ConfirmButton";
import OceanChart from "@/components/OceanChart";
import {
  deleteAccountAction,
  updateEmailAction,
  updateInterestsAction,
  updatePasswordAction,
  updateProfileAction,
} from "./actions";
import "../design-system.css";

export const dynamic = "force-dynamic";

// One screen: Profile (who you are) → Personality → Activity (what you're
// up to) → Settings (account-level stuff), in that order, each section
// tight enough that the whole thing reads as one page, not six.
export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const session = await requireUser();
  const { success, error } = await searchParams;
  const userId = session.id;

  const [user] = await db().select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) {
    return (
      <div className="sm-scope container mt-3">
        <div className="sm-flash error">User not found.</div>
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

  const myEvents = await db()
    .select({
      eventId: events.id,
      title: events.title,
      restaurantName: events.restaurantName,
      eventDate: events.eventDate,
      slot: events.slot,
      priceTier: eventInterest.priceTier,
    })
    .from(eventInterest)
    .innerJoin(events, eq(eventInterest.eventId, events.id))
    .where(eq(eventInterest.userId, userId));

  const [myGroupRow] = await db()
    .select({ groupId: groupMembers.groupId })
    .from(groupMembers)
    .where(eq(groupMembers.userId, userId))
    .limit(1);
  const myTable = myGroupRow
    ? (
        await db()
          .select({ eventId: groups.eventId, title: events.title, eventDate: events.eventDate, slot: events.slot })
          .from(groups)
          .innerJoin(events, eq(groups.eventId, events.id))
          .where(eq(groups.id, myGroupRow.groupId))
          .limit(1)
      )[0]
    : undefined;
  const [myConversation] = myGroupRow
    ? await db().select({ id: conversations.id }).from(conversations).where(eq(conversations.groupId, myGroupRow.groupId)).limit(1)
    : [];

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

  return (
    <div className="sm-scope container mt-3 mb-5">
      <div className="sm-page-head">
        <div className="sm-greeting">{greeting}</div>
        <div className="sm-sub">Everything about your account, in one place.</div>
      </div>

      {success && <div className="sm-flash success">{success}</div>}
      {error && <div className="sm-flash error">{error}</div>}

      <div className="sm-stack">
        {/* 1. PROFILE */}
        <section className="sm-card">
          <span className={`sm-status-pill ${profileComplete ? "matched" : "unset"}`}>
            <span className="sm-dot" />
            {profileComplete ? "Profile complete" : "Profile incomplete"}
          </span>

          <div className="sm-identity">
            {user.profileImage ? (
              <Image src={user.profileImage} width={72} height={72} className="sm-avatar" alt="Profile" />
            ) : (
              <div className="sm-avatar-fallback">{initials || "?"}</div>
            )}
            <div>
              <div className="sm-identity-name">{user.name}</div>
              <div className="sm-price-note" style={{ margin: 0 }}>{user.email}</div>
            </div>
          </div>

          <div className="sm-fact-row" style={{ marginTop: 18, marginBottom: 14 }}>
            <div className="sm-fact"><dt>Phone</dt><dd>{user.phone || "—"}</dd></div>
            <div className="sm-fact"><dt>Age</dt><dd>{user.age ?? "—"}</dd></div>
            <div className="sm-fact"><dt>City</dt><dd>{user.city || "—"}</dd></div>
          </div>

          {selectedInterestNames.length > 0 ? (
            <div className="sm-tag-row" style={{ marginBottom: 14 }}>
              {selectedInterestNames.map((name) => (
                <span key={name} className="sm-tag">{name}</span>
              ))}
            </div>
          ) : (
            <p className="sm-price-note" style={{ marginTop: 0 }}>You haven&rsquo;t picked any interests yet.</p>
          )}

          <div className="sm-actions">
            <EditPanel
              triggerLabel={profileComplete ? "Edit details" : "Complete your profile"}
              action={updateProfileAction}
              encType="multipart/form-data"
            >
              <ProfileFields user={user} />
            </EditPanel>
            <EditPanel triggerLabel="Edit interests" triggerClassName="sm-btn-link" action={updateInterestsAction}>
              <InterestChipPicker
                interests={allInterests}
                defaultSelected={selectedInterestNames}
                fieldName="selected_interests"
              />
            </EditPanel>
          </div>
        </section>

        {/* 2. PERSONALITY */}
        <section className="sm-card">
          <h3 style={{ fontSize: "0.95rem", marginBottom: 12 }}>Personality profile</h3>
          {scores ? (
            <>
              <OceanChart scores={scores} />
              <details className="sm-details" style={{ marginTop: 14 }}>
                <summary>What do these traits mean?</summary>
                <div className="sm-details-body">
                  <p><strong>Openness</strong> — High: curious, imaginative, open to new experiences. Low: practical, prefers routine.</p>
                  <p><strong>Conscientiousness</strong> — High: organized, reliable, plans ahead. Low: spontaneous, disorganized.</p>
                  <p><strong>Extraversion</strong> — High: outgoing, energetic, enjoys social settings. Low: reserved, prefers solitude.</p>
                  <p><strong>Agreeableness</strong> — High: compassionate, cooperative, trusting. Low: competitive, skeptical.</p>
                  <p><strong>Neuroticism</strong> — High: emotionally reactive, prone to stress. Low: calm, resilient.</p>
                  <p>0 = Low, 5 = High.</p>
                </div>
              </details>
            </>
          ) : (
            <>
              <p className="sm-price-note" style={{ marginTop: 0 }}>Personality scores not available yet.</p>
              <Link className="sm-btn sm-btn-primary" href="/ocean-test">Take the 2-minute quiz</Link>
            </>
          )}
        </section>

        {/* 3. ACTIVITY */}
        <section className="sm-card">
          <h3 style={{ fontSize: "0.95rem", marginBottom: 12 }}>Activity</h3>

          {myTable ? (
            <div className="sm-fact-row" style={{ marginBottom: 14 }}>
              <div className="sm-fact"><dt>Your table</dt><dd>{myTable.title}</dd></div>
              <div className="sm-fact"><dt>Date</dt><dd>{formatEventDate(myTable.eventDate)}</dd></div>
              <div className="sm-fact"><dt>Time</dt><dd>{formatSlot(myTable.slot)}</dd></div>
            </div>
          ) : myEvents.length > 0 ? (
            <p className="sm-price-note" style={{ marginTop: 0 }}>
              Down for {myEvents.length} event{myEvents.length === 1 ? "" : "s"} — waiting to be placed at a table.
            </p>
          ) : (
            <p className="sm-price-note" style={{ marginTop: 0 }}>You&rsquo;re not down for anything yet.</p>
          )}

          {myEvents.length > 0 && (
            <ul className="sm-link-list" style={{ marginBottom: 14 }}>
              {myEvents.map((e) => (
                <li key={e.eventId}>
                  <Link href={`/events/${e.eventId}`} className="sm-link-item">
                    {e.title} — {e.restaurantName}
                    <br />
                    <span className="sm-price-note" style={{ margin: 0 }}>
                      {formatEventDate(e.eventDate)} at {formatSlot(e.slot)} · {priceTierLabel(e.priceTier)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <div className="sm-actions">
            <Link className="sm-btn sm-btn-ghost" href="/events">Browse events</Link>
            {myConversation && (
              <Link className="sm-btn sm-btn-primary" href={`/messages?conversation_id=${myConversation.id}`}>
                Open chat with your table
              </Link>
            )}
          </div>
        </section>

        {/* 4. SETTINGS */}
        <section className="sm-card">
          <h3 style={{ fontSize: "0.95rem", marginBottom: 12 }}>Settings</h3>

          <div className="sm-settings-strip">
            <span>Email</span>
            <EditPanel triggerLabel="Change email" triggerClassName="sm-btn-link" action={updateEmailAction}>
              <div className="sm-field">
                <label htmlFor="new-email">New email</label>
                <input type="email" id="new-email" name="email" className="sm-input" defaultValue={user.email} required />
              </div>
            </EditPanel>
          </div>
          <div className="sm-settings-strip">
            <span>Password</span>
            <EditPanel triggerLabel="Change password" triggerClassName="sm-btn-link" action={updatePasswordAction}>
              <div className="sm-field-stack" style={{ marginBottom: 0 }}>
                <div className="sm-field">
                  <label htmlFor="new-password">New password</label>
                  <input type="password" id="new-password" name="password" className="sm-input" autoComplete="new-password" required />
                </div>
                <div className="sm-field">
                  <label htmlFor="confirm-new-password">Confirm new password</label>
                  <input type="password" id="confirm-new-password" name="confirm_password" className="sm-input" autoComplete="new-password" required />
                </div>
              </div>
            </EditPanel>
          </div>

          {session.role === "admin" && (
            <div className="sm-settings-strip">
              <span>Admin</span>
              <Link className="sm-btn-link" href="/admin">Admin dashboard →</Link>
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
        </section>
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
