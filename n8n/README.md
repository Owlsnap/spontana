# n8n email automations

Three workflows, sending through Resend:

| Workflow | Trigger | Sends |
|---|---|---|
| `transactional-emails.json` | Webhook, called by Postgres triggers (`018_email_automations.sql`) | Welcome (on email confirmation), event received, event approved |
| `saved-event-reminders.json` | Daily 09:00 Stockholm | One email per user listing their saved events happening tomorrow |
| `weekly-digest.json` | Thursdays 16:00 Stockholm | New + upcoming events, to opted-in users and newsletter subscribers |

Data flow: Postgres pushes transactional events to n8n through `pg_net`; the scheduled workflows
pull data through service-role RPCs (`get_due_reminders`, `get_digest_events`, `get_digest_recipients`)
and record what was sent in `email_log` so re-runs don't double-send.

Every email links to `/email-preferences?token=…`, which manages reminders and the digest without logging in.

## Setup

### 1. Resend
1. Add the domain `spontana.app` in Resend. Pick the EU region (the privacy policy lists Resend as a sub-processor).
   Add the DNS records it gives you (SPF, DKIM), plus a DMARC record.
2. Create an API key with "Sending access".
3. The sender is `Spontana <hello@spontana.app>`, set as `FROM` at the top of each Code node.

### 2. Database
```sh
supabase db push                                # applies 017 + 018
supabase functions deploy fetch-events          # upsert fix, keeps saved events across syncs
```

### 3. n8n Cloud
Create three credentials (names must match, or reassign them after import):

| Name | Type | Values |
|---|---|---|
| `Resend API` | Header Auth | Name `Authorization`, Value `Bearer re_…` |
| `Spontana Supabase (service role)` | Supabase API | Host `https://wqubexjnvhyunajfmvwp.supabase.co`, Service Role key from Dashboard → Settings → API |
| `Spontana webhook secret` | Header Auth | Name `X-Spontana-Secret`, Value a long random string |

Import the three JSON files (Workflows → Import from file), open each node with a credential, and select the credential.
Activate all three. Copy the **production** URL of the `Supabase trigger` webhook node.

### 4. Point Postgres at n8n
In the Supabase SQL editor (secrets go to Vault, not git):
```sql
select vault.create_secret('https://<you>.app.n8n.cloud/webhook/spontana-events', 'n8n_webhook_url');
select vault.create_secret('<same random string as the n8n credential>', 'n8n_webhook_secret');
```
Until `n8n_webhook_url` exists, the triggers do nothing, so the migration is safe to apply before n8n is set up.

### 5. Optional: route Supabase Auth mail through Resend
Dashboard → Authentication → SMTP Settings: host `smtp.resend.com`, port 465, user `resend`, password = API key.
This way the confirmation and password-reset emails come from the same domain and don't hit Supabase's built-in rate limit.

## Testing
- **Transactional:** open the workflow, click "Test workflow", then sign up with a test account or create an event. Or post to the test URL:
  ```sh
  curl -X POST <test-webhook-url> -H "X-Spontana-Secret: <secret>" -H "Content-Type: application/json" \
    -d '{"kind":"welcome","email":"you@example.com","language":"sv","email_token":null}'
  ```
- **Reminders / digest:** save an event dated tomorrow, then run the workflow manually. Delete your row from `email_log` to resend.
- Pin test data on the Code nodes to preview the HTML without sending.

## Changing templates
Copy lives in the Code nodes: `COPY.sv` / `COPY.en`, Swedish by default. Users get emails in the language they had selected at signup (`profiles.language`).
Edit in the n8n UI, then export the workflow back to this folder.
