import React, { useState, useEffect } from 'react';
import './SavedEvents.css';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { useSavedEvents } from '../../context/SavedEventsContext';
import { supabase } from '../../lib/supabase';
import { dbRowToEvent } from '../../lib/mapEvent';
import EventCard from '../EventCard/EventCard';
import { Link } from 'react-router-dom';
import { Heart } from '@phosphor-icons/react';

export default function SavedEvents() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { savedIds } = useSavedEvents();
  const [savedEvents, setSavedEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !supabase) {
      setLoading(false);
      return;
    }

    async function loadSavedEvents() {
      setLoading(true);

      const { data: savedData, error: savedError } = await supabase
        .from('saved_events')
        .select('event_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (savedError || !savedData || savedData.length === 0) {
        setSavedEvents([]);
        setLoading(false);
        return;
      }

      const ids = savedData.map(r => r.event_id);

      const { data: eventRows, error: eventError } = await supabase
        .from('events')
        .select('*')
        .in('id', ids);

      if (!eventError && eventRows) {
        const eventMap = new Map(eventRows.map(r => [r.id, r]));
        const ordered = ids
          .map(id => eventMap.get(id))
          .filter(Boolean)
          .map(dbRowToEvent);
        setSavedEvents(ordered);
      }

      setLoading(false);
    }

    loadSavedEvents();
  }, [user]);

  // Filter by current savedIds so unsaving removes the event immediately
  const displayedEvents = savedEvents.filter(e => savedIds.has(e.id));

  return (
    <div className="saved-events-page">
      <div className="saved-events-header">
        <h1 className="saved-events-title">
          <Heart size={26} weight="fill" className="saved-title-heart" />
          {t('savedEvents.title')}
        </h1>
      </div>

      {loading ? (
        <div className="saved-events-loading">
          <div className="saved-loading-pulse" />
          <div className="saved-loading-pulse" />
          <div className="saved-loading-pulse" />
        </div>
      ) : displayedEvents.length === 0 ? (
        <div className="saved-events-empty">
          <Heart size={52} weight="regular" className="saved-empty-icon" />
          <h3 className="saved-empty-title">{t('savedEvents.noSavedEvents')}</h3>
          <p className="saved-empty-msg">{t('savedEvents.noSavedEventsMsg')}</p>
          <Link to="/" className="saved-browse-btn">
            {t('savedEvents.browseEvents')}
          </Link>
        </div>
      ) : (
        <EventCard events={displayedEvents} />
      )}
    </div>
  );
}
