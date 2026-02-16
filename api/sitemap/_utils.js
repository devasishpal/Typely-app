import { createClient } from '@supabase/supabase-js';

const DEFAULT_SITE_URL = 'https://typely.in';

function trimTrailingSlash(value) {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

function normalizeDateString(value) {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString().slice(0, 10);
}

export function toLastmodDate(...dates) {
  const normalized = dates
    .map((value) => normalizeDateString(value))
    .filter((value) => Boolean(value))
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  return normalized[0] ?? new Date().toISOString().slice(0, 10);
}

export function xmlEscape(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function resolveSiteUrl(req) {
  const envUrl = process.env.SITE_URL;
  const host = req?.headers?.host;
  if (host && typeof host === 'string') {
    const protoHeader = req.headers['x-forwarded-proto'];
    const proto = Array.isArray(protoHeader) ? protoHeader[0] : protoHeader;
    const protocol = proto || 'https';
    return trimTrailingSlash(`${protocol}://${host}`);
  }

  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    return trimTrailingSlash(envUrl.trim());
  }

  return DEFAULT_SITE_URL;
}

export function absoluteUrl(baseUrl, path) {
  const base = trimTrailingSlash(baseUrl);
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

export function buildUrlEntry(baseUrl, path, options) {
  return {
    loc: absoluteUrl(baseUrl, path),
    lastmod: options?.lastmod,
    changefreq: options?.changefreq,
    priority: options?.priority,
  };
}

export function buildIndexEntry(baseUrl, path, lastmod) {
  return {
    loc: absoluteUrl(baseUrl, path),
    lastmod,
  };
}

export function renderUrlSet(entries) {
  const body = entries
    .map((entry) => {
      const lastmod = entry.lastmod ? `\n    <lastmod>${xmlEscape(entry.lastmod)}</lastmod>` : '';
      const changefreq = entry.changefreq ? `\n    <changefreq>${entry.changefreq}</changefreq>` : '';
      const priority =
        typeof entry.priority === 'number'
          ? `\n    <priority>${Math.max(0, Math.min(1, entry.priority)).toFixed(1)}</priority>`
          : '';

      return `  <url>\n    <loc>${xmlEscape(entry.loc)}</loc>${lastmod}${changefreq}${priority}\n  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

export function renderSitemapIndex(entries) {
  const body = entries
    .map((entry) => {
      const lastmod = entry.lastmod ? `\n    <lastmod>${xmlEscape(entry.lastmod)}</lastmod>` : '';
      return `  <sitemap>\n    <loc>${xmlEscape(entry.loc)}</loc>${lastmod}\n  </sitemap>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</sitemapindex>\n`;
}

export function sendXml(res, xml) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.end(xml);
}

export function sendXmlError(res, message, statusCode = 500) {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<error>${xmlEscape(message)}</error>\n`;
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.end(xml);
}

export function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function createSupabaseServerClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Missing Supabase env vars. Set SUPABASE_URL (or VITE_SUPABASE_URL) and either SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY.'
    );
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
