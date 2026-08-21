"use server";

import { redirect } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { eventInterest } from "@/db/schema";
import { requireCompletedOceanTest } from "@/lib/auth";
import { PRICE_TIER_VALUES, type PriceTier } from "@/lib/constants";

export async function setEventInterestAction(formData: FormData) {
  const eventId = Number(formData.get("event_id"));
  const session = await requireCompletedOceanTest(eventId ? `/events/${eventId}` : undefined);

  const priceTier = String(formData.get("price_tier") ?? "") as PriceTier;

  if (!eventId || !PRICE_TIER_VALUES.includes(priceTier)) {
    redirect(`/events/${eventId || ""}?error=` + encodeURIComponent("Please choose a price point."));
  }

  await db()
    .insert(eventInterest)
    .values({ eventId, userId: session.id, priceTier })
    .onConflictDoUpdate({ target: [eventInterest.eventId, eventInterest.userId], set: { priceTier } });

  redirect(`/events/${eventId}?success=` + encodeURIComponent("You're in! We'll be in touch once your table's set."));
}

export async function withdrawEventInterestAction(formData: FormData) {
  const eventId = Number(formData.get("event_id"));
  const session = await requireCompletedOceanTest(eventId ? `/events/${eventId}` : undefined);
  if (!eventId) redirect("/events");

  await db()
    .delete(eventInterest)
    .where(and(eq(eventInterest.eventId, eventId), eq(eventInterest.userId, session.id)));

  redirect(`/events/${eventId}?success=` + encodeURIComponent("You're no longer down for this one."));
}
