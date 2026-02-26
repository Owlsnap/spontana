import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { toast } from 'sonner';

const SavedEventsContext = createContext(null);

export function SavedEventsProvider({ children }) {
  const { user, openAuthModal } = useAuth();
  const { t } = useLanguage();
  const [savedIds, setSavedIds] = useState(new Set());

  useEffect(() => {
    if (!user || !supabase) {
      setSavedIds(new Set());
      return;
    }

    async function loadSaved() {
      const { data, error } = await supabase
        .from('saved_events')
        .select('event_id')
        .eq('user_id', user.id);

      if (!error && data) {
        setSavedIds(new Set(data.map(r => r.event_id)));
      }
    }

    loadSaved();
  }, [user]);

  const isSaved = useCallback((eventId) => savedIds.has(eventId), [savedIds]);

  const toggleSave = useCallback(async (event) => {
    if (!user) {
      toast(t('savedEvents.loginToSave'));
      openAuthModal('login');
      return;
    }
    if (!supabase) return;

    const eventId = event.id;
    const wasSaved = savedIds.has(eventId);

    // Optimistic update
    setSavedIds(prev => {
      const next = new Set(prev);
      if (wasSaved) next.delete(eventId);
      else next.add(eventId);
      return next;
    });

    if (wasSaved) {
      const { error } = await supabase
        .from('saved_events')
        .delete()
        .eq('user_id', user.id)
        .eq('event_id', eventId);

      if (error) {
        setSavedIds(prev => { const next = new Set(prev); next.add(eventId); return next; });
      } else {
        toast(t('savedEvents.eventUnsaved'));
      }
    } else {
      const { error } = await supabase
        .from('saved_events')
        .insert({ user_id: user.id, event_id: eventId });

      if (error) {
        setSavedIds(prev => { const next = new Set(prev); next.delete(eventId); return next; });
      } else {
        toast.success(t('savedEvents.eventSaved'));
      }
    }
  }, [user, savedIds, openAuthModal, t]);

  return (
    <SavedEventsContext.Provider value={{ savedIds, isSaved, toggleSave }}>
      {children}
    </SavedEventsContext.Provider>
  );
}

export function useSavedEvents() {
  return useContext(SavedEventsContext);
}
