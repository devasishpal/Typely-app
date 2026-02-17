export interface FooterBlogPostRow {
  id: string;
  title: string | null;
  slug?: string | null;
  excerpt: string | null;
  content: string | null;
  image_url: string | null;
  link_url: string | null;
  date_label: string | null;
  sort_order: number | null;
  meta_title?: string | null;
  meta_description?: string | null;
  is_draft?: boolean | null;
  is_deleted?: boolean | null;
  published_at?: string | null;
  created_at?: string | null;
  updated_at: string | null;
  is_published: boolean | null;
}

export interface PublicBlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  imageUrl: string | null;
  linkUrl: string;
  dateLabel: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  isPublished: boolean;
}

function ensureLeadingSlash(value: string) {
  if (!value) return value;
  return value.startsWith('/') ? value : `/${value}`;
}

export function normalizeBlogSlug(input: string) {
  const slug = input
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug;
}

export function buildBlogPath(slug: string) {
  const normalized = normalizeBlogSlug(slug);
  return normalized ? `/blog/${normalized}` : '/blog';
}

export function extractBlogSlugFromLink(link: string | null | undefined) {
  if (!link) return '';
  const value = link.trim();
  if (!value) return '';

  const localPath = value.startsWith('http://') || value.startsWith('https://')
    ? (() => {
        try {
          return new URL(value).pathname;
        } catch {
          return value;
        }
      })()
    : ensureLeadingSlash(value);

  const match = localPath.match(/\/blog\/([^/?#]+)/i);
  if (!match?.[1]) return '';
  return normalizeBlogSlug(decodeURIComponent(match[1]));
}

export function stripHtmlText(raw: string) {
  return raw
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function looksLikeHtml(raw: string) {
  return /<\/?[a-z][\s\S]*>/i.test(raw);
}

export function resolveBlogSlug(
  row: Pick<FooterBlogPostRow, 'id' | 'title' | 'link_url' | 'slug'>,
  fallbackIndex = 1
) {
  const directSlug = normalizeBlogSlug(row.slug ?? '');
  if (directSlug) return directSlug;

  const fromLink = extractBlogSlugFromLink(row.link_url);
  if (fromLink) return fromLink;

  const fromTitle = normalizeBlogSlug(row.title ?? '');
  if (fromTitle) return fromTitle;

  const fromId = normalizeBlogSlug(row.id);
  if (fromId) return fromId;

  return `post-${fallbackIndex}`;
}

export function buildExcerpt(sourceContent: string, sourceExcerpt: string | null | undefined, maxLength = 190) {
  const explicit = (sourceExcerpt ?? '').trim();
  if (explicit) return explicit;

  const text = stripHtmlText(sourceContent);
  if (!text) return 'Read the latest update from Typely.';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3).trim()}...`;
}

export function ensureUniqueSlugs(slugs: string[]) {
  const used = new Set<string>();
  return slugs.map((baseValue, index) => {
    const base = normalizeBlogSlug(baseValue) || `post-${index + 1}`;
    if (!used.has(base)) {
      used.add(base);
      return base;
    }

    let attempt = 2;
    let candidate = `${base}-${attempt}`;
    while (used.has(candidate)) {
      attempt += 1;
      candidate = `${base}-${attempt}`;
    }
    used.add(candidate);
    return candidate;
  });
}

export function mapBlogRowToPost(row: FooterBlogPostRow, index: number): PublicBlogPost {
  const title = (row.title ?? '').trim() || `Post ${index + 1}`;
  const content = (row.content ?? '').trim();
  const slug = resolveBlogSlug(row, index + 1);
  const excerpt = buildExcerpt(content, row.excerpt);
  const linkUrl = buildBlogPath(slug);

  return {
    id: row.id,
    slug,
    title,
    excerpt,
    content: content || excerpt,
    imageUrl: (row.image_url ?? '').trim() || null,
    linkUrl,
    dateLabel: row.date_label ?? null,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
    isPublished: row.is_published !== false,
  };
}
