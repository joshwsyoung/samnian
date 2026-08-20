import Image from "next/image";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { interests, matches, matchUsers, personalityScores, userInterests, users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { firstNameFrom, getGreeting } from "@/lib/greeting";
import { CITIES, PRICE_LEVELS } from "@/lib/constants";
import Flash from "@/components/Flash";
import ThemeToggle from "@/components/ThemeToggle";
import InterestPicker from "@/components/InterestPicker";
import ConfirmButton from "@/components/ConfirmButton";
import OceanChart from "@/components/OceanChart";
import { deleteAccountAction, updateInterestsAction, updateProfileAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const session = await requireUser();
  const { success, error } = await searchParams;
  const userId = session.id;

  const [user] = await db().select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) {
    return <div className="container"><div className="alert alert-danger text-center mt-5">User not found.</div></div>;
  }

  const [scores] = await db().select().from(personalityScores).where(eq(personalityScores.userId, userId)).limit(1);

  const allInterests = await db().select().from(interests);
  const selectedInterestRows = await db()
    .select({ name: interests.name })
    .from(userInterests)
    .innerJoin(interests, eq(userInterests.interestId, interests.id))
    .where(eq(userInterests.userId, userId));
  const selectedInterestNames = selectedInterestRows.map((r) => r.name);

  const [myMatchLink] = await db().select().from(matchUsers).where(eq(matchUsers.userId, userId)).limit(1);
  const myMatch = myMatchLink
    ? (await db().select().from(matches).where(eq(matches.id, myMatchLink.matchId)).limit(1))[0]
    : undefined;

  const requiredFields = [user.name, user.email, user.phone, user.age, user.city, user.priceLevel, user.profileImage];
  const profileComplete = requiredFields.every((f) => f !== null && f !== undefined && f !== "");

  const greeting = `${getGreeting()}${firstNameFrom(user.name)}.`;
  const maxInterestsShown = 7;
  const moreCount = selectedInterestNames.length - maxInterestsShown;

  return (
    <div className="container py-5">
      <div className="text-center mb-4">
        <h2 className="display-6 mb-3 mt-3">{greeting}</h2>
        <p className="text-muted">Here&rsquo;s what we&rsquo;ve got on file for you.</p>
      </div>

      <Flash success={success} error={error} />

      <div className="row justify-content-center">
        <div className="col-md-4 text-center mb-4">
          <div className="card shadow-sm p-3">
            {user.profileImage && (
              <Image
                src={user.profileImage}
                width={120}
                height={120}
                className="rounded-circle mb-3 d-block mx-auto profile-image"
                alt="Profile"
              />
            )}
            <h5 className="fw-semibold fs-3">{user.name}</h5>
            <div className="row">
              <div className="col-6">
                <Link className="btn btn-secondary mt-3 w-100" href="/messages">
                  <i className="bi bi-chat" /> Chats
                </Link>
              </div>
              <div className="col-6">
                <button className="btn btn-secondary mt-3 w-100" data-bs-toggle="modal" data-bs-target="#updateProfileModal">
                  <i className="bi bi-pencil-square" /> Edit Profile
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-8">
          <div className="card shadow-sm p-4">
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Phone:</strong> {user.phone}</p>
            <p><strong>Age:</strong> {user.age}</p>
            <p><strong>City:</strong> {user.city}</p>
            <p><strong>Price Point:</strong> {user.priceLevel}</p>

            {!profileComplete && (
              <div className="d-flex justify-content-center">
                <button className="btn btn-secondary mt-3 w-auto" data-bs-toggle="modal" data-bs-target="#updateProfileModal">
                  Complete Your Profile
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-md-6 mt-3">
          <div className="card">
            <div className="card-body fw-lighter fs-6">
              <h5 className="card-title">My Interests</h5>
              {selectedInterestNames.length > 0 ? (
                <ul className="list-unstyled mb-0 small">
                  {selectedInterestNames.slice(0, maxInterestsShown).map((name) => (
                    <li key={name}>&bull; {name}</li>
                  ))}
                  {moreCount > 0 && <li className="text-muted">+ {moreCount} more</li>}
                </ul>
              ) : (
                <p className="text-muted">You haven&rsquo;t selected any interests yet.</p>
              )}
              <button className="btn btn-secondary mt-3" data-bs-toggle="modal" data-bs-target="#updateInterestsModal">
                Edit Preferences
              </button>
            </div>
          </div>
        </div>
        <div className="col-md-6 mt-3">
          <div className="card">
            <div className="card-body fw-lighter fs-6">
              <h5 className="card-title">Your Match</h5>
              {myMatch ? (
                <p><strong>Matched Table:</strong> Event on {myMatch.eventDate} at {myMatch.slot}.</p>
              ) : (
                <p>No matches yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card personality-card mt-3 mb-4">
        <div className="card-body">
          <div className="row mb-2">
            <div className="col"><h5 className="card-title">OCEAN Personality Test</h5></div>
            <div className="col-auto">
              <button className="btn btn-secondary" data-bs-toggle="modal" data-bs-target="#personalSummaryModal">
                <i className="bi bi-info-circle" />
              </button>
            </div>
          </div>
          {scores ? (
            <OceanChart scores={scores} />
          ) : (
            <>
              <p>Personality scores not available. Please take the test.</p>
              <Link className="btn btn-secondary mt-3" href="/ocean-test">Take the test!</Link>
            </>
          )}
        </div>
      </div>

      {/* Update profile modal */}
      <div className="modal fade" id="updateProfileModal" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog">
          <div className="modal-content fw-lighter">
            <div className="modal-header">
              <h5 className="modal-title">Update Your Profile</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" />
            </div>
            <div className="modal-body">
              <form action={updateProfileAction} encType="multipart/form-data">
                <div className="mb-3">
                  <label htmlFor="name">Name</label>
                  <input type="text" name="name" className="form-control" defaultValue={user.name} required />
                </div>
                <div className="mb-3">
                  <label htmlFor="email">Email</label>
                  <input type="email" className="form-control" defaultValue={user.email} disabled />
                  <div className="form-text">Your login email — contact us to change it.</div>
                </div>
                <div className="mb-3">
                  <label htmlFor="phone">Phone</label>
                  <input type="text" className="form-control" name="phone" defaultValue={user.phone ?? ""} required />
                </div>
                <div className="mb-3">
                  <label htmlFor="age">Age</label>
                  <input type="number" className="form-control" name="age" defaultValue={user.age ?? ""} required />
                </div>
                <div className="mb-3">
                  <label htmlFor="city">City</label>
                  <select className="form-select" name="city" defaultValue={user.city ?? ""} required>
                    <option value="" disabled>Select City</option>
                    {CITIES.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label htmlFor="price_point">Preferred Price Point</label>
                  <select className="form-select" name="price_point" defaultValue={user.priceLevel ?? ""} required>
                    {PRICE_LEVELS.map((level) => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label htmlFor="profile_image">Profile Image</label>
                  <input type="file" name="profile_image" className="form-control" accept="image/*" />
                  {user.profileImage && (
                    <Image
                      src={user.profileImage}
                      alt="Current profile"
                      width={100}
                      height={100}
                      className="img-thumbnail mt-2"
                    />
                  )}
                </div>
                <button type="submit" className="btn btn-secondary mt-3">Save Changes</button>
              </form>

              <ThemeToggle currentTheme={user.theme} />

              <hr />

              <form action={deleteAccountAction}>
                <ConfirmButton
                  message="Are you sure you want to delete your account? This cannot be undone."
                  className="btn btn-outline-danger"
                >
                  Delete Account
                </ConfirmButton>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Personality summary modal */}
      <div className="modal fade" id="personalSummaryModal" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog" role="document">
          <div className="modal-content fw-lighter">
            <div className="modal-header">
              <h5 className="modal-title">Your Personality Summary</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" />
            </div>
            <div className="modal-body">
              <p><strong>Openness:</strong><br /><em>High:</em> Curious, imaginative, open to new experiences, enjoys art and ideas.<br /><em>Low:</em> Practical, prefers routine, conservative in views, uncomfortable with change.</p>
              <p><strong>Conscientiousness:</strong><br /><em>High:</em> Organized, responsible, reliable, goal-oriented, plans ahead.<br /><em>Low:</em> Spontaneous, careless with details, disorganized, struggles with follow-through.</p>
              <p><strong>Extraversion:</strong><br /><em>High:</em> Outgoing, energetic, talkative, enjoys social settings, assertive.<br /><em>Low:</em> Reserved, reflective, prefers solitude, quiet, finds socializing draining.</p>
              <p><strong>Agreeableness:</strong><br /><em>High:</em> Compassionate, cooperative, trusting, empathetic, values getting along.<br /><em>Low:</em> Competitive, skeptical, blunt, more focused on self-interest.</p>
              <p><strong>Neuroticism:</strong><br /><em>High:</em> Emotionally reactive, anxious, prone to stress, mood swings.<br /><em>Low:</em> Calm, emotionally stable, resilient, handles stress well.</p>
              <p className="text-muted">Use the chart to interpret your scores: <br />0 = Low, 5 = High.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Interests modal */}
      <div className="modal fade" id="updateInterestsModal" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog">
          <div className="modal-content fw-lighter">
            <div className="modal-header">
              <h5 className="modal-title">Update Your Interests</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" />
            </div>
            <div className="modal-body">
              <form action={updateInterestsAction}>
                <InterestPicker
                  interests={allInterests}
                  defaultSelected={selectedInterestNames}
                  fieldName="selected_interests"
                />
                <button type="submit" className="btn btn-primary mt-3">Save Changes</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
