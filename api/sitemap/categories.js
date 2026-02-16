import {
  buildUrlEntry,
  createSupabaseServerClient,
  renderUrlSet,
  resolveSiteUrl,
  sendXml,
  sendXmlError,
  toLastmodDate,
} from './_utils.js';

function toCategoryName(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export default async function handler(req, res) {
  try {
    const supabase = createSupabaseServerClient();
    const baseUrl = resolveSiteUrl(req);

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
      const { data: lessons, error: lessonsError } = await supabase
        .from('lessons')
        .select('category, updated_at, created_at');

      if (lessonsError) {
        throw lessonsError;
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

    sendXml(res, renderUrlSet(entries));
  } catch (error) {
    console.error('Failed to generate sitemap-categories.xml:', error);
    sendXmlError(res, 'Unable to generate categories sitemap.');
  }
}
