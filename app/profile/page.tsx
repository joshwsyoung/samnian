import Image from "next/image";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { events, eventInterest, groupMembers, groups, interests, personalityScores, userInterests, users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { CITIES, priceTierLabel } from "@/lib/constants";
import { formatEventDate, formatFeedDate, formatMonthYear, formatSlot } from "@/lib/format";
import EditPanel from "@/components/dash/EditPanel";
import InterestChipPicker from "@/components/dash/InterestChipPicker";
import ConfirmButton from "@/components/ConfirmButton";
import OceanChart from "@/components/OceanChart";
import { deleteAccountAction, updateInterestsAction, updateProfileAction } from "./actions";
import "../design-system.css";

export const dynamic = "force-dynamic";

// One entry in the profile feed — event RSVPs plus a couple of "life
// event"-style entries (joining, completing the personality quiz), all
// merged and sorted newest-first like a real activity feed rather than
// grouped into separate data tables.
type FeedItem =
  | {
      type: "rsvp";
      at: Date;
      priceTier: string;
      confirmed: boolean;
      event: {
        id: number;
        title: string;
        restaurantName: string;
        imageUrl: string | null;
        address: string | null;
        eventDate: string;
        slot: string;
      };
    }
  | { type: "ocean"; at: Date }
  | { type: "join"; at: Date };

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
      imageUrl: events.imageUrl,
      address: events.address,
      eventDate: events.eventDate,
      slot: events.slot,
      priceTier: eventInterest.priceTier,
      rsvpAt: eventInterest.createdAt,
    })
    .from(eventInterest)
    .innerJoin(events, eq(eventInterest.eventId, events.id))
    .where(eq(eventInterest.userId, userId))
    .orderBy(desc(eventInterest.createdAt));

  // Every group this user has been placed in, across every event — used to
  // badge individual feed entries as "confirmed", not just fetched for one.
  const myGroupMemberships = await db()
    .select({ eventId: groups.eventId, approved: groups.approved })
    .from(groupMembers)
    .innerJoin(groups, eq(groupMembers.groupId, groups.id))
    .where(eq(groupMembers.userId, userId));
  const confirmedEventIds = new Set(myGroupMemberships.filter((g) => g.approved).map((g) => g.eventId));

  const requiredFields = [user.name, user.email, user.phone, user.age, user.city, user.profileImage];
  const profileComplete = requiredFields.every((f) => f !== null && f !== undefined && f !== "");

  const initials = (user.name ?? "?")
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const feedItems: FeedItem[] = [
    { type: "join" as const, at: user.createdAt },
    ...(scores ? [{ type: "ocean" as const, at: scores.updatedAt }] : []),
    ...myEvents.map((e) => ({
      type: "rsvp" as const,
      at: e.rsvpAt,
      priceTier: e.priceTier,
      confirmed: confirmedEventIds.has(e.eventId),
      event: {
        id: e.eventId,
        title: e.title,
        restaurantName: e.restaurantName,
        imageUrl: e.imageUrl,
        address: e.address,
        eventDate: e.eventDate,
        slot: e.slot,
      },
    })),
  ].sort((a, b) => b.at.getTime() - a.at.getTime());

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="sm-scope container mt-3">
      <div className="sm-profile-cover">
        <div className="sm-profile-cover-inner">
          {user.profileImage ? (
            <Image src={user.profileImage} width={88} height={88} className="sm-avatar" alt="Profile" />
          ) : (
            <div className="sm-avatar-fallback">{initials || "?"}</div>
          )}
          <div>
            <div className="sm-profile-name">{user.name}</div>
            <div className="sm-profile-meta">
              {user.city || "Somewhere out there"} · Joined {formatMonthYear(user.createdAt)}
            </div>
          </div>
          <span className={`sm-status-pill ${profileComplete ? "matched" : "unset"}`}>
            <span className="sm-dot" />
            {profileComplete ? "Profile complete" : "Profile incomplete"}
          </span>
        </div>
      </div>

      {success && <div className="sm-flash success">{success}</div>}
      {error && <div className="sm-flash error">{error}</div>}

      <div className="sm-profile-layout">
        {/* SIDEBAR */}
        <aside className="sm-profile-sidebar">
          <section className="sm-card">
            <h3>About</h3>
            <div className="sm-fact-row" style={{ marginBottom: 8 }}>
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

          <section className="sm-card">
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

          <section className="sm-card">
            <h3>Personality</h3>
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

          <section className="sm-card sm-danger-zone">
            <details className="sm-details">
              <summary>Delete account</summary>
              <div className="sm-details-body">
                <p className="sm-price-note" style={{ marginTop: 0 }}>This permanently removes your profile, event RSVPs and chat history.</p>
                <form action={deleteAccountAction}>
                  <ConfirmButton
                    message="Are you sure you want to delete your account? This cannot be undone."
                    className="sm-btn-danger"
                  >
                    Delete account
                  </ConfirmButton>
                </form>
              </div>
            </details>
          </section>
        </aside>

        {/* FEED */}
        <main className="sm-feed">
          <h2 className="sm-feed-heading">Activity</h2>

          {feedItems.length === 0 ? (
            <p className="sm-feed-empty">Nothing here yet.</p>
          ) : (
            feedItems.map((item, i) => (
              <FeedCard key={i} item={item} user={user} initials={initials} today={today} />
            ))
          )}
        </main>
      </div>
    </div>
  );
}

