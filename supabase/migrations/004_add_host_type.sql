-- Add host_type column for user-created events
-- 'organizer' = professional/company organizer
-- 'private'   = private individual hosting an event
ALTER TABLE events ADD COLUMN IF NOT EXISTS host_type TEXT;
