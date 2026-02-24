-- Create the events table for Spontana
CREATE TABLE events (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,              -- 'ticketmaster' | 'visitstockholm' | 'user'
  source_id TEXT,                    -- original ID from API
  event_name TEXT NOT NULL,
  type TEXT,
  img TEXT,
  date DATE,
  start_time TEXT,
  end_time TEXT,
  venue TEXT,
  address TEXT,
  city TEXT DEFAULT 'Stockholm',
  country TEXT DEFAULT 'Sweden',
  organizer_name TEXT,
  organizer_email TEXT,
  organizer_phone TEXT,
  price_currency TEXT DEFAULT 'SEK',
  price_amount INTEGER DEFAULT 0,
  price_early_bird INTEGER,
  capacity INTEGER,
  available_spots INTEGER,
  description TEXT,
  tags TEXT[],
  hosts TEXT[],
  status TEXT DEFAULT 'active',
  url TEXT,                          -- link to original/ticket page
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source, source_id)          -- prevent duplicates from same source
);

-- Enable Row Level Security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read events (public directory)
CREATE POLICY "Events are publicly readable"
  ON events FOR SELECT
  USING (true);

-- Allow anonymous inserts (for user-created events)
CREATE POLICY "Anyone can create events"
  ON events FOR INSERT
  WITH CHECK (true);

-- Allow service role full access (for edge functions)
CREATE POLICY "Service role has full access"
  ON events FOR ALL
  USING (auth.role() = 'service_role');

-- Index for common queries
CREATE INDEX idx_events_date ON events (date);
CREATE INDEX idx_events_city ON events (city);
CREATE INDEX idx_events_type ON events (type);
CREATE INDEX idx_events_source ON events (source);
