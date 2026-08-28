/**
 * Seeds 30 fake members for testing dinner groups/chat locally: real
 * Supabase Auth users (so they can actually log in), profile rows,
 * interests, OCEAN scores, RSVPs spread across the existing events, and
 * one fully-formed dinner group (event 3's group) with a conversation and
 * a short chat, so you can log in as one of its members and see the
 * confirmed-table + chat experience immediately.
 *
 * Every seed row is tagged with the @samnianseed.test email domain and is
 * safe to re-run — later runs skip anything that already exists by email.
 * All 30 share one password: SamnianSeed26!
 *
 * Inserts straight into auth.users/auth.identities with a bcrypt hash via
 * pgcrypto's crypt()/gen_salt('bf') — the same shape GoTrue itself writes
 * — since there's no service-role signup flow for creating many accounts
 * at once. Needs DATABASE_URL to be the *direct* Postgres connection (not
 * the pooler) or a role with access to the auth schema; the Supabase
 * dashboard's SQL editor works too if this script's connection lacks it.
 *
 * Run with: npm run db:seed:members
 */
import "dotenv/config";
import postgres from "postgres";

const FIRST = ["Amelia","Oliver","Isla","George","Freya","Noah","Ivy","Leo","Grace","Arthur",
  "Poppy","Jack","Ella","Harry","Millie","Charlie","Ruby","Oscar","Daisy","Freddie",
  "Sophie","Henry","Chloe","Alfie","Lily","Theo","Evie","Jacob","Maya","Finn"];
const LAST = ["Bennett","Carter","Dawson","Ellis","Fletcher","Grant","Hayes","Irwin","Jenkins","Knight",
  "Lawson","Mercer","Nash","Osei","Palmer","Quigley","Reeves","Sutton","Turner","Underwood",
  "Vaughan","Walsh","Yates","Abbott","Bryant","Chapman","Dixon","Everett","Foster","Gibson"];
const CITIES = ["London", "London", "London", "London", "Marlow", "Bristol", "Bristol", "Durban SA"]; // weight toward London
const INTERESTS = [
  "Cooking", "Hiking", "Travel", "Reading", "Live Music", "Film & TV", "Photography", "Yoga", "Cycling",
  "Board Games", "Wine Tasting", "Art & Design", "Technology", "Gaming", "Football", "Running",
  "Gardening", "Volunteering", "Comedy", "Theatre",
];
const TIERS = ["broke", "modest", "fun", "baller"];

// The event this seed places a full dinner group into — must already
// exist, published or not. Swap this to whichever event id you want the
// example group/chat attached to.
const GROUP_EVENT_ID = 3;
const GROUP_EVENT_TITLE = "Long Table Dinner";
const GROUP_RESTAURANT = "Borough Bistro";

/** Small deterministic PRNG so re-runs generate the exact same fake people. */
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}
const rand = seededRandom(20260827);
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)]!;
const int = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1));
const trait = () => Number((1.2 + rand() * 3.6).toFixed(2));

type SeedUser = {
  name: string;
  email: string;
  age: number;
  city: string;
  phone: string;
  interests: string[];
  traits: [number, number, number, number, number];
};

