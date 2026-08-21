import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { events, eventInterest } from "@/db/schema";
import { requireCompletedOceanTest } from "@/lib/auth";
import { formatEventDate, formatSlot } from "@/lib/format";
import { PRICE_TIERS } from "@/lib/constants";
import Flash from "@/components/Flash";
import { setEventInterestAction, withdrawEventInterestAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function EventDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const session = await requireCompletedOceanTest();
  const { id } = await params;
  const { success, error } = await searchParams;
  const eventId = Number(id);

  const [event] = await db().select().from(events).where(eq(events.id, eventId)).limit(1);
  if (!event) notFound();

  const [mine] = await db()
    .select()
    .from(eventInterest)
    .where(and(eq(eventInterest.eventId, eventId), eq(eventInterest.userId, session.id)))
    .limit(1);

  const interestCount = (await db().select({ userId: eventInterest.userId }).from(eventInterest).where(eq(eventInterest.eventId, eventId))).length;

  return (
    <div className="container py-4">
      <Link href="/events" className="btn btn-link px-0 mb-3">&larr; Back to events</Link>

      <Flash success={success} error={error} />

      <div className="event-detail">
        <div className="event-detail-image">
          {event.imageUrl ? (
            <Image src={event.imageUrl} alt={event.restaurantName} fill sizes="100vw" style={{ objectFit: "cover" }} priority />
          ) : (
            <div className="event-card-image-fallback" />
          )}
        </div>

        <div className="row mt-4 g-4">
          <div className="col-lg-7">
            <h1 className="fs-2 mb-1">{event.title}</h1>
            <p className="text-muted fs-5 mb-3">
              {event.restaurantName}
              {event.restaurantUrl && (
                <>
                  {" "}
                  <a href={event.restaurantUrl} target="_blank" rel="noopener noreferrer" className="ms-1">
                    view restaurant <i className="bi bi-box-arrow-up-right" />
                  </a>
                </>
              )}
            </p>

            <ul className="list-unstyled event-detail-facts mb-4">
              <li><i className="bi bi-calendar-event me-2" />{formatEventDate(event.eventDate)} at {formatSlot(event.slot)}</li>
              {event.address && <li><i className="bi bi-geo-alt me-2" />{event.address}</li>}
              {event.capacity && <li><i className="bi bi-people me-2" />Small group, up to {event.capacity} per table</li>}
              <li><i className="bi bi-check2-circle me-2" />{interestCount} {interestCount === 1 ? "person is" : "people are"} interested so far</li>
            </ul>

            {event.description && <p className="event-detail-description">{event.description}</p>}
          </div>

          <div className="col-lg-5">
            <div className="card shadow-sm event-rsvp-card">
              <div className="card-body">
                {mine ? (
                  <>
                    <h5 className="card-title">You&rsquo;re in</h5>
                    <p className="text-muted">Budget: {PRICE_TIERS.find((t) => t.value === mine.priceTier)?.label} ({PRICE_TIERS.find((t) => t.value === mine.priceTier)?.range})</p>
                    <details className="mb-3">
                      <summary className="text-muted small">Change your budget</summary>
                      <form action={setEventInterestAction} className="mt-2">
                        <input type="hidden" name="event_id" value={event.id} />
                        <PriceTierRadios defaultValue={mine.priceTier} />
                        <button type="submit" className="btn btn-secondary btn-sm mt-2">Update</button>
                      </form>
                    </details>
                    <form action={withdrawEventInterestAction}>
                      <input type="hidden" name="event_id" value={event.id} />
                      <button type="submit" className="btn btn-outline-danger btn-sm">I can&rsquo;t make it</button>
                    </form>
                  </>
                ) : (
                  <>
                    <h5 className="card-title">I&rsquo;m in — how much do you want to spend?</h5>
                    <form action={setEventInterestAction}>
                      <input type="hidden" name="event_id" value={event.id} />
                      <PriceTierRadios />
                      <button type="submit" className="btn btn-primary mt-3 w-100">Count me in</button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PriceTierRadios({ defaultValue }: { defaultValue?: string }) {
  return (
    <div className="price-tier-picker">
      {PRICE_TIERS.map((tier) => (
        <label key={tier.value} className="price-tier-option">
          <input type="radio" name="price_tier" value={tier.value} defaultChecked={defaultValue === tier.value} required />
          <span className="price-tier-option-body">
            <span className="price-tier-option-label">{tier.label}</span>
            <span className="price-tier-option-range">{tier.range}</span>
          </span>
        </label>
      ))}
    </div>
  );
}
