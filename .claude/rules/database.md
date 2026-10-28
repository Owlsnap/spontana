---
paths:
  - "supabase/migrations/**"
---

# Migrations

- File name: next number, zero-padded, snake_case: `020_short_description.sql`. Check `ls supabase/migrations` for the next number. Branches can collide, so renumber before merge if needed.
- Start with a comment explaining **why**, plus the issue number if there is one.
- Never edit a migration that has been pushed. Fix forward with a new one.
- Make it re-runnable where Postgres allows: `IF NOT EXISTS`, `CREATE OR REPLACE`, `DROP POLICY IF EXISTS` before `CREATE POLICY`.
- Every new table: `ENABLE ROW LEVEL SECURITY` in the same file, plus explicit policies. No table ships without RLS.
- Every `SECURITY DEFINER` function: `SET search_path = public`, validate inputs, and return only the columns the caller needs. Grant and revoke `EXECUTE` deliberately (`REVOKE ... FROM anon` for service-only RPCs).
- Name policies as sentences: `"Users can update their own events"`.
- Foreign keys to `events(id)`: choose `ON DELETE CASCADE` or `SET NULL` explicitly, and remember that ingestion deletes rows.
- Index the columns you filter or sort on (`date`, `created_by`, foreign keys).
- Secrets (webhook URLs, keys) go in Vault (`vault.create_secret`) and get read at runtime, never written as literals in a migration.
- After the migration: update `.claude/rules/schema-map.md`, and `src/lib/mapEvent.js` if `events` columns changed.

Load the `supabase-migrations` skill for the full workflow (local test, push, verification queries).
