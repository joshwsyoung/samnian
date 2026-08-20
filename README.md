# Samnian

A small dinner-matchmaking app: take an OCEAN personality quiz, set your
availability and budget, get matched to a table, chat with your match.

Rewritten from a PHP/MySQL app (kept for reference in [`legacy-php/`](./legacy-php))
into TypeScript on **Next.js**, deployable to **Vercel**, backed by
**Postgres + Auth (Supabase)**. The UI is a direct port of the original
Bootstrap markup and stylesheet — same look, same layout, same custom CSS
file — just rendered as React instead of PHP templates.

## Stack

- **Next.js 15** (App Router) + **TypeScript**, React Server Components and
  Server Actions instead of separate API/handler files.
- **Auth**: **Supabase Auth** (`@supabase/ssr`) — handles password hashing,
  sessions, and sending the verification/password-reset emails itself.
  No JWT secret to generate, no SMTP to configure.
- **Drizzle ORM** + `postgres.js` against **Postgres** for everything that
  isn't identity (profiles, matches, chat, availability, the OCEAN test).
  Runs over a direct `DATABASE_URL` connection, independent of Supabase's
  client libraries.
- **File uploads**: `@vercel/blob` for profile photos (Vercel's serverless
  functions have no writable local disk, unlike the old PHP `uploads/`
  folder).
- **UI**: the legacy `styles2.css` (a full compiled Bootstrap 5 / Bootswatch
  "Brite" theme + this app's custom rules) reused as-is as `app/globals.css`,
  plus `bootstrap`'s JS bundle for modals/offcanvas/dropdowns and
  `bootstrap-icons`, both self-hosted via npm instead of CDN `<script>` tags.
- **Charts**: `chart.js` / `react-chartjs-2` for the OCEAN results bar chart.

## How auth works

Identity (email, password, sessions, email confirmation, password reset)
lives entirely in Supabase Auth's `auth.users` — this app never stores or
sees a password. `public.users` is this app's *profile* table for that same
person (name, phone, city, price preference, role, …), created right after
`supabase.auth.signUp()` succeeds, keyed by the same `id`.

- **Register** → `supabase.auth.signUp()` → Supabase emails a confirmation
  link → `app/auth/confirm/route.ts` verifies it and starts a session.
- **Login** → `supabase.auth.signInWithPassword()`.
- **Forgot password** → `supabase.auth.resetPasswordForEmail()` → the email
  link lands on `/auth/confirm`, which verifies it and redirects to
  `/reset-password/update`, where `supabase.auth.updateUser({ password })`
  runs against the now-authenticated recovery session.
- **Delete account** → signs out, then `SUPABASE_SERVICE_ROLE_KEY`-backed
  `auth.admin.deleteUser()` removes the real login — Postgres cascades the
  rest (profile row, availability, matches, chat, interests) via the FK
  from `public.users.id` to `auth.users.id`.
- A user's login **email is not editable from their own profile form** —
  changing it is an identity operation, not a profile edit, so it's shown
  read-only there. Admins *can* change a user's email (via `admin.updateUserById`),
  since fixing a broken login for someone else is a legitimate admin task.

One UX change from the legacy app worth knowing: email verification used to
be a 4-digit code you typed in; it's now "click the link we emailed you",
which is what Supabase Auth does out of the box. Getting the code-entry UI
back would mean customizing the confirmation email template in the
Supabase dashboard (Auth → Email Templates) to include `{{ .Token }}` —
not something this app's code controls.

## What changed vs. the PHP app

- **Database**: MySQL → Postgres. The schema in `db/schema.ts` was
  reconstructed from what the PHP handlers actually read/wrote (the old
  `tables.sql` was stale). Fresh schema, no legacy data migrated in.
- **Auth**: PHP `$_SESSION` + a hand-rolled password table → Supabase Auth
  (see above). `email_verification_codes` and `password_reset_codes` no
  longer exist — Supabase Auth owns that job now.
- **File uploads**: local `uploads/` folder → Vercel Blob.
- Two admin dashboard entries were dropped: `admin/messages.php` posted to a
  `handlers/messages_handler.php` that didn't exist in the repo, and
  `public/profile_startup.php` was an unlinked onboarding wizard that posted
  to handlers that also didn't exist. Both looked like abandoned
  work-in-progress rather than shipped features; the real, working chat and
  profile-editing flows (`/messages`, `/profile`) are fully ported.
- A couple of small, genuine bugs got fixed along the way: the dashboard's
  "Update Availability" / "Update Price Point" modals existed in the HTML
  but no button ever opened them (now they do); the admin "create
  conversation from a match" button hardcoded the conversation title to the
  literal string `"Your title"` (now it's generated from the match's date
  and time).
- `personality_tests` and `interests` had no seed data anywhere in the
  repo (they were populated by hand in the old production database). See
  **Seeding** below — `db/seed.ts` ships a reasonable starter set for both,
  clearly marked as such, and the live database already has it loaded.

## ⚠️ Rotate these credentials

While porting this, three live secrets were found committed in the PHP
app's git history (`legacy-php/db.php`, `legacy-php/handlers/mailer.php`,
`legacy-php/handlers/autocomplete_handler.php`): a MySQL password, a Gmail
app password, and a getaddress.io API key. **Rotate all three** at their
respective providers — removing them from new commits doesn't remove them
from history that's already been pushed.

