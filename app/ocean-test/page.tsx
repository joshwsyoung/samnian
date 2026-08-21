import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { personalityTests } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import OceanTestForm from "@/components/OceanTestForm";
import "../design-system.css";

export const dynamic = "force-dynamic";

export default async function OceanTestPage({
  searchParams,
}: {
  searchParams: Promise<{ required?: string; next?: string }>;
}) {
  await requireUser();
  const { required, next } = await searchParams;

  const questions = await db()
    .select()
    .from(personalityTests)
    .where(and(eq(personalityTests.required, true), eq(personalityTests.active, true)))
    .orderBy(asc(personalityTests.id));

  if (questions.length === 0) {
    return (
      <div className="sm-scope container mt-3">
        <div className="sm-flash error">No questions available for the test.</div>
      </div>
    );
  }

  return (
    <div className="sm-scope container mt-3" style={{ maxWidth: 640 }}>
      <div className="sm-page-head">
        <div className="sm-greeting">Personality profile</div>
        <div className="sm-sub">A couple of minutes — helps us match you with people you&rsquo;ll get on with.</div>
      </div>
      {required === "1" && (
        <div className="sm-flash info">
          Quick one first — this helps us group you with people you&rsquo;ll actually get on with.
          You&rsquo;ll need to finish it before you can browse and RSVP to events.
        </div>
      )}
      <div className="sm-card">
        <OceanTestForm
          questions={questions.map((q) => ({ id: q.id, question: q.question, options: q.options }))}
          next={next}
        />
      </div>
    </div>
  );
}
