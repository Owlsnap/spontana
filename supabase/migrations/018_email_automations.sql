-- Email automations: Postgres triggers push events to n8n, n8n pulls
-- reminder/digest data through service-role RPCs and sends via Resend.
--
-- Setup (once, in SQL editor — values never live in git):
--   select vault.create_secret('https://<you>.app.n8n.cloud/webhook/spontana-events', 'n8n_webhook_url');
--   select vault.create_secret('<long random string>', 'n8n_webhook_secret');
-- Until n8n_webhook_url exists, notify_n8n() is a no-op.

-- ── Preferences ────────────────────────────────────────────────────────────
-- email_token lets an email link straight to a preferences page without login.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'sv' CHECK (language IN ('sv', 'en')),
  ADD COLUMN IF NOT EXISTS email_reminders BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS email_digest BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS email_token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE;

ALTER TABLE newsletter_subscribers
  ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'sv' CHECK (language IN ('sv', 'en')),
  ADD COLUMN IF NOT EXISTS unsubscribed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS email_token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE;

-- Signup passes { language, email_digest } as user metadata
CREATE OR REPLACE FUNCTION create_profile_for_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, language, email_digest)
  VALUES (
    NEW.id,
    CASE WHEN NEW.raw_user_meta_data->>'language' = 'en' THEN 'en' ELSE 'sv' END,
    COALESCE(NEW.raw_user_meta_data->>'email_digest' = 'true', FALSE)
  )
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

-- ── Send log (dedup for scheduled emails) ──────────────────────────────────

CREATE TABLE IF NOT EXISTS email_log (
  id BIGSERIAL PRIMARY KEY,
  kind TEXT NOT NULL,         -- 'reminder' | 'digest'
  recipient TEXT NOT NULL,
  ref TEXT NOT NULL,          -- event id for reminders, ISO week (2026-W43) for digests
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (kind, recipient, ref)
);

-- No policies: service role only
ALTER TABLE email_log ENABLE ROW LEVEL SECURITY;

-- ── Push: triggers → n8n webhook ───────────────────────────────────────────

CREATE OR REPLACE FUNCTION notify_n8n(p_kind TEXT, p_payload JSONB)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_url TEXT;
  v_secret TEXT;
BEGIN
  SELECT decrypted_secret INTO v_url FROM vault.decrypted_secrets WHERE name = 'n8n_webhook_url';
  SELECT decrypted_secret INTO v_secret FROM vault.decrypted_secrets WHERE name = 'n8n_webhook_secret';
  IF v_url IS NULL THEN RETURN; END IF;

  -- pg_net queues the request, so this never blocks signup or event creation
  PERFORM net.http_post(
    url     := v_url,
    headers := jsonb_build_object('Content-Type', 'application/json', 'X-Spontana-Secret', COALESCE(v_secret, '')),
    body    := jsonb_build_object('kind', p_kind) || p_payload
  );
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_n8n(%) failed: %', p_kind, SQLERRM;
END;
$$;

-- Welcome email once the address is confirmed (password signups confirm later,
-- Google signups arrive confirmed). Trigger name sorts after on_auth_user_created,
-- so the profile row already exists on INSERT.
CREATE OR REPLACE FUNCTION notify_user_confirmed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile profiles%ROWTYPE;
BEGIN
  IF NEW.email_confirmed_at IS NULL OR (TG_OP = 'UPDATE' AND OLD.email_confirmed_at IS NOT NULL) THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_profile FROM profiles WHERE id = NEW.id;
  PERFORM notify_n8n('welcome', jsonb_build_object(
    'email', NEW.email,
    'language', COALESCE(v_profile.language, 'sv'),
    'email_token', v_profile.email_token
  ));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_email_confirmed
  AFTER INSERT OR UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW EXECUTE FUNCTION notify_user_confirmed();

-- User-created events: confirmation on submit, and again when approved
CREATE OR REPLACE FUNCTION notify_user_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_kind TEXT;
  v_email TEXT;
  v_language TEXT;
  v_token UUID;
