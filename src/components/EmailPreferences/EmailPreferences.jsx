import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../i18n/LanguageContext';
import './EmailPreferences.css';

// Linked from every email as /email-preferences?token=...
// ?unsubscribe=digest turns the digest off on arrival (one click from the email footer).
export default function EmailPreferences() {
  const { t } = useLanguage();
  const [params] = useSearchParams();
  const token = params.get('token');
  const unsubscribe = params.get('unsubscribe');

  const [prefs, setPrefs] = useState(null);
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'invalid'

  useEffect(() => {
    if (!supabase || !token) { setStatus('invalid'); return; }
    (async () => {
      const { data, error } = await supabase.rpc('get_email_preferences', { p_token: token });
      if (error || !data) { setStatus('invalid'); return; }

      if (unsubscribe === 'digest' && data.digest) {
        await supabase.rpc('set_email_preferences', { p_token: token, p_reminders: null, p_digest: false });
        data.digest = false;
      }
      if (unsubscribe === 'reminders' && data.reminders) {
        await supabase.rpc('set_email_preferences', { p_token: token, p_reminders: false, p_digest: null });
        data.reminders = false;
      }
      setPrefs(data);
      setStatus('ready');
    })();
  }, [token, unsubscribe]);

  async function toggle(key) {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    const { error } = await supabase.rpc('set_email_preferences', {
      p_token: token,
      p_reminders: key === 'reminders' ? next.reminders : null,
      p_digest: key === 'digest' ? next.digest : null,
    });
    if (error) {
      setPrefs(prefs);
      toast.error(t('common.error'));
    } else {
      toast.success(t('emailPrefs.saved'));
    }
  }

  if (status === 'loading') return <div className="emailprefs-container" />;

  if (status === 'invalid') {
    return (
      <div className="emailprefs-container">
        <h1 className="emailprefs-title">{t('emailPrefs.title')}</h1>
        <p className="emailprefs-text">{t('emailPrefs.invalid')}</p>
        <Link to="/" className="emailprefs-link">← Spontana</Link>
      </div>
    );
  }

  return (
    <div className="emailprefs-container">
      <h1 className="emailprefs-title">{t('emailPrefs.title')}</h1>
      <p className="emailprefs-text">{t('emailPrefs.subtitle', { email: prefs.email })}</p>

      <div className="emailprefs-list">
        {prefs.type === 'account' && (
          <label className="emailprefs-row">
            <span>
              <span className="emailprefs-label">{t('emailPrefs.reminders')}</span>
              <span className="emailprefs-hint">{t('emailPrefs.remindersHint')}</span>
            </span>
            <input type="checkbox" checked={prefs.reminders} onChange={() => toggle('reminders')} />
          </label>
        )}
        <label className="emailprefs-row">
          <span>
            <span className="emailprefs-label">{t('emailPrefs.digest')}</span>
            <span className="emailprefs-hint">{t('emailPrefs.digestHint')}</span>
          </span>
          <input type="checkbox" checked={prefs.digest} onChange={() => toggle('digest')} />
        </label>
      </div>

      <Link to="/" className="emailprefs-link">← Spontana</Link>
    </div>
  );
}
