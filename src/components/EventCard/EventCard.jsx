//ska innehålla en funktion som filtrerar informationen på EventCard efter användarens val
//ska innehålla typ av event, plats, datum och tid
//ska innehålla en funktion som låter användaren spara eventet
//ska innehålla en funktion som låter användaren dela eventet
//ska innehålla en knapp som låter användaren skapa ett event

import React from "react";
import "./EventCard.css";
import { Link } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";
import { Heart, TrendUp } from "@phosphor-icons/react";
import { useSavedEvents } from "../../context/SavedEventsContext";





export default function EventCard({ events, trendingIds = new Set() }) {
  const { t } = useLanguage();
  const { isSaved, toggleSave } = useSavedEvents();

  if (!events || events.length === 0) {
    return (
      <div className="no-events">
        <div className="no-events-content">
          <h3>{t('eventCard.noEventsFound')}</h3>
          <p>{t('eventCard.noEventsMessage')}</p>
          <Link to="/createevent">
            <button>{t('eventCard.createEvent')}</button>
          </Link>
        </div>
      </div>
    );
  }

  const eventItems = events.map((event) => {
    const eventDate = new Date(event.date);
    const formattedDate = eventDate.toLocaleDateString('sv-SE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    
    // Create tags array
    const tags = [];
    if (event.tags && event.tags.length > 0) {
      tags.push(...event.tags);
    }
    if (event.type) {
      tags.unshift(event.type.toLowerCase().replace(/\s+/g, ''));
    }

    const saved = isSaved(event.id);
    const trending = trendingIds.has(String(event.id));

    return (
      <Link key={event.id || event.eventName} to={`event/${event.id}`} className="event-item-link">
        <div className="event-item-wrapper">
          <article className="event-item">
            <button
              className={`heart-btn${saved ? ' heart-btn--saved' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleSave(event);
              }}
              aria-label={saved ? t('savedEvents.unsave') : t('savedEvents.save')}
            >
              <Heart size={18} weight={saved ? 'fill' : 'regular'} />
            </button>
            <div className="event-content-wrapper">
              <div className="event-meta">
                <time className="event-date">{formattedDate}</time>
                <span className="event-location">
                  @{event.location?.venue || event.location?.city || 'TBA'}
                </span>
                <div className="event-tags">
                  {tags.slice(0, 3).map((tag, index) => (
                    <span key={index} className="event-tag">#{tag}</span>
                  ))}
                </div>
              </div>
              
              <div className="event-content">
                <div className="event-badges">
                  {event.source === 'user' && event.hostType && (
                    <span className={`host-type-badge host-type-${event.hostType}`}>
                      {event.hostType === 'organizer' ? t('createEvent.hostTypeOrganizer') : t('createEvent.hostTypePrivate')}
                    </span>
                  )}
                  {trending && (
                    <span className="trending-badge">
                      <TrendUp size={12} weight="bold" /> {t('eventCard.trending')}
                    </span>
                  )}
                </div>
                <h3 className="event-title">{event.eventName}</h3>
                <p className="event-description">
                  {event.description}
                </p>
                
                <div className="event-details">
                  {event.startTime && (
                    <span className="event-time">{event.startTime}</span>
                  )}

                  {event.availableSpots && (
                    <span className="event-spots">{event.availableSpots} {t('eventCard.spotsLeft')}</span>
                  )}
                </div>
              </div>
            </div>
          </article>
          
          <div className="event-image-container">
            <img
              src={event.img}
              alt={event.eventName}
              className="event-image"
              loading="lazy"
              decoding="async"
              onError={(e) => {
                e.target.src = "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";
              }}
            />
          </div>
        </div>
      </Link>
    );
  });

  return (
    <div className="events-list">
      <div className="events-list-overlay">
        {eventItems}
      </div>
    </div>
  );
}


  



