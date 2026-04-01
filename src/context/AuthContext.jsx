import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  // Modal control
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login'); // 'login' | 'signup' | 'forgot' | 'resetPassword'

  async function loadProfile(userId) {
    if (!supabase || !userId) { setProfile(null); return; }
    const { data } = await supabase
      .from('profiles')
      .select('role, display_name, organization_name')
      .eq('id', userId)
      .single();
    setProfile(data ?? null);
  }

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      await loadProfile(session?.user?.id);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      loadProfile(session?.user?.id);
      if (event === 'PASSWORD_RECOVERY') {
        setAuthModalMode('resetPassword');
        setIsAuthModalOpen(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signIn(email, password) {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async function signUp(email, password) {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) throw error;
    return data;
  }

  async function signInWithGoogle() {
    if (!supabase) throw new Error('Supabase not configured');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) throw error;
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
  }

  async function resetPasswordForEmail(email) {
    if (!supabase) throw new Error('Supabase not configured');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) throw error;
  }

  async function updatePassword(newPassword) {
    if (!supabase) throw new Error('Supabase not configured');
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  }

  async function resendConfirmationEmail(email) {
    if (!supabase) throw new Error('Supabase not configured');
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    if (error) throw error;
  }

  function openAuthModal(mode = 'login') {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  }

  function closeAuthModal() {
    setIsAuthModalOpen(false);
  }

  async function deleteAccount() {
    if (!supabase) throw new Error('Supabase not configured');
    const { error } = await supabase.rpc('delete_own_account');
    if (error) throw error;
    setUser(null);
    setSession(null);
    setProfile(null);
  }

  const isAdmin = profile?.role === 'admin';

  const value = {
    user,
    session,
    loading,
    profile,
    isAdmin,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    resetPasswordForEmail,
    updatePassword,
    deleteAccount,
    isAuthModalOpen,
    authModalMode,
    openAuthModal,
    closeAuthModal,
    resendConfirmationEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
