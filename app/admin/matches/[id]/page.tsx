import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq, isNotNull, notInArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { availability, interests, matchUsers, matches, personalityScores, userInterests, users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { PRICE_LEVELS, SLOTS, type PriceLevel } from "@/lib/constants";
import { updateMatchAction, updateMatchUsersAction } from "../actions";
import "../../../design-system.css";

export const dynamic = "force-dynamic";

async function interestsFor(userId: string) {
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
    <div className="sm-scope container mt-3">
      <div className="sm-page-head">
        <div className="sm-greeting">Edit match</div>
        <div className="sm-sub">{match.eventDate} · {match.slot}</div>
      </div>

      <form action={updateMatchAction} className="sm-card" style={{ marginBottom: 24 }}>
        <input type="hidden" name="id" value={match.id} />

        <div className="sm-field-row">
          <div className="sm-field">
            <label htmlFor="event_date">Event date</label>
            <input type="date" id="event_date" className="sm-input" name="event_date" defaultValue={match.eventDate} required />
          </div>
          <div className="sm-field">
            <label htmlFor="slot">Time slot</label>
            <select id="slot" className="sm-input" name="slot" defaultValue={match.slot} required>
              {SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="sm-field">
            <label htmlFor="price_point">Price point</label>
            <select id="price_point" className="sm-input" name="price_point" defaultValue={match.priceLevel} required>
              {PRICE_LEVELS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <label htmlFor="approved" className="sm-chip-check">
            <input type="checkbox" id="approved" name="approved" defaultChecked={match.approved} />
            <span>Approved</span>
          </label>
        </div>

        <div className="sm-actions">
          <button type="submit" className="sm-btn sm-btn-primary">Save changes</button>
          <Link href="/admin/matches" className="sm-btn sm-btn-ghost">Cancel</Link>
        </div>
      </form>

      <h3 style={{ fontSize: "1.05rem", marginBottom: 14 }}>Manage users in this match</h3>

      <form method="get" className="sm-card" style={{ marginBottom: 24 }}>
        <div className="sm-field-row" style={{ marginBottom: 0 }}>
          <div className="sm-field">
            <label htmlFor="city">City</label>
            <select id="city" className="sm-input" name="city" defaultValue={filters.city ?? ""}>
              <option value="">Any city</option>
              {cityOptions.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="sm-field">
            <label htmlFor="age">Age</label>
            <input type="number" id="age" className="sm-input" name="age" placeholder="Any age" defaultValue={filters.age ?? ""} />
          </div>
          <div className="sm-field">
            <label htmlFor="interest">Interest</label>
            <select id="interest" className="sm-input" name="interest" defaultValue={filters.interest ?? ""}>
              <option value="">Any interest</option>
              {allInterests.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </div>
          <div className="sm-field">
            <label htmlFor="filter_price_point">Price point</label>
            <select id="filter_price_point" className="sm-input" name="price_point" defaultValue={filters.price_point ?? ""}>
              <option value="">Any price point</option>
              {PRICE_LEVELS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <button className="sm-btn sm-btn-primary" type="submit">Filter</button>
        </div>
      </form>

      <h4 style={{ fontSize: "0.92rem", marginBottom: 10 }}>Assigned users</h4>
      <div className="sm-table-wrap" style={{ marginBottom: 24 }}>
        <table className="sm-table">
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
                <td>{names.length > 0 ? names.join(", ") : <span style={{ color: "var(--sm-text-muted)" }}>None</span>}</td>
                <td>
                  <form action={updateMatchUsersAction}>
                    <input type="hidden" name="action" value="remove" />
                    <input type="hidden" name="match_id" value={matchId} />
                    <input type="hidden" name="user_id" value={u.id} />
                    <button className="sm-btn-xs sm-danger">Remove</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h4 style={{ fontSize: "0.92rem", marginBottom: 10 }}>Available users</h4>
      <div className="sm-table-wrap">
        <table className="sm-table">
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
                <td>{names.length > 0 ? names.join(", ") : <span style={{ color: "var(--sm-text-muted)" }}>None</span>}</td>
                <td>
                  <form action={updateMatchUsersAction}>
                    <input type="hidden" name="action" value="add" />
                    <input type="hidden" name="match_id" value={matchId} />
                    <input type="hidden" name="user_id" value={u.id} />
                    <button className="sm-btn-xs sm-accept">Add</button>
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
