import {
  buildUrlEntry,
  createSupabaseServerClient,
  renderUrlSet,
  resolveSiteUrl,
  sendXml,
  sendXmlError,
  toLastmodDate,
} from './_utils';

function isMissingRelationError(error: any) {
  return typeof error?.code === 'string' && (error.code === '42P01' || error.code === 'PGRST205');
}

async function hasBlogPosts(supabase: any) {
  const candidateTables = ['blog_posts', 'posts'];

  for (const table of candidateTables) {
    const { count, error } = await supabase
      .from(table)
      .select('id', { count: 'exact', head: true });

    if (error) {
      if (isMissingRelationError(error)) continue;
      continue;
    }

    if (typeof count === 'number' && count > 0) {
      return true;
    }
  }

  return false;
}

export default async function handler(req: any, res: any) {
  try {
    const supabase = createSupabaseServerClient();
    const baseUrl = resolveSiteUrl(req);

    const [
      { data: latestLesson },
      { data: latestPractice },
      { data: latestSettings },
      hasBlogPostRows,
    ] =
      await Promise.all([
        supabase
          .from('lessons')
          .select('updated_at, created_at')
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('practice_tests')
          .select('updated_at, created_at')
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('site_settings')
          .select('updated_at, blog')
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        hasBlogPosts(supabase),
      ]);

    const settingsLastmod = toLastmodDate(latestSettings?.updated_at);
    const lessonsLastmod = toLastmodDate(latestLesson?.updated_at, latestLesson?.created_at);
    const practiceLastmod = toLastmodDate(
      latestPractice?.updated_at,
      latestPractice?.created_at
    );
    const homeLastmod = toLastmodDate(settingsLastmod, lessonsLastmod, practiceLastmod);
    const hasBlogFromSettings =
      typeof latestSettings?.blog === 'string' && latestSettings.blog.trim().length > 0;
    const hasBlog = hasBlogFromSettings || hasBlogPostRows;

    const entries = [
      buildUrlEntry(baseUrl, '/', {
        lastmod: homeLastmod,
        changefreq: 'weekly',
        priority: 1.0,
      }),
      buildUrlEntry(baseUrl, '/lessons', {
        lastmod: lessonsLastmod,
        changefreq: 'weekly',
        priority: 0.9,
      }),
      buildUrlEntry(baseUrl, '/practice', {
        lastmod: practiceLastmod,
        changefreq: 'weekly',
        priority: 0.9,
      }),
      buildUrlEntry(baseUrl, '/about', {
        lastmod: settingsLastmod,
        changefreq: 'monthly',
        priority: 0.6,
      }),
      buildUrlEntry(baseUrl, '/contact', {
        lastmod: settingsLastmod,
        changefreq: 'monthly',
        priority: 0.6,
      }),
    ];

    if (hasBlog) {
      entries.push(
        buildUrlEntry(baseUrl, '/blog', {
          lastmod: settingsLastmod,
          changefreq: 'weekly',
          priority: 0.7,
        })
      );
    }

    sendXml(res, renderUrlSet(entries));
  } catch (error) {
    console.error('Failed to generate sitemap-pages.xml:', error);
    sendXmlError(res, 'Unable to generate pages sitemap.');
  }
}
