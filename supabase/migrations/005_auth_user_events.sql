-- Add created_by column to track which user created each event
ALTER TABLE events ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_events_created_by ON events (created_by);

-- Drop the open-to-anyone INSERT policy
DROP POLICY IF EXISTS "Anyone can create events" ON events;

-- Only authenticated users can insert events (and must set created_by to their own uid)
CREATE POLICY "Authenticated users can create events" ON events
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL AND (created_by = auth.uid() OR created_by IS NULL));

-- Users can update only their own events
CREATE POLICY "Users can update their own events" ON events
  FOR UPDATE TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Users can delete only their own events
CREATE POLICY "Users can delete their own events" ON events
  FOR DELETE TO authenticated
  USING (auth.uid() = created_by);
