-- Close three ways around event moderation. RLS checks which rows a user may
-- write, not which columns, so:
--   1. "Users can update their own events" (005) let owners set status = 'active'
--      on their own pending event (and fired the "approved" email from 018).
--   2. enforce_user_event_pending (012) only fires for source = 'user', so an
--      insert claiming source = 'visitstockholm' went live without review.
--   3. The insert policy (011) accepts created_by IS NULL, which skipped both
--      ownership and the 10-per-24h rate limit.
-- Same approach as 017: a trigger that trusts only admins and callers without a
-- user JWT (service role, cron, dashboard).

CREATE OR REPLACE FUNCTION guard_event_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR is_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.source := 'user';
    NEW.status := 'pending';
    NEW.created_by := auth.uid();
    NEW.view_count := 0;
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.source IS DISTINCT FROM OLD.source
     OR NEW.source_id IS DISTINCT FROM OLD.source_id
     OR NEW.created_by IS DISTINCT FROM OLD.created_by
     OR NEW.view_count IS DISTINCT FROM OLD.view_count
     OR NEW.id IS DISTINCT FROM OLD.id
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Not allowed to change status, source, ownership or view count';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_event_column_guard ON events;
CREATE TRIGGER enforce_event_column_guard
  BEFORE INSERT OR UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION guard_event_columns();
