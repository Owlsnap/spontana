-- "Users can update own profile" (013) allows any column, including role.
-- Block role changes unless the caller is an admin. Dashboard / service-role
-- updates (auth.uid() IS NULL) are still allowed so admins can be promoted there.

CREATE OR REPLACE FUNCTION prevent_role_self_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role
     AND auth.uid() IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Not allowed to change role';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_profile_role_lock
  BEFORE UPDATE OF role ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_role_self_escalation();
