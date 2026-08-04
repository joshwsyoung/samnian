"use server";

import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { chatMessages, conversationUsers, conversations, matchUsers } from "@/db/schema";
import { requireUser } from "@/lib/auth";

export async function createConversationAction(formData: FormData) {
  const session = await requireUser();
  const userId = Number(session.sub);

  const title = String(formData.get("title") ?? "").trim();
  const invitedUserIds = formData.getAll("users").map(Number).filter(Boolean);
  const matchIdRaw = formData.get("match_id");
  const matchId = matchIdRaw ? Number(matchIdRaw) : null;

  if (!title) {
    redirect("/messages?error=missing_title");
  }

  let invitees = invitedUserIds;
  if (matchId && invitees.length === 0) {
    const rows = await db().select({ userId: matchUsers.userId }).from(matchUsers).where(eq(matchUsers.matchId, matchId));
    invitees = rows.map((r) => r.userId);
  }

  if (matchId) {
    const [existing] = await db().select().from(conversations).where(eq(conversations.matchId, matchId)).limit(1);
    if (existing) {
      redirect(`/messages?conversation_id=${existing.id}`);
    }
  }

  const [conversation] = await db()
    .insert(conversations)
    .values({ title, userId, matchId })
    .returning();

  if (!conversation) {
    redirect("/messages?error=missing_data");
  }

  await db().insert(conversationUsers).values({ conversationId: conversation.id, userId, status: "accepted" });

  const others = invitees.filter((id) => id !== userId);
  if (others.length > 0) {
    await db()
      .insert(conversationUsers)
      .values(others.map((inviteeId) => ({ conversationId: conversation.id, userId: inviteeId, status: "pending" as const })));
  }

  redirect(`/messages?conversation_id=${conversation.id}`);
}

export async function sendMessageAction(formData: FormData) {
  const session = await requireUser();
  const userId = Number(session.sub);
  const conversationId = Number(formData.get("conversation_id"));
  const message = String(formData.get("message") ?? "").trim();

  if (!conversationId || !message) {
    redirect("/messages?error=missing_message_or_conversation");
  }

  const [membership] = await db()
    .select()
    .from(conversationUsers)
    .where(and(eq(conversationUsers.conversationId, conversationId), eq(conversationUsers.userId, userId)))
    .limit(1);

  if (!membership) {
    redirect("/messages?error=not_in_conversation");
  }

  await db().insert(chatMessages).values({ conversationId, senderId: userId, message });
  redirect(`/messages?conversation_id=${conversationId}`);
}

export async function inviteDecisionAction(formData: FormData) {
  const session = await requireUser();
  const userId = Number(session.sub);
  const conversationId = Number(formData.get("conversation_id"));
  const decision = String(formData.get("decision") ?? "");

  if (!conversationId || (decision !== "accepted" && decision !== "declined")) {
    redirect("/messages?error=missing_data");
  }

  const [invitation] = await db()
    .select()
    .from(conversationUsers)
    .where(
      and(
        eq(conversationUsers.conversationId, conversationId),
        eq(conversationUsers.userId, userId),
        eq(conversationUsers.status, "pending")
      )
    )
    .limit(1);

  if (!invitation) {
    redirect("/messages?error=no_pending_invitation");
  }

  await db()
    .update(conversationUsers)
    .set({ status: decision as "accepted" | "declined" })
    .where(and(eq(conversationUsers.conversationId, conversationId), eq(conversationUsers.userId, userId)));

  redirect(`/messages?conversation_id=${conversationId}`);
}

export async function inviteUserAction(formData: FormData) {
  const session = await requireUser();
  const userId = Number(session.sub);
  const conversationId = Number(formData.get("conversation_id"));
  const inviteUserId = Number(formData.get("invite_user_id"));

  if (!conversationId || !inviteUserId) {
    redirect("/messages?error=missing_data");
  }

  const [membership] = await db()
    .select()
    .from(conversationUsers)
    .where(and(eq(conversationUsers.conversationId, conversationId), eq(conversationUsers.userId, userId)))
    .limit(1);

  if (!membership) {
    redirect("/messages?error=not_in_conversation");
  }

  const [already] = await db()
    .select()
    .from(conversationUsers)
    .where(and(eq(conversationUsers.conversationId, conversationId), eq(conversationUsers.userId, inviteUserId)))
    .limit(1);

  if (!already) {
    await db().insert(conversationUsers).values({ conversationId, userId: inviteUserId, status: "pending" });
  }

  redirect(`/messages?conversation_id=${conversationId}`);
}

export async function removeUserAction(formData: FormData) {
  const session = await requireUser();
  const userId = Number(session.sub);
  const conversationId = Number(formData.get("conversation_id"));
  const userIdToRemove = Number(formData.get("user_id"));

  if (!conversationId || !userIdToRemove) {
    redirect("/messages?error=missing_data");
  }

  const [membership] = await db()
    .select()
    .from(conversationUsers)
    .where(and(eq(conversationUsers.conversationId, conversationId), eq(conversationUsers.userId, userId)))
    .limit(1);

  if (!membership) {
    redirect("/messages?error=not_in_conversation");
  }

  const [conversation] = await db().select().from(conversations).where(eq(conversations.id, conversationId)).limit(1);

  if (conversation && userIdToRemove === conversation.userId) {
    redirect(`/messages?conversation_id=${conversationId}&error=cant_remove_creator`);
  }

  await db()
    .delete(conversationUsers)
    .where(and(eq(conversationUsers.conversationId, conversationId), eq(conversationUsers.userId, userIdToRemove)));

  redirect(userIdToRemove === userId ? "/messages" : `/messages?conversation_id=${conversationId}`);
}

export async function deleteConversationAction(formData: FormData) {
  const session = await requireUser();
  const userId = Number(session.sub);
  const conversationId = Number(formData.get("conversation_id"));

  if (!conversationId) {
    redirect("/messages?error=missing_id");
  }

  const [conversation] = await db().select().from(conversations).where(eq(conversations.id, conversationId)).limit(1);

  if (!conversation || conversation.userId !== userId) {
    redirect("/messages?error=not_creator");
  }

  await db().delete(conversations).where(eq(conversations.id, conversationId));
  redirect("/messages?deleted=1");
}
