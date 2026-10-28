---
paths:
  - "supabase/**"
  - "src/lib/**"
  - "src/context/**"
  - "api/**"
  - "n8n/**"
---

# Schema map

Current state after migration 021. Update this file in the same PR as any migration that changes it.

## Tables

| Table | Purpose | Key columns | RLS summary |
|---|---|---|---|
| `events` | All events, every source | `id TEXT PK`, `source` (`ticketmaster`/`visitstockholm`/`user`), `source_id`, `UNIQUE(source, source_id)`, `created_by → auth.users`, `status` (`active`/`pending`/`rejected`), `date`, `end_date`, `view_count`, `host_type` | anon+auth SELECT; auth INSERT own (max 10/24h, 011); owner UPDATE/DELETE; admin UPDATE/DELETE any (020) |
| `profiles` | One per auth user | `id → auth.users`, `role` (`user`/`organizer`/`admin`), `language` (`sv`/`en`), `email_reminders` (default true), `email_digest` (default false), `email_token UUID` | own SELECT/UPDATE; admin SELECT all; role change blocked for non-admins (017) |
| `saved_events` | User bookmarks | `user_id`, `event_id → events ON DELETE CASCADE`, `UNIQUE(user_id, event_id)` | own SELECT/INSERT/DELETE |
| `event_views` | Raw view log | `event_id`, `user_id`, `viewed_at` | written only by the `track-view` edge function |
| `newsletter_subscribers` | Footer newsletter | `email UNIQUE`, `language`, `confirmed_at`, `confirmation_sent_at`, `unsubscribed_at`, `email_token` | no direct client access, only through RPCs |
| `invite_codes` | Signup gating | `code PK`, `active` | service role only; verify through RPC |
| `email_log` | Dedup for scheduled email | `kind` (`reminder`/`digest`), `recipient`, `ref`, `UNIQUE(kind, recipient, ref)` | service role only |

Cascade warning: deleting an `events` row deletes its `saved_events`. Ingestion has to upsert and delete only the rows that left the feed, never delete everything and re-insert.

## Triggers

- `enforce_user_event_pending` (012): BEFORE INSERT on events. `source = 'user'` sets `status = 'pending'`.
- `enforce_event_column_guard` (021): BEFORE INSERT OR UPDATE on events, skipped for admins and the service role. On insert it forces `source = 'user'`, `status = 'pending'`, `created_by = auth.uid()`, `view_count = 0`. On update it rejects changes to `status`, `source`, `source_id`, `created_by`, `view_count`, `id`, `created_at`, except `created_by` going to NULL once that user is deleted (the FK cascade from `delete_own_account()`).
- `on_auth_user_created` (013, replaced in 018): creates the profile row.
- `enforce_profile_role_lock` (017): BEFORE UPDATE OF role on profiles.
- `on_auth_user_email_confirmed`, `notify_user_event_insert`, `notify_user_event_status` (018): push to n8n through `notify_n8n()` → `pg_net`. They do nothing until the Vault secret `n8n_webhook_url` exists.

## RPCs (`SECURITY DEFINER`, `search_path = public`)

| Function | Caller | Purpose |
|---|---|---|
| `is_admin()` | authenticated, policies | role check without profiles RLS recursion (020) |
| `verify_invite_code(code)` | anon | check a code without exposing the table |
| `delete_own_account()` | authenticated | GDPR self-delete |
| `increment_view_count(event_id)`, `get_trending_events(...)` | edge fn / anon | views, trending row |
| `subscribe_newsletter(email, language)` | anon | double opt-in signup |
| `get_email_preferences(token)`, `set_email_preferences(token, reminders, digest)` | anon (the token is the auth) | `/email-preferences` page |
| `get_due_reminders(days_ahead)`, `get_digest_events(limit)`, `get_digest_recipients(ref)` | service role (n8n) | scheduled email |

## Cron (pg_cron, 002)

- `scrape-visitstockholm-daily`: `0 3 * * *`
- `fetch-ticketmaster-daily`: `10 3 * * *`

## Storage

- `event-images` bucket: public read, authenticated upload/delete (006).
