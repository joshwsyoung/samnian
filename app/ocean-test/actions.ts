"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { personalityTests, personalityScores } from "@/db/schema";
import { requireUser } from "@/lib/auth";

type Trait = "O" | "C" | "E" | "A" | "N";

export async function submitOceanTestAction(formData: FormData) {
  const session = await requireUser();
  const userId = session.id;

  const questions = await db()
    .select()
    .from(personalityTests)
    .where(eq(personalityTests.required, true));

  const sums: Record<Trait, { sum: number; count: number }> = {
    O: { sum: 0, count: 0 },
    C: { sum: 0, count: 0 },
    E: { sum: 0, count: 0 },
    A: { sum: 0, count: 0 },
    N: { sum: 0, count: 0 },
  };

  for (const q of questions) {
    const raw = formData.get(`question_${q.id}`);
    if (raw === null) continue;

    let value = Number(raw);
    if (Number.isNaN(value)) continue;
    if (q.reverse) value = 6 - value;

    sums[q.trait].sum += value;
    sums[q.trait].count += 1;
  }

  const average = (t: Trait) => (sums[t].count ? sums[t].sum / sums[t].count : 0);

  const scores = {
    userId,
    openness: average("O"),
    conscientiousness: average("C"),
    extraversion: average("E"),
    agreeableness: average("A"),
    neuroticism: average("N"),
    updatedAt: new Date(),
  };

  await db()
    .insert(personalityScores)
    .values(scores)
    .onConflictDoUpdate({ target: personalityScores.userId, set: scores });

  redirect("/events?success=" + encodeURIComponent("Thanks — your personality results are saved! Take a look at what's coming up."));
}
