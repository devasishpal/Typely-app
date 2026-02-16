import {
  buildUrlEntry,
  createSupabaseServerClient,
  renderUrlSet,
  resolveSiteUrl,
  sendXml,
  sendXmlError,
  toLastmodDate,
} from './_utils';

type BlogRow = Record<string, unknown>;

function isMissingRelationError(error: any) {
  return typeof error?.code === 'string' && error.code === '42P01';
}

async function fetchBlogRows(supabase: any): Promise<BlogRow[]> {
  const candidateTables = ['blog_posts', 'posts'];

  for (const table of candidateTables) {
    const { data, error } = await supabase.from(table).select('*');
    if (!error && Array.isArray(data)) {
      return data as BlogRow[];
    }

    if (error && !isMissingRelationError(error)) {
      console.warn(`Failed to query ${table} for blog sitemap:`, error.message || error);
    }
  }

  return [];
}

export default async function handler(req: any, res: any) {
  try {
    const supabase = createSupabaseServerClient();
    const baseUrl = resolveSiteUrl(req);

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

    for (const row of blogRows) {
      const slug = typeof row.slug === 'string' ? row.slug.trim() : '';
      if (!slug) continue;

      const isPublishedFlag =
        typeof row.is_published === 'boolean' ? row.is_published : undefined;
      const status = typeof row.status === 'string' ? row.status.toLowerCase() : '';
      const isPublishedStatus = !status || ['published', 'public', 'live'].includes(status);

      if (isPublishedFlag === false || !isPublishedStatus) {
        continue;
      }

      entries.push(
        buildUrlEntry(baseUrl, `/blog/${slug}`, {
          lastmod: toLastmodDate(
            row.updated_at as string | undefined,
            row.published_at as string | undefined,
            row.created_at as string | undefined
          ),
          changefreq: 'weekly',
          priority: 0.7,
        })
      );
    }

    sendXml(res, renderUrlSet(entries));
  } catch (error) {
    console.error('Failed to generate sitemap-blog.xml:', error);
    sendXmlError(res, 'Unable to generate blog sitemap.');
  }
}
