-- Content moderation: user-created events start as 'pending' instead of 'active'
-- Events from ticketmaster and visitstockholm are unaffected (inserted via service role)

CREATE OR REPLACE FUNCTION set_user_event_pending()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.source = 'user' THEN
    NEW.status := 'pending';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_user_event_pending
  BEFORE INSERT ON events
  FOR EACH ROW
  EXECUTE FUNCTION set_user_event_pending();
