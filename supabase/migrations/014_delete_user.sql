-- Allows a logged-in user to permanently delete their own account.
-- SECURITY DEFINER runs as the function owner (postgres), which has
-- permission to delete from auth.users. The WHERE clause ensures a user
-- can only delete themselves.
CREATE OR REPLACE FUNCTION delete_own_account()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM auth.users WHERE id = auth.uid();
$$;
