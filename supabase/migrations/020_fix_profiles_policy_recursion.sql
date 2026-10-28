-- The admin policies from 013 look up the caller's role with a subquery on
-- profiles. Inside a profiles policy that subquery is itself subject to RLS,
-- so Postgres fails with "infinite recursion detected in policy for relation
-- profiles". That breaks any authenticated read of profiles (AuthContext's role
-- lookup) and any UPDATE/DELETE on events (owner edits, admin approve/reject),
-- because the admin event policies hit the same lookup.
-- Fix: do the lookup in a SECURITY DEFINER function, which bypasses RLS.

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin');
$$;

REVOKE EXECUTE ON FUNCTION is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
CREATE POLICY "Admins can read all profiles" ON profiles
  FOR SELECT TO authenticated
  USING (is_admin());

DROP POLICY IF EXISTS "Admins can update any event" ON events;
CREATE POLICY "Admins can update any event" ON events
  FOR UPDATE TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can delete any event" ON events;
CREATE POLICY "Admins can delete any event" ON events
  FOR DELETE TO authenticated
  USING (is_admin());
