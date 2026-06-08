/**
 * Converts an event name to a clean URL slug.
 * e.g. "Balett: Julia & Romeo" → "balett-julia-romeo"
 */
export function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[åä]/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * Maps a Supabase DB row (snake_case) to the component format (camelCase with nested objects).
 */
export function dbRowToEvent(row) {
  return {
    id: row.id,
    source: row.source || 'user',
    eventName: row.event_name,
    type: row.type || '',
    img: row.img || '',
    date: row.date || '',
    startTime: row.start_time || '',
    endTime: row.end_time || '',
    location: {
      venue: row.venue || '',
      address: row.address || '',
      city: row.city || 'Stockholm',
      state: '',
      postalCode: '',
      country: row.country || 'Sweden',
    },
    organizer: {
      name: row.organizer_name || '',
      email: row.organizer_email || '',
      phone: row.organizer_phone || '',
    },
    price: {
      currency: row.price_currency || 'SEK',
      amount: row.price_amount ?? null,
      earlyBird: row.price_early_bird || null,
    },
    capacity: row.capacity || 0,
    availableSpots: row.available_spots || 0,
    description: row.description || '',
    tags: row.tags || [],
    hosts: row.hosts || [],
    status: row.status || 'active',
    url: row.url || null,
    lat: row.lat || null,
    lng: row.lng || null,
    hostType: row.host_type || null,
    viewCount: row.view_count ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Maps a component event object to a Supabase DB row for insertion.
 */
export function eventToDbRow(event) {
  return {
    id: event.id,
    source: event.source || 'user',
    source_id: event.sourceId || null,
    event_name: event.eventName,
    type: event.type || null,
    img: event.img || null,
    date: event.date || null,
    start_time: event.startTime || null,
    end_time: event.endTime || null,
    venue: event.location?.venue || event.venue || null,
    address: event.location?.address || event.address || null,
    city: event.location?.city || event.city || 'Stockholm',
    country: event.location?.country || 'Sweden',
    organizer_name: event.organizer?.name || event.organizerName || null,
    organizer_email: event.organizer?.email || event.organizerEmail || null,
    organizer_phone: event.organizer?.phone || null,
    price_currency: event.price?.currency || 'SEK',
    price_amount: event.price?.amount ?? (event.price ? parseInt(event.price) : 0),
    price_early_bird: event.price?.earlyBird || null,
    capacity: event.capacity ? parseInt(event.capacity) : null,
    available_spots: event.availableSpots ?? event.capacity ?? null,
    description: event.description || null,
    tags: event.tags || [],
    hosts: event.hosts || [],
    status: event.status || 'active',
    url: event.url || null,
    lat: event.lat || null,
    lng: event.lng || null,
    host_type: event.hostType || null,
  };
}
