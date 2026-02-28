import { useState } from 'react';
import { X } from '@phosphor-icons/react';
import { useLanguage } from '../../i18n/LanguageContext';
import './LaunchBanner.css';

export default function LaunchBanner() {
  const { t } = useLanguage();
  const [dismissed, setDismissed] = useState(() =>
    localStorage.getItem('launch-banner-dismissed') === 'true'
  );

  if (dismissed) return null;

  function dismiss() {
    localStorage.setItem('launch-banner-dismissed', 'true');
    setDismissed(true);
  }

  return (
    <div className="launch-banner">
      <span className="launch-banner-badge">{t('banner.badge')}</span>
      <p className="launch-banner-text">{t('banner.text')}</p>
      <button className="launch-banner-close" onClick={dismiss} aria-label="Dismiss">
        <X size={13} weight="bold" />
      </button>
    </div>
  );
}
