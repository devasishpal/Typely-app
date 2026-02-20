import { createClient } from '@supabase/supabase-js';

const DEFAULT_SITE_URL = 'https://typelyapp.vercel.app';
const DEFAULT_SITEMAP_TIMEOUT_MS = 4500;
const SITEMAP_CACHE_CONTROL = 'public, max-age=0, s-maxage=86400, stale-while-revalidate=86400, stale-if-error=604800';
const SITEMAP_CDN_CACHE_CONTROL = 'public, s-maxage=86400, stale-while-revalidate=86400';
const VALID_SITEMAP_TYPES = new Set([
  'index',
  'pages',
  'lessons',
  'blog',
  'categories',
  'users',
]);
const INDEX_CHILD_SITEMAPS = [
  { type: 'blog', path: '/sitemap-blog.xml' },
  { type: 'lessons', path: '/sitemap-lessons.xml' },
  { type: 'pages', path: '/sitemap-pages.xml' },
  { type: 'categories', path: '/sitemap-categories.xml' },
];

function trimTrailingSlash(value) {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

function normalizeDateString(value) {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString().slice(0, 10);
}

function toLastmodDate(...dates) {
  const normalized = dates
    .map((value) => normalizeDateString(value))
    .filter((value) => Boolean(value))
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  return normalized[0] ?? new Date().toISOString().slice(0, 10);
}

function xmlEscape(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
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

function absoluteUrl(baseUrl, path) {
  const base = trimTrailingSlash(baseUrl);
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

function buildUrlEntry(baseUrl, path, options) {
  return {
    loc: absoluteUrl(baseUrl, path),
    lastmod: options?.lastmod,
    changefreq: options?.changefreq,
    priority: options?.priority,
  };
}

function buildIndexEntry(baseUrl, path, lastmod) {
  return {
    loc: absoluteUrl(baseUrl, path),
    lastmod,
  };
}

function renderUrlSet(entries) {
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

function renderSitemapIndex(entries) {
  const body = entries
    .map((entry) => {
      const lastmod = entry.lastmod ? `\n    <lastmod>${xmlEscape(entry.lastmod)}</lastmod>` : '';
      return `  <sitemap>\n    <loc>${xmlEscape(entry.loc)}</loc>${lastmod}\n  </sitemap>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</sitemapindex>\n`;
}

function sendXml(res, xml) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', SITEMAP_CACHE_CONTROL);
  res.setHeader('CDN-Cache-Control', SITEMAP_CDN_CACHE_CONTROL);
  res.setHeader('Vercel-CDN-Cache-Control', SITEMAP_CDN_CACHE_CONTROL);
  res.end(xml);
}

function parseTimeoutMs(value) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_SITEMAP_TIMEOUT_MS;
  return parsed;
}

async function withTimeout(promise, timeoutMs, fallbackValue, label) {
  let timer = null;
  try {
    return await Promise.race([
      promise,
      new Promise((resolve) => {
        timer = setTimeout(() => {
          console.warn(`Sitemap generation timed out (${label}) after ${timeoutMs}ms. Serving fallback.`);
          resolve(fallbackValue);
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function createSupabaseServerClient() {
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

function toCategoryName(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function getQueryValue(req, key) {
  const raw = req?.query?.[key];
  if (Array.isArray(raw)) {
    return typeof raw[0] === 'string' ? raw[0] : '';
  }
  return typeof raw === 'string' ? raw : '';
}

function getSitemapType(req) {
  const value = getQueryValue(req, 'type').trim().toLowerCase();
  if (!value || !VALID_SITEMAP_TYPES.has(value)) {
    return 'index';
  }
  return value;
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function buildFixedIndexEntries(baseUrl, lastmodByType = {}) {
  const fallbackLastmod = todayDate();

  return INDEX_CHILD_SITEMAPS.map((entry) =>
    buildIndexEntry(
      baseUrl,
      entry.path,
      normalizeDateString(lastmodByType[entry.type]) || fallbackLastmod
    )
  );
}

function generateFallbackSitemap(type, baseUrl) {
  const lastmod = todayDate();

  if (type === 'pages') {
    return renderUrlSet([
      buildUrlEntry(baseUrl, '/', { lastmod, changefreq: 'weekly', priority: 1.0 }),
      buildUrlEntry(baseUrl, '/lessons', { lastmod, changefreq: 'weekly', priority: 0.9 }),
      buildUrlEntry(baseUrl, '/practice', { lastmod, changefreq: 'weekly', priority: 0.9 }),
      buildUrlEntry(baseUrl, '/about', { lastmod, changefreq: 'monthly', priority: 0.6 }),
      buildUrlEntry(baseUrl, '/contact', { lastmod, changefreq: 'monthly', priority: 0.6 }),
      buildUrlEntry(baseUrl, '/blog', { lastmod, changefreq: 'weekly', priority: 0.7 }),
    ]);
  }

  if (type === 'blog') {
    return renderUrlSet([
      buildUrlEntry(baseUrl, '/blog', { lastmod, changefreq: 'weekly', priority: 0.8 }),
    ]);
  }

  if (type === 'lessons' || type === 'categories') {
    return renderUrlSet([
      buildUrlEntry(baseUrl, '/lessons', { lastmod, changefreq: 'weekly', priority: 0.8 }),
    ]);
  }

  if (type === 'users') {
    return renderUrlSet([]);
  }

  return renderSitemapIndex(buildFixedIndexEntries(baseUrl));
}

async function hasBlogPosts(supabase) {
  const candidateTables = ['footer_blog_posts', 'blog_posts', 'posts'];

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

async function getBlogMeta(supabase) {
  const candidateTables = ['footer_blog_posts', 'blog_posts', 'posts'];

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

async function generateIndexSitemap(supabase, baseUrl) {
  const [
    { data: latestLesson },
    { data: latestPractice },
    { data: latestSettings },
    categoriesResult,
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
    getBlogMeta(supabase),
  ]);

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

  return renderSitemapIndex(
    buildFixedIndexEntries(baseUrl, {
      blog: blogLastmod,
      lessons: lessonsLastmod,
      pages: pagesLastmod,
      categories: categoriesLastmod,
    })
  );
}

async function generatePagesSitemap(supabase, baseUrl) {
  const [
    { data: latestLesson },
    { data: latestPractice },
    { data: latestSettings },
    hasBlogPostRows,
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

  return renderUrlSet(entries);
}

async function generateLessonsSitemap(supabase, baseUrl) {
  const { data: lessons, error } = await supabase
    .from('lessons')
    .select('id, slug, title, updated_at, created_at')
    .order('order_index', { ascending: true });

  if (error) {
    console.warn('Failed to query lessons for sitemap:', error.message || error);
    return renderUrlSet([
      buildUrlEntry(baseUrl, '/lessons', {
        lastmod: todayDate(),
        changefreq: 'weekly',
        priority: 0.8,
      }),
    ]);
  }

  const rows = Array.isArray(lessons) ? lessons : [];
  const entries = rows
    .map((lesson) => {
      const slug =
        typeof lesson.slug === 'string' && lesson.slug.trim()
          ? lesson.slug.trim()
          : slugify(typeof lesson.title === 'string' ? lesson.title : '');
      const lessonRef = slug || (typeof lesson.id === 'string' ? lesson.id : '');
      if (!lessonRef) return null;

      return buildUrlEntry(baseUrl, `/lesson/${lessonRef}`, {
        lastmod: toLastmodDate(lesson.updated_at, lesson.created_at),
        changefreq: 'weekly',
        priority: 0.8,
      });
    })
    .filter((entry) => Boolean(entry));

  if (entries.length === 0) {
    entries.push(
      buildUrlEntry(baseUrl, '/lessons', {
        lastmod: todayDate(),
        changefreq: 'weekly',
        priority: 0.8,
      })
    );
  }

  return renderUrlSet(entries);
}

async function generateBlogSitemap(supabase, baseUrl) {
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

      const isPublishedFlag = typeof row.is_published === 'boolean' ? row.is_published : undefined;
      const status = typeof row.status === 'string' ? row.status.toLowerCase() : '';
      const isPublishedStatus = !status || ['published', 'public', 'live'].includes(status);

      if (isPublishedFlag === false || !isPublishedStatus) {
        continue;
      }

      const postPath = blogPostPathTemplate.replace('{slug}', encodeURIComponent(slug));
      entries.push(
        buildUrlEntry(baseUrl, postPath, {
          lastmod: toLastmodDate(row.updated_at, row.published_at, row.created_at),
          changefreq: 'weekly',
          priority: 0.7,
        })
      );
    }
  }

  return renderUrlSet(entries);
}

async function generateCategoriesSitemap(supabase, baseUrl) {
  const { data: categories, error: categoriesError } = await supabase
    .from('categories')
    .select('*');

  const categoryRows = [];

  if (!categoriesError && Array.isArray(categories) && categories.length > 0) {
    for (const row of categories) {
      const name = toCategoryName(row.name);
      if (!name) continue;
      categoryRows.push({
        category: name,
        updated_at: row.updated_at,
        created_at: row.created_at,
      });
    }
  } else {
    if (categoriesError && !isMissingRelationError(categoriesError)) {
      console.warn('Failed to query categories for sitemap:', categoriesError.message || categoriesError);
    }

    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('category, updated_at, created_at');

    if (lessonsError) {
      console.warn('Failed to query lessons for category sitemap:', lessonsError.message || lessonsError);
      return renderUrlSet([
        buildUrlEntry(baseUrl, '/lessons', {
          lastmod: todayDate(),
          changefreq: 'weekly',
          priority: 0.8,
        }),
      ]);
    }

    const seen = new Set();
    for (const lesson of Array.isArray(lessons) ? lessons : []) {
      const category = toCategoryName(lesson.category);
      if (!category || seen.has(category)) continue;
      seen.add(category);
      categoryRows.push({
        category,
        updated_at: lesson.updated_at,
        created_at: lesson.created_at,
      });
    }
  }

  const entries = categoryRows.map((row) =>
    buildUrlEntry(baseUrl, `/lessons?category=${encodeURIComponent(row.category)}`, {
      lastmod: toLastmodDate(row.updated_at, row.created_at),
      changefreq: 'weekly',
      priority: 0.5,
    })
  );

  if (entries.length === 0) {
    entries.push(
      buildUrlEntry(baseUrl, '/lessons', {
        lastmod: todayDate(),
        changefreq: 'weekly',
        priority: 0.8,
      })
    );
  }

  return renderUrlSet(entries);
}

async function generateUsersSitemap(supabase, baseUrl) {
  const publicProfilePathTemplate = resolvePublicProfilePathTemplate();

  if (!publicProfilePathTemplate) {
    return renderUrlSet([]);
  }

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('username, role, updated_at, created_at')
    .not('username', 'is', null);

  if (error) {
    console.warn('Failed to query profiles for users sitemap:', error.message || error);
    return renderUrlSet([]);
  }

  const entries = (Array.isArray(profiles) ? profiles : [])
    .filter((profile) => profile.role !== 'admin')
    .map((profile) => {
      const username = typeof profile.username === 'string' ? profile.username.trim() : '';
      if (!username) return null;
      const userPath = publicProfilePathTemplate.replace('{username}', encodeURIComponent(username));

      return buildUrlEntry(baseUrl, userPath, {
        lastmod: toLastmodDate(profile.updated_at, profile.created_at),
        changefreq: 'weekly',
        priority: 0.4,
      });
    })
    .filter((entry) => Boolean(entry));

  return renderUrlSet(entries);
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET, HEAD');
    res.end('Method not allowed');
    return;
  }

  const type = getSitemapType(req);
  const baseUrl = resolveSiteUrl(req);
  const fallbackXml = generateFallbackSitemap(type, baseUrl);

  if (req.method === 'HEAD') {
    sendXml(res, '');
    return;
  }

  let supabase;
  try {
    supabase = createSupabaseServerClient();
  } catch (error) {
    console.error(`Failed to initialize sitemap client (${type}):`, error);
    sendXml(res, fallbackXml);
    return;
  }

  try {
    const timeoutMs = parseTimeoutMs(process.env.SITEMAP_TIMEOUT_MS);
    let xml;
    if (type === 'pages') {
      xml = await withTimeout(
        generatePagesSitemap(supabase, baseUrl),
        timeoutMs,
        fallbackXml,
        'pages'
      );
    } else if (type === 'lessons') {
      xml = await withTimeout(
        generateLessonsSitemap(supabase, baseUrl),
        timeoutMs,
        fallbackXml,
        'lessons'
      );
    } else if (type === 'blog') {
      xml = await withTimeout(
        generateBlogSitemap(supabase, baseUrl),
        timeoutMs,
        fallbackXml,
        'blog'
      );
    } else if (type === 'categories') {
      xml = await withTimeout(
        generateCategoriesSitemap(supabase, baseUrl),
        timeoutMs,
        fallbackXml,
        'categories'
      );
    } else if (type === 'users') {
      xml = await withTimeout(
        generateUsersSitemap(supabase, baseUrl),
        timeoutMs,
        fallbackXml,
        'users'
      );
    } else {
      xml = await withTimeout(
        generateIndexSitemap(supabase, baseUrl),
        timeoutMs,
        fallbackXml,
        'index'
      );
    }

    sendXml(res, xml);
  } catch (error) {
    console.error(`Failed to generate sitemap (${type}):`, error);
    sendXml(res, fallbackXml);
  }
}
