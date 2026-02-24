import React from "react";
import { ArrowRight } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import "./Footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h4 className="footer-title">UPPTÄCK</h4>
          <ul className="footer-links">
            <li><Link to="/">Evenemang</Link></li>
            <li><Link to="/createevent">Skapa event</Link></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4 className="footer-title">SOCIALA MEDIER</h4>
          <ul className="footer-links">
            <li><a href="#" className="social-link">Instagram</a></li>
            <li><a href="#" className="social-link">Facebook</a></li>
            <li><a href="#" className="social-link">Twitter</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4 className="footer-title">KONTAKT</h4>
          <ul className="footer-links">
            <li>hello@spontana.app</li>
            <li>Stockholm, Sverige</li>
          </ul>
        </div>

        <div className="footer-section">
          <h4 className="footer-title">NYHETSBREV</h4>
          <p className="newsletter-text">Missa inte vad som händer.</p>
          <div className="newsletter-input">
            <input type="email" placeholder="Din email" />
            <button className="subscribe-btn"><ArrowRight size={16} weight="bold" /></button>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-brand">
          <span className="brand-name">SPONTANA</span>
          <span className="footer-tagline">Stockholm i fickan.</span>
          <span className="copyright">©2025 ALL RIGHTS RESERVED</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
