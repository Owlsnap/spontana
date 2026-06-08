//ska innehålla ett urval EventCards som ska visas på välkomsidan
//ska innehålla en funktion där användaren väljer stad
//ska innehålla login och register knappar
// efter att användaren valt stad ska användaren kunna se eventCards som är i den staden

import React, { useEffect, useState, useMemo, useRef } from "react";
import "./Welcomepage.css";
import EventCard from "../EventCard/EventCard";
import SearchFilter from "../SearchFilter/SearchFilter";
import { Link } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";
import EventCardSkeleton from "../Skeleton/EventCardSkeleton";


const EVENTS_PER_PAGE = 12;

const HERO_PHRASES = [
  "FIND YOUR NIGHT",
  "SOMETHING IS ON",
  "STOCKHOLM LIVES",
  "GET OUT TONIGHT",
];

const Welcomepage = ({ events, loading: externalLoading }) => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("All Types");
  const [priceRange, setPriceRange] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [filteredEvents, setFilteredEvents] = useState(events);
  const [isLoading, setIsLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(EVENTS_PER_PAGE);
  const eventsRef = useRef(null);
  const [heroPhraseIndex, setHeroPhraseIndex] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const todayEventCount = useMemo(() => {
    const d = new Date();
    const todayLocal = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    return events.filter(e => e.date === todayLocal || e.date?.startsWith(todayLocal)).length;
  }, [events]);

  const bannerCategories = useMemo(() => {
    return [...new Set(events.map(e => e.type).filter(Boolean))].sort();
  }, [events]);

  // Filter events based on search and filter criteria
  useEffect(() => {
    let filtered = events;

    // Search by event name
    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.eventName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by event type
    if (selectedType !== "All Types") {
      filtered = filtered.filter(event => event.type === selectedType);
    }

    // Filter by price range
    if (priceRange !== "all") {
      filtered = filtered.filter(event => {
        const price = event.price?.amount || 0;
        switch (priceRange) {
          case "free":
            return price === 0;
          case "under50":
            return price > 0 && price < 50;
          case "50to200":
            return price >= 50 && price <= 200;
          case "over200":
            return price > 200;
          default:
            return true;
        }
      });
    }

    // Filter by date — all comparisons use local midnight to avoid UTC drift
    if (dateFilter !== "all") {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const weekFromNow = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000);
      const monthFromNow = new Date(startOfToday.getFullYear(), startOfToday.getMonth() + 1, startOfToday.getDate());
      const nextMonthFromNow = new Date(startOfToday.getFullYear(), startOfToday.getMonth() + 2, startOfToday.getDate());

      filtered = filtered.filter(event => {
        // Parse date as local by appending T00:00:00 (avoids UTC-midnight shift)
        const eventDate = new Date(`${event.date?.slice(0, 10)}T00:00:00`);

        switch (dateFilter) {
          case "today":
            return eventDate.toDateString() === startOfToday.toDateString();
          case "thisweek":
            return eventDate >= startOfToday && eventDate <= weekFromNow;
          case "thismonth":
            return eventDate >= startOfToday && eventDate <= monthFromNow;
          case "nextmonth":
            return eventDate >= monthFromNow && eventDate <= nextMonthFromNow;
          default:
            return true;
        }
      });
    }

    // Filter by location
    if (selectedLocation !== "all") {
      filtered = filtered.filter(event => {
        const eventCity = event.location?.city?.toLowerCase();
        return eventCity === selectedLocation.toLowerCase();
      });
    }

    setFilteredEvents(filtered);
    setVisibleCount(EVENTS_PER_PAGE);
  }, [events, searchTerm, selectedType, priceRange, dateFilter, selectedLocation]);

  // Use external loading state from Supabase fetch, with brief minimum display
  useEffect(() => {
    if (externalLoading) {
      setIsLoading(true);
    } else {
      const timer = setTimeout(() => setIsLoading(false), 300);
      return () => clearTimeout(timer);
    }
  }, [externalLoading]);

  // Decode animation — runs on mount and on each hero phrase change
  useEffect(() => {
    const letters = document.querySelectorAll('.decode-letter');
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    const allIntervals = [];

    letters.forEach((letter, index) => {
      const target = letter.getAttribute('data-target');
      let iterations = 0;
      const maxIterations = 2 + Math.floor(index / 2);

      const interval = setInterval(() => {
        if (iterations < maxIterations) {
          letter.textContent = characters[Math.floor(Math.random() * characters.length)];
          iterations++;
        } else {
          letter.textContent = target;
          clearInterval(interval);
        }
      }, 30 + index * 10);

      allIntervals.push(interval);
    });

    return () => allIntervals.forEach(clearInterval);
  }, [heroPhraseIndex]);

  // Cycle hero phrases every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setHeroPhraseIndex(prev => (prev + 1) % HERO_PHRASES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedType("All Types");
    setPriceRange("all");
    setDateFilter("all");
    setSelectedLocation("all");
  };


  return (
    <div className="welcomepage">
      <div className="upper-section-with-bg">
        <div className="upperWelcomepage">
          <div className="hero-left">
            <h1 className="hero-title decode-text">
              {HERO_PHRASES[heroPhraseIndex].split(' ').map((word, wordIndex) => (
                <span key={wordIndex} className="hero-word">
                  {word.split('').map((letter, letterIndex) => (
                    <span
                      key={letterIndex}
                      className="matrix-letter decode-letter"
                      data-target={letter}
                    >
                      {letter}
                    </span>
                  ))}
                </span>
              ))}
            </h1>
          </div>
          <div className="banner-content-live">
            {t('welcome.liveNow')} • {todayEventCount} {t('welcome.activeEventsToday')}
          </div>
          <div className="hero-actions">
            <Link to={"/createevent"} className="cta-button primary">
              {t('welcome.createEvent')}
            </Link>
            <button className="cta-button secondary" onClick={() => eventsRef.current?.scrollIntoView({ behavior: 'smooth' })}>
              {t('welcome.discoverEvents')}
            </button>
          </div>
        </div>

        {/* Continuous Rolling Banner — full width, outside constrained content box */}
        <div className="rolling-banner-container">
          <div className="rolling-banner">
            <div className="banner-content">
              {[...Array(4)].map((_, i) => (
                <span key={i}>
                  {bannerCategories.map(cat => ` • ${cat.toUpperCase()}`).join('')}
                  {` • ${t('welcome.liveNow')} • `}<strong>{todayEventCount} {t('welcome.activeEventsToday')}</strong>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Event Cards Section */}

      <div className="lowerWelcomepage" ref={eventsRef}>
        {/* Mobile filter toggle */}
        <button className="filter-toggle-btn" onClick={() => setSidebarOpen(true)}>
          <svg width="14" height="14" viewBox="0 0 15 15" fill="none">
            <path d="M1 2h13M3 7h9M5 12h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          {t('search.filters')}
        </button>

        <div className="events-layout">
          {/* Sidebar overlay (mobile) */}
          {sidebarOpen && (
            <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
          )}

          {/* Filter sidebar */}
          <aside className={`filter-sidebar${sidebarOpen ? ' open' : ''}`}>
            <SearchFilter
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              selectedType={selectedType}
              setSelectedType={setSelectedType}
              priceRange={priceRange}
              setPriceRange={setPriceRange}
              dateFilter={dateFilter}
              setDateFilter={setDateFilter}
              selectedLocation={selectedLocation}
              setSelectedLocation={setSelectedLocation}
              onClearFilters={handleClearFilters}
              onClose={() => setSidebarOpen(false)}
              events={events}
            />
          </aside>

          {/* Events main */}
          <div className="events-main">
            {!isLoading && filteredEvents.length > 0 && (
              <h3 id="justNuH3">
                {`${t(filteredEvents.length === 1 ? 'welcome.foundEvents' : 'welcome.foundEvents_plural', { count: filteredEvents.length })}:`}
              </h3>
            )}
            {isLoading ? (
              <EventCardSkeleton count={5} />
            ) : (
              <>
                <EventCard events={filteredEvents.slice(0, visibleCount)} />
                {visibleCount < filteredEvents.length && (
                  <button
                    className="load-more-btn"
                    onClick={() => setVisibleCount((prev) => prev + EVENTS_PER_PAGE)}
                  >
                    {t('welcome.loadMore')}
                  </button>
                )}
                {visibleCount >= filteredEvents.length && filteredEvents.length > EVENTS_PER_PAGE && (
                  <p className="all-events-loaded">{t('welcome.allLoaded')}</p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Welcomepage;
