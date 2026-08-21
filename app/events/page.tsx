import Image from "next/image";
import Link from "next/link";
import { and, eq, gte } from "drizzle-orm";
import { db } from "@/lib/db";
import { events, eventInterest } from "@/db/schema";
import { requireCompletedOceanTest } from "@/lib/auth";
import { formatEventDate, formatSlot } from "@/lib/format";
import { priceTierLabel } from "@/lib/constants";
import Flash from "@/components/Flash";

export const dynamic = "force-dynamic";

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const session = await requireCompletedOceanTest();
  const { success, error } = await searchParams;

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = (
    await db()
      .select()
      .from(events)
      .where(and(eq(events.published, true), gte(events.eventDate, today)))
  ).sort((a, b) => a.eventDate.localeCompare(b.eventDate));

  const myInterest = await db()
    .select({ eventId: eventInterest.eventId, priceTier: eventInterest.priceTier })
    .from(eventInterest)
    .where(eq(eventInterest.userId, session.id));
  const interestByEvent = new Map(myInterest.map((r) => [r.eventId, r.priceTier]));

  return (
    <div className="container py-4">
      <div className="mb-4">
        <h2 className="display-6 mb-1">Upcoming events</h2>
        <p className="text-muted mb-0">Pick a night out that suits you, and tell us what you&rsquo;re comfortable spending.</p>
      </div>

      <Flash success={success} error={error} />

      {upcoming.length === 0 ? (
        <div className="alert alert-info">No events on the books yet — check back soon.</div>
      ) : (
        <div className="row g-4">
          {upcoming.map((e) => {
            const tier = interestByEvent.get(e.id);
            return (
              <div className="col-12 col-sm-6 col-lg-4" key={e.id}>
                <Link href={`/events/${e.id}`} className="event-card-link">
                  <article className="event-card">
                    <div className="event-card-image">
                      {e.imageUrl ? (
                        <Image src={e.imageUrl} alt={e.restaurantName} fill sizes="(max-width: 576px) 100vw, (max-width: 992px) 50vw, 33vw" style={{ objectFit: "cover" }} />
                      ) : (
                        <div className="event-card-image-fallback" />
                      )}
                      {tier && <span className="event-card-badge">You&rsquo;re in — {priceTierLabel(tier)}</span>}
                    </div>
                    <div className="event-card-body">
                      <div className="d-flex justify-content-between align-items-start">
                        <h3 className="event-card-title">{e.title}</h3>
                      </div>
                      <p className="event-card-sub">{e.restaurantName}</p>
                      <p className="event-card-meta">
                        {formatEventDate(e.eventDate)} · {formatSlot(e.slot)}
                        {e.address && <> · {e.address}</>}
                      </p>
                    </div>
                  </article>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
