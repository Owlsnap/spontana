// Minimal PostgREST client for Vercel functions (files prefixed "_" aren't deployed as routes)

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

export async function selectEvents(query, { range } = {}) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error('Supabase env vars missing');
  const res = await fetch(`${SUPABASE_URL}/rest/v1/events?${query}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      ...(range ? { Range: range } : {}),
    },
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  return res.json();
}

// Today's date in Stockholm as YYYY-MM-DD
export function stockholmToday() {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm' }).format(new Date());
}
