import { resolveSiteUrl } from './sitemap/_utils.js';

export default async function handler(req, res) {
  const baseUrl = resolveSiteUrl(req);
  const body = `User-agent: *\nAllow: /\n\nSitemap: ${baseUrl}/sitemap.xml\n`;

  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  res.end(body);
}
