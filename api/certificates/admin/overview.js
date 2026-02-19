import {
  createSupabaseServerClient,
  formatTestName,
  isAdminUser,
  requireAuthenticatedUser,
  sendJson,
} from '../_utils.js';

function formatStudentName(profile) {
  const row = Array.isArray(profile) ? profile[0] : profile;
  const fullName = row?.full_name?.trim();
  if (fullName) return fullName;
  const username = row?.username?.trim();
  if (username) return username;
  return 'Typely Student';
}

function buildEmptyOverview() {
  return {
    totals: {
      totalIssued: 0,
      totalRevoked: 0,
      activeTemplates: 0,
    },
    activeRule: null,
    topEarners: [],
    recentCertificates: [],
  };
}

function mapRecentCertificates(rows) {
  return Array.isArray(rows)
    ? rows.map((row) => ({
        certificateCode: row.certificate_code,
        studentName: formatStudentName(row.profiles),
        testName: formatTestName(
          Array.isArray(row.typing_tests) ? row.typing_tests[0]?.test_type : row.typing_tests?.test_type
        ),
        wpm: Number(row.wpm ?? 0),
        accuracy: Number(row.accuracy ?? 0),
        issuedAt: row.issued_at,
        isRevoked: Boolean(row.is_revoked),
        revokedAt: row.revoked_at,
        revokedReason: row.revoked_reason || null,
      }))
    : [];
}

async function fetchTopEarners(supabase) {
  const rpcResult = await supabase.rpc('get_top_certificate_earners', { p_limit: 10 });
  if (!rpcResult.error) {
    return Array.isArray(rpcResult.data)
      ? rpcResult.data.map((row) => ({
          userId: row.user_id,
          username: row.username || 'Member',
          fullName: row.full_name || null,
          certificateCount: Number(row.certificate_count ?? 0),
        }))
      : [];
  }

  console.warn('Top earners RPC unavailable, using fallback aggregation:', rpcResult.error);

  const { data: issuedRows, error: issuedError } = await supabase
    .from('user_certificates')
    .select('user_id, issued_at');

  if (issuedError) {
    console.warn('Fallback top earners query failed:', issuedError);
    return [];
  }

  const statsByUser = new Map();
  for (const row of Array.isArray(issuedRows) ? issuedRows : []) {
    const userId = typeof row.user_id === 'string' ? row.user_id : '';
    if (!userId) continue;

    const current = statsByUser.get(userId);
    const issuedAtTime = Number.isNaN(Date.parse(row.issued_at || ''))
      ? 0
      : Date.parse(row.issued_at);

    if (!current) {
      statsByUser.set(userId, {
        count: 1,
        lastIssuedAtTime: issuedAtTime,
      });
      continue;
    }

    current.count += 1;
    if (issuedAtTime > current.lastIssuedAtTime) {
      current.lastIssuedAtTime = issuedAtTime;
    }
  }

  const ranked = Array.from(statsByUser.entries())
    .map(([userId, stats]) => ({
      userId,
      certificateCount: Number(stats.count ?? 0),
      lastIssuedAtTime: Number(stats.lastIssuedAtTime ?? 0),
    }))
    .sort((a, b) => {
      if (b.certificateCount !== a.certificateCount) {
        return b.certificateCount - a.certificateCount;
      }
      return b.lastIssuedAtTime - a.lastIssuedAtTime;
    })
    .slice(0, 10);

  if (ranked.length === 0) return [];

  const userIds = ranked.map((row) => row.userId);
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, username, full_name')
    .in('id', userIds);

  if (profilesError) {
    console.warn('Fallback top earners profile lookup failed:', profilesError);
  }

  const profileById = new Map(
    (Array.isArray(profiles) ? profiles : []).map((profile) => [profile.id, profile])
  );

  return ranked.map((row) => {
    const profile = profileById.get(row.userId);
    const username = typeof profile?.username === 'string' ? profile.username.trim() : '';
    const fullName = typeof profile?.full_name === 'string' ? profile.full_name.trim() : '';

    return {
      userId: row.userId,
      username: username || 'Member',
      fullName: fullName || null,
      certificateCount: row.certificateCount,
    };
  });
}