BEGIN
  IF NEW.source <> 'user' OR NEW.created_by IS NULL THEN RETURN NEW; END IF;

  IF TG_OP = 'INSERT' THEN
    v_kind := 'event_submitted';
  ELSIF OLD.status = 'pending' AND NEW.status = 'active' THEN
    v_kind := 'event_approved';
  ELSE
    RETURN NEW;
  END IF;

  SELECT u.email, p.language, p.email_token INTO v_email, v_language, v_token
  FROM auth.users u LEFT JOIN profiles p ON p.id = u.id
  WHERE u.id = NEW.created_by;
  IF v_email IS NULL THEN RETURN NEW; END IF;

  PERFORM notify_n8n(v_kind, jsonb_build_object(
    'email', v_email,
    'language', COALESCE(v_language, 'sv'),
    'email_token', v_token,
    'event', jsonb_build_object(
      'id', NEW.id, 'name', NEW.event_name, 'date', NEW.date, 'end_date', NEW.end_date,
      'start_time', NEW.start_time, 'venue', NEW.venue, 'img', NEW.img
    )
  ));
  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_user_event_insert
  AFTER INSERT ON events
  FOR EACH ROW EXECUTE FUNCTION notify_user_event();

CREATE TRIGGER notify_user_event_status
  AFTER UPDATE OF status ON events
  FOR EACH ROW EXECUTE FUNCTION notify_user_event();

-- ── Pull: RPCs for scheduled n8n workflows (service role only) ─────────────

-- One row per user: their saved events happening p_days_ahead days from today (Stockholm)
CREATE OR REPLACE FUNCTION get_due_reminders(p_days_ahead INT DEFAULT 1)
RETURNS TABLE(email TEXT, language TEXT, email_token UUID, events JSONB)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.email::text, p.language, p.email_token,
    jsonb_agg(jsonb_build_object(
      'id', e.id, 'name', e.event_name, 'date', e.date, 'start_time', e.start_time,
      'venue', e.venue, 'img', e.img
    ) ORDER BY e.start_time NULLS LAST)
  FROM saved_events s
  JOIN events e ON e.id = s.event_id
  JOIN profiles p ON p.id = s.user_id
  JOIN auth.users u ON u.id = s.user_id
  WHERE p.email_reminders
    AND u.email_confirmed_at IS NOT NULL
    AND e.status = 'active'
    AND e.date = (NOW() AT TIME ZONE 'Europe/Stockholm')::date + p_days_ahead
    AND NOT EXISTS (
      SELECT 1 FROM email_log l
      WHERE l.kind = 'reminder' AND l.recipient = u.email AND l.ref = e.id
    )
  GROUP BY u.email, p.language, p.email_token;
$$;

-- Digest content: events added in the last 7 days, plus the most-viewed of the coming week
CREATE OR REPLACE FUNCTION get_digest_events(p_limit INT DEFAULT 6)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH today AS (SELECT (NOW() AT TIME ZONE 'Europe/Stockholm')::date AS d),
  fresh AS (
    SELECT e.* FROM events e, today
    WHERE e.status = 'active' AND e.date >= today.d
      AND e.created_at > NOW() - INTERVAL '7 days'
      AND COALESCE(e.img, '') <> ''
    ORDER BY e.view_count DESC NULLS LAST, e.date
    LIMIT p_limit
  ),
  upcoming AS (
    SELECT e.* FROM events e, today
    WHERE e.status = 'active' AND e.date BETWEEN today.d AND today.d + 7
      AND COALESCE(e.img, '') <> ''
      AND e.id NOT IN (SELECT id FROM fresh)
    ORDER BY e.view_count DESC NULLS LAST, e.date
    LIMIT p_limit
  )
  SELECT jsonb_build_object(
    'new', COALESCE((SELECT jsonb_agg(jsonb_build_object(
      'id', id, 'name', event_name, 'date', date, 'start_time', start_time, 'venue', venue, 'img', img, 'type', type
    ) ORDER BY date) FROM fresh), '[]'::jsonb),
    'upcoming', COALESCE((SELECT jsonb_agg(jsonb_build_object(
      'id', id, 'name', event_name, 'date', date, 'start_time', start_time, 'venue', venue, 'img', img, 'type', type
    ) ORDER BY date) FROM upcoming), '[]'::jsonb)
  );
$$;

