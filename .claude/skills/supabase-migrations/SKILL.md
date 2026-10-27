---
name: supabase-migrations
description: Write, test and push Supabase migrations for Spontana - tables, RLS policies, triggers, SECURITY DEFINER RPCs, cron jobs. Use whenever a change needs a new file in supabase/migrations.
---

# Supabase migrations

CLI: `supabase` (on this machine `C:\Users\ASUS\AppData\Local\supabase\supabase.exe`), authenticated through `SUPABASE_ACCESS_TOKEN`. Conventions are in `.claude/rules/database.md`, current state in `.claude/rules/schema-map.md`.

## 1. Write

- Next number: `ls supabase/migrations | tail -1`.
- Use these shapes as starting points:

```sql
-- Why this exists (issue #N)
CREATE TABLE IF NOT EXISTS thing (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE thing ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own things" ON thing;
CREATE POLICY "Users can read their own things" ON thing
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
```

```sql
-- Column guard: owners may edit their rows, but not privileged columns
CREATE OR REPLACE FUNCTION guard_thing_columns()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NEW.status IS DISTINCT FROM OLD.status
     AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Not allowed to change status';
  END IF;
  RETURN NEW;
END $$;
```

```sql
-- Service-only RPC
CREATE OR REPLACE FUNCTION do_service_thing(p_ref TEXT)
RETURNS TABLE (email TEXT) LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$ ... $$;
REVOKE EXECUTE ON FUNCTION do_service_thing(TEXT) FROM PUBLIC, anon, authenticated;
```

## 2. Test locally

```sh
supabase start             # needs Docker
supabase db reset          # replays every migration from scratch, which catches ordering bugs
```

Then check behavior as each role in the SQL editor (`http://localhost:54323`) or `psql`:

```sql
-- act as a specific user
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"<user-uuid>","role":"authenticated"}', true);
-- try the thing that should fail, and the thing that should work
```

Test the attacker path, not just the happy path: anon, another user, the owner trying a privileged column. Keep the queries; they go into the PR description.

No Docker? Say so, review the SQL extra carefully, and run the verification queries right after pushing.

## 3. Push

Only after the user confirms, since this changes production:

```sh
supabase db push --dry-run   # shows which migrations would apply
supabase db push
```

## 4. Follow-up

- Update `schema-map.md` (tables, triggers, RPCs, cron).
- `events` column change: update `dbRowToEvent` / `eventToDbRow` and `mapEvent.test.js`.
- Triggers that call n8n: update `n8n/README.md`.