function buildUsers(): SeedUser[] {
  const users: SeedUser[] = [];
  for (let i = 0; i < 30; i++) {
    const first = FIRST[i]!;
    const last = pick(LAST);
    const shuffled = [...INTERESTS].sort(() => rand() - 0.5);
    users.push({
      name: `${first} ${last}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}${i}@samnianseed.test`,
      age: int(22, 46),
      city: pick(CITIES),
      phone: `+447${int(100000000, 999999999)}`,
      interests: shuffled.slice(0, int(2, 5)),
      traits: [trait(), trait(), trait(), trait(), trait()],
    });
  }
  return users;
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local first.");
  }
  const sql = postgres(url, { prepare: false });
  const users = buildUsers();
  const table = users.slice(0, 6); // the six who get placed into the example group

  try {
    await sql.begin(async (tx) => {
      await tx`
        insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, reauthentication_token, phone_change, phone_change_token)
        select '00000000-0000-0000-0000-000000000000'::uuid, gen_random_uuid(), 'authenticated', 'authenticated', v.email, crypt('SamnianSeed26!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, jsonb_build_object('full_name', v.name), false, false, now(), now(), '', '', '', '', '', '', '', ''
        from (select unnest(${users.map((u) => u.email)}::text[]) as email, unnest(${users.map((u) => u.name)}::text[]) as name) v
        where not exists (select 1 from auth.users existing where existing.email = v.email)
      `;

      await tx`
        insert into auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
        select gen_random_uuid(), au.id::text, au.id, jsonb_build_object('sub', au.id::text, 'email', au.email, 'email_verified', true), 'email', now(), now(), now()
        from auth.users au
        where au.email like '%@samnianseed.test'
        and not exists (select 1 from auth.identities i where i.user_id = au.id and i.provider = 'email')
      `;

      await tx`
        insert into public.users (id, name, email, phone, age, city, role, created_at)
        select au.id, v.name, v.email, v.phone, v.age, v.city, 'user', now()
        from (select
            unnest(${users.map((u) => u.email)}::text[]) as email,
            unnest(${users.map((u) => u.name)}::text[]) as name,
            unnest(${users.map((u) => u.phone)}::text[]) as phone,
            unnest(${users.map((u) => u.age)}::int[]) as age,
            unnest(${users.map((u) => u.city)}::text[]) as city
        ) v
        join auth.users au on au.email = v.email
        where not exists (select 1 from public.users existing where existing.id = au.id)
      `;

      await tx`
        insert into personality_scores (user_id, openness, conscientiousness, extraversion, agreeableness, neuroticism, updated_at)
        select au.id, v.o, v.c, v.e, v.a, v.n, now()
        from (select
            unnest(${users.map((u) => u.email)}::text[]) as email,
            unnest(${users.map((u) => u.traits[0])}::numeric[]) as o,
            unnest(${users.map((u) => u.traits[1])}::numeric[]) as c,
            unnest(${users.map((u) => u.traits[2])}::numeric[]) as e,
            unnest(${users.map((u) => u.traits[3])}::numeric[]) as a,
            unnest(${users.map((u) => u.traits[4])}::numeric[]) as n
        ) v
        join auth.users au on au.email = v.email
        on conflict (user_id) do nothing
      `;

      const interestPairs = users.flatMap((u) => u.interests.map((name) => ({ email: u.email, name })));
      await tx`
        insert into user_interests (user_id, interest_id)
        select au.id, i.id
        from (select
            unnest(${interestPairs.map((p) => p.email)}::text[]) as email,
            unnest(${interestPairs.map((p) => p.name)}::text[]) as interest_name
        ) v
        join auth.users au on au.email = v.email
        join interests i on i.name = v.interest_name
        on conflict do nothing
      `;

      // ~65% of seed users RSVP to 1-2 of the events already in the DB.
      const eventIds = await tx<{ id: number }[]>`select id from samnian_events order by id`;
      if (eventIds.length > 0) {
        const rsvps: { email: string; eventId: number; tier: string }[] = [];
        for (const u of users) {
          if (rand() < 0.65) {
            const chosen = [...eventIds].sort(() => rand() - 0.5).slice(0, int(1, Math.min(2, eventIds.length)));
            for (const e of chosen) rsvps.push({ email: u.email, eventId: e.id, tier: pick(TIERS) });
          }
        }
        if (rsvps.length > 0) {
          await tx`
            insert into samnian_event_interest (event_id, user_id, price_tier)
            select v.event_id, au.id, v.tier::price_tier
            from (select
                unnest(${rsvps.map((r) => r.email)}::text[]) as email,
                unnest(${rsvps.map((r) => r.eventId)}::int[]) as event_id,
                unnest(${rsvps.map((r) => r.tier)}::text[]) as tier
            ) v
            join auth.users au on au.email = v.email
            on conflict do nothing
          `;
        }
      }

      // The example dinner group: find-or-create an (approved) group for
      // GROUP_EVENT_ID, then place `table`'s six members into it.
      const [group] = await tx<{ id: number }[]>`
        select id from samnian_groups where event_id = ${GROUP_EVENT_ID} order by id limit 1
      `;
      const groupId =
        group?.id ??
        (
          await tx<{ id: number }[]>`
            insert into samnian_groups (event_id, approved) values (${GROUP_EVENT_ID}, true) returning id
          `
        )[0]!.id;

      await tx`
        insert into samnian_event_interest (event_id, user_id, price_tier)
        select ${GROUP_EVENT_ID}, au.id, 'fun'::price_tier
        from (select unnest(${table.map((u) => u.email)}::text[]) as email) v
        join auth.users au on au.email = v.email
        on conflict do nothing
      `;

      await tx`
        insert into samnian_group_members (group_id, user_id)
        select ${groupId}, au.id
        from (select unnest(${table.map((u) => u.email)}::text[]) as email) v
        join auth.users au on au.email = v.email
        on conflict do nothing
      `;

      await tx`
        insert into conversations (title, user_id, group_id, created_at)
        select ${GROUP_EVENT_TITLE}, au.id, ${groupId}, now()
        from auth.users au where au.email = ${table[0]!.email}
        and not exists (select 1 from conversations where group_id = ${groupId})
      `;

      const [conv] = await tx<{ id: number }[]>`
        select id from conversations where group_id = ${groupId} order by id desc limit 1
      `;
      if (conv) {
        await tx`
          insert into conversation_users (conversation_id, user_id, status)
          select ${conv.id}, au.id, 'accepted'
          from (select unnest(${table.map((u) => u.email)}::text[]) as email) v
          join auth.users au on au.email = v.email
          on conflict do nothing
        `;

        const chatScript: [number, string][] = [
          [0, `Excited for this one! Anyone been to ${GROUP_RESTAURANT} before?`],
          [1, "Not yet, but I've heard great things about their steak."],
          [2, "Count me in for a starter to share if anyone's up for it"],
          [3, "What time are we all aiming to get there for?"],
          [0, "Booking's for 7, so I'll head over for about 6:50"],
          [4, "Perfect, see you all there!"],
        ];
        await tx`
          insert into chat_messages (conversation_id, sender_id, message, sent_at)
          select ${conv.id}, au.id, v.message, now() - (v.mins_ago || ' minutes')::interval
          from (select
              unnest(${chatScript.map(([i]) => table[i]!.email)}::text[]) as email,
              unnest(${chatScript.map(([, m]) => m)}::text[]) as message,
              unnest(${chatScript.map((_, i) => (chatScript.length - i) * 7)}::int[]) as mins_ago
          ) v
          join auth.users au on au.email = v.email
          where not exists (select 1 from chat_messages cm where cm.conversation_id = ${conv.id})
        `;
      }
    });

    console.log(`Seeded ${users.length} test members (@samnianseed.test, password: SamnianSeed26!).`);
    console.log(`Placed ${table.length} of them into a confirmed group for event ${GROUP_EVENT_ID} ("${GROUP_EVENT_TITLE}") with a short chat.`);
    console.log(`Log in as e.g. ${table[0]!.email} to see it as a member.`);
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
