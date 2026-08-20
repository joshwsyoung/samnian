import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { conversations, matchUsers, matches } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { SLOTS } from "@/lib/constants";
import Flash from "@/components/Flash";
import { createConversationAction } from "@/app/messages/actions";
import "../../design-system.css";

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
    <div className="sm-scope container mt-3">
      <div className="sm-page-head">
        <div className="sm-greeting">Matches</div>
      </div>

      <Flash success={success === "created" ? "Match created." : success === "match_updated" ? "Match updated." : undefined} />

      <div className="sm-actions" style={{ marginBottom: 16 }}>
        <Link href="/admin/matches/new" className="sm-btn sm-btn-primary">Add match</Link>
      </div>

      <div className="sm-table-wrap">
        <table className="sm-table">
          <thead>
            <tr>
              <th>Date</th><th>Time slot</th><th>Price point</th><th># Users</th><th>Approved</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.id}>
                <td>{m.eventDate}</td>
                <td>{m.slot}</td>
                <td>{m.priceLevel}</td>
                <td>{m.userCount}</td>
                <td>
                  <span className={`sm-status-pill ${m.approved ? "matched" : "unset"}`}>
                    <span className="sm-dot" />{m.approved ? "Yes" : "No"}
                  </span>
                </td>
                <td>
                  <div className="sm-row-actions">
                    <Link href={`/admin/matches/${m.id}`} className="sm-btn-xs">Edit</Link>
                    {m.approved && (
                      m.conversationId ? (
                        <Link href={`/messages?conversation_id=${m.conversationId}`} className="sm-btn-xs sm-accept">
                          Go to conversation
                        </Link>
                      ) : (
                        <form action={createConversationAction}>
                          <input type="hidden" name="title" value={`Table for ${m.eventDate} at ${m.slot}`} />
                          <input type="hidden" name="match_id" value={m.id} />
                          {m.userIds.map((uid) => (
                            <input key={uid} type="hidden" name="users" value={uid} />
                          ))}
                          <button type="submit" className="sm-btn-xs sm-accept">Create conversation</button>
                        </form>
                      )
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
