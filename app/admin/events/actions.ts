"use server";

import { redirect } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { events, groups, groupMembers } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { SLOTS, type Slot } from "@/lib/constants";

function readEventFields(formData: FormData) {
  return {
    title: String(formData.get("title") ?? "").trim(),
    restaurantName: String(formData.get("restaurant_name") ?? "").trim(),
    restaurantUrl: String(formData.get("restaurant_url") ?? "").trim() || null,
    imageUrl: String(formData.get("image_url") ?? "").trim() || null,
    address: String(formData.get("address") ?? "").trim() || null,
    description: String(formData.get("description") ?? "").trim() || null,
    eventDate: String(formData.get("event_date") ?? ""),
    slot: String(formData.get("slot") ?? "") as Slot,
    capacity: formData.get("capacity") ? Number(formData.get("capacity")) : null,
    published: formData.get("published") === "on",
  };
}

export async function createEventAction(formData: FormData) {
  await requireAdmin();
  const fields = readEventFields(formData);

  if (!fields.title || !fields.restaurantName || !fields.eventDate || !SLOTS.includes(fields.slot)) {
    redirect("/admin/events/new?error=failed");
  }

  const [event] = await db().insert(events).values(fields).returning();
  if (!event) redirect("/admin/events/new?error=failed");
  redirect(`/admin/events/${event.id}?success=created`);
}

export async function updateEventAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const fields = readEventFields(formData);

  await db().update(events).set(fields).where(eq(events.id, id));
  redirect(`/admin/events/${id}?success=updated`);
}

export async function createGroupAction(formData: FormData) {
  await requireAdmin();
  const eventId = Number(formData.get("event_id"));
  if (!eventId) redirect("/admin/events");

  await db().insert(groups).values({ eventId });
  redirect(`/admin/events/${eventId}`);
}

export async function updateGroupApprovalAction(formData: FormData) {
  await requireAdmin();
  const groupId = Number(formData.get("group_id"));
  const eventId = Number(formData.get("event_id"));
  const approved = formData.get("approved") === "on";

  await db().update(groups).set({ approved }).where(eq(groups.id, groupId));
  redirect(`/admin/events/${eventId}`);
}

export async function addGroupMemberAction(formData: FormData) {
  await requireAdmin();
  const groupId = Number(formData.get("group_id"));
  const eventId = Number(formData.get("event_id"));
  const userId = String(formData.get("user_id") ?? "");
  if (!groupId || !userId) redirect(`/admin/events/${eventId}`);

  await db().insert(groupMembers).values({ groupId, userId }).onConflictDoNothing();
  redirect(`/admin/events/${eventId}`);
}

export async function removeGroupMemberAction(formData: FormData) {
  await requireAdmin();
  const groupId = Number(formData.get("group_id"));
  const eventId = Number(formData.get("event_id"));
  const userId = String(formData.get("user_id") ?? "");

  await db().delete(groupMembers).where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)));
  redirect(`/admin/events/${eventId}`);
}
