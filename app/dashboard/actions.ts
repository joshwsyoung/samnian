"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { availability, matchUsers, users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { PRICE_LEVELS, SLOTS, type PriceLevel, type Slot } from "@/lib/constants";

export async function updateThemeAction(formData: FormData) {
  const session = await requireUser();
  const theme = formData.get("theme") === "dark" ? "dark" : "light";
  await db().update(users).set({ theme }).where(eq(users.id, Number(session.sub)));
}

export async function updateAvailabilityAction(formData: FormData) {
  const session = await requireUser();
  const eventDate = String(formData.get("event_date") ?? "");
  const slot = String(formData.get("slot") ?? "") as Slot;

  if (!eventDate || !SLOTS.includes(slot)) {
    redirect("/dashboard?error=" + encodeURIComponent("Please select a date and time slot."));
  }

  const userId = Number(session.sub);
  await db()
    .insert(availability)
    .values({ userId, eventDate, slot })
    .onConflictDoUpdate({ target: availability.userId, set: { eventDate, slot } });

  redirect("/dashboard?success=" + encodeURIComponent("Availability updated successfully!"));
}

export async function updatePricePointAction(formData: FormData) {
  const session = await requireUser();
  const priceLevel = String(formData.get("price_point") ?? "") as PriceLevel;

  if (!PRICE_LEVELS.includes(priceLevel)) {
    redirect("/dashboard?error=" + encodeURIComponent("Price point is required."));
  }

  await db().update(users).set({ priceLevel }).where(eq(users.id, Number(session.sub)));
  redirect("/dashboard?success=" + encodeURIComponent("Price point updated successfully!"));
}

export async function updatePreferencesAction(formData: FormData) {
  const session = await requireUser();
  const matchId = Number(formData.get("match_id"));
  if (!matchId) {
    redirect("/dashboard?error=" + encodeURIComponent("Invalid match selection."));
  }

  const userId = Number(session.sub);
  await db().delete(matchUsers).where(eq(matchUsers.userId, userId));
  await db().insert(matchUsers).values({ matchId, userId });

  redirect("/dashboard?success=" + encodeURIComponent("Preference saved!"));
}
