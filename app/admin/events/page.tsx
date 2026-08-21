import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { events, eventInterest, groups } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { formatEventDate, formatSlot } from "@/lib/format";
import Flash from "@/components/Flash";

export const dynamic = "force-dynamic";

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  await requireAdmin();
  const { success } = await searchParams;

  const allEvents = (await db().select().from(events)).sort((a, b) => b.eventDate.localeCompare(a.eventDate));

  const rows = await Promise.all(
    allEvents.map(async (e) => {
      const interested = await db().select({ userId: eventInterest.userId }).from(eventInterest).where(eq(eventInterest.eventId, e.id));
      const eventGroups = await db().select({ id: groups.id }).from(groups).where(eq(groups.eventId, e.id));
      return { ...e, interestCount: interested.length, groupCount: eventGroups.length };
    })
  );

  return (
    <div className="container mt-4">
      <h2>Events</h2>

      <Flash success={success === "created" ? "Event created." : success === "updated" ? "Event updated." : undefined} />

      <Link href="/admin/events/new" className="btn btn-success mb-3">Add Event</Link>

      <table className="table table-bordered mt-3">
        <thead className="thead-light">
          <tr>
            <th>Title</th><th>Restaurant</th><th>Date</th><th>Time</th><th>Interested</th><th>Groups</th><th>Published</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((e) => (
            <tr key={e.id}>
              <td>{e.title}</td>
              <td>{e.restaurantName}</td>
              <td>{formatEventDate(e.eventDate)}</td>
              <td>{formatSlot(e.slot)}</td>
              <td>{e.interestCount}</td>
              <td>{e.groupCount}</td>
              <td>{e.published ? "✅" : "❌"}</td>
              <td>
                <Link href={`/admin/events/${e.id}`} className="btn btn-sm btn-primary">Manage</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
