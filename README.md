# TalkTable

A small dinner-matchmaking app: take an OCEAN personality quiz, set your
availability and budget, get matched to a table, chat with your match.

Rewritten from a PHP/MySQL app (kept for reference in [`legacy-php/`](./legacy-php))
into TypeScript on **Next.js**, deployable to **Vercel**, backed by
**Postgres (Supabase)**. The UI is a direct port of the original Bootstrap
markup and stylesheet — same look, same layout, same custom CSS file — just
rendered as React instead of PHP templates.

## Stack

- **Next.js 15** (App Router) + **TypeScript**, React Server Components and
  Server Actions instead of separate API/handler files.
- **Drizzle ORM** + `postgres.js` against **Postgres** (developed against
  Supabase; any Postgres works).
- **Auth**: signed, `httpOnly` JWT session cookie (via `jose`) + `bcryptjs`
  password hashing — no external auth service, no server-side session store,
  so it runs cleanly on Vercel's serverless functions.
- **Email**: SMTP via `nodemailer` (verification codes, password resets). If
  unset, emails are logged to the console instead of sent — fine for local
  dev.
- **File uploads**: `@vercel/blob` for profile photos (Vercel's serverless
  functions have no writable local disk, unlike the old PHP `uploads/`
  folder).
- **UI**: the legacy `styles2.css` (a full compiled Bootstrap 5 / Bootswatch
  "Brite" theme + this app's custom rules) reused as-is as `app/globals.css`,
  plus `bootstrap`'s JS bundle for modals/offcanvas/dropdowns and
  `bootstrap-icons`, both self-hosted via npm instead of CDN `<script>` tags.
- **Charts**: `chart.js` / `react-chartjs-2` for the OCEAN results bar chart.

## What changed vs. the PHP app

- **Database**: MySQL → Postgres. The schema in `db/schema.ts` was
  reconstructed from what the PHP handlers actually read/wrote (the old
  `tables.sql` was stale — missing `verified`, `email_verification_codes`,
  `password_reset_codes`, etc.). It's a fresh schema with no legacy data
  migrated in (by design — see the PR/session notes).
- **Sessions**: PHP `$_SESSION` → a signed JWT cookie. No server-side session
  storage needed, which matters on Vercel's stateless functions.
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
  clearly marked as such.

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
cp .env.example .env.local   # fill in DATABASE_URL and SESSION_SECRET at minimum
npm run db:push              # or db:generate + db:migrate, see below
npm run db:seed              # interests + OCEAN questions
npm run dev
```

### Database migrations

Schema lives in `db/schema.ts`. Two ways to apply it:

- `npm run db:push` — fast, no migration files, good for local iteration.
- `npm run db:generate` then `npm run db:migrate` — generates a versioned
  SQL file under `drizzle/` first, the way you'd want in CI/production.

## Deploying

1. **Database**: create a [Supabase](https://supabase.com) project (or any
   Postgres), then run the migration in `drizzle/0000_organic_krista_starr.sql`
   against it (or `npm run db:migrate` with `DATABASE_URL` pointed at it).
2. **Vercel project**: import this repo, add the env vars from
   `.env.example` (`DATABASE_URL`, `SESSION_SECRET`, `SMTP_*`) in Project
   Settings → Environment Variables.
3. **Blob storage**: Project → Storage → connect a Blob store — Vercel
   injects `BLOB_READ_WRITE_TOKEN` automatically, no manual copy-paste
   needed.
4. Deploy. No build-time DB access is required — every page that touches
   the database also reads the session cookie, so Next.js treats it as
   dynamic (rendered per-request) rather than trying to prerender it.

### Supabase Row Level Security

If you point this at a Supabase project, note that **Supabase's own
Postgres advisor will flag the new tables as having RLS disabled** — that's
expected here: this app talks to Postgres directly via `DATABASE_URL`
(bypassing PostgREST/RLS entirely, same trust model as any other backend
with a database password), not through Supabase's client-side `anon` key.
If anything else in that same Supabase project *does* use the public
`anon`/`authenticated` REST API, turn RLS on for these tables so that API
can't read/write them:

```sql
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_verification_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personality_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personality_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interests ENABLE ROW LEVEL SECURITY;
```

With no policies added, this blocks the `anon`/`authenticated` REST API
from touching these tables entirely — which is what you want, since this
app never uses that API. Don't run this against tables another app in the
same Supabase project *does* need PostgREST access to without adding
matching policies first.

## Project layout

```
app/                  routes (App Router) — one folder per page, colocated
                       actions.ts files hold that route's Server Actions
components/            shared React components
lib/                    db client, auth, mailer, blob upload, constants
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
