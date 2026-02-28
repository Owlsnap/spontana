-- Invite codes table for beta access
CREATE TABLE IF NOT EXISTS invite_codes (
  code TEXT PRIMARY KEY,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;

-- Anyone can verify a code (read-only)
CREATE POLICY "Anyone can verify invite codes"
  ON invite_codes FOR SELECT
  USING (true);

-- Seed a default beta code — change or add more via Supabase dashboard
INSERT INTO invite_codes (code, active) VALUES ('BETA2026', true)
  ON CONFLICT (code) DO NOTHING;
