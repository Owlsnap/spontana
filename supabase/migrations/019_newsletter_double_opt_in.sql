-- Double opt-in for the footer newsletter.
-- subscribe_newsletter() sends a confirmation email (via n8n); the address only
-- receives the digest after clicking Confirm on /email-preferences?token=...

ALTER TABLE newsletter_subscribers
  ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS confirmation_sent_at TIMESTAMPTZ;

-- Rows from before this migration submitted the form under single opt-in; keep them
UPDATE newsletter_subscribers SET confirmed_at = subscribed_at WHERE confirmed_at IS NULL;

-- Signups go through subscribe_newsletter() only
DROP POLICY IF EXISTS "Anyone can subscribe" ON newsletter_subscribers;

CREATE OR REPLACE FUNCTION subscribe_newsletter(p_email TEXT, p_language TEXT DEFAULT 'sv')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row newsletter_subscribers%ROWTYPE;
BEGIN
  IF p_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RAISE EXCEPTION 'Invalid email';
  END IF;

  INSERT INTO newsletter_subscribers (email, language)
  VALUES (lower(trim(p_email)), CASE WHEN p_language = 'en' THEN 'en' ELSE 'sv' END)
  ON CONFLICT (email) DO NOTHING;

  SELECT * INTO v_row FROM newsletter_subscribers WHERE email = lower(trim(p_email)) FOR UPDATE;

  -- Already subscribed: nothing to confirm. Sent recently: don't let the form spam an inbox.
  IF (v_row.confirmed_at IS NOT NULL AND v_row.unsubscribed_at IS NULL)
     OR v_row.confirmation_sent_at > NOW() - INTERVAL '10 minutes' THEN
    RETURN;
  END IF;

  UPDATE newsletter_subscribers SET confirmation_sent_at = NOW() WHERE id = v_row.id;
  PERFORM notify_n8n('newsletter_confirm', jsonb_build_object(
    'email', v_row.email,
    'language', v_row.language,
    'email_token', v_row.email_token
  ));
END;
$$;

CREATE OR REPLACE FUNCTION get_email_preferences(p_token UUID)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT jsonb_build_object('type', 'account', 'email', u.email, 'confirmed', TRUE,
              'reminders', p.email_reminders, 'digest', p.email_digest)
       FROM profiles p JOIN auth.users u ON u.id = p.id WHERE p.email_token = p_token),
    (SELECT jsonb_build_object('type', 'newsletter', 'email', n.email, 'confirmed', n.confirmed_at IS NOT NULL,
              'reminders', NULL, 'digest', n.confirmed_at IS NOT NULL AND n.unsubscribed_at IS NULL)
       FROM newsletter_subscribers n WHERE n.email_token = p_token)
  );
$$;

-- Turning the digest on from a newsletter token confirms the address: the token
-- only ever reaches that inbox, and this only runs on an explicit click.
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
     SET unsubscribed_at = CASE WHEN p_digest THEN NULL ELSE COALESCE(unsubscribed_at, NOW()) END,
         confirmed_at = CASE WHEN p_digest THEN COALESCE(confirmed_at, NOW()) ELSE confirmed_at END
   WHERE email_token = p_token AND p_digest IS NOT NULL;
  RETURN FOUND;
END;
$$;

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
    WHERE n.confirmed_at IS NOT NULL AND n.unsubscribed_at IS NULL
  ) r
  WHERE NOT EXISTS (
    SELECT 1 FROM email_log l
    WHERE l.kind = 'digest' AND lower(l.recipient) = lower(r.email) AND l.ref = p_ref
  )
  ORDER BY lower(r.email), r.priority;
$$;
