import { createSupabaseServerClient, resolveSiteUrl } from './sitemap/_utils.js';

const LESSON_UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getQueryValue(value) {
  if (Array.isArray(value)) {
    return typeof value[0] === 'string' ? value[0].trim() : '';
  }
  return typeof value === 'string' ? value.trim() : '';
}

export default async function handler(req, res) {
  const lessonId = getQueryValue(req?.query?.id);
  if (!lessonId || !LESSON_UUID_PATTERN.test(lessonId)) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Lesson not found.');
    return;
  }

  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from('lessons')
      .select('slug')
      .eq('id', lessonId)
      .maybeSingle();

    if (error || !data?.slug) {
      if (error) {
        console.error('Failed to resolve lesson slug for UUID redirect:', error);
      }
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end('Lesson not found.');
      return;
    }

    const destination = `${resolveSiteUrl(req)}/lesson/${encodeURIComponent(data.slug)}`;
    res.statusCode = 301;
    res.setHeader('Location', destination);
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.end();
  } catch (error) {
    console.error('Unexpected lesson UUID redirect error:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Unable to resolve lesson URL.');
  }
}
