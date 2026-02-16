import {
  buildIndexEntry,
  createSupabaseServerClient,
  renderSitemapIndex,
  resolveSiteUrl,
  sendXml,
  sendXmlError,
  toLastmodDate,
} from './_utils.js';

function isMissingRelationError(error) {
  return typeof error?.code === 'string' && (error.code === '42P01' || error.code === 'PGRST205');
}

function resolvePublicProfilePathTemplate() {
  const template = process.env.SITEMAP_PUBLIC_PROFILE_PATH_TEMPLATE;
  if (!template || typeof template !== 'string') return null;

  const normalized = template.trim();
  if (!normalized.includes('{username}')) return null;
  return normalized.startsWith('/') ? normalized : `/${normalized}`;
}

async function getBlogMeta(supabase) {
  const candidateTables = ['blog_posts', 'posts'];

  for (const table of candidateTables) {
    const [{ count, error: countError }, { data: latest, error: latestError }] =
      await Promise.all([
        supabase.from(table).select('id', { count: 'exact', head: true }),
        supabase
          .from(table)
          .select('updated_at, published_at, created_at')
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

    if (countError || latestError) {
      if (
        (countError && isMissingRelationError(countError)) ||
        (latestError && isMissingRelationError(latestError))
      ) {
        continue;
      }
      continue;
    }

    return {
      hasPosts: typeof count === 'number' && count > 0,
      lastmod: toLastmodDate(latest?.updated_at, latest?.published_at, latest?.created_at),
    };
  }

  return {
    hasPosts: false,
    lastmod: undefined,
  };
}

export default async function handler(req, res) {
  try {
    const supabase = createSupabaseServerClient();
    const baseUrl = resolveSiteUrl(req);
    const publicProfilePathTemplate = resolvePublicProfilePathTemplate();

    const [
      { data: latestLesson },
      { data: latestPractice },
      { data: latestSettings },
      categoriesResult,
      profilesCountResult,
      profilesLatestResult,
      blogMeta,
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
        .from('profiles')
        .select('updated_at, created_at')
        .not('username', 'is', null)
        .neq('role', 'admin')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      getBlogMeta(supabase),
    ]);

    const hasBlogFromSettings =
      typeof latestSettings?.blog === 'string' && latestSettings.blog.trim().length > 0;
    const hasBlogFromPosts = blogMeta.hasPosts;
    const hasBlog = hasBlogFromSettings || hasBlogFromPosts;

    const hasUsers =
      Boolean(publicProfilePathTemplate) &&
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
      blogMeta.lastmod && blogMeta.lastmod.length > 0
        ? toLastmodDate(blogMeta.lastmod, settingsLastmod)
        : settingsLastmod;

    const usersLastmod = toLastmodDate(
      profilesLatestResult.data?.updated_at,
      profilesLatestResult.data?.created_at
    );

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
