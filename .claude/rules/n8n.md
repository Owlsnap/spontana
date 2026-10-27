---
paths:
  - "n8n/**"
  - "supabase/migrations/018_*"
  - "supabase/migrations/019_*"
---

# n8n workflows

- The JSON in `n8n/workflows/` is an export from n8n Cloud. Edit in the n8n UI, then export over the file. If you edit the JSON by hand, say so in the PR so it gets re-imported.
- Exports must not contain credential secrets, only credential names (`Resend API`, `Spontana Supabase (service role)`, `Spontana webhook secret`). Check before committing.
- Postgres → n8n goes through `notify_n8n(kind, payload)`. A new transactional email means a new `kind` handled in `transactional-emails.json`.
- Scheduled sends record to `email_log` (`UNIQUE(kind, recipient, ref)`) so re-runs don't double-send. Log only emails that actually went out.
- Every email links to `/email-preferences?token=…`. Reminders are on by default, the digest is opt-in, and newsletter subscribers need `confirmed_at`.
- Template copy lives in the Code nodes as `COPY.sv` / `COPY.en` and follows `copy.md`.
- Update `n8n/README.md` when triggers, credentials or schedules change.
