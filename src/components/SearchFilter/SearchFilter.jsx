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
  events
}) {
  const { t } = useLanguage();

  // Event types in English (matches data.json structure)
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

  // Extract unique cities from events (normalized to title case for deduplication)
  const availableCities = [
    "all",
    ...new Set(
      events?.map(event => event.location?.city).filter(Boolean)
        .map(city => city.charAt(0).toUpperCase() + city.slice(1).toLowerCase())
    )
  ];

  return (
    <div className="search-filter-container">
      <div className="search-section">
        <input
          type="text"
          placeholder={t('search.placeholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="filter-section">
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="filter-select"
        >
          {eventTypes.map(type => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>

        <select
          value={priceRange}
          onChange={(e) => setPriceRange(e.target.value)}
          className="filter-select"
        >
          {priceRanges.map(range => (
            <option key={range.value} value={range.value}>{range.label}</option>
          ))}
        </select>

        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="filter-select"
        >
          {dateFilters.map(date => (
            <option key={date.value} value={date.value}>{date.label}</option>
          ))}
        </select>

        <select
          value={selectedLocation}
          onChange={(e) => setSelectedLocation(e.target.value)}
          className="filter-select location-filter"
        >
          <option value="all">{t('search.allLocations')}</option>
          {availableCities.slice(1).map(city => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>

        <button onClick={onClearFilters} className="clear-filters-btn">
          {t('search.clearFilters')}
        </button>
      </div>

      <div className="category-buttons">
        <button className={`quick-btn ${selectedType === 'All Types' ? 'active' : ''}`} onClick={onClearFilters}>
          {t('categories.all')}
        </button>
        <button className={`quick-btn ${selectedType === 'Live Music' ? 'active' : ''}`} onClick={() => setSelectedType('Live Music')}>
          {t('categories.concert')}
        </button>
        <button className={`quick-btn ${selectedType === 'Film & Media' ? 'active' : ''}`} onClick={() => setSelectedType('Film & Media')}>
          {t('categories.music')}
        </button>
        <button className={`quick-btn ${selectedType === 'Art Exhibition' ? 'active' : ''}`} onClick={() => setSelectedType('Art Exhibition')}>
          {t('categories.art')}
        </button>
        <button className={`quick-btn ${selectedType === 'Food & Drink' ? 'active' : ''}`} onClick={() => setSelectedType('Food & Drink')}>
          {t('categories.food')}
        </button>
        <button className={`quick-btn ${selectedType === 'Nightlife' ? 'active' : ''}`} onClick={() => setSelectedType('Nightlife')}>
          {t('categories.nightlife')}
        </button>
        <button className={`quick-btn ${selectedType === 'Business' ? 'active' : ''}`} onClick={() => setSelectedType('Business')}>
          {t('categories.business')}
        </button>
      </div>
    </div>
  );
}
