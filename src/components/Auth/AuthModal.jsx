import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { X } from '@phosphor-icons/react';
import './AuthModal.css';

export default function AuthModal() {
  const { isAuthModalOpen, authModalMode, closeAuthModal, openAuthModal, signIn, signUp, signInWithGoogle, resetPasswordForEmail, updatePassword } = useAuth();
  const { t } = useLanguage();

  const [mode, setMode] = useState(authModalMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

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

    if (mode === 'resetPassword' && password !== confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'login') {
        await signIn(email, password);
        toast.success(t('auth.loginSuccess'));
        closeAuthModal();
      } else if (mode === 'signup') {
        await signUp(email, password);
        toast.success(t('auth.signupSuccess'));
        closeAuthModal();
      } else if (mode === 'forgot') {
        await resetPasswordForEmail(email);
        toast.success(t('auth.forgotSuccess'));
        closeAuthModal();
      } else if (mode === 'resetPassword') {
        await updatePassword(password);
        toast.success(t('auth.resetSuccess'));
        closeAuthModal();
      }
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
          {mode === 'login' && t('auth.loginTitle')}
          {mode === 'signup' && t('auth.signupTitle')}
          {mode === 'forgot' && t('auth.forgotTitle')}
          {mode === 'resetPassword' && t('auth.resetTitle')}
        </h2>
        <p className="auth-subtitle">
          {mode === 'login' && t('auth.loginSubtitle')}
          {mode === 'signup' && t('auth.signupSubtitle')}
          {mode === 'forgot' && t('auth.forgotSubtitle')}
          {mode === 'resetPassword' && t('auth.resetSubtitle')}
        </p>

        <form onSubmit={handleSubmit} noValidate>
          {(mode === 'login' || mode === 'signup' || mode === 'forgot') && (
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
          )}

          {(mode === 'login' || mode === 'signup' || mode === 'resetPassword') && (
            <div className="auth-field">
              <label htmlFor="auth-password">
                {mode === 'resetPassword' ? t('auth.newPassword') : t('auth.password')}
              </label>
              <input
                id="auth-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                autoFocus={mode === 'resetPassword'}
              />
            </div>
          )}

          {(mode === 'signup' || mode === 'resetPassword') && (
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
            {submitting ? '...' : (
              mode === 'login' ? t('auth.loginButton') :
              mode === 'signup' ? t('auth.signupButton') :
              mode === 'forgot' ? t('auth.forgotButton') :
              t('auth.resetButton')
            )}
          </button>
        </form>

        {(mode === 'login' || mode === 'signup') && (
          <>
            <div className="auth-divider">
              <span>{t('auth.orContinueWith')}</span>
            </div>
            <button
              type="button"
              className="auth-google-btn"
              disabled={googleLoading}
              onClick={async () => {
                setGoogleLoading(true);
                try {
                  await signInWithGoogle();
                } catch (err) {
                  setError(err.message || t('common.error'));
                  setGoogleLoading(false);
                }
              }}
            >
              <svg className="auth-google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {googleLoading ? '...' : 'Google'}
            </button>
          </>
        )}

        <p className="auth-switch">
          {mode === 'login' && (
            <>
              <button className="auth-switch-btn" onClick={() => switchMode('forgot')}>
                {t('auth.forgotPassword')}
              </button>
              {'  ·  '}
              {t('auth.noAccount')}{' '}
              <button className="auth-switch-btn" onClick={() => switchMode('signup')}>
                {t('auth.signupButton')}
              </button>
            </>
          )}
          {mode === 'signup' && (
            <>
              {t('auth.hasAccount')}{' '}
              <button className="auth-switch-btn" onClick={() => switchMode('login')}>
                {t('auth.loginButton')}
              </button>
            </>
          )}
          {(mode === 'forgot' || mode === 'resetPassword') && (
            <button className="auth-switch-btn" onClick={() => switchMode('login')}>
              {t('auth.backToLogin')}
            </button>
          )}
        </p>
      </div>
    </div>
  );
}
