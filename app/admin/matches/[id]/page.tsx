import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq, isNotNull, notInArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { availability, interests, matchUsers, matches, personalityScores, userInterests, users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { PRICE_LEVELS, SLOTS, type PriceLevel } from "@/lib/constants";
import { updateMatchAction, updateMatchUsersAction } from "../actions";

export const dynamic = "force-dynamic";

async function interestsFor(userId: number) {
  const rows = await db()
    .select({ name: interests.name })
    .from(userInterests)
    .innerJoin(interests, eq(userInterests.interestId, interests.id))
    .where(eq(userInterests.userId, userId));
  return rows.map((r) => r.name);
}

export default async function EditMatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ city?: string; age?: string; interest?: string; price_point?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const matchId = Number(id);
  const filters = await searchParams;

  const [match] = await db().select().from(matches).where(eq(matches.id, matchId)).limit(1);
  if (!match) notFound();

  const cityRows = await db().selectDistinct({ city: users.city }).from(users).where(isNotNull(users.city));
  const cityOptions = cityRows.map((r) => r.city).filter((c): c is string => Boolean(c)).sort();

  const allInterests = await db().select().from(interests);

  const assignedLinks = await db().select({ userId: matchUsers.userId }).from(matchUsers).where(eq(matchUsers.matchId, matchId));
  const assignedIds = assignedLinks.map((l) => l.userId);

  const assignedUsers = assignedIds.length
    ? await Promise.all(
        assignedIds.map(async (uid) => {
          const [u] = await db().select().from(users).where(eq(users.id, uid)).limit(1);
          const [avail] = await db().select().from(availability).where(eq(availability.userId, uid)).limit(1);
          const [scores] = await db().select().from(personalityScores).where(eq(personalityScores.userId, uid)).limit(1);
          const userInterestNames = await interestsFor(uid);
          return { user: u, availability: avail, scores, interests: userInterestNames };
        })
      )
    : [];

  const unassignedConditions = [assignedIds.length > 0 ? notInArray(users.id, assignedIds) : undefined];
  if (filters.city) unassignedConditions.push(eq(users.city, filters.city));
  if (filters.age) unassignedConditions.push(eq(users.age, Number(filters.age)));
  if (filters.price_point) unassignedConditions.push(eq(users.priceLevel, filters.price_point as PriceLevel));

  let unassignedUsers = await db()
    .select()
    .from(users)
    .where(and(...unassignedConditions.filter((c): c is NonNullable<typeof c> => Boolean(c))));

  if (filters.interest) {
    const interestId = Number(filters.interest);
    const withInterest = await db()
      .select({ userId: userInterests.userId })
      .from(userInterests)
      .where(eq(userInterests.interestId, interestId));
    const idSet = new Set(withInterest.map((r) => r.userId));
    unassignedUsers = unassignedUsers.filter((u) => idSet.has(u.id));
  }

  const unassignedRows = await Promise.all(
    unassignedUsers.map(async (u) => {
      const [scores] = await db().select().from(personalityScores).where(eq(personalityScores.userId, u.id)).limit(1);
      const userInterestNames = await interestsFor(u.id);
      return { user: u, scores, interests: userInterestNames };
    })
  );

  return (
    <div className="container mt-4">
      <h2>Edit Match</h2>
      <form action={updateMatchAction}>
        <input type="hidden" name="id" value={match.id} />

        <div className="form-group mb-3">
          <label htmlFor="event_date">Event Date</label>
          <input type="date" className="form-control" name="event_date" defaultValue={match.eventDate} required />
        </div>

        <div className="form-group mb-3">
          <label htmlFor="slot">Time Slot</label>
          <select className="form-control" name="slot" defaultValue={match.slot} required>
            {SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="form-group mb-3">
          <label htmlFor="price_point">Price Point</label>
          <select className="form-control" name="price_point" defaultValue={match.priceLevel} required>
            {PRICE_LEVELS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div className="form-check mb-3">
          <input type="checkbox" className="form-check-input" name="approved" id="approved" defaultChecked={match.approved} />
          <label className="form-check-label" htmlFor="approved">Approved</label>
        </div>

        <button type="submit" className="btn btn-primary">Save Changes</button>{" "}
        <Link href="/admin/matches" className="btn btn-secondary ml-2">Cancel</Link>
      </form>

      <h3 className="mt-5">Manage Users in This Match</h3>

      <form method="get" className="mb-4">
        <div className="row g-2">
          <div className="col-md-3">
            <select className="form-select" name="city" defaultValue={filters.city ?? ""}>
              <option value="">Any City</option>
              {cityOptions.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="col-md-2">
            <input type="number" name="age" className="form-control" placeholder="Age" defaultValue={filters.age ?? ""} />
          </div>
          <div className="col-md-3">
            <select name="interest" className="form-select" defaultValue={filters.interest ?? ""}>
              <option value="">Any Interest</option>
              {allInterests.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </div>
          <div className="col-md-2">
            <select name="price_point" className="form-select" defaultValue={filters.price_point ?? ""}>
              <option value="">Any Price Point</option>
              {PRICE_LEVELS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="col-md-2">
            <button className="btn btn-primary w-100" type="submit">Filter</button>
          </div>
        </div>
      </form>

      <h5>Assigned Users</h5>
      <div className="table-responsive">
        <table className="table table-bordered mb-3">
          <thead>
            <tr>
              <th>ID</th><th>Name</th><th>Age</th><th>Location</th><th>Price</th>
              <th>O</th><th>C</th><th>E</th><th>A</th><th>N</th><th>Interests</th><th>Action</th>
            </tr>
          </thead>
          <tbody>
            {assignedUsers.map(({ user: u, scores, interests: names }) => u && (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.name}</td>
                <td>{u.age}</td>
                <td>{u.city}</td>
                <td>{u.priceLevel}</td>
                <td>{scores?.openness ?? ""}</td>
                <td>{scores?.conscientiousness ?? ""}</td>
                <td>{scores?.extraversion ?? ""}</td>
                <td>{scores?.agreeableness ?? ""}</td>
                <td>{scores?.neuroticism ?? ""}</td>
                <td>{names.length > 0 ? names.join(", ") : <span className="text-muted">None</span>}</td>
                <td>
                  <form action={updateMatchUsersAction} className="m-0">
                    <input type="hidden" name="action" value="remove" />
                    <input type="hidden" name="match_id" value={matchId} />
                    <input type="hidden" name="user_id" value={u.id} />
                    <button className="btn btn-sm btn-danger">Remove</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h5>Available Users</h5>
      <div className="table-responsive">
        <table className="table table-bordered">
          <thead>
            <tr>
              <th>ID</th><th>Name</th><th>Age</th><th>Location</th><th>Price</th>
              <th>O</th><th>C</th><th>E</th><th>A</th><th>N</th><th>Interests</th><th>Action</th>
            </tr>
          </thead>
          <tbody>
            {unassignedRows.map(({ user: u, scores, interests: names }) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.name}</td>
                <td>{u.age}</td>
                <td>{u.city}</td>
                <td>{u.priceLevel}</td>
                <td>{scores?.openness ?? ""}</td>
                <td>{scores?.conscientiousness ?? ""}</td>
                <td>{scores?.extraversion ?? ""}</td>
                <td>{scores?.agreeableness ?? ""}</td>
                <td>{scores?.neuroticism ?? ""}</td>
                <td>{names.length > 0 ? names.join(", ") : <span className="text-muted">None</span>}</td>
                <td>
                  <form action={updateMatchUsersAction} className="m-0">
                    <input type="hidden" name="action" value="add" />
                    <input type="hidden" name="match_id" value={matchId} />
                    <input type="hidden" name="user_id" value={u.id} />
                    <button className="btn btn-sm btn-success">Add</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
