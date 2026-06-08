import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import "./Eventpage.css";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";
import EventpageSkeleton from "../Skeleton/EventpageSkeleton";
import { supabase } from "../../lib/supabase";
import { dbRowToEvent } from "../../lib/mapEvent";
import { toast } from "sonner";
import {
  CalendarBlank, Clock, MapPin, MapTrifold,
  Envelope, Phone, Sparkle, Lightning,
  Ticket, Heart, Export,
  TwitterLogo, FacebookLogo, LinkedinLogo, WhatsappLogo,
  Link as LinkIcon, ArrowLeft,
} from "@phosphor-icons/react";
import { useSavedEvents } from "../../context/SavedEventsContext";

export default function Eventpage({ events: propEvents }) {
  const { t } = useLanguage();
  const { isSaved, toggleSave } = useSavedEvents();
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  window.scrollTo(0, 0);

  useEffect(() => {
    async function loadEvent() {
      setIsLoading(true);

      // First try from props
      if (propEvents && propEvents.length > 0) {
        const found = propEvents.find((e) => String(e.id) === id);
        if (found) {
          setEvent(found);
          setIsLoading(false);
          return;
        }
      }

      // Then try Supabase — fetch single event by id
      if (supabase) {
        try {
          const { data: row, error } = await supabase
            .from("events")
            .select("*")
            .eq("id", id)
            .single();

          if (!error && row) {
            setEvent(dbRowToEvent(row));
            setIsLoading(false);
            return;
          }
        } catch {
          // Supabase unreachable
        }
      }

      // Not found
      setEvent(null);
      setIsLoading(false);
    }

    loadEvent();
  }, [id, propEvents]);

  // Show skeleton while loading
  if (isLoading) {
    return <EventpageSkeleton />;
  }

  if (!event) {
    return (
      <div className="eventpage-error">
        <div className="error-content angular-large white-border">
          <h1>{t('eventPage.notFound')}</h1>
          <p>{t('eventPage.notFoundMsg')}</p>
          <Link to="/" className="back-button">
            <ArrowLeft size={16} weight="bold" /> {t('eventPage.backToEvents')}
          </Link>
        </div>
      </div>
    );
  }

  // Calculate days until event
  const eventDate = new Date(event.date);
  const today = new Date();
  const daysUntil = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));

  // Calculate percentage of spots filled
  const spotsFilled = event.capacity
    ? ((event.capacity - (event.availableSpots || 0)) / event.capacity) * 100
    : 0;

  // Share functionality
  const handleShare = (platform) => {
    const eventUrl = window.location.href;
    const eventTitle = encodeURIComponent(event.eventName);

    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?text=${eventTitle}&url=${eventUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${eventUrl}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${eventUrl}`,
      whatsapp: `https://wa.me/?text=${eventTitle}%20${eventUrl}`,
      copy: eventUrl
    };

    if (platform === 'copy') {
      navigator.clipboard.writeText(eventUrl);
      toast.success(t('eventPage.linkCopied'));
    } else {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
    setShowShareMenu(false);
  };

  const handleGetDirections = () => {
    const query = encodeURIComponent(
      [event.location?.address, event.location?.venue, event.location?.city]
        .filter(Boolean)
        .join(', ')
    );
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
    toast.success(t('eventPage.openingDirections'));
  };

  const handleSave = () => {
    toggleSave(event);
  };

  const canonicalUrl = `https://spontana.app/event/${event.id}`;
  const ogImage = event.img || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1200&auto=format&fit=crop";

  const eventInfo = (
    <div key={event.eventName} className="eventpage">
      <Helmet>
        <title>{event.eventName} — Spontana</title>
        <meta name="description" content={event.description || `${event.eventName} at ${event.location?.venue || 'Stockholm'}`} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={event.eventName} />
        <meta property="og:description" content={event.description || `${event.eventName} at ${event.location?.venue || 'Stockholm'}`} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="event" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={event.eventName} />
        <meta name="twitter:image" content={ogImage} />
      </Helmet>

      {/* Hero Section with Event Image */}
      <div className="event-hero">
        <div className="event-hero-image-container">
          <img
            className="event-hero-image"
            src={event.img || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3"}
            alt={event.eventName}
            onError={(e) => {
              e.target.src = "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3";
            }}
          />
          <div className="event-hero-overlay"></div>
        </div>

        <button className="back-arrow-btn" onClick={() => navigate(-1)} aria-label="Go back">
          <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24">
            <path d="M7 7h8.586L5.293 17.293l1.414 1.414L17 8.414V17h2V5H7v2z" fill="white"/>
          </svg>
        </button>

        <div className="event-hero-content">
          <h1 className="event-hero-title">
            {event.eventName}
          </h1>

          <div className="event-hero-meta">
            <div className="event-meta-item">
              <span className="meta-icon"><CalendarBlank size={18} weight="duotone" /></span>
              <span className="meta-text">{new Date(event.date).toLocaleDateString('sv-SE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <div className="event-meta-item">
              <span className="meta-icon"><Clock size={18} weight="duotone" /></span>
              <span className="meta-text">{event.startTime}{event.endTime ? ` - ${event.endTime}` : ''}</span>
            </div>
            <div className="event-meta-item">
              <span className="meta-icon"><MapPin size={18} weight="duotone" /></span>
              <span className="meta-text">{event.location?.venue || event.venue}{event.location?.city ? `, ${event.location.city}` : ''}</span>
            </div>
          </div>

          <div className="event-status-container">
            {daysUntil >= 0 && daysUntil <= 7 && (
              <span className="event-urgency-badge">
                {daysUntil === 0 ? t('eventPage.today') : daysUntil === 1 ? t('eventPage.tomorrow') : t('eventPage.daysAway', { count: daysUntil })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="event-content-grid">
        {/* Left Column - Main Info */}
        <div className="event-main-column">
          {/* Description Section */}
          <div className="event-section angular-container white-border">
            <h2 className="section-title">
              {t('eventPage.description')}
            </h2>
            {event.description ? (
              <p className="event-description-text">{event.description}</p>
            ) : (
              <p className="event-description-text event-description-empty">
                {event.source === 'ticketmaster'
                  ? t('eventPage.noDescriptionTicketmaster')
                  : t('eventPage.noDescription')}
              </p>
            )}
            {event.url && (
              <a href={event.url} target="_blank" rel="noopener noreferrer" className="directions-button">
                {event.description ? t('eventPage.viewOriginal') : t('eventPage.viewFullDetails')}
              </a>
            )}
          </div>

          {/* Location Section */}
          <div className="event-section angular-container white-border">
            <h2 className="section-title">
              {t('eventPage.location')}
            </h2>
            <div className="location-details">
              <h3 className="venue-name">{event.location?.venue || ''}</h3>
              <p className="venue-address">
                {event.location?.address || ''}<br />
                {event.location?.city || ''}{event.location?.state ? `, ${event.location.state}` : ''} {event.location?.postalCode || ''}<br />
                {event.location?.country || ''}
              </p>
              <button className="directions-button" onClick={handleGetDirections}>
                <MapTrifold size={16} weight="duotone" /> {t('eventPage.getDirections')}
              </button>
            </div>
          </div>

          {/* Organizer Section */}
          {event.organizer?.name && (
            <div className="event-section angular-container white-border">
              <h2 className="section-title">
                {t('eventPage.organizer')}
              </h2>
              <div className="organizer-details">
                <div className="organizer-avatar">
                  {event.organizer.name.charAt(0).toUpperCase()}
                </div>
                <div className="organizer-info">
                  <h3 className="organizer-name">{event.organizer.name}</h3>
                  {event.hostType && (
                    <span className={`host-type-badge host-type-${event.hostType}`}>
                      {event.hostType === 'organizer' ? t('createEvent.hostTypeOrganizer') : t('createEvent.hostTypePrivate')}
                    </span>
                  )}
                  {event.organizer.email && (
                    <a href={`mailto:${event.organizer.email}`} className="organizer-contact">
                      <Envelope size={15} weight="duotone" /> {event.organizer.email}
                    </a>
                  )}
                  {event.organizer.phone && (
                    <a href={`tel:${event.organizer.phone}`} className="organizer-contact">
                      <Phone size={15} weight="duotone" /> {event.organizer.phone}
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tags Section */}
          {event.tags && event.tags.length > 0 && (
            <div className="event-section angular-container white-border">
              <h2 className="section-title">
                {t('eventPage.tags')}
              </h2>
              <div className="event-tags-grid">
                <span className="event-tag-main">{event.type}</span>
                {event.tags.map((tag, index) => (
                  <span key={index} className="event-tag">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Hosts Section */}
          {event.hosts && event.hosts.length > 0 && (
            <div className="event-section angular-container white-border">
              <h2 className="section-title">
                {t('eventPage.hosts')}
              </h2>
              <div className="hosts-list">
                {event.hosts.map((host, index) => (
                  <div key={index} className="host-item">
                    <div className="host-avatar">{host.charAt(0)}</div>
                    <span className="host-name">{host}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Sidebar */}
        <div className="event-sidebar">
          {/* Action Card */}
          <div className="event-action-card angular-large white-border cyberpunk-glow">
            <div className="price-section">
              {event.price?.amount > 0 ? (
                <>
                  <div className="price-main">
                    <span className="price-amount">{event.price.amount}</span>
                    <span className="price-currency">{event.price.currency}</span>
                  </div>
                  {event.price.earlyBird && (
                    <div className="price-early-bird">
                      <span className="early-bird-label">{t('eventPage.earlyBird')}</span>
                      <span className="early-bird-price">{event.price.earlyBird} {event.price.currency}</span>
                    </div>
                  )}
                </>
              ) : event.price?.amount === 0 ? (
                <div className="price-free">
                  <span className="free-badge"><Sparkle size={16} weight="fill" /> {t('eventPage.free')}</span>
                </div>
              ) : null}
            </div>

            {event.capacity > 0 && (
              <div className="capacity-section">
                <div className="capacity-info">
                  <div className="capacity-label">{t('eventPage.availableSpots')}</div>
                  <div className="capacity-count">
                    <span className="spots-available">{event.availableSpots || '?'}</span>
                    <span className="spots-total">/ {event.capacity}</span>
                  </div>
                </div>
                <div className="capacity-bar">
                  <div
                    className="capacity-fill"
                    style={{ width: `${spotsFilled}%` }}
                  ></div>
                </div>
                {event.availableSpots && event.availableSpots < event.capacity * 0.2 && (
                  <div className="capacity-warning"><Lightning size={14} weight="fill" /> {t('eventPage.fillingUp')}</div>
                )}
              </div>
            )}

            <button
              className="cta-button-primary"
              onClick={() => event.url && window.open(event.url, '_blank')}
            >
              <span className="cta-icon"><Ticket size={18} weight="duotone" /></span>
              {event.url ? t('eventPage.rsvp') : t('eventPage.rsvp')}
            </button>

            <div className="action-buttons-row">
              <button
                className={`action-button save-btn${event && isSaved(event.id) ? ' save-btn--saved' : ''}`}
                onClick={handleSave}
              >
                <Heart size={17} weight={event && isSaved(event.id) ? 'fill' : 'regular'} />
                {event && isSaved(event.id) ? t('savedEvents.saved') : t('eventPage.save')}
              </button>
              <button
                className="action-button share-btn"
                onClick={() => setShowShareMenu(!showShareMenu)}
              >
                <Export size={17} weight="duotone" />
                {t('eventPage.share')}
              </button>
            </div>

            {showShareMenu && (
              <div className="share-menu angular-small">
                <button onClick={() => handleShare('twitter')} className="share-option">
                  <TwitterLogo size={15} weight="fill" /> Twitter
                </button>
                <button onClick={() => handleShare('facebook')} className="share-option">
                  <FacebookLogo size={15} weight="fill" /> Facebook
                </button>
                <button onClick={() => handleShare('linkedin')} className="share-option">
                  <LinkedinLogo size={15} weight="fill" /> LinkedIn
                </button>
                <button onClick={() => handleShare('whatsapp')} className="share-option">
                  <WhatsappLogo size={15} weight="fill" /> WhatsApp
                </button>
                <button onClick={() => handleShare('copy')} className="share-option">
                  <LinkIcon size={15} weight="bold" /> {t('eventPage.copyLink')}
                </button>
              </div>
            )}
          </div>

          {/* Quick Info Card */}
          <div className="event-quick-info angular-container white-border">
            <h3 className="quick-info-title">{t('eventPage.quickInfo')}</h3>
            <div className="quick-info-items">
              <div className="quick-info-item">
                <span className="info-label">{t('eventPage.quickInfoType')}</span>
                <span className="info-value">{event.type}</span>
              </div>
              <div className="quick-info-item">
                <span className="info-label">{t('eventPage.quickInfoDuration')}</span>
                <span className="info-value">
                  {event.startTime}{event.endTime ? ` - ${event.endTime}` : ''}
                </span>
              </div>
              {event.createdAt && (
                <div className="quick-info-item">
                  <span className="info-label">{t('eventPage.quickInfoCreated')}</span>
                  <span className="info-value">
                    {new Date(event.createdAt).toLocaleDateString('sv-SE')}
                  </span>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Similar Events Section */}
      <div className="similar-events-section">
        <h2 className="similar-events-title">
          <span className="title-accent"><Sparkle size={20} weight="fill" /></span>
          {t('eventPage.similarEvents')}
        </h2>
        <div className="similar-events-grid">
          {(propEvents || [])
            .filter(e =>
              e.id !== event.id &&
              (e.type === event.type || e.location?.city === event.location?.city)
            )
            .slice(0, 3)
            .map(similarEvent => (
              <Link
                key={similarEvent.id}
                to={`/event/${similarEvent.id}`}
                className="similar-event-card angular-container white-border"
              >
                <img
                  src={similarEvent.img || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3"}
                  alt={similarEvent.eventName}
                  className="similar-event-image"
                  onError={(e) => {
                    e.target.src = "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3";
                  }}
                />
                <div className="similar-event-content">
                  <h3 className="similar-event-title">{similarEvent.eventName}</h3>
                  <p className="similar-event-meta">
                    {new Date(similarEvent.date).toLocaleDateString('sv-SE')} • {similarEvent.location?.city || ''}
                  </p>
                  <span className="similar-event-tag">{similarEvent.type}</span>
                </div>
              </Link>
            ))}
        </div>
      </div>
    </div>
  );

  return <div className="eventpage-container">{eventInfo}</div>;
}
