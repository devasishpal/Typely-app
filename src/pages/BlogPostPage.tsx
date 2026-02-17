import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { supabase } from '@/db/supabase';
import PageMeta from '@/components/common/PageMeta';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import NotFound from './NotFound';
import {
  buildBlogPath,
  looksLikeHtml,
  mapBlogRowToPost,
  normalizeBlogSlug,
  type FooterBlogPostRow,
  type PublicBlogPost,
} from '@/lib/blogPosts';
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  Clock3,
  Newspaper,
} from 'lucide-react';

const BLOG_SELECT_FIELDS =
  'id, title, slug, excerpt, content, image_url, link_url, date_label, sort_order, created_at, updated_at, is_published, is_draft, is_deleted';

function isMissingRelationError(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === '42P01'
  );
}

function safeJson(raw: string) {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

function formatDisplayDate(post: PublicBlogPost) {
  if (post.dateLabel) return post.dateLabel;
  const source = post.createdAt || post.updatedAt;
  if (!source) return 'Recently updated';
  const parsed = new Date(source);
  if (Number.isNaN(parsed.getTime())) return 'Recently updated';
  return parsed.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function estimateReadTime(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

export default function BlogPostPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const normalizedSlug = useMemo(() => normalizeBlogSlug(slug), [slug]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [post, setPost] = useState<PublicBlogPost | null>(null);

  useEffect(() => {
    let active = true;

    const loadPost = async () => {
      if (!normalizedSlug) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      setNotFound(false);

      try {
        const { data, error: requestError } = await (supabase.from('footer_blog_posts' as any))
          .select(BLOG_SELECT_FIELDS)
          .eq('is_published', true)
          .eq('is_draft', false)
          .eq('is_deleted', false)
          .order('sort_order', { ascending: true })
          .order('updated_at', { ascending: false });

        if (requestError) throw requestError;
        if (!active) return;

        const rows = Array.isArray(data) ? (data as FooterBlogPostRow[]) : [];
        const mapped = rows.map((row, index) => mapBlogRowToPost(row, index));
        const matched = mapped.find((entry) => entry.slug === normalizedSlug) ?? null;

        if (!matched) {
          setNotFound(true);
          setPost(null);
        } else {
          setPost(matched);
        }
      } catch (requestError) {
        if (!active) return;
        if (isMissingRelationError(requestError)) {
          const { data } = await supabase
            .from('site_settings')
            .select('blog')
            .order('updated_at', { ascending: false })
            .order('id', { ascending: false })
            .limit(1)
            .maybeSingle();

          const raw = typeof data?.blog === 'string' ? data.blog : '';
          const parsed = safeJson(raw);
          if (!Array.isArray(parsed)) {
            setNotFound(true);
            setPost(null);
            return;
          }

          const fallbackRows = parsed.map((entry, index) => {
            const item = entry as Record<string, unknown>;
            const postId = typeof item.id === 'string' && item.id.trim() ? item.id : `fallback-${index + 1}`;
            return {
              id: postId,
              title: typeof item.title === 'string' ? item.title : null,
              excerpt: typeof item.excerpt === 'string' ? item.excerpt : null,
              content: typeof item.content === 'string' ? item.content : null,
              image_url: typeof item.image_url === 'string'
                ? item.image_url
                : typeof item.imageUrl === 'string'
                  ? item.imageUrl
                  : null,
              link_url: typeof item.link_url === 'string'
                ? item.link_url
                : typeof item.linkUrl === 'string'
                  ? item.linkUrl
                  : null,
              date_label: typeof item.date_label === 'string'
                ? item.date_label
                : typeof item.dateLabel === 'string'
                  ? item.dateLabel
                  : null,
              sort_order: index,
              created_at: null,
              updated_at: null,
              is_published: true,
            } satisfies FooterBlogPostRow;
          });

          const mapped = fallbackRows.map((row, index) => mapBlogRowToPost(row, index));
          const matched = mapped.find((entry) => entry.slug === normalizedSlug) ?? null;
          if (!matched) {
            setNotFound(true);
            setPost(null);
          } else {
            setPost(matched);
          }
          return;
        }

        setError(requestError instanceof Error ? requestError.message : 'Failed to load blog post.');
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadPost();

    return () => {
      active = false;
    };
  }, [normalizedSlug]);

  const canonicalUrl = useMemo(() => {
    if (typeof window === 'undefined' || !post) return undefined;
    return `${window.location.origin}${buildBlogPath(post.slug)}`;
  }, [post]);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-[980px] space-y-6 pb-10 sm:pb-12">
        <div className="h-12 w-28 animate-pulse rounded bg-muted/45" />
        <div className="overflow-hidden rounded-3xl border border-border/60 bg-card/70 shadow-card">
          <div className="h-64 animate-pulse bg-muted/45 sm:h-80 lg:h-96" />
          <div className="space-y-4 p-6 sm:p-8 lg:p-10">
            <div className="h-4 w-40 animate-pulse rounded bg-muted/55" />
            <div className="h-10 w-4/5 animate-pulse rounded bg-muted/60" />
            <div className="h-4 w-full animate-pulse rounded bg-muted/50" />
            <div className="h-4 w-full animate-pulse rounded bg-muted/50" />
            <div className="h-4 w-4/5 animate-pulse rounded bg-muted/50" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-[980px] pb-10 sm:pb-12">
        <Alert variant="destructive" aria-live="polite">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (notFound || !post) {
    return <NotFound />;
  }

  const metaDescription = post.excerpt.length > 160 ? `${post.excerpt.slice(0, 157)}...` : post.excerpt;
  const publishedDate = formatDisplayDate(post);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto w-full max-w-[980px] space-y-6 pb-10 sm:space-y-7 sm:pb-12"
    >
      <PageMeta
        title={`${post.title} | Typely Blog`}
        description={metaDescription}
        canonicalUrl={canonicalUrl}
        ogType="article"
        ogTitle={post.title}
        ogDescription={metaDescription}
        ogImage={post.imageUrl ?? undefined}
      />

      <Button asChild variant="outline" size="sm" className="h-9 rounded-lg">
        <Link to="/blog">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Blog
        </Link>
      </Button>

      <article className="overflow-hidden rounded-3xl border border-border/60 bg-card/80 shadow-card">
        <div className="relative h-64 overflow-hidden border-b border-border/60 bg-muted/40 sm:h-80 lg:h-96">
          {post.imageUrl ? (
            <img
              src={post.imageUrl}
              alt={`${post.title} featured image`}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 via-secondary/15 to-accent/10 text-primary">
              <Newspaper className="h-12 w-12" aria-hidden="true" />
            </div>
          )}
        </div>

        <div className="space-y-5 p-6 sm:p-8 lg:p-10">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground sm:text-sm">
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="h-4 w-4" aria-hidden="true" />
                {publishedDate}
              </span>
              <span aria-hidden="true">|</span>
              <span className="inline-flex items-center gap-1">
                <Clock3 className="h-4 w-4" aria-hidden="true" />
                {estimateReadTime(post.content)} min read
              </span>
            </div>

            <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {post.title}
            </h1>
          </div>

          {looksLikeHtml(post.content) ? (
            <div
              className="admin-settings-preview space-y-4 text-sm leading-8 text-muted-foreground sm:text-base"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          ) : (
            <div className="space-y-4 text-sm leading-8 text-muted-foreground sm:text-base">
              {post.content
                .split(/\n{2,}/)
                .map((paragraph) => paragraph.trim())
                .filter(Boolean)
                .map((paragraph, index) => (
                  <p key={`post-paragraph-${index}`} className="whitespace-pre-line">
                    {paragraph}
                  </p>
                ))}
            </div>
          )}
        </div>
      </article>
    </motion.div>
  );
}
