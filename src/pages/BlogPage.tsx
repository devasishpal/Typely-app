import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { supabase } from '@/db/supabase';
import PageMeta from '@/components/common/PageMeta';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  buildBlogPath,
  mapBlogRowToPost,
  type FooterBlogPostRow,
  type PublicBlogPost,
} from '@/lib/blogPosts';
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  Clock3,
  Newspaper,
  Sparkles,
} from 'lucide-react';

const BLOG_SELECT_FIELDS =
  'id, title, excerpt, content, image_url, link_url, date_label, sort_order, created_at, updated_at, is_published';

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

function formatPostDate(post: PublicBlogPost) {
  if (post.dateLabel) return post.dateLabel;
  const source = post.createdAt || post.updatedAt;
  if (!source) return null;
  const parsed = new Date(source);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function estimateReadTime(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

export default function BlogPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [posts, setPosts] = useState<PublicBlogPost[]>([]);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const { data, error: requestError } = await (supabase.from('footer_blog_posts' as any))
        .select(BLOG_SELECT_FIELDS)
        .eq('is_published', true)
        .order('sort_order', { ascending: true })
        .order('updated_at', { ascending: false });

      if (requestError) throw requestError;

      const rows = Array.isArray(data) ? (data as FooterBlogPostRow[]) : [];
      setPosts(rows.map((row, index) => mapBlogRowToPost(row, index)));
    } catch (requestError) {
      if (isMissingRelationError(requestError)) {
        // Fallback for environments where footer_blog_posts has not been migrated yet.
        const { data } = await supabase
          .from('site_settings')
          .select('blog')
          .order('updated_at', { ascending: false })
          .order('id', { ascending: false })
          .limit(1)
          .maybeSingle();

        const raw = typeof data?.blog === 'string' ? data.blog : '';
        const parsed = safeJson(raw);
        if (Array.isArray(parsed)) {
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
          setPosts(fallbackRows.map((row, index) => mapBlogRowToPost(row, index)));
        } else {
          setPosts([]);
        }
      } else {
        setError(requestError instanceof Error ? requestError.message : 'Failed to load blog posts.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  useEffect(() => {
    const channel = supabase
      .channel('public-blog-posts-feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'footer_blog_posts' },
        () => {
          void loadPosts();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadPosts]);

  const canonicalUrl = useMemo(() => {
    if (typeof window === 'undefined') return undefined;
    return `${window.location.origin}/blog`;
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto w-full max-w-[1180px] space-y-7 pb-10 sm:space-y-9 sm:pb-12"
    >
      <PageMeta
        title="Blog | Typely"
        description="Explore the latest Typely blog posts, typing strategies, and platform updates."
        canonicalUrl={canonicalUrl}
      />

      <section className="relative isolate overflow-hidden rounded-3xl border border-border/65 bg-card/85 px-5 py-8 shadow-card backdrop-blur-sm sm:px-8 sm:py-10 lg:px-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,hsl(var(--primary)/0.16)_0%,transparent_50%),radial-gradient(circle_at_85%_30%,hsl(var(--secondary)/0.15)_0%,transparent_46%),radial-gradient(circle_at_50%_90%,hsl(var(--accent)/0.12)_0%,transparent_45%)]"
        />
        <div className="relative z-10 space-y-4">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Latest Stories
          </span>
          <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Typely Blog
          </h1>
          <p className="max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base sm:leading-8">
            Discover typing tips, product updates, and practical learning strategies.
          </p>
        </div>
      </section>

      {error ? (
        <Alert variant="destructive" aria-live="polite">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={`blog-skeleton-${index}`}
              className="overflow-hidden rounded-2xl border border-border/60 bg-card/70 shadow-card sm:aspect-square"
            >
              <div className="h-40 animate-pulse bg-muted/45 sm:h-[44%]" />
              <div className="space-y-3 p-5">
                <div className="h-3 w-24 animate-pulse rounded bg-muted/55" />
                <div className="h-5 w-4/5 animate-pulse rounded bg-muted/60" />
                <div className="h-3 w-full animate-pulse rounded bg-muted/50" />
                <div className="h-3 w-5/6 animate-pulse rounded bg-muted/50" />
                <div className="pt-2">
                  <div className="h-9 w-28 animate-pulse rounded-md bg-muted/55" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-2xl border border-border/65 bg-card/75 p-8 text-center text-muted-foreground shadow-card">
          No blogs available yet.
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {posts.map((post, index) => {
            const dateText = formatPostDate(post);

            return (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.35, delay: index * 0.04 }}
                className="overflow-hidden rounded-2xl border border-border/60 bg-card/80 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/35 hover:shadow-hover sm:aspect-square"
              >
                <div className="relative h-40 overflow-hidden border-b border-border/60 bg-muted/40 sm:h-[44%]">
                  {post.imageUrl ? (
                    <img
                      src={post.imageUrl}
                      alt={`${post.title} featured image`}
                      className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.03]"
                      loading="lazy"
                    />
                  ) : (
                    <div className={cn('flex h-full w-full items-center justify-center bg-gradient-to-br', index % 2 === 0 ? 'from-primary/20 via-secondary/15 to-accent/10' : 'from-secondary/20 via-primary/15 to-accent/10')}>
                      <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-primary/30 bg-background/75 text-primary shadow-card">
                        <Newspaper className="h-5 w-5" aria-hidden="true" />
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex h-full flex-col p-5">
                  <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                      {estimateReadTime(post.content)} min read
                    </span>
                    {dateText ? <span aria-hidden="true">|</span> : null}
                    {dateText ? <span>{dateText}</span> : null}
                  </div>

                  <h2 className="line-clamp-2 text-lg font-semibold leading-snug text-foreground">{post.title}</h2>
                  <p className="mt-3 line-clamp-4 text-sm leading-7 text-muted-foreground">{post.excerpt}</p>

                  <div className="mt-auto pt-5">
                    <Button asChild type="button" variant="outline" size="sm" className="h-9 rounded-lg">
                      <Link to={buildBlogPath(post.slug)} aria-label={`Read more about ${post.title}`}>
                        Read More
                        <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      )}

      <div className="rounded-2xl border border-border/65 bg-card/70 px-5 py-4 shadow-card sm:px-7 sm:py-5">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <span>New posts are synced automatically from the Admin panel.</span>
          <Link to="/contact" className="inline-flex items-center gap-1 font-medium text-primary">
            Contact Typely
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
