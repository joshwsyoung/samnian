"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { requireUser } from "@/lib/auth";

// Sets/replaces the signed-in user's Founder Member Number — purely a
// badge (the number printed on a physical launch ticket), never touches
// auth. Called both from /founder (scanning a ticket's QR code) and from
// the "Account settings" pop-up on /dashboard (manual entry/correction).
export async function claimFounderNumberAction(formData: FormData) {
  const session = await requireUser();

  const raw = String(formData.get("number") ?? "").trim();
  const n = Number(raw);
  if (!raw || !Number.isInteger(n) || n <= 0) {
    redirect("/founder?error=" + encodeURIComponent("Enter the number printed on your ticket."));
  }

  try {
    await db().update(users).set({ foundersNumber: n }).where(eq(users.id, session.id));
  } catch (err) {
    // 23505 = unique_violation — someone else already claimed this number.
    if ((err as { code?: string })?.code === "23505") {
      redirect(
        `/founder?n=${n}&error=` +
          encodeURIComponent(`Founder number #${n} has already been claimed by another member.`)
      );
    }
    throw err;
  }

  redirect(`/founder?n=${n}&success=` + encodeURIComponent(`You're Founder Member #${n}!`));
}
