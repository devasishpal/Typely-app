import {
  buildIndexEntry,
  createSupabaseServerClient,
  renderSitemapIndex,
  resolveSiteUrl,
  sendXml,
  sendXmlError,
  toLastmodDate,
} from './_utils';

function isMissingRelationError(error: any) {
  return typeof error?.code === 'string' && error.code === '42P01';
}

export default async function handler(req: any, res: any) {
  try {
    const supabase = createSupabaseServerClient();
    const baseUrl = resolveSiteUrl(req);

    const [
      { data: latestLesson },
      { data: latestPractice },
      { data: latestSettings },
      categoriesResult,
      profilesCountResult,
      blogPostsCountResult,
      blogLatestResult,
    ] = await Promise.all([
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
      supabase
        .from('categories')
        .select('updated_at, created_at')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .not('username', 'is', null)
        .neq('role', 'admin'),
      supabase
        .from('blog_posts')
        .select('id', { count: 'exact', head: true }),
      supabase
        .from('blog_posts')
        .select('updated_at, created_at, published_at')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const hasBlogFromSettings =
      typeof latestSettings?.blog === 'string' && latestSettings.blog.trim().length > 0;
    const hasBlogFromPosts =
      !blogPostsCountResult.error &&
      typeof blogPostsCountResult.count === 'number' &&
      blogPostsCountResult.count > 0;
    const hasBlog = hasBlogFromSettings || hasBlogFromPosts;

    const hasUsers =
      !profilesCountResult.error &&
      typeof profilesCountResult.count === 'number' &&
      profilesCountResult.count > 0;

    const settingsLastmod = toLastmodDate(latestSettings?.updated_at);
    const lessonsLastmod = toLastmodDate(latestLesson?.updated_at, latestLesson?.created_at);
    const practiceLastmod = toLastmodDate(
      latestPractice?.updated_at,
      latestPractice?.created_at
    );
    const pagesLastmod = toLastmodDate(settingsLastmod, lessonsLastmod, practiceLastmod);

    const categoriesLastmod = categoriesResult.error
      ? lessonsLastmod
      : toLastmodDate(categoriesResult.data?.updated_at, categoriesResult.data?.created_at);

    const blogLastmod =
      blogPostsCountResult.error && isMissingRelationError(blogPostsCountResult.error)
        ? settingsLastmod
        : toLastmodDate(
            blogLatestResult.data?.updated_at,
            blogLatestResult.data?.published_at,
            blogLatestResult.data?.created_at,
            settingsLastmod
          );

    const usersLastmod = toLastmodDate();

    const entries = [
      buildIndexEntry(baseUrl, '/sitemap-pages.xml', pagesLastmod),
      buildIndexEntry(baseUrl, '/sitemap-lessons.xml', lessonsLastmod),
      buildIndexEntry(baseUrl, '/sitemap-categories.xml', categoriesLastmod),
    ];

    if (hasBlog) {
      entries.push(buildIndexEntry(baseUrl, '/sitemap-blog.xml', blogLastmod));
    }

    if (hasUsers) {
      entries.push(buildIndexEntry(baseUrl, '/sitemap-users.xml', usersLastmod));
    }

    sendXml(res, renderSitemapIndex(entries));
  } catch (error) {
    console.error('Failed to generate sitemap.xml:', error);
    sendXmlError(res, 'Unable to generate sitemap index.');
  }
}
