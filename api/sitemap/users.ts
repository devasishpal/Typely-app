import {
  buildUrlEntry,
  createSupabaseServerClient,
  renderUrlSet,
  resolveSiteUrl,
  sendXml,
  sendXmlError,
  toLastmodDate,
} from './_utils';

export default async function handler(req: any, res: any) {
  try {
    const supabase = createSupabaseServerClient();
    const baseUrl = resolveSiteUrl(req);

    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('username, role, updated_at, created_at')
      .not('username', 'is', null);

    if (error) {
      throw error;
    }

    const entries = (Array.isArray(profiles) ? profiles : [])
      .filter((profile) => profile.role !== 'admin')
      .map((profile) => {
        const username = typeof profile.username === 'string' ? profile.username.trim() : '';
        if (!username) return null;

        return buildUrlEntry(baseUrl, `/users/${encodeURIComponent(username)}`, {
          lastmod: toLastmodDate(profile.updated_at, profile.created_at),
          changefreq: 'weekly',
          priority: 0.4,
        });
      })
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

    sendXml(res, renderUrlSet(entries));
  } catch (error) {
    console.error('Failed to generate sitemap-users.xml:', error);
    sendXmlError(res, 'Unable to generate users sitemap.');
  }
}
