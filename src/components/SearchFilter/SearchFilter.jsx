import React from "react";
import "./SearchFilter.css";
import { useLanguage } from "../../i18n/LanguageContext";

export default function SearchFilter({
  searchTerm,
  setSearchTerm,
  selectedType,
  setSelectedType,
  priceRange,
  setPriceRange,
  dateFilter,
  setDateFilter,
  selectedLocation,
  setSelectedLocation,
  onClearFilters,
  onClose,
  events
}) {
  const { t } = useLanguage();

  const eventTypes = [
    { value: "All Types", label: t('eventTypes.allTypes') },
    { value: "Live Music", label: t('eventTypes.liveMusic') },
    { value: "Theatre", label: t('eventTypes.theatre') },
    { value: "Art Exhibition", label: t('eventTypes.artExhibition') },
    { value: "Film & Media", label: t('eventTypes.filmMedia') },
    { value: "Nightlife", label: t('eventTypes.nightlife') },
    { value: "Festival", label: t('eventTypes.festival') },
    { value: "Food & Drink", label: t('eventTypes.foodDrink') },
    { value: "Sports", label: t('eventTypes.sports') },
    { value: "Family", label: t('eventTypes.family') },
    { value: "Conference", label: t('eventTypes.conference') },
    { value: "Business", label: t('eventTypes.business') },
    { value: "Health & Wellness", label: t('eventTypes.healthWellness') },
    { value: "Literature", label: t('eventTypes.literature') },
    { value: "Environment", label: t('eventTypes.environment') },
    { value: "Startup Pitch", label: t('eventTypes.startupPitch') },
    { value: "Build Night", label: t('eventTypes.buildNight') },
    { value: "Other", label: t('eventTypes.other') },
  ];

  const priceRanges = [
    { label: t('search.allPrices'), value: "all" },
    { label: t('search.free'), value: "free" },
    { label: t('search.under50'), value: "under50" },
    { label: t('search.range50to200'), value: "50to200" },
    { label: t('search.over200'), value: "over200" }
  ];

  const dateFilters = [
    { label: t('search.allDates'), value: "all" },
    { label: t('search.today'), value: "today" },
    { label: t('search.thisWeek'), value: "thisweek" },
    { label: t('search.thisMonth'), value: "thismonth" },
    { label: t('search.nextMonth'), value: "nextmonth" }
  ];

  const availableCities = [
    "all",
    ...new Set(
      events?.map(event => event.location?.city).filter(Boolean)
        .map(city => city.charAt(0).toUpperCase() + city.slice(1).toLowerCase())
    )
  ];

  const categoryButtons = [
    { value: "All Types", label: t('categories.all') },
    { value: "Live Music", label: t('categories.concert') },
    { value: "Film & Media", label: t('categories.music') },
    { value: "Art Exhibition", label: t('categories.art') },
    { value: "Food & Drink", label: t('categories.food') },
    { value: "Nightlife", label: t('categories.nightlife') },
    { value: "Business", label: t('categories.business') },
  ];

  const hasActiveFilters = searchTerm || selectedType !== "All Types" || priceRange !== "all" || dateFilter !== "all" || selectedLocation !== "all";

  return (
    <div className="search-filter-container">
      {/* Mobile close button */}
      {onClose && (
        <button className="sidebar-close-btn" onClick={onClose} aria-label="Close filters">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      )}

      {/* Search */}
      <div className="sidebar-search-section">
        <div className="sidebar-search-wrap">
          <svg className="sidebar-search-icon" width="13" height="13" viewBox="0 0 15 15" fill="none">
            <path d="M10 6.5C10 8.433 8.433 10 6.5 10C4.567 10 3 8.433 3 6.5C3 4.567 4.567 3 6.5 3C8.433 3 10 4.567 10 6.5ZM9.364 10.071C8.561 10.639 7.57 11 6.5 11C4.015 11 2 8.985 2 6.5C2 4.015 4.015 2 6.5 2C8.985 2 11 4.015 11 6.5C11 7.57 10.639 8.561 10.071 9.364L13.354 12.646C13.549 12.842 13.549 13.158 13.354 13.354C13.158 13.549 12.842 13.549 12.646 13.354L9.364 10.071Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"/>
          </svg>
          <input
            type="text"
            placeholder={t('search.placeholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Event Type */}
      <div className="sidebar-section">
        <p className="sidebar-section-label">{t('search.eventType')}</p>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="filter-select"
        >
          {eventTypes.map(type => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>
      </div>

      {/* Price */}
      <div className="sidebar-section">
        <p className="sidebar-section-label">{t('search.price')}</p>
        <div className="sidebar-option-list">
          {priceRanges.map(range => (
            <button
              key={range.value}
              className={`sidebar-option-btn ${priceRange === range.value ? 'active' : ''}`}
              onClick={() => setPriceRange(range.value)}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Date */}
      <div className="sidebar-section">
        <p className="sidebar-section-label">{t('search.date')}</p>
        <div className="sidebar-option-list">
          {dateFilters.map(date => (
            <button
              key={date.value}
              className={`sidebar-option-btn ${dateFilter === date.value ? 'active' : ''}`}
              onClick={() => setDateFilter(date.value)}
            >
              {date.label}
            </button>
          ))}
        </div>
      </div>

      {/* Location */}
      <div className="sidebar-section">
        <p className="sidebar-section-label">{t('search.location')}</p>
        <select
          value={selectedLocation}
          onChange={(e) => setSelectedLocation(e.target.value)}
          className="filter-select"
        >
          <option value="all">{t('search.allLocations')}</option>
          {availableCities.slice(1).map(city => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>
      </div>

      {/* Categories */}
      <div className="sidebar-section">
        <p className="sidebar-section-label">{t('search.categories')}</p>
        <div className="category-buttons">
          {categoryButtons.map(cat => (
            <button
              key={cat.value}
              className={`quick-btn ${selectedType === cat.value || (cat.value === 'All Types' && selectedType === 'All Types') ? 'active' : ''}`}
              onClick={() => cat.value === 'All Types' ? onClearFilters() : setSelectedType(cat.value)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Clear filters */}
      {hasActiveFilters && (
        <button onClick={onClearFilters} className="clear-filters-btn">
          {t('search.clearFilters')}
        </button>
      )}
    </div>
  );
}
