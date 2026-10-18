/**
 * SEO metadata for an event page. Shared by the client (Helmet in Eventpage)
 * and the server (api/event.js), so crawlers and browsers see the same tags.
 * Takes an event in component format (see dbRowToEvent).
 */

import { lastDay, isMultiDay } from './eventDates.js';

export const SITE_URL = 'https://spontana.app';
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1200&auto=format&fit=crop';

// "+01:00" / "+02:00" depending on Stockholm DST at that date
function stockholmOffset(date, time) {
  const d = new Date(`${date}T${time || '12:00'}:00Z`);
  if (isNaN(d)) return '+01:00';
  const tz = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Stockholm', timeZoneName: 'longOffset' })
    .formatToParts(d)
    .find((p) => p.type === 'timeZoneName')?.value || 'GMT+01:00';
  return tz === 'GMT' ? '+00:00' : tz.slice(3);
}

function isoDateTime(date, time) {
  if (!date) return undefined;
  if (!/^\d{2}:\d{2}$/.test(time || '')) return date;
  return `${date}T${time}:00${stockholmOffset(date, time)}`;
}

function truncate(text, max) {
  const clean = (text || '').replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}

export function buildEventSeo(event) {
  const venue = event.location?.venue || '';
  const address = event.location?.address || '';
  const city = event.location?.city || 'Stockholm';
  const canonicalUrl = `${SITE_URL}/event/${event.id}`;
  const image = event.img || FALLBACK_IMAGE;
  const description = truncate(
    event.description || `${event.eventName} at ${venue || address || city}`,
    160
  );

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.eventName,
    description: truncate(event.description, 1000) || undefined,
    startDate: isoDateTime(event.date, event.startTime),
    endDate: event.endTime
      ? isoDateTime(lastDay(event), event.endTime)
      : isMultiDay(event) ? lastDay(event) : undefined,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: venue || address || city,
      address: {
        '@type': 'PostalAddress',
        streetAddress: address || undefined,
        addressLocality: city,
        addressCountry: 'SE',
      },
      geo: event.lat && event.lng
        ? { '@type': 'GeoCoordinates', latitude: event.lat, longitude: event.lng }
        : undefined,
    },
    image: [image],
    url: canonicalUrl,
    organizer: event.organizer?.name
      ? { '@type': 'Organization', name: event.organizer.name }
      : undefined,
  };

  // Prices are only reliable for user-created events
  if (event.source === 'user' && event.price?.amount != null) {
    jsonLd.offers = {
      '@type': 'Offer',
      price: event.price.amount,
      priceCurrency: event.price.currency || 'SEK',
      url: event.url || canonicalUrl,
      availability: 'https://schema.org/InStock',
    };
  } else if (event.url) {
    jsonLd.offers = { '@type': 'Offer', url: event.url };
  }

  return {
    title: `${event.eventName} — Spontana`,
    description,
    canonicalUrl,
    image,
    // JSON.stringify drops undefined fields; escape "<" so it can't close the script tag
    jsonLd: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
  };
}
