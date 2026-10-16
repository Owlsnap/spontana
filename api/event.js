// Serves /event/:id (see vercel.json): the SPA's index.html with the event's
// meta tags, JSON-LD and a plain-text summary filled in, so crawlers that don't
// run JavaScript still see the event. React replaces the summary on load.
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { selectEvents } from './_supabase.js';
import { dbRowToEvent } from '../src/lib/mapEvent.js';
import { buildEventSeo } from '../src/lib/eventSeo.js';

let templateCache;

async function loadTemplate(req) {
  if (templateCache) return templateCache;
  try {
    // Bundled via "includeFiles" in vercel.json
    templateCache = await readFile(path.join(process.cwd(), 'dist', 'index.html'), 'utf8');
  } catch {
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const res = await fetch(`${proto}://${req.headers.host}/index.html`);
    if (!res.ok) throw new Error(`index.html fetch failed: ${res.status}`);
    templateCache = await res.text();
  }
  return templateCache;
}

const escapeHtml = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// data-rh marks tags as Helmet's, so Helmet replaces them instead of duplicating
function headTags(event, seo) {
  const meta = (attr, key, content) => `<meta ${attr}="${key}" content="${escapeHtml(content)}" data-rh="true" />`;
  return [
    `<title>${escapeHtml(seo.title)}</title>`,
    meta('name', 'description', seo.description),
    `<link rel="canonical" href="${escapeHtml(seo.canonicalUrl)}" data-rh="true" />`,
    meta('property', 'og:title', event.eventName),
    meta('property', 'og:description', seo.description),
    meta('property', 'og:image', seo.image),
    meta('property', 'og:url', seo.canonicalUrl),
    meta('property', 'og:type', 'event'),
    meta('name', 'twitter:card', 'summary_large_image'),
    meta('name', 'twitter:title', event.eventName),
    meta('name', 'twitter:image', seo.image),
    `<script type="application/ld+json" data-rh="true">${seo.jsonLd}</script>`,
  ].join('\n    ');
}

function bodySummary(event) {
  const when = [event.date, event.startTime].filter(Boolean).join(' ');
  const where = [event.location.venue, event.location.address, event.location.city].filter(Boolean).join(', ');
  return `<main style="max-width:720px;margin:0 auto;padding:16px;color:#fff;font-family:sans-serif">
      <h1>${escapeHtml(event.eventName)}</h1>
      <p>${escapeHtml(when)}${where ? ` · ${escapeHtml(where)}` : ''}</p>
      ${event.description ? `<p>${escapeHtml(event.description)}</p>` : ''}
      ${event.url ? `<p><a href="${escapeHtml(event.url)}" rel="nofollow noopener">Tickets &amp; info</a></p>` : ''}
      <p><a href="/">More events in Stockholm</a></p>
    </main>`;
}

export default async function handler(req, res) {
  const id = req.query?.id ?? new URL(req.url, 'http://x').searchParams.get('id');
  let html;
  try {
    html = await loadTemplate(req);
  } catch (err) {
    console.error('event page: no template', err);
    res.statusCode = 500;
    res.end('Something went wrong');
    return;
  }

  let row;
  try {
    const rows = id ? await selectEvents(`select=*&id=eq.${encodeURIComponent(id)}&limit=1`) : [];
    row = rows[0] ?? null;
  } catch (err) {
    // Supabase down: serve the plain SPA shell and let the client try
    console.error('event page: lookup failed', err);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end(html);
    return;
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  if (!row || row.status !== 'active') {
    // Missing, pending or rejected: the SPA still renders (owners can view pending events), but don't index it
    res.statusCode = 404;
    res.setHeader('Cache-Control', 'public, s-maxage=60');
    res.end(html.replace('</head>', '  <meta name="robots" content="noindex" />\n  </head>'));
    return;
  }

  const event = dbRowToEvent(row);
  const seo = buildEventSeo(event);
  const page = html
    .replace(/<title>[^<]*<\/title>/, headTags(event, seo))
    .replace('<div id="root"></div>', `<div id="root">${bodySummary(event)}</div>`);

  res.statusCode = 200;
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
  res.end(page);
}
