import {
  createSupabaseServerClient,
  getQueryValue,
  isAdminUser,
  requireAuthenticatedUser,
  sanitizeCertificateCode,
  sendJson,
} from './_utils.js';

function sendPdf(res, bytes, fileName) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.setHeader('Cache-Control', 'no-store');
  res.end(Buffer.from(bytes));
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

    const certificateCode = sanitizeCertificateCode(getQueryValue(req, 'code'), { allowLegacy: true });
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
    if (!data?.pdf_url) {
      sendJson(res, 404, { error: 'Certificate not found.' });
      return;
    }

    const isOwner = data.user_id === user.id;
    const isAdmin = !isOwner ? await isAdminUser(supabase, user.id) : false;
    if (!isOwner && !isAdmin) {
      sendJson(res, 403, { error: 'You are not allowed to download this certificate.' });
      return;
    }

    const { data: pdfBlob, error: storageError } = await supabase.storage
      .from('certificates')
      .download(data.pdf_url);

    if (storageError || !pdfBlob) {
      throw storageError || new Error('Unable to load certificate PDF.');
    }

    const bytes = new Uint8Array(await pdfBlob.arrayBuffer());
    sendPdf(res, bytes, `typely-certificate-${certificateCode}.pdf`);
  } catch (error) {
    console.error('Certificate download failed:', error);
    sendJson(res, 500, { error: 'Unable to prepare certificate download.' });
  }
}
