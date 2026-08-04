import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { PRICE_LEVELS, SLOTS } from "@/lib/constants";
import { createMatchAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewMatchPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin();
  const { error } = await searchParams;

  return (
    <div className="container mt-4">
      <h2>Create New Match</h2>

      {error === "failed" && <div className="alert alert-danger">Please fill in all fields.</div>}

      <form action={createMatchAction}>
        <div className="form-group mb-3">
          <label htmlFor="event_date">Event Date</label>
          <input type="date" className="form-control" name="event_date" required />
        </div>
        <div className="form-group mb-3">
          <label htmlFor="slot">Time Slot</label>
          <select className="form-control" name="slot" required>
            {SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="form-group mb-3">
          <label htmlFor="price_point">Price Point</label>
          <select className="form-control" name="price_point" required>
            {PRICE_LEVELS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="form-check mb-3">
          <input type="checkbox" className="form-check-input" name="approved" id="approved" />
          <label className="form-check-label" htmlFor="approved">Approved</label>
        </div>
        <button type="submit" className="btn btn-success">Create Match</button>{" "}
        <Link href="/admin/matches" className="btn btn-secondary ml-2">Cancel</Link>
      </form>
    </div>
  );
}
