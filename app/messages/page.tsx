import { and, asc, desc, eq, ne, notInArray, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { chatMessages, conversationUsers, conversations, users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import ConfirmButton from "@/components/ConfirmButton";
import {
  createConversationAction,
  deleteConversationAction,
  inviteDecisionAction,
  inviteUserAction,
  removeUserAction,
  sendMessageAction,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ conversation_id?: string; error?: string; deleted?: string }>;
}) {
  const session = await requireUser();
  const userId = Number(session.sub);
  const { conversation_id, error } = await searchParams;
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

  let activeConversation: { id: number; title: string; userId: number } | null = null;
  let isMember = false;
  let messages: { senderId: number | null; senderName: string | null; message: string; sentAt: Date }[] = [];
  let participants: { id: number; name: string; status: "pending" | "accepted" | "declined" }[] = [];
  let inviteCandidates: { id: number; name: string }[] = [];

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

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <button className="btn btn-secondary" data-bs-toggle="offcanvas" data-bs-target="#chatList">Chats</button>
        {activeConversation && (
          <button type="button" className="btn btn-outline-secondary" data-bs-toggle="modal" data-bs-target="#conversationInfoModal">
            <i className="bi bi-info-circle" />
          </button>
        )}
      </div>

      {error === "not_in_conversation" && <div className="alert alert-danger">You&rsquo;re not part of that conversation.</div>}
      {error === "cant_remove_creator" && <div className="alert alert-danger">You can&rsquo;t remove the conversation&rsquo;s creator.</div>}
      {error === "missing_title" && <div className="alert alert-danger">Please give the conversation a title.</div>}

      <div className="row">
        <div className="offcanvas offcanvas-start" tabIndex={-1} id="chatList">
          <div className="offcanvas-header">
            <h5 className="offcanvas-title">Conversations</h5>
            <button type="button" className="btn-close" data-bs-dismiss="offcanvas" />
          </div>
          <div className="offcanvas-body">
            {conversationPreviews.length === 0 ? (
              <div className="alert alert-info">No conversations yet.</div>
            ) : (
              <div className="list-group">
                {conversationPreviews.map((c) => (
                  <div key={c.id} className={`list-group-item ${conversationId === c.id ? "active" : ""}`}>
                    <div className="d-flex justify-content-between align-items-center">
                      <a href={`/messages?conversation_id=${c.id}`} className="fw-bold text-decoration-none text-reset flex-grow-1">
                        {c.title}
                        {c.status === "pending" && <span className="badge bg-warning text-dark ms-2">Pending</span>}
                      </a>
                      <small className="text-muted">
                        {c.lastMessage ? new Date(c.lastMessage.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                      </small>
                    </div>
                    <div className="text-truncate mb-2">{c.lastMessage?.message ?? ""}</div>
                    {c.status === "pending" && (
                      <form action={inviteDecisionAction} className="d-flex gap-2">
                        <input type="hidden" name="conversation_id" value={c.id} />
                        <button type="submit" name="decision" value="accepted" className="btn btn-sm btn-success">Accept</button>
                        <button type="submit" name="decision" value="declined" className="btn btn-sm btn-danger">Decline</button>
                      </form>
                    )}
                  </div>
                ))}
              </div>
            )}
            <button className="btn btn-primary mt-3" data-bs-toggle="modal" data-bs-target="#createConversationModal">
              Create New Conversation
            </button>
          </div>
        </div>

        <div className="modal fade" id="createConversationModal" tabIndex={-1} aria-hidden="true">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Create a New Conversation</h5>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" />
              </div>
              <div className="modal-body">
                <form action={createConversationAction}>
                  <div className="mb-3">
                    <label htmlFor="conversationTitle" className="form-label">Conversation Title</label>
                    <input type="text" className="form-control" id="conversationTitle" name="title" required />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="users" className="form-label">Add Users</label>
                    <select className="form-select" id="users" name="users" required>
                      {allUsers.filter((u) => u.id !== userId).map((u) => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="modal-footer">
                    <button type="submit" className="btn btn-primary">Create Conversation</button>
                    <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-8">
          {conversationId && !isMember && (
            <div className="alert alert-info">
              You don&rsquo;t have access to this chat. Start a new one{" "}
              <a data-bs-toggle="modal" data-bs-target="#createConversationModal">here.</a>
            </div>
          )}

          {activeConversation && (
            <>
              <div className="modal fade" id="conversationInfoModal" tabIndex={-1} aria-hidden="true">
                <div className="modal-dialog">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h5 className="modal-title">Participants</h5>
                      <button type="button" className="btn-close" data-bs-dismiss="modal" />
                    </div>
                    <div className="modal-body">
                      {participants.map((p) => (
                        <div key={p.id} className="d-flex justify-content-between align-items-center mb-2">
                          <span className={`badge bg-${p.status === "accepted" ? "success" : "warning text-dark"}`}>
                            {p.name} ({p.status})
                          </span>
                          {p.id !== activeConversation!.userId && (
                            <form method="POST" action={removeUserAction} className="ms-2">
                              <input type="hidden" name="conversation_id" value={activeConversation!.id} />
                              <input type="hidden" name="user_id" value={p.id} />
                              <button type="submit" className="btn btn-sm btn-outline-danger">
                                {p.id === userId ? "Leave" : "Remove"}
                              </button>
                            </form>
                          )}
                        </div>
                      ))}
                      {activeConversation!.userId === userId && (
                        <button type="button" className="btn btn-sm btn-outline-danger" data-bs-toggle="modal" data-bs-target="#deleteConfirmationModal">
                          Delete Chat
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal fade" id="deleteConfirmationModal" tabIndex={-1} aria-hidden="true">
                <div className="modal-dialog">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h5 className="modal-title">Confirm Deletion</h5>
                      <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" />
                    </div>
                    <div className="modal-body">Are you sure you want to delete this chat? This action cannot be undone.</div>
                    <div className="modal-footer">
                      <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                      <form method="POST" action={deleteConversationAction} className="d-inline">
                        <input type="hidden" name="conversation_id" value={activeConversation!.id} />
                        <ConfirmButton message="Are you sure you want to delete this chat? This action cannot be undone." className="btn btn-danger">
                          Delete Chat
                        </ConfirmButton>
                      </form>
                    </div>
                  </div>
                </div>
              </div>

              <div id="chat-box" className="border p-3 bg-light mb-3" style={{ height: 400, overflowY: "auto" }}>
                {messages.length === 0 ? (
                  <p className="text-muted">No messages yet. Start the conversation.</p>
                ) : (
                  messages.map((m, i) => (
                    <div key={i} className={`d-flex ${m.senderId === userId ? "justify-content-end" : "justify-content-start"}`}>
                      <div
                        className={`mb-2 px-3 py-2 rounded ${m.senderId === userId ? "bg-primary text-white" : "bg-white border"}`}
                        style={{ maxWidth: "75%" }}
                      >
                        <div className="small fw-bold">{m.senderName}</div>
                        <div style={{ whiteSpace: "pre-wrap" }}>{m.message}</div>
                        <div className="small text-muted text-end">
                          {new Date(m.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <form action={sendMessageAction} className="mb-3">
                <input type="hidden" name="conversation_id" value={activeConversation.id} />
                <div className="input-group">
                  <input type="text" name="message" className="form-control" placeholder="Type a message..." required />
                  <button className="btn btn-primary" type="submit">Send</button>
                </div>
              </form>

              <button className="btn btn-outline-success mb-3" data-bs-toggle="modal" data-bs-target="#inviteModal">
                + Invite User
              </button>

              <div className="modal fade" id="inviteModal" tabIndex={-1} aria-hidden="true">
                <div className="modal-dialog">
                  <form method="POST" action={inviteUserAction} className="modal-content">
                    <input type="hidden" name="conversation_id" value={activeConversation.id} />
                    <div className="modal-header">
                      <h5 className="modal-title">Invite User</h5>
                      <button type="button" className="btn-close" data-bs-dismiss="modal" />
                    </div>
                    <div className="modal-body">
                      <label htmlFor="invite_user_id">Select User:</label>
                      <select name="invite_user_id" className="form-select" required>
                        {inviteCandidates.map((u) => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="modal-footer">
                      <button type="submit" className="btn btn-primary">Send Invite</button>
                      <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    </div>
                  </form>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
