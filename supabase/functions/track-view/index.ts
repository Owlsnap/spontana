import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BOT_PATTERNS = [
  /bot/i, /crawler/i, /spider/i, /scraper/i, /headless/i,
  /googlebot/i, /bingbot/i, /slurp/i, /duckduckbot/i,
  /baidu/i, /yandex/i, /sogou/i, /facebot/i, /ia_archiver/i,
  /wget/i, /curl/i, /python-requests/i, /axios/i,
  /go-http-client/i, /java\//i, /okhttp/i,
];

function isBot(userAgent: string | null): boolean {
  if (!userAgent) return true;
  return BOT_PATTERNS.some(pattern => pattern.test(userAgent));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  const userAgent = req.headers.get("user-agent");
  if (isBot(userAgent)) {
    return new Response(JSON.stringify({ skipped: true, reason: "bot" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let event_id: string;
  let user_id: string | null = null;

  try {
    const body = await req.json();
    event_id = body.event_id;
    if (!event_id) throw new Error("Missing event_id");
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Extract user_id from JWT if present
  const authHeader = req.headers.get("authorization");
  if (authHeader) {
    try {
      const anonClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
      );
      const { data: { user } } = await anonClient.auth.getUser(
        authHeader.replace("Bearer ", "")
      );
      user_id = user?.id ?? null;
    } catch {
      // anonymous view is fine
    }
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const [viewInsert, countUpdate] = await Promise.all([
    supabase.from("event_views").insert({ event_id, user_id }),
    supabase.rpc("increment_view_count", { p_event_id: event_id }),
  ]);

  if (viewInsert.error) {
    console.error("Insert error:", viewInsert.error.message);
    return new Response(JSON.stringify({ error: "Failed to record view" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