-- Opted-in accounts + newsletter subscribers, deduped by address, minus anyone already sent p_ref
CREATE OR REPLACE FUNCTION get_digest_recipients(p_ref TEXT)
RETURNS TABLE(email TEXT, language TEXT, email_token UUID)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT ON (lower(r.email)) r.email, r.language, r.email_token
  FROM (
    SELECT u.email::text AS email, p.language, p.email_token, 1 AS priority
    FROM profiles p JOIN auth.users u ON u.id = p.id
    WHERE p.email_digest AND u.email_confirmed_at IS NOT NULL
    UNION ALL
    SELECT n.email, n.language, n.email_token, 2
    FROM newsletter_subscribers n
    WHERE n.unsubscribed_at IS NULL
  ) r
  WHERE NOT EXISTS (
    SELECT 1 FROM email_log l
    WHERE l.kind = 'digest' AND lower(l.recipient) = lower(r.email) AND l.ref = p_ref
  )
  ORDER BY lower(r.email), r.priority;
$$;

CREATE OR REPLACE FUNCTION log_emails_sent(p_kind TEXT, p_recipient TEXT, p_refs TEXT[])
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO email_log (kind, recipient, ref)
  SELECT p_kind, p_recipient, unnest(p_refs)
  ON CONFLICT DO NOTHING;
$$;

REVOKE EXECUTE ON FUNCTION notify_n8n(TEXT, JSONB) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION get_due_reminders(INT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION get_digest_events(INT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION get_digest_recipients(TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION log_emails_sent(TEXT, TEXT, TEXT[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION get_due_reminders(INT) TO service_role;
GRANT EXECUTE ON FUNCTION get_digest_events(INT) TO service_role;
GRANT EXECUTE ON FUNCTION get_digest_recipients(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION log_emails_sent(TEXT, TEXT, TEXT[]) TO service_role;

-- ── Public RPCs: newsletter signup + token-based preferences page ──────────

-- Re-subscribing after an unsubscribe clears unsubscribed_at instead of hitting the unique constraint
CREATE OR REPLACE FUNCTION subscribe_newsletter(p_email TEXT, p_language TEXT DEFAULT 'sv')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RAISE EXCEPTION 'Invalid email';
  END IF;
  INSERT INTO newsletter_subscribers (email, language)
  VALUES (lower(trim(p_email)), CASE WHEN p_language = 'en' THEN 'en' ELSE 'sv' END)
  ON CONFLICT (email) DO UPDATE SET unsubscribed_at = NULL;
END;
$$;

CREATE OR REPLACE FUNCTION get_email_preferences(p_token UUID)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT jsonb_build_object('type', 'account', 'email', u.email,
              'reminders', p.email_reminders, 'digest', p.email_digest)
       FROM profiles p JOIN auth.users u ON u.id = p.id WHERE p.email_token = p_token),
    (SELECT jsonb_build_object('type', 'newsletter', 'email', n.email,
              'reminders', NULL, 'digest', n.unsubscribed_at IS NULL)
       FROM newsletter_subscribers n WHERE n.email_token = p_token)
  );
$$;

-- Turning the digest off from an account also unsubscribes that address from the
-- footer newsletter, otherwise the dedup in get_digest_recipients would still send it.
CREATE OR REPLACE FUNCTION set_email_preferences(p_token UUID, p_reminders BOOLEAN, p_digest BOOLEAN)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
BEGIN
  UPDATE profiles p
     SET email_reminders = COALESCE(p_reminders, p.email_reminders),
         email_digest = COALESCE(p_digest, p.email_digest)
   WHERE p.email_token = p_token
  RETURNING (SELECT u.email FROM auth.users u WHERE u.id = p.id) INTO v_email;

  IF v_email IS NOT NULL THEN
    IF p_digest = FALSE THEN
      UPDATE newsletter_subscribers SET unsubscribed_at = NOW()
       WHERE lower(email) = lower(v_email) AND unsubscribed_at IS NULL;
    END IF;
    RETURN TRUE;
  END IF;

  UPDATE newsletter_subscribers
     SET unsubscribed_at = CASE WHEN p_digest THEN NULL ELSE COALESCE(unsubscribed_at, NOW()) END
   WHERE email_token = p_token AND p_digest IS NOT NULL;
  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION subscribe_newsletter(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_email_preferences(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION set_email_preferences(UUID, BOOLEAN, BOOLEAN) TO anon, authenticated;
