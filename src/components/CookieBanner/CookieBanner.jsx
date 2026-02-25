import { useState, useEffect } from 'react';
import './CookieBanner.css';

export default function CookieBanner() {
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
        <span className="cookie-title">Cookies.</span>
        <span className="cookie-text">
          We use them to keep you logged in. No tracking, no ads, no selling your data to anyone.
        </span>
      </div>
      <div className="cookie-actions">
        <button className="cookie-btn cookie-decline" onClick={decline}>No thanks</button>
        <button className="cookie-btn cookie-accept" onClick={accept}>Got it</button>
      </div>
    </div>
  );
}
