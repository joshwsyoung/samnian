import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { conversations, matchUsers, matches } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { SLOTS } from "@/lib/constants";
import Flash from "@/components/Flash";
import { createConversationAction } from "@/app/messages/actions";

export const dynamic = "force-dynamic";

export default async function AdminMatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  await requireAdmin();
  const { success } = await searchParams;

  const allMatches = (await db().select().from(matches)).sort(
    (a, b) => b.eventDate.localeCompare(a.eventDate) || SLOTS.indexOf(a.slot) - SLOTS.indexOf(b.slot)
  );

  const rows = await Promise.all(
    allMatches.map(async (m) => {
      const assignedUsers = await db().select({ userId: matchUsers.userId }).from(matchUsers).where(eq(matchUsers.matchId, m.id));
      const [conversation] = await db().select().from(conversations).where(eq(conversations.matchId, m.id)).limit(1);
      return { ...m, userCount: assignedUsers.length, userIds: assignedUsers.map((u) => u.userId), conversationId: conversation?.id };
    })
  );

  return (
    <div className="container mt-4">
      <h2>Matches</h2>

      <Flash success={success === "created" ? "Match created." : success === "match_updated" ? "Match updated." : undefined} />

      <Link href="/admin/matches/new" className="btn btn-success mb-3">Add Match</Link>

      <table className="table table-bordered mt-3">
        <thead className="thead-light">
          <tr>
            <th>Date</th><th>Time Slot</th><th>Price Point</th><th># Users</th><th>Approved</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((m) => (
            <tr key={m.id}>
              <td>{m.eventDate}</td>
              <td>{m.slot}</td>
              <td>{m.priceLevel}</td>
              <td>{m.userCount}</td>
              <td>{m.approved ? "✅" : "❌"}</td>
              <td>
                <Link href={`/admin/matches/${m.id}`} className="btn btn-sm btn-primary">Edit</Link>{" "}
                {m.approved && (
                  m.conversationId ? (
                    <Link href={`/messages?conversation_id=${m.conversationId}`} className="btn btn-sm btn-info">
                      Go to Conversation
                    </Link>
                  ) : (
                    <form action={createConversationAction} className="d-inline">
                      <input type="hidden" name="title" value={`Table for ${m.eventDate} at ${m.slot}`} />
                      <input type="hidden" name="match_id" value={m.id} />
                      {m.userIds.map((uid) => (
                        <input key={uid} type="hidden" name="users" value={uid} />
                      ))}
                      <button type="submit" className="btn btn-sm btn-success mt-2">Create Conversation</button>
                    </form>
                  )
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
