import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { personalityTests } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import OceanTestForm from "@/components/OceanTestForm";

export const dynamic = "force-dynamic";

export default async function OceanTestPage({
  searchParams,
}: {
  searchParams: Promise<{ required?: string }>;
}) {
  await requireUser();
  const { required } = await searchParams;

  const questions = await db()
    .select()
    .from(personalityTests)
    .where(and(eq(personalityTests.required, true), eq(personalityTests.active, true)))
    .orderBy(asc(personalityTests.id));

  if (questions.length === 0) {
    return (
      <div className="container">
        <div className="alert alert-danger mt-5">No questions available for the test.</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="top mt-5">
        <h2 className="mb-4 fw-lighter text-center">OCEAN Personality Test</h2>
        {required === "1" && (
          <div className="alert alert-info text-center">
            Quick one first — this helps us group you with people you&rsquo;ll actually get on with.
            You&rsquo;ll need to finish it before you can browse and RSVP to events.
          </div>
        )}
        <OceanTestForm
          questions={questions.map((q) => ({ id: q.id, question: q.question, options: q.options }))}
        />
      </div>
    </div>
  );
}
