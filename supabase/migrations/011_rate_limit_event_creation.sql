-- Rate limit user event creation to 10 events per 24 hours per user
-- Enforced at the RLS level so it cannot be bypassed client-side

DROP POLICY IF EXISTS "Authenticated users can create events" ON events;

CREATE POLICY "Authenticated users can create events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (created_by = auth.uid() OR created_by IS NULL)
    AND (
      SELECT COUNT(*)
      FROM events
      WHERE created_by = auth.uid()
        AND created_at > NOW() - INTERVAL '24 hours'
    ) < 10
  );
