import {
  createSupabaseServerClient,
  isAdminUser,
  parseJsonBody,
  requireAuthenticatedUser,
  sanitizeCertificateCode,
  sendJson,
} from '../_utils.js';

function sanitizeReason(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, 500);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' }, { Allow: 'POST' });
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

    const body = parseJsonBody(req);
    const certificateCode = sanitizeCertificateCode(body?.certificateCode, { allowLegacy: true });
    if (!certificateCode) {
      sendJson(res, 400, { error: 'Valid certificate code is required.' });
      return;
    }

    const revoke = body?.revoke !== false;
    const now = new Date().toISOString();
    const reason = sanitizeReason(body?.reason);

    const updates = revoke
      ? {
          is_revoked: true,
          revoked_at: now,
          revoked_reason: reason,
        }
      : {
          is_revoked: false,
          revoked_at: null,
          revoked_reason: null,
        };

    const { data, error } = await supabase
      .from('user_certificates')
      .update(updates)
      .eq('certificate_code', certificateCode)
      .select('certificate_code, is_revoked, revoked_at, revoked_reason')
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      sendJson(res, 404, { error: 'Certificate not found.' });
      return;
    }

    sendJson(res, 200, {
      certificateCode: data.certificate_code,
      isRevoked: Boolean(data.is_revoked),
      revokedAt: data.revoked_at,
      revokedReason: data.revoked_reason || null,
    });
  } catch (error) {
    console.error('Certificate revoke/update failed:', error);
    sendJson(res, 500, { error: 'Unable to update certificate status.' });
  }
}
