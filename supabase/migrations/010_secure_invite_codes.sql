-- Remove public SELECT access to invite_codes table
-- Previously anyone could query the table directly via REST API and enumerate valid codes

DROP POLICY IF EXISTS "Invite codes are publicly readable" ON invite_codes;
DROP POLICY IF EXISTS "Public can read invite codes" ON invite_codes;

-- Only service role retains direct access
CREATE POLICY "Service role can manage invite codes"
  ON invite_codes FOR ALL
  USING (auth.role() = 'service_role');

-- Security definer function: verifies an invite code without exposing the table
-- Runs with the privileges of the function owner (postgres), bypassing RLS
-- Returns TRUE if the code exists and is active, FALSE otherwise
CREATE OR REPLACE FUNCTION verify_invite_code(p_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM invite_codes
    WHERE code = p_code
      AND active = true
  );
END;
$$;

-- Grant execute to anonymous and authenticated users (so the frontend can call it)
GRANT EXECUTE ON FUNCTION verify_invite_code(TEXT) TO anon, authenticated;
