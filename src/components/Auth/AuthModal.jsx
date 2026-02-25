import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { X } from '@phosphor-icons/react';
import './AuthModal.css';

export default function AuthModal() {
  const { isAuthModalOpen, authModalMode, closeAuthModal, openAuthModal, signIn, signUp, resetPasswordForEmail, updatePassword } = useAuth();
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
