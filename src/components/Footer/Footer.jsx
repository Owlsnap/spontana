import React from "react";
import { ArrowRight } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";
import spontanaLogo from "../../assets/spontana-logo-nobg.png";
import mascot from "../../assets/mascot.png";
import "./Footer.css";

const Footer = () => {
  const { t } = useLanguage();

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
          <div className="newsletter-input">
            <input type="email" placeholder={t('footer.emailPlaceholder')} />
            <button className="subscribe-btn"><ArrowRight size={16} weight="bold" /></button>
          </div>
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
