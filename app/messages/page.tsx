import Link from "next/link";
import { and, asc, desc, eq, ne, notInArray, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { chatMessages, conversationUsers, conversations, users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import EditPanel from "@/components/dash/EditPanel";
import ConfirmButton from "@/components/ConfirmButton";
import {
  createConversationAction,
  deleteConversationAction,
  inviteDecisionAction,
  inviteUserAction,
  removeUserAction,
  sendMessageAction,
} from "./actions";
import "../design-system.css";

export const dynamic = "force-dynamic";

const ERROR_COPY: Record<string, string> = {
  not_in_conversation: "You're not part of that conversation.",
  cant_remove_creator: "You can't remove the conversation's creator.",
  missing_title: "Please give the conversation a title.",
};

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ conversation_id?: string; error?: string; deleted?: string }>;
}) {
  const session = await requireUser();
  const userId = session.id;
  const { conversation_id, error, deleted } = await searchParams;
  const conversationId = conversation_id ? Number(conversation_id) : null;

  const myConversations = await db()
    .select({
      id: conversations.id,
      title: conversations.title,
      status: conversationUsers.status,
      createdAt: conversations.createdAt,
    })
    .from(conversations)
    .innerJoin(conversationUsers, eq(conversations.id, conversationUsers.conversationId))
    .where(
      and(
        eq(conversationUsers.userId, userId),
        or(eq(conversationUsers.status, "accepted"), eq(conversationUsers.status, "pending"))
      )
    )
    .orderBy(desc(conversations.createdAt));

  const conversationPreviews = await Promise.all(
    myConversations.map(async (c) => {
      const [lastMessage] = await db()
        .select({ message: chatMessages.message, sentAt: chatMessages.sentAt })
        .from(chatMessages)
        .where(eq(chatMessages.conversationId, c.id))
        .orderBy(desc(chatMessages.sentAt))
        .limit(1);
      return { ...c, lastMessage };
    })
  );

  const allUsers = await db().select({ id: users.id, name: users.name }).from(users);

  let activeConversation: { id: number; title: string; userId: string } | null = null;
  let isMember = false;
  let messages: { senderId: string | null; senderName: string | null; message: string; sentAt: Date }[] = [];
  let participants: { id: string; name: string; status: "pending" | "accepted" | "declined" }[] = [];
  let inviteCandidates: { id: string; name: string }[] = [];

  if (conversationId) {
    const [conv] = await db().select().from(conversations).where(eq(conversations.id, conversationId)).limit(1);

    const [membership] = await db()
      .select()
      .from(conversationUsers)
      .where(and(eq(conversationUsers.conversationId, conversationId), eq(conversationUsers.userId, userId)))
      .limit(1);

    isMember = Boolean(conv && membership);

    if (isMember && conv) {
      activeConversation = conv;

      messages = await db()
        .select({
          senderId: chatMessages.senderId,
          senderName: users.name,
          message: chatMessages.message,
          sentAt: chatMessages.sentAt,
        })
        .from(chatMessages)
        .leftJoin(users, eq(chatMessages.senderId, users.id))
        .where(eq(chatMessages.conversationId, conversationId))
        .orderBy(asc(chatMessages.sentAt));

      participants = await db()
        .select({ id: users.id, name: users.name, status: conversationUsers.status })
        .from(conversationUsers)
        .innerJoin(users, eq(conversationUsers.userId, users.id))
        .where(eq(conversationUsers.conversationId, conversationId));

      const participantIds = participants.map((p) => p.id);
      inviteCandidates = await db()
        .select({ id: users.id, name: users.name })
        .from(users)
        .where(
          participantIds.length > 0
            ? and(ne(users.id, userId), notInArray(users.id, participantIds))
            : ne(users.id, userId)
        );
    }
  }

  const hasSelection = Boolean(conversationId);
  const noAccess = Boolean(conversationId) && !isMember;

  return (
    <div className="sm-scope container mt-3">
      <div className="sm-page-head">
        <div className="sm-greeting">Messages</div>
        <div className="sm-sub">Chat with your matched tables.</div>
      </div>

      {deleted && <div className="sm-flash success">Chat deleted.</div>}
      {error && ERROR_COPY[error] && <div className="sm-flash error">{ERROR_COPY[error]}</div>}

      <div className="sm-chat-shell">
        <aside className="sm-conv-list" data-selected={hasSelection}>
          <div className="sm-card">
            <div className="sm-conv-list-head">
              <h3>Chats</h3>
              <EditPanel triggerLabel="New chat" triggerClassName="sm-btn-xs" action={createConversationAction}>
                <NewConversationFields candidates={allUsers.filter((u) => u.id !== userId)} />
              </EditPanel>
            </div>

            {conversationPreviews.length === 0 ? (
              <p className="sm-price-note" style={{ marginTop: 0 }}>No conversations yet — start one above.</p>
            ) : (
              <div className="sm-conv-items">
                {conversationPreviews.map((c) => (
                  <div key={c.id}>
                    <Link
                      href={`/messages?conversation_id=${c.id}`}
                      className={`sm-conv-item ${conversationId === c.id ? "active" : ""}`}
                    >
                      <div className="sm-conv-item-top">
                        <span className="sm-conv-item-title">{c.title}</span>
                        <span className="sm-conv-item-time">
                          {c.lastMessage ? new Date(c.lastMessage.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                        </span>
                      </div>
                      <div className="sm-conv-item-preview">
                        {c.lastMessage?.message ?? (c.status === "pending" ? "Invitation pending" : "No messages yet")}
                      </div>
                    </Link>
                    {c.status === "pending" && (
                      <form action={inviteDecisionAction} className="sm-conv-item-invite">
                        <input type="hidden" name="conversation_id" value={c.id} />
                        <button type="submit" name="decision" value="accepted" className="sm-btn-xs sm-accept">Accept</button>
                        <button type="submit" name="decision" value="declined" className="sm-btn-xs sm-decline">Decline</button>
                      </form>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        <section className="sm-thread" data-selected={hasSelection}>
          <Link href="/messages" className="sm-btn-link sm-back-link">← Chats</Link>

          {noAccess && (
            <div className="sm-card">
              <p style={{ marginBottom: 0 }}>You don&rsquo;t have access to this chat.</p>
            </div>
          )}

          {!activeConversation && !noAccess && (
            <div className="sm-card">
              <p className="sm-price-note" style={{ marginTop: 0, marginBottom: 0 }}>
                Select a conversation, or start a new one.
              </p>
            </div>
          )}

          {activeConversation && (
            <div className="sm-card">
              <div className="sm-thread-head">
                <h3>{activeConversation.title}</h3>
              </div>

              <details className="sm-details" style={{ marginBottom: 14 }}>
                <summary>Participants</summary>
                <div className="sm-details-body">
                  {participants.map((p) => (
                    <div key={p.id} className="sm-participant-row">
                      <span>{p.name}{p.status !== "accepted" ? ` · ${p.status}` : ""}</span>
                      {p.id !== activeConversation.userId && (
                        <form action={removeUserAction}>
                          <input type="hidden" name="conversation_id" value={activeConversation.id} />
                          <input type="hidden" name="user_id" value={p.id} />
                          <button type="submit" className="sm-btn-xs sm-danger">
                            {p.id === userId ? "Leave" : "Remove"}
                          </button>
                        </form>
                      )}
                    </div>
                  ))}

                  <div className="sm-actions" style={{ marginTop: 10 }}>
                    <EditPanel triggerLabel="Invite someone" triggerClassName="sm-btn-link" action={inviteUserAction}>
                      <input type="hidden" name="conversation_id" value={activeConversation.id} />
                      <InviteFields candidates={inviteCandidates} />
                    </EditPanel>
                  </div>

                  {activeConversation.userId === userId && (
                    <form action={deleteConversationAction} style={{ marginTop: 10 }}>
                      <input type="hidden" name="conversation_id" value={activeConversation.id} />
                      <ConfirmButton
                        message="Are you sure you want to delete this chat? This action cannot be undone."
                        className="sm-btn-danger"
                      >
                        Delete chat
                      </ConfirmButton>
                    </form>
                  )}
                </div>
              </details>

              <div className="sm-msg-list">
                {messages.length === 0 ? (
                  <p className="sm-price-note" style={{ marginTop: 0 }}>No messages yet. Start the conversation.</p>
                ) : (
                  messages.map((m, i) => (
                    <div key={i} className={`sm-msg-row ${m.senderId === userId ? "mine" : ""}`}>
                      <div className={`sm-bubble ${m.senderId === userId ? "mine" : "theirs"}`}>
                        <div className="sm-msg-name">{m.senderName}</div>
                        <div className="sm-msg-text">{m.message}</div>
                        <div className="sm-msg-time">
                          {new Date(m.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <form action={sendMessageAction} className="sm-composer">
                <input type="hidden" name="conversation_id" value={activeConversation.id} />
                <input type="text" name="message" placeholder="Type a message…" required />
                <button className="sm-btn sm-btn-primary" type="submit">Send</button>
              </form>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function NewConversationFields({ candidates }: { candidates: { id: string; name: string | null }[] }) {
  return (
    <div className="sm-field-row">
      <div className="sm-field">
        <label htmlFor="conversationTitle">Conversation title</label>
        <input type="text" id="conversationTitle" name="title" className="sm-input" required />
      </div>
      <div className="sm-field">
        <label htmlFor="conversationUser">Add user</label>
        <select id="conversationUser" name="users" className="sm-input" required>
          {candidates.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

function InviteFields({ candidates }: { candidates: { id: string; name: string | null }[] }) {
  if (candidates.length === 0) {
    return <p className="sm-price-note" style={{ marginTop: 0 }}>Everyone&rsquo;s already in this chat.</p>;
  }
  return (
    <div className="sm-field">
      <label htmlFor="invite_user_id">Select user</label>
      <select id="invite_user_id" name="invite_user_id" className="sm-input" required>
        {candidates.map((u) => (
          <option key={u.id} value={u.id}>{u.name}</option>
        ))}
      </select>
    </div>
  );
}
