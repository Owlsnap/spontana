import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Map Ticketmaster segment/genre names to our event types
const typeMapping: Record<string, string> = {
  "Music": "Live Music",
  "Sports": "Sports",
  "Arts & Theatre": "Theatre",
  "Film": "Film & Media",
  "Miscellaneous": "Other",
  "Family": "Family",
  "Comedy": "Theatre",
  "Classical": "Live Music",
  "Dance": "Theatre",
  "Opera": "Theatre",
  "Exhibition": "Art Exhibition",
};

function mapTicketmasterEvent(tm: any): any {
  const venue = tm._embedded?.venues?.[0];
  const classification = tm.classifications?.[0];
  const priceRange = tm.priceRanges?.[0];

  // Pick the best image (prefer 16:9 ratio, largest)
  const img = tm.images
    ?.sort((a: any, b: any) => (b.width || 0) - (a.width || 0))
    ?.find((i: any) => i.ratio === "16_9")?.url
    || tm.images?.[0]?.url
    || "";

  const segmentName = classification?.segment?.name || "";
  const genreName = classification?.genre?.name || "";
  const type = typeMapping[segmentName] || typeMapping[genreName] || "Other";

  // Convert currency — Ticketmaster may return EUR for Swedish events
  let priceCurrency = priceRange?.currency || "SEK";
  let priceAmount: number | null = priceRange?.min != null ? Math.round(priceRange.min) : null;
  if (priceCurrency === "EUR" && priceAmount !== null) {
    priceAmount = Math.round(priceAmount * 11.5); // approximate EUR→SEK
    priceCurrency = "SEK";
  }

  return {
    id: `tm_${tm.id}`,
    source: "ticketmaster",
    source_id: tm.id,
    event_name: tm.name,
    type,
    img,
    date: tm.dates?.start?.localDate || null,
    start_time: tm.dates?.start?.localTime?.slice(0, 5) || null,
    end_time: null,
    venue: venue?.name || null,
    address: venue?.address?.line1 || null,
    city: venue?.city?.name || "Stockholm",
    country: venue?.country?.name || "Sweden",
    organizer_name: tm.promoter?.name || null,
    organizer_email: null,
    organizer_phone: null,
    price_currency: priceCurrency,
    price_amount: priceAmount,
    price_early_bird: null,
    capacity: null,
    available_spots: null,
    description: tm.info || tm.pleaseNote || null,
    tags: [
      classification?.segment?.name,
      classification?.genre?.name,
      classification?.subGenre?.name,
    ].filter(Boolean).map((t: string) => t.toLowerCase()),
    hosts: [],
    status: "active",
    url: tm.url || null,
    lat: venue?.location?.latitude ? parseFloat(venue.location.latitude) : null,
    lng: venue?.location?.longitude ? parseFloat(venue.location.longitude) : null,
  };
}

/**
 * For recurring events (e.g. MAMMA MIA every Saturday), Ticketmaster returns
 * a separate entry per date. Keep only the earliest upcoming occurrence per
 * event name + venue combination.
 */
function deduplicateEvents(events: any[]): any[] {
  const seen = new Map<string, any>();
  for (const event of events) {
    const key = `${event.event_name?.toLowerCase()}__${event.venue?.toLowerCase() ?? ""}`;
    const existing = seen.get(key);
    if (!existing || new Date(event.date) < new Date(existing.date)) {
      seen.set(key, event);
    }
  }
  return Array.from(seen.values());
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("TICKETMASTER_API_KEY");
    if (!apiKey) {
      throw new Error("TICKETMASTER_API_KEY not set");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch events from Ticketmaster Discovery API
    const tmUrl = new URL("https://app.ticketmaster.com/discovery/v2/events.json");
    tmUrl.searchParams.set("apikey", apiKey);
    tmUrl.searchParams.set("countryCode", "SE");
    tmUrl.searchParams.set("city", "Stockholm");
    tmUrl.searchParams.set("size", "200");
    tmUrl.searchParams.set("sort", "date,asc");

    const response = await fetch(tmUrl.toString());
    if (!response.ok) {
      throw new Error(`Ticketmaster API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const tmEvents = data._embedded?.events || [];

    if (tmEvents.length === 0) {
      return new Response(
        JSON.stringify({ message: "No events found from Ticketmaster", count: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Map and deduplicate recurring events
    const mapped = deduplicateEvents(tmEvents.map(mapTicketmasterEvent));

    // Delete all existing Ticketmaster rows first, then insert fresh deduplicated set
    const { error: deleteError } = await supabase
      .from("events")
      .delete()
      .eq("source", "ticketmaster");

    if (deleteError) throw new Error(`Supabase delete error: ${deleteError.message}`);

    const { error } = await supabase
      .from("events")
      .insert(mapped);

    if (error) throw new Error(`Supabase insert error: ${error.message}`);

    return new Response(
      JSON.stringify({
        message: `Successfully synced ${mapped.length} events from Ticketmaster`,
        count: mapped.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
