-- Regression checks for 020 (profiles policy recursion) and 021 (event column guard).
-- Run against the local stack after `supabase db reset`:
--   docker exec -i supabase_db_Spontana psql -U postgres -d postgres -q < supabase/tests/event_moderation.sql
-- Everything runs in a transaction and rolls back. Every row should say PASS.

\set ON_ERROR_STOP on
BEGIN;

INSERT INTO auth.users (id, email, aud, role) VALUES
  ('11111111-1111-1111-1111-111111111111', 'owner@test.local', 'authenticated', 'authenticated'),
  ('22222222-2222-2222-2222-222222222222', 'admin@test.local', 'authenticated', 'authenticated');
UPDATE profiles SET role = 'admin' WHERE id = '22222222-2222-2222-2222-222222222222';

CREATE TEMP TABLE results (check_name TEXT, passed BOOLEAN, detail TEXT);
GRANT ALL ON results TO authenticated;

-- ── As the owner ──────────────────────────────────────────────
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);

-- 020: profile reads no longer recurse; non-admins see only themselves
INSERT INTO results SELECT 'owner reads own profile only (020)',
  count(*) = 1 AND bool_and(id = auth.uid()), count(*)::text || ' rows'
FROM profiles;

-- Hole 2 + 3: fake source, no owner, preset status and views
INSERT INTO events (id, source, source_id, event_name, status, created_by, view_count)
VALUES ('t_fake', 'visitstockholm', 'fake1', 'Sneaky', 'active', NULL, 999);
INSERT INTO results SELECT 'insert forced to user/pending/owner/0',
  source = 'user' AND status = 'pending' AND created_by = auth.uid() AND view_count = 0,
  format('%s/%s/%s/%s', source, status, created_by, view_count)
FROM events WHERE id = 't_fake';

-- Normal create, like CreateEvent.jsx
INSERT INTO events (id, source, event_name, status, created_by)
VALUES ('t_own', 'user', 'Loppis', 'pending', auth.uid());

-- Hole 1: self-approve
DO $$ BEGIN
  UPDATE events SET status = 'active' WHERE id = 't_own';
  INSERT INTO results VALUES ('owner cannot self-approve', false, 'update went through');
EXCEPTION WHEN raise_exception THEN
  INSERT INTO results VALUES ('owner cannot self-approve', true, SQLERRM);
END $$;

DO $$ BEGIN
  UPDATE events SET view_count = 5000 WHERE id = 't_own';
  INSERT INTO results VALUES ('owner cannot set view_count', false, 'update went through');
EXCEPTION WHEN raise_exception THEN
  INSERT INTO results VALUES ('owner cannot set view_count', true, SQLERRM);
END $$;

DO $$ BEGIN
  UPDATE events SET created_by = NULL WHERE id = 't_own';
  INSERT INTO results VALUES ('owner cannot drop ownership', false, 'update went through');
EXCEPTION WHEN raise_exception THEN
  INSERT INTO results VALUES ('owner cannot drop ownership', true, SQLERRM);
END $$;

-- What MyEvents.jsx sends must still work
UPDATE events SET event_name = 'Loppis i Hornstull', description = 'Kom tidigt', price_amount = 0,
  updated_at = NOW() WHERE id = 't_own';
INSERT INTO results SELECT 'owner can edit content', event_name = 'Loppis i Hornstull', event_name
FROM events WHERE id = 't_own';

-- ── As an admin ───────────────────────────────────────────────
SELECT set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', true);
INSERT INTO results SELECT 'admin reads all profiles (020)', count(*) >= 2, count(*)::text || ' rows'
FROM profiles;
UPDATE events SET status = 'active' WHERE id = 't_own';
INSERT INTO results SELECT 'admin can approve', status = 'active', status FROM events WHERE id = 't_own';

-- ── As service role (ingestion, track-view) ───────────────────
RESET ROLE;
SELECT set_config('request.jwt.claims', '', true);
INSERT INTO events (id, source, source_id, event_name, status)
VALUES ('vs_test', 'visitstockholm', 'test', 'Real import', 'active');
SELECT increment_view_count('vs_test');
INSERT INTO results SELECT 'service role keeps source/status, can count views',
  source = 'visitstockholm' AND status = 'active' AND view_count = 1,
  format('%s/%s/%s', source, status, view_count)
FROM events WHERE id = 'vs_test';

SELECT CASE WHEN passed THEN 'PASS' ELSE 'FAIL' END AS result, check_name, detail FROM results;
ROLLBACK;
