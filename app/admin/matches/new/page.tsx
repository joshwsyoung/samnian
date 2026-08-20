import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { PRICE_LEVELS, SLOTS } from "@/lib/constants";
import { createMatchAction } from "../actions";
import "../../../design-system.css";

export const dynamic = "force-dynamic";

export default async function NewMatchPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin();
  const { error } = await searchParams;

  return (
    <div className="sm-scope container mt-3" style={{ maxWidth: 560 }}>
      <div className="sm-page-head">
        <div className="sm-greeting">Create new match</div>
      </div>

      {error === "failed" && <div className="sm-flash error">Please fill in all fields.</div>}

      <form action={createMatchAction} className="sm-card">
        <div className="sm-field-stack">
          <div className="sm-field">
            <label htmlFor="event_date">Event date</label>
            <input type="date" id="event_date" className="sm-input" name="event_date" required />
          </div>
          <div className="sm-field">
            <label htmlFor="slot">Time slot</label>
            <select id="slot" className="sm-input" name="slot" required>
              {SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="sm-field">
            <label htmlFor="price_point">Price point</label>
            <select id="price_point" className="sm-input" name="price_point" required>
              {PRICE_LEVELS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <label htmlFor="approved" className="sm-chip-check" style={{ alignSelf: "flex-start" }}>
            <input type="checkbox" id="approved" name="approved" />
            <span>Approved</span>
          </label>
        </div>

        <div className="sm-actions">
          <button type="submit" className="sm-btn sm-btn-primary">Create match</button>
          <Link href="/admin/matches" className="sm-btn sm-btn-ghost">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
