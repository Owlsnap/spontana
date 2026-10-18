// Dynamic sitemap: static pages + every upcoming active event. Served at /sitemap.xml (see vercel.json).
import { selectEvents, stockholmToday } from './_supabase.js';
import { SITE_URL } from '../src/lib/eventSeo.js';

const PAGE_SIZE = 1000; // PostgREST max rows per request

async function upcomingEvents() {
  const today = stockholmToday();
  const query = `select=id,updated_at&status=eq.active&or=(date.gte.${today},end_date.gte.${today})&order=date.asc,id.asc`;
  const rows = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const page = await selectEvents(query, { range: `${from}-${from + PAGE_SIZE - 1}` });
    rows.push(...page);
    if (page.length < PAGE_SIZE) return rows;
  }
}

function urlEntry(loc, { lastmod, changefreq, priority }) {
  return [
    '  <url>',
    `    <loc>${loc}</loc>`,
    lastmod && `    <lastmod>${lastmod}</lastmod>`,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    '  </url>',
  ].filter(Boolean).join('\n');
}

export default async function handler(req, res) {
  try {
    const events = await upcomingEvents();
    const entries = [
      urlEntry(`${SITE_URL}/`, { changefreq: 'daily', priority: '1.0' }),
      urlEntry(`${SITE_URL}/privacy`, { changefreq: 'yearly', priority: '0.3' }),
      ...events.map((e) =>
        urlEntry(`${SITE_URL}/event/${encodeURIComponent(e.id)}`, {
          lastmod: e.updated_at?.slice(0, 10),
          changefreq: 'daily',
          priority: '0.8',
        })
      ),
    ];
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`;

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    // Events sync nightly; an hour of CDN caching is plenty fresh
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.end(xml);
  } catch (err) {
    console.error('sitemap failed', err);
    res.statusCode = 500;
    res.setHeader('Cache-Control', 'no-store');
    res.end('Sitemap unavailable');
  }
}
