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

    const [
      totalIssuedResult,
      totalRevokedResult,
      activeTemplatesResult,
      activeRuleResult,
      topEarnersResult,
      recentCertificatesResult,
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
      supabase.rpc('get_top_certificate_earners', { p_limit: 10 }),
      supabase
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
        .limit(40),
    ]);

    if (totalIssuedResult.error) throw totalIssuedResult.error;
    if (totalRevokedResult.error) throw totalRevokedResult.error;
    if (activeTemplatesResult.error) throw activeTemplatesResult.error;
    if (activeRuleResult.error) throw activeRuleResult.error;
    if (topEarnersResult.error) throw topEarnersResult.error;
    if (recentCertificatesResult.error) throw recentCertificatesResult.error;

    const topEarners = Array.isArray(topEarnersResult.data)
      ? topEarnersResult.data.map((row) => ({
          userId: row.user_id,
          username: row.username || 'Member',
          fullName: row.full_name || null,
          certificateCount: Number(row.certificate_count ?? 0),
        }))
      : [];

    const recentCertificates = Array.isArray(recentCertificatesResult.data)
      ? recentCertificatesResult.data.map((row) => ({
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

    sendJson(res, 200, {
      totals: {
        totalIssued: Number(totalIssuedResult.count ?? 0),
        totalRevoked: Number(totalRevokedResult.count ?? 0),
        activeTemplates: Number(activeTemplatesResult.count ?? 0),
      },
      activeRule: activeRuleResult.data
        ? {
            minimumWpm: Number(activeRuleResult.data.minimum_wpm ?? 0),
            minimumAccuracy: Number(activeRuleResult.data.minimum_accuracy ?? 0),
            testType: activeRuleResult.data.test_type || 'timed',
            isEnabled: Boolean(activeRuleResult.data.is_enabled),
          }
        : null,
      topEarners,
      recentCertificates,
    });
  } catch (error) {
    console.error('Admin certificate overview failed:', error);
    sendJson(res, 500, { error: 'Unable to load certificate overview.' });
  }
}
