import {
  createSupabaseServerClient,
  getQueryValue,
  isAdminUser,
  requireAuthenticatedUser,
  sanitizeCertificateCode,
  sendJson,
} from './_utils.js';

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

    const certificateCode = sanitizeCertificateCode(getQueryValue(req, 'code'));
    if (!certificateCode) {
      sendJson(res, 400, { error: 'Valid certificate code is required.' });
      return;
    }

    const { data, error } = await supabase
      .from('user_certificates')
      .select('certificate_code, user_id, pdf_url')
      .eq('certificate_code', certificateCode)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      sendJson(res, 404, { error: 'Certificate not found.' });
      return;
    }

    const isOwner = data.user_id === user.id;
    const isAdmin = !isOwner ? await isAdminUser(supabase, user.id) : false;
    if (!isOwner && !isAdmin) {
      sendJson(res, 403, { error: 'You are not allowed to download this certificate.' });
      return;
    }

    const { data: signed, error: signedError } = await supabase.storage
      .from('certificates')
      .createSignedUrl(data.pdf_url, 90);

    if (signedError || !signed?.signedUrl) {
      throw signedError || new Error('Unable to create signed URL.');
    }

    sendJson(res, 200, {
      downloadUrl: signed.signedUrl,
      expiresInSeconds: 90,
    });
  } catch (error) {
    console.error('Certificate download URL generation failed:', error);
    sendJson(res, 500, { error: 'Unable to prepare certificate download.' });
  }
}
