//ska innehålla login/logout och register knappar
//ska innehålla logo
//ska innehålla en sökfunktion som filtrerar eventCards efter användarens input

import React, { useState } from "react";
import { createPortal } from "react-dom";
import "./Navbar.css";
import spontanaLogo from "../../assets/spontana-logo-new.svg";
import { useLanguage } from "../../i18n/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const Navbar = () => {
  const { t, language, toggleLanguage } = useLanguage();
  const { user, signOut, openAuthModal, isAdmin } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  function logoClickHome() {
    window.location.href = "/";
  }

  async function handleSignOut() {
    await signOut();
    toast(t('auth.loggedOut'), { duration: 2000 });
  }

  // Truncate email for display
  const displayEmail = user?.email
    ? user.email.length > 22
      ? user.email.slice(0, 20) + '…'
      : user.email
    : '';

  return (
    <div className="navbar">
      <img onClick={logoClickHome} src={spontanaLogo} className="logo" alt="Spontana logo" />

      {/* Desktop nav — hidden on mobile via CSS */}
      <div className="nav-buttons">
        <button
          className="language-toggle"
          onClick={() => {
            toggleLanguage();
            toast(language === 'en' ? '🇸🇪 Språk ändrat till svenska' : '🇬🇧 Language changed to English', { duration: 2000 });
          }}
          aria-label="Toggle language"
        >
          {language === 'en' ? '🇸🇪 SV' : '🇬🇧 EN'}
        </button>

        {user ? (
          <>
            <span className="nav-user-email" title={user.email}>{displayEmail}</span>
            <Link to="/myevents" className="nav-button nav-button-myevents">
              {t('auth.myEvents')}
            </Link>
            <Link to="/saved" className="nav-button nav-button-saved">
              {t('savedEvents.title')}
            </Link>
            {isAdmin && (
              <Link to="/admin" className="nav-button nav-button-admin">
                Admin
              </Link>
            )}
            <button className="nav-button" onClick={handleSignOut}>
              {t('auth.logout')}
            </button>
          </>
        ) : (
          <>
            <button className="nav-button" onClick={() => openAuthModal('login')}>
              {t('navbar.login')}
            </button>
            <button className="nav-button" onClick={() => openAuthModal('signup')}>
              {t('navbar.createAccount')}
            </button>
          </>
        )}
      </div>

      {/* Hamburger — visible on mobile only via CSS */}
      <button className="hamburger-btn" onClick={() => setMenuOpen(true)} aria-label="Open menu">
        ☰
      </button>

      {/* Mobile menu overlay — rendered via portal to escape navbar's clip-path */}
      {menuOpen && createPortal(
        <div className="mobile-menu-overlay" onClick={() => setMenuOpen(false)}>
          <div className="mobile-menu" onClick={e => e.stopPropagation()}>
            <div className="mobile-menu-header">
              <button className="mobile-menu-close" onClick={() => setMenuOpen(false)}>✕</button>
            </div>
            <button
              className="mobile-menu-item language-item"
              onClick={() => {
                toggleLanguage();
                toast(language === 'en' ? '🇸🇪 Språk ändrat till svenska' : '🇬🇧 Language changed to English', { duration: 2000 });
                setMenuOpen(false);
              }}
            >
              {language === 'en' ? '🇸🇪 Svenska' : '🇬🇧 English'}
            </button>
            <div className="mobile-menu-divider" />
            {user ? (
              <>
                <span className="mobile-menu-email">{displayEmail || user.email}</span>
                <Link to="/myevents" className="mobile-menu-item" onClick={() => setMenuOpen(false)}>
                  {t('auth.myEvents')}
                </Link>
                <Link to="/saved" className="mobile-menu-item" onClick={() => setMenuOpen(false)}>
                  {t('savedEvents.title')}
                </Link>
                {isAdmin && (
                  <Link to="/admin" className="mobile-menu-item mobile-menu-admin" onClick={() => setMenuOpen(false)}>
                    Admin
                  </Link>
                )}
                <button className="mobile-menu-item mobile-menu-logout" onClick={() => { handleSignOut(); setMenuOpen(false); }}>
                  {t('auth.logout')}
                </button>
              </>
            ) : (
              <>
                <button className="mobile-menu-item" onClick={() => { openAuthModal('login'); setMenuOpen(false); }}>
                  {t('navbar.login')}
                </button>
                <button className="mobile-menu-item mobile-menu-signup" onClick={() => { openAuthModal('signup'); setMenuOpen(false); }}>
                  {t('navbar.createAccount')}
                </button>
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Navbar;
