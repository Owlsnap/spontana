import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BASE_URL = "https://www.visitstockholm.com";

function extractEvents(html: string): any[] {
  const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) return [];

  let nextData: any;
  try {
    nextData = JSON.parse(m[1]);
  } catch {
    return [];
  }

  const contentBlocks: any[] =
    nextData?.props?.pageProps?.componentProps?.contentBlocks ?? [];

  // Collect items from all blocks that have them
  const allItems: any[] = [];
  for (const block of contentBlocks) {
    const items = block?.value?.items;
    if (Array.isArray(items)) allItems.push(...items);
  }

  // Deduplicate by id
  const seen = new Set<string>();
  const unique = allItems.filter((item) => {
    const key = String(item.id);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return unique.map(mapEvent);
}

function mapEvent(item: any): any {
  const img = resolveImage(item.image);
  const tags = buildTags(item);

  return {
    id: `vs_${item.id}`,
    source: "visitstockholm",
    source_id: String(item.id),
    event_name: item.title ?? "Untitled Event",
    type: mapCategory(item.category?.title ?? item.categories?.[0] ?? ""),
    img,
    date: item.startDate ?? null,
    start_time: null,  // not in API response
    end_time: null,
    venue: item.venueName ?? null,
    address: item.address ?? null,
    city: item.city ?? "Stockholm",
    country: "Sweden",
    organizer_name: null,
    organizer_email: null,
    organizer_phone: null,
    price_currency: "SEK",
    price_amount: null,  // VisitStockholm doesn't provide pricing data
    price_early_bird: null,
    capacity: null,
    available_spots: null,
    description: stripHtml(item.description ?? ""),
    tags,
    hosts: [],
    status: "active",
    url: item.href ?? item.externalWebsiteUrl ?? null,
    lat: item.location?.latitude ?? null,
    lng: item.location?.longitude ?? null,
  };
}

function resolveImage(image: any): string | null {
  if (!image) return null;
  // Prefer medium rendition, fall back to original url
  const src =
    image.renditions?.medium?.src ??
    image.renditions?.small?.src ??
    image.url ??
    null;
  if (!src) return null;
  // Relative URLs need the base domain prepended
  return src.startsWith("http") ? src : `${BASE_URL}${src}`;
}

function mapCategory(cat: string): string {
  const c = cat.toLowerCase();
  if (c.includes("music") || c.includes("konsert") || c.includes("musik") || c.includes("concert")) return "Live Music";
  if (c.includes("club") || c.includes("party") || c.includes("partie") || c.includes("nattliv") || c.includes("nightlife")) return "Nightlife";
  if (c.includes("festival")) return "Festival";
  if (c.includes("art") || c.includes("konst") || c.includes("exhibition") || c.includes("utställning") || c.includes("gallery") || c.includes("galleri")) return "Art Exhibition";
  if (c.includes("food") || c.includes("mat") || c.includes("drink") || c.includes("dryck") || c.includes("restaurant") || c.includes("restaurang")) return "Food & Drink";
  if (c.includes("sport") || c.includes("idrott")) return "Sports";
  if (c.includes("film") || c.includes("cinema") || c.includes("bio") || c.includes("media")) return "Film & Media";
  if (c.includes("theatre") || c.includes("teater") || c.includes("opera") || c.includes("dance") || c.includes("dans") || c.includes("comedy") || c.includes("show")) return "Theatre";
  if (c.includes("family") || c.includes("barn") || c.includes("children") || c.includes("kid")) return "Family";
  if (c.includes("conference") || c.includes("konferens") || c.includes("seminar") || c.includes("lecture") || c.includes("föreläsning")) return "Conference";
  if (c.includes("business") || c.includes("startup") || c.includes("entrepreneur") || c.includes("företag")) return "Business";
  if (c.includes("health") || c.includes("wellness") || c.includes("yoga") || c.includes("meditation") || c.includes("hälsa")) return "Health & Wellness";
  if (c.includes("literature") || c.includes("litteratur") || c.includes("book") || c.includes("bok") || c.includes("poetry") || c.includes("poesi")) return "Literature";
  return "Other";
}

function buildTags(item: any): string[] {
  const raw = [
    ...(Array.isArray(item.categories) ? item.categories : []),
    item.category?.title,
    item.category?.slug,
  ].filter(Boolean);
  return [...new Set(raw.map((t: string) => t.toLowerCase()))];
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const response = await fetch(`${BASE_URL}/events/`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Spontana/1.0; +https://spontana.se)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });

    if (!response.ok) {
      throw new Error(`visitstockholm.com returned ${response.status}`);
    }

    const html = await response.text();
    const events = extractEvents(html);

    if (events.length === 0) {
      return new Response(
        JSON.stringify({ message: "No events found — page structure may have changed", count: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { error } = await supabase
      .from("events")
      .upsert(events, { onConflict: "source,source_id", ignoreDuplicates: false });

    if (error) throw new Error(`Supabase upsert error: ${error.message}`);

    const hcUrl = Deno.env.get("HEALTHCHECKS_SCRAPE_URL");
    if (hcUrl) await fetch(hcUrl).catch(() => {});

    return new Response(
      JSON.stringify({ message: `Synced ${events.length} events from visitstockholm.com`, count: events.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
