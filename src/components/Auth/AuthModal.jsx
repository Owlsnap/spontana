import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { X } from '@phosphor-icons/react';
import './AuthModal.css';

export default function AuthModal() {
  const { isAuthModalOpen, authModalMode, closeAuthModal, openAuthModal, signIn, signUp } = useAuth();
  const { t } = useLanguage();

  const [mode, setMode] = useState(authModalMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Sync mode when parent changes it (e.g. clicking "Log In" vs "Create Account")
  useEffect(() => {
    setMode(authModalMode);
    setError('');
  }, [authModalMode, isAuthModalOpen]);

  // Lock body scroll while open
  useEffect(() => {
    if (isAuthModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  function switchMode(newMode) {
    setMode(newMode);
    setError('');
    setPassword('');
    setConfirmPassword('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (mode === 'signup' && password !== confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'login') {
        await signIn(email, password);
        toast.success(t('auth.loginSuccess'));
      } else {
        await signUp(email, password);
        toast.success(t('auth.signupSuccess'));
      }
      closeAuthModal();
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message || t('common.error'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-backdrop" onClick={closeAuthModal}>
      <div className="auth-modal angular-container" onClick={(e) => e.stopPropagation()}>
        <button className="auth-close" onClick={closeAuthModal} aria-label={t('common.close')}><X size={18} weight="bold" /></button>

        <h2 className="auth-title">
          {mode === 'login' ? t('auth.loginTitle') : t('auth.signupTitle')}
        </h2>
        <p className="auth-subtitle">
          {mode === 'login' ? t('auth.loginSubtitle') : t('auth.signupSubtitle')}
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label htmlFor="auth-email">{t('auth.email')}</label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
            />
          </div>

          <div className="auth-field">
            <label htmlFor="auth-password">{t('auth.password')}</label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          {mode === 'signup' && (
            <div className="auth-field">
              <label htmlFor="auth-confirm">{t('auth.confirmPassword')}</label>
              <input
                id="auth-confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
          )}

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="auth-submit" disabled={submitting}>
            {submitting
              ? '...'
              : mode === 'login'
                ? t('auth.loginButton')
                : t('auth.signupButton')}
          </button>
        </form>

        <p className="auth-switch">
          {mode === 'login' ? (
            <>
              {t('auth.noAccount')}{' '}
              <button className="auth-switch-btn" onClick={() => switchMode('signup')}>
                {t('auth.signupButton')}
              </button>
            </>
          ) : (
            <>
              {t('auth.hasAccount')}{' '}
              <button className="auth-switch-btn" onClick={() => switchMode('login')}>
                {t('auth.loginButton')}
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
