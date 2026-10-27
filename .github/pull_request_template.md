## What and why

<!-- One paragraph. Link the spec (specs/...) and issue (#N). -->

## How it was verified

- [ ] `npm test`
- [ ] `npm run build`
- [ ] Checked in the browser (UI changes, include 375px)
- [ ] SQL checks for RLS/triggers, as anon / other user / owner (migrations; paste the queries)

## Deploy steps

<!-- Delete what doesn't apply. -->
- [ ] `supabase db push`
- [ ] `supabase functions deploy <name>`
- [ ] New Supabase secret / Vault entry:
- [ ] Re-import n8n workflow:

## Checklist

- [ ] New strings in `translations.js`, in both `en` and `sv`
- [ ] `.claude/rules/schema-map.md` updated if the schema changed
- [ ] Bug fix has a regression test (`/harden`)
