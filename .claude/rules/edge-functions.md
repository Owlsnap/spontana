---
paths:
  - "supabase/functions/**"
---

# Edge functions (Deno)

- One folder per function with `index.ts`, using `Deno.serve`. Handle `OPTIONS` for CORS only if a browser calls it (`track-view` does; the ingestion jobs don't need to).
- Service-role client from `Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")`. Third-party keys come from Supabase secrets (`supabase secrets set NAME=...`).
- Imports: `https://esm.sh/@supabase/supabase-js@2` is the current convention.
- Ingestion writes `upsert(..., { onConflict: "source,source_id" })`, then deletes only that source's rows missing from the fetched set. Never delete everything and re-insert (it cascades into `saved_events`). If a fetch returns 0 events, treat it as a failure, not as "everything was removed".
- Map to the `events` columns in `schema-map.md`. Row `id` is `<prefix>_<source_id>` (`vs_`, `tm_`).
- Return JSON `{ ok, counts..., error? }` with a proper status code, and `console.error` failures so they show up in the function logs.
- Deploy: `supabase functions deploy <name>`. Test locally with `supabase functions serve <name>` and curl.
