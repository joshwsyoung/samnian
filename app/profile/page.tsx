import Image from "next/image";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { events, eventInterest, groupMembers, groups, interests, personalityScores, userInterests, users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { firstNameFrom, getGreeting } from "@/lib/greeting";
import { CITIES, priceTierLabel } from "@/lib/constants";
import { formatEventDate, formatSlot } from "@/lib/format";
import EditPanel from "@/components/dash/EditPanel";
import InterestChipPicker from "@/components/dash/InterestChipPicker";
import ConfirmButton from "@/components/ConfirmButton";
import OceanChart from "@/components/OceanChart";
import { deleteAccountAction, updateInterestsAction, updateProfileAction } from "./actions";
import "../design-system.css";

export const dynamic = "force-dynamic";

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
    <div className="sm-scope container mt-3">
      <div className="sm-page-head">
        <div className="sm-greeting">{greeting}</div>
        <div className="sm-sub">Here&rsquo;s what we&rsquo;ve got on file for you.</div>
      </div>

      {success && <div className="sm-flash success">{success}</div>}
      {error && <div className="sm-flash error">{error}</div>}

      <div className="sm-stack">
        {/* IDENTITY CARD */}
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
              <div className="sm-actions" style={{ marginTop: 4 }}>
                <Link className="sm-btn-link" href="/messages">Open chats →</Link>
                <Link className="sm-btn-link" href="/events">Browse events →</Link>
              </div>
            </div>
          </div>

          <div className="sm-fact-row" style={{ marginTop: 18 }}>
            <div className="sm-fact"><dt>Email</dt><dd>{user.email}</dd></div>
            <div className="sm-fact"><dt>Phone</dt><dd>{user.phone || "—"}</dd></div>
            <div className="sm-fact"><dt>Age</dt><dd>{user.age ?? "—"}</dd></div>
            <div className="sm-fact"><dt>City</dt><dd>{user.city || "—"}</dd></div>
          </div>

          <div className="sm-actions">
            <EditPanel
              triggerLabel={profileComplete ? "Edit details" : "Complete your profile"}
              action={updateProfileAction}
              encType="multipart/form-data"
            >
              <ProfileFields user={user} />
            </EditPanel>
          </div>
        </section>

        {/* QUICK FACTS */}
        <div className="sm-quick-row">
          <section className="sm-card sm-quick-card">
            <h3>My events</h3>
            {myEvents.length > 0 ? (
              <ul className="sm-link-list">
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
            ) : (
              <>
                <p className="sm-price-note" style={{ marginTop: 0 }}>You&rsquo;re not down for anything yet.</p>
                <Link className="sm-btn sm-btn-primary" href="/events">Browse events</Link>
              </>
            )}
          </section>

          <section className="sm-card sm-quick-card">
            <h3>Interests</h3>
            {selectedInterestNames.length > 0 ? (
              <div className="sm-tag-row">
                {selectedInterestNames.map((name) => (
                  <span key={name} className="sm-tag">{name}</span>
                ))}
              </div>
            ) : (
              <p className="sm-price-note" style={{ marginTop: 0 }}>You haven&rsquo;t picked any interests yet.</p>
            )}
            <div className="sm-actions" style={{ marginTop: 12 }}>
              <EditPanel triggerLabel="Edit interests" triggerClassName="sm-btn-link" action={updateInterestsAction}>
                <InterestChipPicker
                  interests={allInterests}
                  defaultSelected={selectedInterestNames}
                  fieldName="selected_interests"
                />
              </EditPanel>
            </div>
          </section>
        </div>

        {/* TABLE */}
        <section className="sm-card">
          <h3 style={{ fontSize: "0.95rem", marginBottom: 12 }}>Your table</h3>
          {myTable ? (
            <div className="sm-fact-row" style={{ marginBottom: 0 }}>
              <div className="sm-fact"><dt>Event</dt><dd>{myTable.title}</dd></div>
              <div className="sm-fact"><dt>Date</dt><dd>{formatEventDate(myTable.eventDate)}</dd></div>
              <div className="sm-fact"><dt>Time</dt><dd>{formatSlot(myTable.slot)}</dd></div>
            </div>
          ) : (
            <p className="sm-price-note" style={{ marginTop: 0 }}>
              Not placed at a table yet — <Link className="sm-btn-link" href="/events">browse events</Link> and RSVP to one.
            </p>
          )}
        </section>

        {/* PERSONALITY */}
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

        {/* DANGER ZONE */}
        <section className="sm-card">
          <h3 style={{ fontSize: "0.95rem", marginBottom: 10 }}>Delete account</h3>
          <p className="sm-price-note" style={{ marginTop: 0 }}>This permanently removes your profile, event RSVPs and chat history.</p>
          <form action={deleteAccountAction}>
            <ConfirmButton
              message="Are you sure you want to delete your account? This cannot be undone."
              className="sm-btn-danger"
            >
              Delete account
            </ConfirmButton>
          </form>
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
