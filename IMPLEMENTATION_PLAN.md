# Spontana: Real Stockholm Event Data — Implementation Plan

## Context
Spontana is currently a frontend-only React app with 10 hardcoded mock events in `src/data.json`. The goal is to populate it with real Stockholm events using the **Ticketmaster Discovery API** (free, 5,000 req/day) as the primary source, with a **visitstockholm.com scraper** as fallback. We'll use **Supabase** for the database and edge functions (keeps API keys server-side).

## Architecture

```
[Supabase Edge Function: fetch-events]  →  [Supabase DB: events table]
   ├── Ticketmaster API (primary)              ↑
   └── visitstockholm.com scraper (fallback)   |
                                                |
[React Frontend]  ←── reads from ──────────────┘
```

---

## Step 1: Install Supabase Client
- `npm install @supabase/supabase-js`
- Create `src/lib/supabase.js` with Supabase client init (public anon key + project URL)

---

## Step 2: Create Supabase `events` Table

Run this SQL migration in the Supabase dashboard:

```sql
CREATE TABLE events (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,              -- 'ticketmaster' | 'visitstockholm' | 'user'
  source_id TEXT,                    -- original ID from API
  event_name TEXT NOT NULL,
  type TEXT,
  img TEXT,
  date DATE,
  start_time TEXT,
  end_time TEXT,
  venue TEXT,
  address TEXT,
  city TEXT DEFAULT 'Stockholm',
  country TEXT DEFAULT 'Sweden',
  organizer_name TEXT,
  organizer_email TEXT,
  organizer_phone TEXT,
  price_currency TEXT DEFAULT 'SEK',
  price_amount INTEGER DEFAULT 0,
  price_early_bird INTEGER,
  capacity INTEGER,
  available_spots INTEGER,
  description TEXT,
  tags TEXT[],
  hosts TEXT[],
  status TEXT DEFAULT 'active',
  url TEXT,                          -- link to original/ticket page
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source, source_id)          -- prevent duplicates per source
);
```

---

## Step 3: Create Edge Function — `fetch-events` (Ticketmaster)

A Deno edge function deployed to Supabase that:
1. Calls Ticketmaster Discovery API:
   ```
   GET https://app.ticketmaster.com/discovery/v2/events.json?countryCode=SE&city=Stockholm&size=200&apikey={key}
   ```
2. Maps Ticketmaster response fields → our `events` table schema
3. Upserts into the `events` table (deduplicates via `source + source_id`)
4. Can be triggered manually or via Supabase cron (`pg_cron`) for scheduled refresh

Store `TICKETMASTER_API_KEY` as a Supabase secret.

### Ticketmaster Field Mapping

| Ticketmaster Field | Our Schema Field |
|---|---|
| `name` | `event_name` |
| `classifications[0].segment.name` | `type` |
| `images[0].url` (best ratio) | `img` |
| `dates.start.localDate` | `date` |
| `dates.start.localTime` | `start_time` |
| `priceRanges[0].min` | `price_amount` |
| `priceRanges[0].currency` | `price_currency` |
| `_embedded.venues[0].name` | `venue` |
| `_embedded.venues[0].address.line1` | `address` |
| `_embedded.venues[0].location` | `lat`, `lng` |
| `url` | `url` |
| `info` or `pleaseNote` | `description` |

### Ticketmaster API Notes
- **Free tier**: 5,000 requests/day, 5 req/second
- **Auth**: API key passed as `apikey` query param
- **Pagination**: `size` (max 200) + `page` (0-indexed), max 1,000 results total
- **Date filter**: `startDateTime` / `endDateTime` in ISO format
- **Category filter**: `classificationName` (e.g., "music", "sports", "arts")
- **Register at**: https://developer.ticketmaster.com/products-and-docs/apis/getting-started/

---

## Step 4: Create Edge Function — `scrape-visitstockholm` (Fallback)

- Fetches `https://www.visitstockholm.com/events/`
- The page is a Next.js app with event data embedded in `<script>` tags as JSON (`props.pageProps`)
- Parses the embedded JSON to extract events
- Maps fields (title, dates, venue, image, description, coordinates) → our schema
- Upserts into `events` table with `source = 'visitstockholm'`

---

## Step 5: Update React Frontend to Read from Supabase

### `src/App.jsx`
- Replace `import data from "./data.json"` with a `useEffect` that fetches from Supabase `events` table
- Keep `data.json` as development fallback if Supabase is unreachable

### `src/components/Eventpage/Eventpage.jsx`
- Replace direct `data.json` import with Supabase query by event name

### New: `src/lib/mapEvent.js`
- Transform DB rows (snake_case) → component format (camelCase nested objects):
```js
// DB row → Component format
{
  event_name: "...",          →  eventName: "...",
  venue: "...",               →  location: { venue: "...", address: "...", city: "..." },
  organizer_name: "...",      →  organizer: { name: "...", email: "...", phone: "..." },
  price_amount: 299,          →  price: { amount: 299, currency: "SEK", earlyBird: null },
}
```

---

## Step 6: Update CreateEvent to Write to Supabase

### `src/components/CreateEvent/CreateEvent.jsx`
- On submit, insert into Supabase `events` table with `source = 'user'`
- Events now persist across page refreshes

---

## Step 7: Update Filter Logic for New Data

### `src/components/Welcomepage/Welcomepage.jsx`
- Price filter ranges (under 50, 50-200, 200+) work with SEK — the mapper will normalize currencies to SEK
- Type mapping: Ticketmaster segments (Music, Sports, Arts & Theatre, etc.) → our category buttons (Live Music, Sports, Art Exhibition, etc.)

---

## Files to Create
| File | Purpose |
|---|---|
| `src/lib/supabase.js` | Supabase client initialization |
| `src/lib/mapEvent.js` | DB row ↔ component format mapper |
| `supabase/functions/fetch-events/index.ts` | Ticketmaster fetch edge function |
| `supabase/functions/scrape-visitstockholm/index.ts` | Scraper edge function |
| `supabase/migrations/001_create_events_table.sql` | DB schema |

## Files to Modify
| File | Change |
|---|---|
| `package.json` | Add `@supabase/supabase-js` |
| `src/App.jsx` | Fetch events from Supabase instead of data.json |
| `src/components/Eventpage/Eventpage.jsx` | Query Supabase instead of data.json |
| `src/components/CreateEvent/CreateEvent.jsx` | Insert to Supabase on submit |
| `src/components/Welcomepage/Welcomepage.jsx` | Handle loading states, type mapping |

---

## Verification Checklist
- [ ] Run SQL migration in Supabase dashboard → confirm table created
- [ ] Get Ticketmaster API key from https://developer.ticketmaster.com
- [ ] Deploy `fetch-events` edge function → invoke it → confirm events appear in DB
- [ ] Start React app (`npm run dev`) → confirm real Stockholm events render on homepage
- [ ] Test filters (type, price, date, location) work with real data
- [ ] Create a new event → refresh page → confirm it persists
- [ ] Deploy `scrape-visitstockholm` → invoke → confirm additional events appear

---

## API Registration Links
- **Ticketmaster**: https://developer.ticketmaster.com/products-and-docs/apis/getting-started/
- **Supabase**: Already set up by user
