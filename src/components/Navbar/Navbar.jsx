//ska innehålla login/logout och register knappar
//ska innehålla logo
//ska innehålla en sökfunktion som filtrerar eventCards efter användarens input

import React from "react";
import "./Navbar.css";
import spontanaLogo from "../../assets/spontana-logo-nobg.png";
import { useLanguage } from "../../i18n/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const Navbar = () => {
  const { t, language, toggleLanguage } = useLanguage();
  const { user, signOut, openAuthModal } = useAuth();

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
    </div>
  );
};

export default Navbar;
