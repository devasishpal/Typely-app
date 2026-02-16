import {
  buildUrlEntry,
  createSupabaseServerClient,
  renderUrlSet,
  resolveSiteUrl,
  sendXml,
  sendXmlError,
  toLastmodDate,
} from './_utils';

function resolvePublicProfilePathTemplate() {
  const template = process.env.SITEMAP_PUBLIC_PROFILE_PATH_TEMPLATE;
  if (!template || typeof template !== 'string') return null;

  const normalized = template.trim();
  if (!normalized.includes('{username}')) return null;
  return normalized.startsWith('/') ? normalized : `/${normalized}`;
}

export default async function handler(req: any, res: any) {
  try {
    const supabase = createSupabaseServerClient();
    const baseUrl = resolveSiteUrl(req);
    const publicProfilePathTemplate = resolvePublicProfilePathTemplate();

    if (!publicProfilePathTemplate) {
      sendXml(res, renderUrlSet([]));
      return;
    }

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
        const userPath = publicProfilePathTemplate.replace(
          '{username}',
          encodeURIComponent(username)
        );

        return buildUrlEntry(baseUrl, userPath, {
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
