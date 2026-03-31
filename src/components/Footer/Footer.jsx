import React, { useState } from "react";
import { ArrowRight } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";
import { supabase } from "../../lib/supabase";
import spontanaLogo from "../../assets/spontana-logo-nobg.png";
import mascot from "../../assets/mascot.png";
import "./Footer.css";

const Footer = () => {
  const { t } = useLanguage();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState('idle'); // 'idle' | 'submitting' | 'success' | 'error'

  async function handleNewsletterSubmit(e) {
    e.preventDefault();
    if (!newsletterEmail.trim() || newsletterStatus === 'submitting') return;
    setNewsletterStatus('submitting');
    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .insert({ email: newsletterEmail.trim().toLowerCase() });
      if (error && error.code !== '23505') throw error; // 23505 = unique violation (already subscribed)
      setNewsletterStatus('success');
      setNewsletterEmail('');
    } catch {
      setNewsletterStatus('error');
    }
  }

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h4 className="footer-title">{t('footer.discover')}</h4>
          <ul className="footer-links">
            <li><Link to="/">{t('footer.events')}</Link></li>
            <li><Link to="/createevent">{t('footer.createEvent')}</Link></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4 className="footer-title">{t('footer.socialMedia')}</h4>
          <ul className="footer-links">
            <li><a href="https://www.instagram.com/spontana.app/" target="_blank" rel="noopener noreferrer" className="social-link">Instagram</a></li>
            <li><a href="#" className="social-link">Facebook</a></li>
            <li><a href="#" className="social-link">Twitter</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4 className="footer-title">{t('footer.contact')}</h4>
          <ul className="footer-links">
            <li>hello@spontana.app</li>
            <li>{t('footer.location')}</li>
          </ul>
        </div>

        <div className="footer-section">
          <h4 className="footer-title">{t('footer.newsletter')}</h4>
          <p className="newsletter-text">{t('footer.newsletterText')}</p>
          {newsletterStatus === 'success' ? (
            <p className="newsletter-success">{t('footer.subscribeSuccess')}</p>
          ) : (
            <form className="newsletter-input" onSubmit={handleNewsletterSubmit} noValidate>
              <input
                type="email"
                placeholder={t('footer.emailPlaceholder')}
                value={newsletterEmail}
                onChange={(e) => { setNewsletterEmail(e.target.value); setNewsletterStatus('idle'); }}
                required
              />
              <button
                type="submit"
                className="subscribe-btn"
                disabled={newsletterStatus === 'submitting'}
              >
                <ArrowRight size={16} weight="bold" />
              </button>
            </form>
          )}
          {newsletterStatus === 'error' && (
            <p className="newsletter-error">{t('footer.subscribeError')}</p>
          )}
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-brand">
          <img src={spontanaLogo} alt="Spontana" className="footer-logo" />
          <span className="footer-tagline">{t('footer.tagline')}</span>
          <span className="copyright">©2025 ALL RIGHTS RESERVED</span>
        </div>
        <img src={mascot} alt="Spontana mascot" className="footer-mascot" />
      </div>
    </footer>
  );
};

export default Footer;
