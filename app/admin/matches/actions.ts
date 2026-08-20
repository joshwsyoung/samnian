"use server";

import { redirect } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { matches, matchUsers } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { PRICE_LEVELS, SLOTS, type PriceLevel, type Slot } from "@/lib/constants";

export async function createMatchAction(formData: FormData) {
  await requireAdmin();

  const eventDate = String(formData.get("event_date") ?? "");
  const slot = String(formData.get("slot") ?? "") as Slot;
  const priceLevel = String(formData.get("price_point") ?? "") as PriceLevel;
  const approved = formData.get("approved") === "on";

  if (!eventDate || !SLOTS.includes(slot) || !PRICE_LEVELS.includes(priceLevel)) {
    redirect("/admin/matches/new?error=failed");
  }

  await db().insert(matches).values({ eventDate, slot, priceLevel, approved });
  redirect("/admin/matches?success=created");
}

export async function updateMatchAction(formData: FormData) {
  await requireAdmin();

  const id = Number(formData.get("id"));
  const eventDate = String(formData.get("event_date") ?? "");
  const slot = String(formData.get("slot") ?? "") as Slot;
  const priceLevel = String(formData.get("price_point") ?? "") as PriceLevel;
  const approved = formData.get("approved") === "on";

  await db().update(matches).set({ eventDate, slot, priceLevel, approved }).where(eq(matches.id, id));
  redirect("/admin/matches?success=match_updated");
}

export async function updateMatchUsersAction(formData: FormData) {
  await requireAdmin();

  const matchId = Number(formData.get("match_id"));
  const userId = String(formData.get("user_id") ?? "");
  const action = String(formData.get("action") ?? "");

  const [match] = await db().select().from(matches).where(eq(matches.id, matchId)).limit(1);
  if (!match) {
    redirect("/admin/matches");
  }

  if (action === "add") {
    await db().insert(matchUsers).values({ matchId, userId });
  } else if (action === "remove") {
    await db().delete(matchUsers).where(and(eq(matchUsers.matchId, matchId), eq(matchUsers.userId, userId)));
  }

  redirect(`/admin/matches/${matchId}`);
}
