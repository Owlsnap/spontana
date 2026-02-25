import { useState, useEffect } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import './CookieBanner.css';

export default function CookieBanner() {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) setVisible(true);
  }, []);

  function accept() {
    localStorage.setItem('cookie-consent', 'accepted');
    setVisible(false);
  }

  function decline() {
    localStorage.setItem('cookie-consent', 'declined');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="cookie-banner">
      <div className="cookie-content">
        <span className="cookie-title">{t('cookie.title')}</span>
        <span className="cookie-text">{t('cookie.text')}</span>
      </div>
      <div className="cookie-actions">
        <button className="cookie-btn cookie-decline" onClick={decline}>{t('cookie.decline')}</button>
        <button className="cookie-btn cookie-accept" onClick={accept}>{t('cookie.accept')}</button>
      </div>
    </div>
  );
}
