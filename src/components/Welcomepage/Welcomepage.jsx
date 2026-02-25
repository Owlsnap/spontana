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

  const todayEventCount = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return events.filter(e => e.date === today).length;
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

    // Filter by date
    if (dateFilter !== "all") {
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.date);
        const today = new Date();
        const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        const monthFromNow = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
        const nextMonthFromNow = new Date(today.getFullYear(), today.getMonth() + 2, today.getDate());

        switch (dateFilter) {
          case "today":
            return eventDate.toDateString() === today.toDateString();
          case "thisweek":
            return eventDate >= today && eventDate <= weekFromNow;
          case "thismonth":
            return eventDate >= today && eventDate <= monthFromNow;
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
           {/* Continuous Rolling Banner */}
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
      
      <div className="hero-actions">
        <Link to={"/createevent"} className="cta-button primary">
          {t('welcome.createEvent')}
        </Link>
        <button className="cta-button secondary" onClick={() => eventsRef.current?.scrollIntoView({ behavior: 'smooth' })}>
          {t('welcome.discoverEvents')}
        </button>
      </div>
      </div>

      {/* Event Cards Section */}

      <div className="lowerWelcomepage" ref={eventsRef}>
        {/* Search and Filter Section */}
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
          events={events}
        />

        <div>
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
  );
};

export default Welcomepage;
