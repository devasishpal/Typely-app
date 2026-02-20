const DEFAULT_SITE_URL = 'https://typely.in';

function trimTrailingSlash(value) {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

function resolveSiteUrl(req) {
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

export default async function handler(req, res) {
  const baseUrl = resolveSiteUrl(req);
  const body = `User-agent: *\nAllow: /\n\nSitemap: ${baseUrl}/sitemap.xml\n`;

  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  res.end(body);
}
