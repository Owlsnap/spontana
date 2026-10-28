# Spontana

Event aggregator for Stockholm locals (20–35, decide last-minute). Pulls events from Ticketmaster and Visitstockholm, lets users post their own, sends reminders and a weekly digest. Live at https://spontana.app.

## Stack

- **Frontend:** React 18 + Vite 4, React Router 6, plain CSS per component (`Component/Component.css`), design tokens in `src/index.css`. Toasts via `sonner`, icons via `@phosphor-icons/react`.
- **Backend:** Supabase (Postgres + RLS, Auth, Storage, Edge Functions on Deno, pg_cron + pg_net).
- **Hosting:** Vercel. `api/` holds Node serverless functions (server-rendered event page meta, sitemap). See `vercel.json` for rewrites.
- **Email:** n8n Cloud + Resend. Workflows are exported to `n8n/workflows/`; setup in `n8n/README.md`.

## Layout

```
src/
  components/<Name>/<Name>.jsx + .css   one folder per component
  context/        AuthContext (session, auth modal), SavedEventsContext
  i18n/           translations.js (en + sv), LanguageContext -> useLanguage().t(key)
  lib/            supabase client, mapEvent (DB row <-> component shape), eventDates, eventSeo
api/              Vercel functions; files starting with _ are helpers, not routes
supabase/
  migrations/     NNN_snake_case.sql, applied in order, never edited after push
  functions/      fetch-events (Ticketmaster), scrape-visitstockholm, track-view
n8n/workflows/    exported n8n JSON
specs/            feature specs written with /prd
```

## Data flow

- The frontend reads events from Supabase only, never from third-party APIs. `src/data.json` is the offline fallback.
- DB rows are snake_case, components use camelCase with nested `location`/`organizer`/`price`. Convert only through `dbRowToEvent` / `eventToDbRow` in `src/lib/mapEvent.js`.
- Event dates are `YYYY-MM-DD` strings in Stockholm local time. Use the helpers in `src/lib/eventDates.js`. Never `new Date('YYYY-MM-DD')`, which parses as UTC.
- User-created events are forced to `status = 'pending'` by a trigger, and an admin approves them at `/admin`.
- Ingestion runs nightly via pg_cron: Visitstockholm at 03:00 UTC, Ticketmaster at 03:10 UTC.

Schema details: `.claude/rules/schema-map.md`.

## Commands

```sh
npm run dev        # Vite dev server
npm test           # Vitest, once
npm run lint       # ESLint (has pre-existing errors, see below)
npm run build      # production build
supabase db push                       # apply new migrations to the linked project
supabase functions deploy <name>       # deploy one edge function
```

Supabase CLI on this machine: `C:\Users\ASUS\AppData\Local\supabase\supabase.exe`, authenticated with `SUPABASE_ACCESS_TOKEN`.

## Working agreements

- **Verify before saying done.** Run `npm test` and `npm run build` after code changes. For UI changes, check them in the browser too. Report failures as they are.
- **Copy is part of the feature.** Every user-facing string goes in `translations.js` in both `en` and `sv`, in the brand voice (`BRAND.md`, `.claude/rules/copy.md`).
- **Security sits in the database.** Assume the anon key is public and every client check is cosmetic. Access control belongs in RLS, triggers, or `SECURITY DEFINER` functions.
- **Never fix the same bug twice.** When a bug is fixed, add a test or a rule that would have caught it (`/harden`).
- **Migrations are append-only.** Add a new numbered file; don't edit one that has been pushed.
- **No secrets in git.** Keys go in `.env` (frontend), Supabase secrets (edge functions), or Vault (Postgres).
- Branch per change (`feat/`, `fix/`, `chore/`), PR into `master`.

## Known debt

- **Open security bug:** the owner UPDATE policy (005) doesn't limit columns, so a user can set their own event to `status = 'active'` and skip moderation. Needs a BEFORE UPDATE guard like 017's.
- `npm run lint` fails on existing code (mostly `react/prop-types`, unused vars). CI reports it without blocking. Don't add new lint errors in files you touch.
- `002_cron_jobs.sql` calls edge functions with the anon key, so anyone can trigger a sync. Planned fix: shared-secret header.
- Each ingestion function has its own upsert/cleanup logic. A shared `_shared/ingest.ts` is planned before more sources are added.

## Workflow skills

`/prd` spec a feature → `/breakdown` into tasks → `/build` implement → `/pr-review` review the branch → `/ship` open the PR → `/harden` after bugs.
