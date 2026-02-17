import {
  buildUrlEntry,
  createSupabaseServerClient,
  renderUrlSet,
  resolveSiteUrl,
  sendXml,
  sendXmlError,
  toLastmodDate,
} from './_utils.js';

function isMissingRelationError(error) {
  return typeof error?.code === 'string' && (error.code === '42P01' || error.code === 'PGRST205');
}

function resolveBlogPostPathTemplate() {
  const template = process.env.SITEMAP_BLOG_POST_PATH_TEMPLATE;
  if (!template || typeof template !== 'string') return null;

  const normalized = template.trim();
  if (!normalized.includes('{slug}')) return null;
  return normalized.startsWith('/') ? normalized : `/${normalized}`;
}

function resolveSlug(row) {
  const direct = typeof row.slug === 'string' ? row.slug.trim() : '';
  if (direct) return direct;

  const link = typeof row.link_url === 'string' ? row.link_url.trim() : '';
  if (!link) return '';

  const match = link.match(/\/blog\/([^/?#]+)/i);
  return match?.[1] ? decodeURIComponent(match[1]) : '';
}

async function fetchBlogRows(supabase) {
  const candidateTables = ['footer_blog_posts', 'blog_posts', 'posts'];

  for (const table of candidateTables) {
    const { data, error } = await supabase.from(table).select('*');
    if (!error && Array.isArray(data)) {
      return data;
    }

    if (error && !isMissingRelationError(error)) {
      console.warn(`Failed to query ${table} for blog sitemap:`, error.message || error);
    }
  }

  return [];
}

export default async function handler(req, res) {
  try {
    const supabase = createSupabaseServerClient();
    const baseUrl = resolveSiteUrl(req);
    const blogPostPathTemplate = resolveBlogPostPathTemplate();

    const [{ data: latestSettings }, blogRows] = await Promise.all([
      supabase
        .from('site_settings')
        .select('updated_at, blog')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      fetchBlogRows(supabase),
    ]);

    const settingsLastmod = toLastmodDate(latestSettings?.updated_at);
    const entries = [
      buildUrlEntry(baseUrl, '/blog', {
        lastmod: settingsLastmod,
        changefreq: 'weekly',
        priority: 0.8,
      }),
    ];

    if (blogPostPathTemplate) {
      for (const row of blogRows) {
        const slug = resolveSlug(row);
        if (!slug) continue;

        if (row.is_deleted === true || row.is_draft === true) {
          continue;
        }

        const isPublishedFlag =
          typeof row.is_published === 'boolean' ? row.is_published : undefined;
        const status = typeof row.status === 'string' ? row.status.toLowerCase() : '';
        const isPublishedStatus = !status || ['published', 'public', 'live'].includes(status);

        if (isPublishedFlag === false || !isPublishedStatus) {
          continue;
        }

        const postPath = blogPostPathTemplate.replace('{slug}', encodeURIComponent(slug));
        entries.push(
          buildUrlEntry(baseUrl, postPath, {
            lastmod: toLastmodDate(
              row.updated_at,
              row.published_at,
              row.created_at
            ),
            changefreq: 'weekly',
            priority: 0.7,
          })
        );
      }
    }

    sendXml(res, renderUrlSet(entries));
  } catch (error) {
    console.error('Failed to generate sitemap-blog.xml:', error);
    sendXmlError(res, 'Unable to generate blog sitemap.');
  }
}