async function fetchRecentCertificates(supabase) {
  const joinedResult = await supabase
    .from('user_certificates')
    .select(
      `
        certificate_code,
        wpm,
        accuracy,
        issued_at,
        is_revoked,
        revoked_at,
        revoked_reason,
        profiles(full_name, username),
        typing_tests(test_type)
      `
    )
    .order('issued_at', { ascending: false })
    .limit(40);

  if (!joinedResult.error) {
    return mapRecentCertificates(joinedResult.data);
  }

  console.warn('Recent certificate join query failed, using fallback query:', joinedResult.error);

  const fallbackResult = await supabase
    .from('user_certificates')
    .select(
      `
        certificate_code,
        wpm,
        accuracy,
        issued_at,
        is_revoked,
        revoked_at,
        revoked_reason
      `
    )
    .order('issued_at', { ascending: false })
    .limit(40);

  if (fallbackResult.error) {
    throw fallbackResult.error;
  }

  return mapRecentCertificates(fallbackResult.data);
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'Method not allowed' }, { Allow: 'GET' });
    return;
  }

  try {
    const supabase = createSupabaseServerClient();
    const user = await requireAuthenticatedUser(req, supabase);
    if (!user) {
      sendJson(res, 401, { error: 'Authentication required.' });
      return;
    }

    const isAdmin = await isAdminUser(supabase, user.id);
    if (!isAdmin) {
      sendJson(res, 403, { error: 'Admin access required.' });
      return;
    }

    const overview = buildEmptyOverview();

    const [
      totalIssuedResult,
      totalRevokedResult,
      activeTemplatesResult,
      activeRuleResult,
    ] = await Promise.all([
      supabase.from('user_certificates').select('id', { count: 'exact', head: true }),
      supabase
        .from('user_certificates')
        .select('id', { count: 'exact', head: true })
        .eq('is_revoked', true),
      supabase
        .from('certificate_templates')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true),
      supabase
        .from('certificate_rules')
        .select('id, minimum_wpm, minimum_accuracy, test_type, is_enabled')
        .eq('is_enabled', true)
        .limit(1)
        .maybeSingle(),
    ]);

    if (!totalIssuedResult.error) {
      overview.totals.totalIssued = Number(totalIssuedResult.count ?? 0);
    } else {
      console.warn('Certificate overview count query failed (issued):', totalIssuedResult.error);
    }

    if (!totalRevokedResult.error) {
      overview.totals.totalRevoked = Number(totalRevokedResult.count ?? 0);
    } else {
      console.warn('Certificate overview count query failed (revoked):', totalRevokedResult.error);
    }

    if (!activeTemplatesResult.error) {
      overview.totals.activeTemplates = Number(activeTemplatesResult.count ?? 0);
    } else {
      console.warn(
        'Certificate overview count query failed (active templates):',
        activeTemplatesResult.error
      );
    }

    if (!activeRuleResult.error && activeRuleResult.data) {
      overview.activeRule = {
        minimumWpm: Number(activeRuleResult.data.minimum_wpm ?? 0),
        minimumAccuracy: Number(activeRuleResult.data.minimum_accuracy ?? 0),
        testType: activeRuleResult.data.test_type || 'timed',
        isEnabled: Boolean(activeRuleResult.data.is_enabled),
      };
    } else if (activeRuleResult.error) {
      console.warn('Certificate overview active rule query failed:', activeRuleResult.error);
    }

    const [topEarners, recentCertificates] = await Promise.all([
      fetchTopEarners(supabase).catch((error) => {
        console.warn('Certificate overview top earners fetch failed:', error);
        return [];
      }),
      fetchRecentCertificates(supabase).catch((error) => {
        console.warn('Certificate overview recent certificates fetch failed:', error);
        return [];
      }),
    ]);

    overview.topEarners = topEarners;
    overview.recentCertificates = recentCertificates;

    sendJson(res, 200, overview);
  } catch (error) {
    console.error('Admin certificate overview failed:', error);
    sendJson(res, 200, buildEmptyOverview());
  }
}
