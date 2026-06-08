-- Add view_count to events for fast denormalized reads
ALTER TABLE events ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Detailed view log for trending queries and analytics
CREATE TABLE IF NOT EXISTS event_views (
  id BIGSERIAL PRIMARY KEY,
  event_id TEXT REFERENCES events(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS event_views_event_id_viewed_at
  ON event_views(event_id, viewed_at DESC);

-- Only the service role (edge function) can write/read this table
ALTER TABLE event_views ENABLE ROW LEVEL SECURITY;

-- Atomic increment used by the edge function
CREATE OR REPLACE FUNCTION increment_view_count(p_event_id TEXT)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE events SET view_count = view_count + 1 WHERE id = p_event_id;
$$;

-- RPC: returns event IDs trending in the last N hours
CREATE OR REPLACE FUNCTION get_trending_events(
  min_views INT DEFAULT 3,
  hours_back INT DEFAULT 48
)
RETURNS TABLE(event_id TEXT, recent_views BIGINT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ev.event_id, COUNT(*) AS recent_views
  FROM event_views ev
  WHERE ev.viewed_at > NOW() - (hours_back || ' hours')::INTERVAL
  GROUP BY ev.event_id
  HAVING COUNT(*) >= min_views
  ORDER BY recent_views DESC;
$$;