## Local development

```bash
npm install
cp .env.example .env.local   # fill in DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL,
                              # NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
npm run db:push               # or db:generate + db:migrate, see below
npm run db:seed                # interests + OCEAN questions (skips if already seeded)
npm run dev
```

### Database migrations

Schema lives in `db/schema.ts`. Two ways to apply it:

- `npm run db:push` — fast, no migration files, good for local iteration.
- `npm run db:generate` then `npm run db:migrate` — generates a versioned
  SQL file under `drizzle/` first, the way you'd want in CI/production.

`drizzle/0000_adorable_grim_reaper.sql` is written for a **fresh** Postgres
database — including the enum types this schema uses. Applying it to a
Supabase project that already has some of those types (e.g. if you'd run an
earlier revision of this schema) will fail on the `CREATE TYPE` statements;
drop the stale objects first or start from a clean database. It does *not*
try to create `auth.users` — Supabase already owns that table.

## Deploying

1. **Supabase project**: create one (or reuse an existing one — this app
   only adds its own tables, nothing schema-wide). Grab, from
   Settings → API: the project URL, the `anon`/publishable key, and the
   `service_role` secret. From Settings → Database: the pooled connection
   string, for `DATABASE_URL`.
2. Run the migration in `drizzle/0000_adorable_grim_reaper.sql` against it
   (or `npm run db:migrate` with `DATABASE_URL` pointed at it), then
   `npm run db:seed`.
3. **Supabase Auth → URL Configuration**: add your deployment's URL(s) to
   the Redirect URLs allowlist (e.g. `https://your-app.vercel.app/**`, plus
   `http://localhost:3000/**` for local dev). Without this, the
   confirmation and password-reset email links Supabase sends will fail —
   this app never uses `NEXT_PUBLIC_BASE_URL`/the request's Host header for
   anything else, but Supabase itself still needs to be told which
   redirect targets it's allowed to send people to.
4. **Vercel project**: import this repo, add the env vars from
   `.env.example` in Project Settings → Environment Variables. Note that
   the `NEXT_PUBLIC_*` ones are inlined into the build at build time, not
   read live — if you edit `NEXT_PUBLIC_SUPABASE_URL` or
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` after the fact, an already-built
   deployment keeps running on the old values until you trigger a fresh
   build (Deployments → ⋯ → Redeploy without reusing the build cache, or
   push a new commit). `DATABASE_URL` isn't prefixed that way and *is*
   read live, so it doesn't have this gotcha.
5. **Blob storage**: Project → Storage → connect a Blob store — Vercel
   injects `BLOB_READ_WRITE_TOKEN` automatically, no manual copy-paste
   needed.
6. Deploy. No build-time DB or Supabase access is required — every page
   that touches either also reads the session cookie, so Next.js treats it
   as dynamic (rendered per-request) rather than trying to prerender it.

### Supabase Row Level Security

**This matters more here than it would in a typical Supabase app, and it's
currently off — read this before going further.** Because this app uses
real Supabase Auth accounts, every registered user now holds a genuine
Supabase JWT. With RLS disabled, that JWT works directly against Supabase's
public PostgREST API (`your-project.supabase.co/rest/v1/...`) — completely
bypassing this app's own authorization logic. Concretely, right now any
signed-up user could call that API themselves to read every other user's
profile, or set their own `role` to `'admin'`.

This app itself never uses that API — it always reads/writes over
`DATABASE_URL` via Drizzle, a separate, direct Postgres connection that
RLS doesn't apply to. So enabling RLS with **no policies at all** is safe
for this app specifically: it simply locks the PostgREST door this app
doesn't use, without touching anything this app does. I didn't turn it on
myself since Supabase's tooling asks that a person decide this, not an
agent — but I'd genuinely recommend running this:

```sql
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personality_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personality_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
```

If this Supabase project is shared with another app that *does* need
PostgREST access to some of these tables, add matching policies instead of
running this blind.

## Project layout

```
app/                  routes (App Router) — one folder per page, colocated
                       actions.ts files hold that route's Server Actions
app/auth/confirm/      shared callback for Supabase Auth email links
components/            shared React components
lib/                    db client, auth session helper, supabase/, blob upload, constants
lib/supabase/           Supabase clients — server.ts (cookies-based), admin.ts (service role)
db/                     Drizzle schema + seed script
drizzle/                generated SQL migrations
legacy-php/             the original PHP app, kept for reference only
```

## Making a user an admin

There's no UI for this (matches the old app, which had no self-serve promo
path either) — flip it directly in the database:

```sql
update users set role = 'admin' where email = 'you@example.com';
```
