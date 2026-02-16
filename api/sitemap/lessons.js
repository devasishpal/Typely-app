import {
  buildUrlEntry,
  createSupabaseServerClient,
  renderUrlSet,
  resolveSiteUrl,
  sendXml,
  sendXmlError,
  toLastmodDate,
} from './_utils.js';

export default async function handler(req, res) {
  try {
    const supabase = createSupabaseServerClient();
    const baseUrl = resolveSiteUrl(req);

    const { data: lessons, error } = await supabase
      .from('lessons')
      .select('id, updated_at, created_at')
      .order('order_index', { ascending: true });

    if (error) {
      throw error;
    }

    const rows = Array.isArray(lessons) ? lessons : [];
    const entries = rows
      .map((lesson) => {
        const lessonId = typeof lesson.id === 'string' ? lesson.id : '';
        if (!lessonId) return null;

        return buildUrlEntry(baseUrl, `/lesson/${lessonId}`, {
          lastmod: toLastmodDate(lesson.updated_at, lesson.created_at),
          changefreq: 'weekly',
          priority: 0.8,
        });
      })
      .filter((entry) => Boolean(entry));

    sendXml(res, renderUrlSet(entries));
  } catch (error) {
    console.error('Failed to generate sitemap-lessons.xml:', error);
    sendXmlError(res, 'Unable to generate lessons sitemap.');
  }
}
