import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import EventFormFields from "@/components/EventFormFields";
import { createEventAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewEventPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin();
  const { error } = await searchParams;

  return (
    <div className="container mt-4">
      <h2>Create New Event</h2>

      {error === "failed" && <div className="alert alert-danger">Please fill in the required fields.</div>}

      <form action={createEventAction}>
        <EventFormFields />
        <button type="submit" className="btn btn-success">Create Event</button>{" "}
        <Link href="/admin/events" className="btn btn-secondary ms-2">Cancel</Link>
      </form>
    </div>
  );
}
