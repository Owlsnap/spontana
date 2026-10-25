import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../i18n/LanguageContext';
import './EmailPreferences.css';

// Linked from every email as /email-preferences?token=...
// Changes only happen on an explicit toggle: email link scanners open URLs (some run JS),
// so nothing may be changed just by loading the page.
export default function EmailPreferences() {
  const { t } = useLanguage();
  const [params] = useSearchParams();
  const token = params.get('token');

  const [prefs, setPrefs] = useState(null);
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'invalid'

  useEffect(() => {
    if (!supabase || !token) { setStatus('invalid'); return; }
    (async () => {
      const { data, error } = await supabase.rpc('get_email_preferences', { p_token: token });
      if (error || !data) { setStatus('invalid'); return; }
      setPrefs(data);
      setStatus('ready');
    })();
  }, [token]);

  async function toggle(key, successMessage = t('emailPrefs.saved')) {
    // Turning the digest on also confirms an unconfirmed newsletter address
    const next = { ...prefs, [key]: !prefs[key], confirmed: prefs.confirmed || (key === 'digest' && !prefs.digest) };
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
      toast.success(successMessage);
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

  // Double opt-in: confirmation is an explicit click, never the page load
  if (!prefs.confirmed) {
    return (
      <div className="emailprefs-container">
        <h1 className="emailprefs-title">{t('emailPrefs.confirmTitle')}</h1>
        <p className="emailprefs-text">{t('emailPrefs.confirmText', { email: prefs.email })}</p>
        <button type="button" className="emailprefs-confirm" onClick={() => toggle('digest', t('emailPrefs.confirmed'))}>
          {t('emailPrefs.confirmButton')}
        </button>
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
