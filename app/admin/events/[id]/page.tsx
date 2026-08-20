import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { events, eventInterest, groups, groupMembers, users, conversations } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { priceTierLabel } from "@/lib/constants";
import Flash from "@/components/Flash";
import EventFormFields from "@/components/EventFormFields";
import { createConversationAction } from "@/app/messages/actions";
import {
  addGroupMemberAction,
  createGroupAction,
  removeGroupMemberAction,
  updateEventAction,
  updateGroupApprovalAction,
} from "../actions";

export const dynamic = "force-dynamic";

export default async function EditEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const { success } = await searchParams;
  const eventId = Number(id);

  const [event] = await db().select().from(events).where(eq(events.id, eventId)).limit(1);
  if (!event) notFound();

  const interestRows = await db()
    .select({ userId: eventInterest.userId, priceTier: eventInterest.priceTier, name: users.name, email: users.email })
    .from(eventInterest)
    .innerJoin(users, eq(eventInterest.userId, users.id))
    .where(eq(eventInterest.eventId, eventId));

  const eventGroups = await db().select().from(groups).where(eq(groups.eventId, eventId));

  const groupsWithMembers = await Promise.all(
    eventGroups.map(async (g) => {
      const members = await db()
        .select({ userId: groupMembers.userId, name: users.name })
        .from(groupMembers)
        .innerJoin(users, eq(groupMembers.userId, users.id))
        .where(eq(groupMembers.groupId, g.id));
      const [conversation] = await db().select().from(conversations).where(eq(conversations.groupId, g.id)).limit(1);
      return { ...g, members, conversationId: conversation?.id };
    })
  );

  const groupedUserIds = new Set(groupsWithMembers.flatMap((g) => g.members.map((m) => m.userId)));
  const ungroupedInterested = interestRows.filter((r) => !groupedUserIds.has(r.userId));

  return (
    <div className="container mt-4">
      <Link href="/admin/events" className="btn btn-link px-0">&larr; All events</Link>
      <h2>Edit Event</h2>

      <Flash success={success === "updated" ? "Event updated." : success === "created" ? "Event created." : undefined} />

      <form action={updateEventAction}>
        <input type="hidden" name="id" value={event.id} />
        <EventFormFields
          defaults={{
            title: event.title,
            restaurantName: event.restaurantName,
            restaurantUrl: event.restaurantUrl,
            imageUrl: event.imageUrl,
            address: event.address,
            description: event.description,
            eventDate: event.eventDate,
            slot: event.slot,
            capacity: event.capacity,
            published: event.published,
          }}
        />
        <button type="submit" className="btn btn-primary">Save Changes</button>
      </form>

      <h3 className="mt-5">Interested users ({interestRows.length})</h3>
      <div className="table-responsive">
        <table className="table table-bordered">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Budget</th><th>Status</th></tr>
          </thead>
          <tbody>
            {interestRows.map((r) => (
              <tr key={r.userId}>
                <td>{r.name}</td>
                <td>{r.email}</td>
                <td>{priceTierLabel(r.priceTier)}</td>
                <td>{groupedUserIds.has(r.userId) ? <span className="badge bg-success">In a group</span> : <span className="badge bg-secondary">Not yet grouped</span>}</td>
              </tr>
            ))}
            {interestRows.length === 0 && (
              <tr><td colSpan={4} className="text-muted">No one&rsquo;s expressed interest yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <h3 className="mt-5">Groups</h3>
      <p className="text-muted">Build dinner tables from the interested users above. A chat only gets created once a group&rsquo;s members are finalised.</p>

      {groupsWithMembers.map((g) => (
        <div className="card mb-3" key={g.id}>
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
              <h5 className="card-title mb-0">Table #{g.id} — {g.members.length} member{g.members.length === 1 ? "" : "s"}</h5>
              <div className="d-flex align-items-center gap-2">
                {g.approved ? <span className="badge bg-success">Approved</span> : <span className="badge bg-secondary">Not approved</span>}
                <form action={updateGroupApprovalAction} className="m-0">
                  <input type="hidden" name="group_id" value={g.id} />
                  <input type="hidden" name="event_id" value={eventId} />
                  <input type="hidden" name="approved" value={g.approved ? "" : "on"} />
                  <button type="submit" className="btn btn-sm btn-outline-secondary">{g.approved ? "Unapprove" : "Approve"}</button>
                </form>

                {g.approved && (
                  g.conversationId ? (
                    <Link href={`/messages?conversation_id=${g.conversationId}`} className="btn btn-sm btn-info">Go to Chat</Link>
                  ) : (
                    <form action={createConversationAction} className="d-inline">
                      <input type="hidden" name="title" value={`${event.restaurantName} — ${event.title}`} />
                      <input type="hidden" name="group_id" value={g.id} />
                      {g.members.map((m) => (
                        <input key={m.userId} type="hidden" name="users" value={m.userId} />
                      ))}
                      <button type="submit" className="btn btn-sm btn-success" disabled={g.members.length === 0}>Start Chat</button>
                    </form>
                  )
                )}
              </div>
            </div>

            <ul className="list-group list-group-flush mt-3">
              {g.members.map((m) => (
                <li key={m.userId} className="list-group-item d-flex justify-content-between align-items-center">
                  {m.name}
                  <form action={removeGroupMemberAction} className="m-0">
                    <input type="hidden" name="group_id" value={g.id} />
                    <input type="hidden" name="event_id" value={eventId} />
                    <input type="hidden" name="user_id" value={m.userId} />
                    <button type="submit" className="btn btn-sm btn-outline-danger">Remove</button>
                  </form>
                </li>
              ))}
              {g.members.length === 0 && <li className="list-group-item text-muted">No members yet.</li>}
            </ul>

            {ungroupedInterested.length > 0 && (
              <form action={addGroupMemberAction} className="d-flex gap-2 mt-3">
                <input type="hidden" name="group_id" value={g.id} />
                <input type="hidden" name="event_id" value={eventId} />
                <select name="user_id" className="form-select form-select-sm" required>
                  <option value="">Add someone…</option>
                  {ungroupedInterested.map((r) => (
                    <option key={r.userId} value={r.userId}>{r.name} ({priceTierLabel(r.priceTier)})</option>
                  ))}
                </select>
                <button type="submit" className="btn btn-sm btn-outline-primary text-nowrap">Add</button>
              </form>
            )}
          </div>
        </div>
      ))}

      <form action={createGroupAction}>
        <input type="hidden" name="event_id" value={eventId} />
        <button type="submit" className="btn btn-outline-success">+ New table</button>
      </form>
    </div>
  );
}
