import Image from "next/image";
import Link from "next/link";
import { and, eq, gte } from "drizzle-orm";
import { db } from "@/lib/db";
import { events, eventInterest } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { formatEventDate, formatSlot } from "@/lib/format";
import { priceTierLabel } from "@/lib/constants";
import "../design-system.css";

export const dynamic = "force-dynamic";

// Public — anyone can browse events without an account. Only expressing
// interest in one requires logging in (and the OCEAN test), which is what
// makes an event page itself work as an entry point for a new visitor.
export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const session = await getSession();
  const { success, error } = await searchParams;

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = (
    await db()
      .select()
      .from(events)
      .where(and(eq(events.published, true), gte(events.eventDate, today)))
  ).sort((a, b) => a.eventDate.localeCompare(b.eventDate));

  const interestByEvent = session
    ? new Map(
        (
          await db()
            .select({ eventId: eventInterest.eventId, priceTier: eventInterest.priceTier })
            .from(eventInterest)
            .where(eq(eventInterest.userId, session.id))
        ).map((r) => [r.eventId, r.priceTier])
      )
    : new Map<number, string>();

  return (
    <div className="sm-scope container mt-3 mb-5">
      <div className="sm-page-head">
        <div className="sm-greeting">Upcoming dinners</div>
        <div className="sm-sub">Pick a night out that suits you — log in when you&rsquo;re ready to RSVP.</div>
      </div>

      {success && <div className="sm-flash success">{success}</div>}
      {error && <div className="sm-flash error">{error}</div>}

      {upcoming.length === 0 ? (
        <div className="sm-card">
          <p style={{ margin: 0 }}>No events on the books yet — check back soon.</p>
        </div>
      ) : (
        <div className="sm-event-grid">
          {upcoming.map((e) => {
            const tier = interestByEvent.get(e.id);
            return (
              <Link href={`/events/${e.id}`} className="sm-event-card" key={e.id}>
                <div className="sm-event-card-img">
                  {e.imageUrl ? (
                    <Image
                      src={e.imageUrl}
                      alt={e.restaurantName}
                      fill
                      sizes="(max-width: 576px) 100vw, (max-width: 992px) 50vw, 33vw"
                      style={{ objectFit: "cover" }}
                    />
                  ) : null}
                  {tier && <span className="sm-event-badge">You&rsquo;re in — {priceTierLabel(tier)}</span>}
                </div>
                <div className="sm-event-card-body">
                  <div className="sm-event-card-top">
                    <h3 className="sm-event-card-title">{e.title}</h3>
                    {e.cuisine && <span className="sm-tag-outline">{e.cuisine}</span>}
                  </div>
                  <p className="sm-event-card-sub">{e.restaurantName}</p>
                  <p className="sm-event-card-meta">
                    <i className="bi bi-calendar-event" />
                    {formatEventDate(e.eventDate)} · {formatSlot(e.slot)}
                    {e.address && <> · {e.address}</>}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
