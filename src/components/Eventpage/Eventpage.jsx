import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import "./Eventpage.css";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";
import EventpageSkeleton from "../Skeleton/EventpageSkeleton";
import { supabase } from "../../lib/supabase";
import { dbRowToEvent } from "../../lib/mapEvent";
import { buildEventSeo } from "../../lib/eventSeo";
import { localToday, parseLocalDate, isOngoing, isMultiDay, formatEventDates } from "../../lib/eventDates";
import { toast } from "sonner";
import {
  CalendarBlank, Clock, MapPin, MapTrifold,
  Envelope, Phone, Sparkle, Lightning,
  ArrowSquareOut, Heart, Export, Eye,
  TwitterLogo, FacebookLogo, LinkedinLogo, WhatsappLogo,
  Link as LinkIcon, ArrowLeft,
} from "@phosphor-icons/react";
import { useSavedEvents } from "../../context/SavedEventsContext";


export default function Eventpage({ events: propEvents }) {
  const { t, language } = useLanguage();
  const locale = language === 'en' ? 'en-GB' : 'sv-SE';
  const { isSaved, toggleSave } = useSavedEvents();
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

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

  // Track view once per session per event (debounced via sessionStorage)
  useEffect(() => {
    if (!id || !supabase) return;
    const key = `viewed_${id}`;
    const lastViewed = sessionStorage.getItem(key);
    const thirtyMin = 30 * 60 * 1000;
    if (lastViewed && Date.now() - Number(lastViewed) < thirtyMin) return;

    sessionStorage.setItem(key, String(Date.now()));
    supabase.functions.invoke("track-view", {
      body: { event_id: id },
    }).catch(() => {});
  }, [id]);

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

  // Calendar days until event, in local time. new Date("YYYY-MM-DD") parses as
  // UTC midnight, which made tonight's events read as "tomorrow" after 00:00.
  const today = localToday();
  const daysUntil = Math.round((parseLocalDate(event.date) - parseLocalDate(today)) / (1000 * 60 * 60 * 24));
  const ongoing = isOngoing(event, today);
  const dateText = formatEventDates(event, locale, isMultiDay(event)
    ? { day: 'numeric', month: 'long', year: 'numeric' }
    : { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const timeRange = event.startTime
    ? `${event.startTime}${event.endTime ? ` - ${event.endTime}` : ''}`
    : '';
  const venueName = event.location?.venue || event.venue || event.location?.address || '';
  const venueLine = [venueName, event.location?.city].filter(Boolean).join(', ');

  const similarEvents = (propEvents || [])
    .filter(e => e.id !== event.id && e.type && e.type === event.type)
    .slice(0, 3);

  // Calculate percentage of spots filled
  const spotsFilled = event.capacity
    ? ((event.capacity - (event.availableSpots || 0)) / event.capacity) * 100
    : 0;

  // Share functionality
  const handleShare = (platform) => {
    const rawUrl = window.location.href;
    const eventUrl = encodeURIComponent(rawUrl);
    const eventTitle = encodeURIComponent(event.eventName);

    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?text=${eventTitle}&url=${eventUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${eventUrl}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${eventUrl}`,
      whatsapp: `https://wa.me/?text=${eventTitle}%20${eventUrl}`,
    };

    if (platform === 'copy') {
      Promise.resolve()
        .then(() => navigator.clipboard.writeText(rawUrl))
        .then(() => toast.success(t('eventPage.linkCopied')))
        .catch(() => toast.error(t('eventPage.linkCopyFailed')));
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

  const seo = buildEventSeo(event);

  // We don't sell tickets — the CTA always links out, so name where it goes
  const outbound = {
    ticketmaster: { label: t('eventPage.outboundTicketmaster') },
    visitstockholm: { label: t('eventPage.outboundVisitStockholm') },
  }[event.source] || { label: t('eventPage.outboundOrganizer') };

  const eventInfo = (
    <div key={event.eventName} className="eventpage">
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
        <link rel="canonical" href={seo.canonicalUrl} />
        <meta property="og:title" content={event.eventName} />
        <meta property="og:description" content={seo.description} />
        <meta property="og:image" content={seo.image} />
        <meta property="og:url" content={seo.canonicalUrl} />
        <meta property="og:type" content="event" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={event.eventName} />
        <meta name="twitter:image" content={seo.image} />
        <script type="application/ld+json">{seo.jsonLd}</script>
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
              <span className="meta-text">{dateText}</span>
            </div>
            {timeRange && (
              <div className="event-meta-item">
                <span className="meta-icon"><Clock size={18} weight="duotone" /></span>
                <span className="meta-text">{timeRange}</span>
              </div>
            )}
            {venueLine && (
              <div className="event-meta-item">
                <span className="meta-icon"><MapPin size={18} weight="duotone" /></span>
                <span className="meta-text">{venueLine}</span>
              </div>
            )}
          </div>

          <div className="event-status-container">
            {ongoing ? (
              <span className="event-urgency-badge">{t('eventPage.ongoing')}</span>
            ) : daysUntil >= 0 && daysUntil <= 7 && (
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
          </div>

          {/* Location Section */}
          <div className="event-section angular-container white-border">
            <h2 className="section-title">
              {t('eventPage.location')}
            </h2>
            <div className="location-details">
              {venueName && <h3 className="venue-name">{venueName}</h3>}
              <p className="venue-address">
                {[
                  venueName !== event.location?.address && event.location?.address,
                  [event.location?.city, event.location?.postalCode].filter(Boolean).join(' '),
                  event.location?.country,
                ].filter(Boolean).map((line, i) => (
                  <React.Fragment key={i}>{i > 0 && <br />}{line}</React.Fragment>
                ))}
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
            {event.source === 'user' && (
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
                ) : (
                  <div className="price-free">
                    <span className="free-badge"><Sparkle size={16} weight="fill" /> {t('eventPage.free')}</span>
                  </div>
                )}
              </div>
            )}

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

            {event.url && (
              <a
                href={event.url}
                target="_blank"
                rel="noopener noreferrer"
                className="cta-button-primary"
              >
                {outbound.label}
                <span className="cta-icon"><ArrowSquareOut size={18} weight="bold" /></span>
              </a>
            )}

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
              {timeRange && (
                <div className="quick-info-item">
                  <span className="info-label">{t('eventPage.quickInfoDuration')}</span>
                  <span className="info-value">{timeRange}</span>
                </div>
              )}
              {event.viewCount > 0 && (
                <div className="quick-info-item">
                  <span className="info-label">
                    <Eye size={13} weight="duotone" style={{ verticalAlign: 'middle', marginRight: 3 }} />
                    {t('eventPage.views')}
                  </span>
                  <span className="info-value">{event.viewCount.toLocaleString(locale)}</span>
                </div>
              )}
              {event.createdAt && (
                <div className="quick-info-item">
                  <span className="info-label">{t('eventPage.quickInfoCreated')}</span>
                  <span className="info-value">
                    {new Date(event.createdAt).toLocaleDateString(locale)}
                  </span>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Similar Events Section */}
      {similarEvents.length > 0 && (
      <div className="similar-events-section">
        <h2 className="similar-events-title">
          <span className="title-accent"><Sparkle size={20} weight="fill" /></span>
          {t('eventPage.similarEvents')}
        </h2>
        <div className="similar-events-grid">
          {similarEvents.map(similarEvent => (
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
                    {formatEventDates(similarEvent, locale, { day: "numeric", month: "short" })}
                    {(similarEvent.location?.venue || similarEvent.location?.city) && ` • ${similarEvent.location.venue || similarEvent.location.city}`}
                  </p>
                  <span className="similar-event-tag">{similarEvent.type}</span>
                </div>
              </Link>
            ))}
        </div>
      </div>
      )}
    </div>
  );

  return <div className="eventpage-container">{eventInfo}</div>;
}
