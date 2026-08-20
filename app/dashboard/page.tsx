import { and, eq, gte } from "drizzle-orm";
import { db } from "@/lib/db";
import { availability, matches, users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { firstNameFrom, getGreeting } from "@/lib/greeting";
import { SLOTS } from "@/lib/constants";
import Flash from "@/components/Flash";
import ThemeToggle from "@/components/ThemeToggle";
import { updateAvailabilityAction, updatePreferencesAction, updatePricePointAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const session = await requireUser();
  const { success, error } = await searchParams;
  const userId = session.id;

  const [user] = await db().select().from(users).where(eq(users.id, userId)).limit(1);
  const [userAvailability] = await db().select().from(availability).where(eq(availability.userId, userId)).limit(1);

  const today = new Date().toISOString().slice(0, 10);
  const upcomingMatches = (
    await db()
      .select()
      .from(matches)
      .where(and(gte(matches.eventDate, today), eq(matches.approved, true)))
  ).sort((a, b) => a.eventDate.localeCompare(b.eventDate) || SLOTS.indexOf(a.slot) - SLOTS.indexOf(b.slot));

  const greeting = `${getGreeting()}${firstNameFrom(user?.name)}.`;

  return (
    <div className="container mt-3">
      <h2 className="display-6 mb-3 mt-3">{greeting}</h2>

      <Flash success={success} error={error} />

      <div className="row">
        <div className="col-md-4 mb-3">
          <div className="card">
            <div className="card-body fw-lighter fs-6">
              <h5 className="card-title">Dinner options</h5>
              <p>Update your availability and price preference based on existing upcoming matches.</p>
              <div className="d-flex flex-wrap gap-2 mt-3">
                <button className="btn btn-secondary" data-bs-toggle="modal" data-bs-target="#preferencesModal">
                  Choose Session
                </button>
                <button className="btn btn-secondary" data-bs-toggle="modal" data-bs-target="#updateAvailabilityModal">
                  Update Availability
                </button>
                <button className="btn btn-secondary" data-bs-toggle="modal" data-bs-target="#updatePricePointModal">
                  Update Price Point
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-md-6 mb-3">
          <div className="card">
            <ThemeToggle currentTheme={user?.theme ?? "light"} />
          </div>
        </div>
      </div>

      {/* Modal: choose a match/session */}
      <div className="modal fade" id="preferencesModal" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog">
          <form action={updatePreferencesAction} className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Edit Preferences</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" />
            </div>
            <div className="modal-body">
              {upcomingMatches.length > 0 ? (
                <div className="mb-3">
                  <label htmlFor="match_id" className="form-label">Choose your preferred session</label>
                  <select name="match_id" id="match_id" className="form-select" required>
                    {upcomingMatches.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.eventDate} at {m.slot} ({m.priceLevel})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <p className="text-muted">No upcoming sessions available yet. Please check back later.</p>
              )}
            </div>
            <div className="modal-footer d-flex justify-content-start">
              <button type="submit" className="btn" disabled={upcomingMatches.length === 0}>Save Changes</button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal: update availability */}
      <div className="modal fade" id="updateAvailabilityModal" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog">
          <div className="modal-content fw-lighter">
            <div className="modal-header">
              <h5 className="modal-title">Update Your Availability</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" />
            </div>
            <div className="modal-body">
              <form action={updateAvailabilityAction}>
                <div className="mb-3">
                  <label htmlFor="event_date">Choose a Wednesday:</label>
                  <input
                    type="date"
                    name="event_date"
                    className="form-control"
                    defaultValue={userAvailability?.eventDate}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="slot">Choose a time slot:</label>
                  <select name="slot" className="form-control" defaultValue={userAvailability?.slot} required>
                    {SLOTS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="btn mt-3">Save Availability</button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: update price point */}
      <div className="modal fade" id="updatePricePointModal" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog">
          <div className="modal-content fw-lighter">
            <div className="modal-header">
              <h5 className="modal-title">Update Your Price Point</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" />
            </div>
            <div className="modal-body">
              <form action={updatePricePointAction}>
                <div className="mb-3">
                  <label htmlFor="price_point">Choose a price point:</label>
                  <select name="price_point" className="form-control" defaultValue={user?.priceLevel ?? ""} required>
                    <option value="£">£</option>
                    <option value="££">££</option>
                    <option value="£££">£££</option>
                  </select>
                </div>
                <button type="submit" className="btn mt-3">Save Price Point</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
