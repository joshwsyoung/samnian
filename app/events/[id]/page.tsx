import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { events, eventInterest, personalityScores } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { formatEventDate, formatSlot } from "@/lib/format";
import { PRICE_TIERS } from "@/lib/constants";
import "../../design-system.css";
import { setEventInterestAction, withdrawEventInterestAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function EventDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const session = await getSession();
  const { id } = await params;
  const { success, error } = await searchParams;
  const eventId = Number(id);

  const [event] = await db().select().from(events).where(eq(events.id, eventId)).limit(1);
  if (!event) notFound();

  const interestCount = (await db().select({ userId: eventInterest.userId }).from(eventInterest).where(eq(eventInterest.eventId, eventId))).length;

  let mine: { priceTier: string } | undefined;
  let hasOceanScores = false;
  if (session) {
    [mine] = await db()
      .select({ priceTier: eventInterest.priceTier })
      .from(eventInterest)
      .where(and(eq(eventInterest.eventId, eventId), eq(eventInterest.userId, session.id)))
      .limit(1);
    const [scores] = await db().select({ userId: personalityScores.userId }).from(personalityScores).where(eq(personalityScores.userId, session.id)).limit(1);
    hasOceanScores = Boolean(scores);
  }

  const next = `/events/${eventId}`;
  const galleryPhotos = [event.imageUrl, ...event.images].filter((src): src is string => Boolean(src)).slice(0, 5);
  const mapsUrl = event.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${event.restaurantName}, ${event.address}`)}`
    : undefined;

  return (
    <div className="sm-scope container mt-3 mb-5" style={{ maxWidth: 900 }}>
      <Link href="/events" className="sm-btn-link" style={{ display: "inline-block", marginBottom: 14 }}>
        ← Back to events
      </Link>

      {success && <div className="sm-flash success">{success}</div>}
      {error && <div className="sm-flash error">{error}</div>}

      {galleryPhotos.length > 0 && (
        <div className="sm-event-gallery">
          {galleryPhotos.map((src, i) => (
            <div key={i}>
              <Image src={src} alt={event.restaurantName} fill sizes="(max-width: 640px) 50vw, 40vw" style={{ objectFit: "cover" }} priority={i === 0} />
            </div>
          ))}
        </div>
      )}

      <div className="sm-event-title-row">
        <div>
          <h1>{event.title}</h1>
          <p className="sm-event-restaurant">
            {event.restaurantName}
            {event.restaurantUrl && (
              <>
                {" "}
                <a href={event.restaurantUrl} target="_blank" rel="noopener noreferrer" className="sm-btn-link" style={{ marginLeft: 4 }}>
                  visit website <i className="bi bi-box-arrow-up-right" />
                </a>
              </>
            )}
          </p>
        </div>
        {event.cuisine && <span className="sm-tag-outline">{event.cuisine}</span>}
      </div>

      <div className="sm-quick-row" style={{ alignItems: "start", marginTop: 18 }}>
        <div>
          <div className="sm-event-facts">
            <div className="sm-event-fact">
              <i className="bi bi-calendar-event" />
              <div>
                <span className="sm-event-fact-label">Date</span>
                {formatEventDate(event.eventDate)}
              </div>
            </div>
            <div className="sm-event-fact">
              <i className="bi bi-clock" />
              <div>
                <span className="sm-event-fact-label">Arrival time</span>
                {formatSlot(event.slot)}
              </div>
            </div>
            {event.address && (
              <div className="sm-event-fact">
                <i className="bi bi-geo-alt" />
                <div>
                  <span className="sm-event-fact-label">Location</span>
                  {event.address}
                  {mapsUrl && (
                    <>
                      {" "}
                      <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
                        Open in Google Maps <i className="bi bi-box-arrow-up-right" />
                      </a>
                    </>
                  )}
                </div>
              </div>
            )}
            {event.capacity && (
              <div className="sm-event-fact">
                <i className="bi bi-people" />
                <div>
                  <span className="sm-event-fact-label">Table size</span>
                  Small group, up to {event.capacity} per table
                </div>
              </div>
            )}
            <div className="sm-event-fact">
              <i className="bi bi-check2-circle" />
              <div>
                <span className="sm-event-fact-label">Interest so far</span>
                {interestCount} {interestCount === 1 ? "person is" : "people are"} in
              </div>
            </div>
          </div>

          {event.description && <p className="sm-event-description">{event.description}</p>}
        </div>

        <div className="sm-card">
          {!session ? (
            <>
              <h3 style={{ fontSize: "1rem", marginBottom: 8 }}>Want in?</h3>
              <p className="sm-price-note" style={{ marginTop: 0 }}>
                Log in or register to RSVP — it&rsquo;s quick, and Google sign-in handles new or existing accounts either way.
              </p>
              <Link className="sm-btn sm-btn-primary" style={{ width: "100%" }} href={`/login?next=${encodeURIComponent(next)}`}>
                Log in to RSVP
              </Link>
            </>
          ) : !hasOceanScores ? (
            <>
              <h3 style={{ fontSize: "1rem", marginBottom: 8 }}>Almost there</h3>
              <p className="sm-price-note" style={{ marginTop: 0 }}>
                A 2-minute personality quiz helps us group you with people you&rsquo;ll actually get on with —
                one more step before you can RSVP.
              </p>
              <Link className="sm-btn sm-btn-primary" style={{ width: "100%" }} href={`/ocean-test?required=1&next=${encodeURIComponent(next)}`}>
                Take the quiz
              </Link>
            </>
          ) : mine ? (
            <>
              <h3 style={{ fontSize: "1rem", marginBottom: 4 }}>You&rsquo;re in</h3>
              <p className="sm-price-note" style={{ marginTop: 0 }}>
                Budget: {PRICE_TIERS.find((t) => t.value === mine!.priceTier)?.label} ({PRICE_TIERS.find((t) => t.value === mine!.priceTier)?.range})
              </p>
              <details className="sm-details" style={{ marginTop: 12, marginBottom: 12 }}>
                <summary>Change your budget</summary>
                <div className="sm-details-body">
                  <form action={setEventInterestAction}>
                    <input type="hidden" name="event_id" value={event.id} />
                    <PriceTierRadios defaultValue={mine.priceTier} />
                    <button type="submit" className="sm-btn sm-btn-primary" style={{ marginTop: 12 }}>Update</button>
                  </form>
                </div>
              </details>
              <form action={withdrawEventInterestAction}>
                <input type="hidden" name="event_id" value={event.id} />
                <button type="submit" className="sm-btn-danger">I can&rsquo;t make it</button>
              </form>
            </>
          ) : (
            <>
              <h3 style={{ fontSize: "1rem", marginBottom: 12 }}>I&rsquo;m in — how much do you want to spend?</h3>
              <form action={setEventInterestAction}>
                <input type="hidden" name="event_id" value={event.id} />
                <PriceTierRadios />
                <button type="submit" className="sm-btn sm-btn-primary" style={{ width: "100%", marginTop: 14 }}>Count me in</button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function PriceTierRadios({ defaultValue }: { defaultValue?: string }) {
  return (
    <div className="sm-price-tier-picker">
      {PRICE_TIERS.map((tier) => (
        <label key={tier.value} className="sm-price-tier-option">
          <input type="radio" name="price_tier" value={tier.value} defaultChecked={defaultValue === tier.value} required />
          <span className="sm-price-tier-option-body">
            <span className="sm-price-tier-option-label">{tier.label}</span>
            <span className="sm-price-tier-option-range">{tier.range}</span>
          </span>
        </label>
      ))}
    </div>
  );
}