function FeedCard({
  item,
  user,
  initials,
  today,
}: {
  item: FeedItem;
  user: typeof users.$inferSelect;
  initials: string;
  today: string;
}) {
  const avatar = user.profileImage ? (
    <Image src={user.profileImage} width={38} height={38} className="sm-avatar sm-feed-avatar" alt="" />
  ) : (
    <div className="sm-avatar-fallback sm-feed-avatar-fallback">{initials || "?"}</div>
  );

  if (item.type === "join") {
    return (
      <article className="sm-card">
        <div className="sm-feed-item-header">
          {avatar}
          <div>
            <div className="sm-feed-item-headline"><strong>{user.name}</strong> joined Samnian 🎉</div>
            <div className="sm-feed-item-time">{formatFeedDate(item.at)}</div>
          </div>
        </div>
      </article>
    );
  }

  if (item.type === "ocean") {
    return (
      <article className="sm-card">
        <div className="sm-feed-item-header">
          {avatar}
          <div>
            <div className="sm-feed-item-headline"><strong>{user.name}</strong> completed the OCEAN personality quiz</div>
            <div className="sm-feed-item-time">{formatFeedDate(item.at)}</div>
          </div>
        </div>
      </article>
    );
  }

  const { event, priceTier, confirmed } = item;
  const isUpcoming = event.eventDate >= today;

  return (
    <article className="sm-card">
      <div className="sm-feed-item-header">
        {avatar}
        <div>
          <div className="sm-feed-item-headline">
            <strong>{user.name}</strong> {isUpcoming ? "is in for" : "went to"} <strong>{event.title}</strong>
          </div>
          <div className="sm-feed-item-time">{formatFeedDate(item.at)}</div>
        </div>
      </div>

      <Link href={`/events/${event.id}`} className="sm-feed-event">
        <div className="sm-feed-event-thumb">
          {event.imageUrl && (
            <Image src={event.imageUrl} alt={event.restaurantName} fill sizes="84px" style={{ objectFit: "cover" }} />
          )}
        </div>
        <div className="sm-feed-event-body">
          <p className="sm-feed-event-title">{event.title}</p>
          <p className="sm-feed-event-sub">{event.restaurantName}</p>
          <p className="sm-feed-event-meta">
            {formatEventDate(event.eventDate)} at {formatSlot(event.slot)}
            {event.address && <> · {event.address}</>}
          </p>
        </div>
      </Link>

      <div className="sm-feed-badges">
        <span className={`sm-feed-pill ${isUpcoming ? "sm-feed-pill-upcoming" : ""}`}>
          {isUpcoming ? "Upcoming" : "Past event"}
        </span>
        <span className="sm-feed-pill">{priceTierLabel(priceTier)}</span>
        {confirmed && <span className="sm-feed-pill sm-feed-pill-confirmed">🎉 Table confirmed</span>}
      </div>
    </article>
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
