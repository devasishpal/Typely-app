import { buildCertificatePdfBuffer } from './_pdf.js';
import {
  createSupabaseServerClient,
  getQueryValue,
  isAdminUser,
  normalizeStudentName,
  requireAuthenticatedUser,
  resolveSiteUrl,
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

async function buildOnDemandCertificatePdf(supabase, certificate, req) {
  const [templateResult, profileResult] = await Promise.all([
    supabase
      .from('certificate_templates')
      .select(
        `
        id,
        background_image_url,
        template_version,
        name_x_pct,
        name_y_pct,
        wpm_x_pct,
        wpm_y_pct,
        accuracy_x_pct,
        accuracy_y_pct,
        date_x_pct,
        date_y_pct,
        certificate_id_x_pct,
        certificate_id_y_pct,
        font_family,
        font_weight,
        font_color,
        title_font_size,
        subtitle_font_size,
        body_font_size,
        name_font_size,
        wpm_font_size,
        accuracy_font_size,
        date_font_size,
        certificate_id_font_size
      `
      )
      .eq('id', certificate.template_id)
      .maybeSingle(),
    supabase.from('profiles').select('id, full_name, username').eq('id', certificate.user_id).maybeSingle(),
  ]);

  if (templateResult.error) throw templateResult.error;
  if (profileResult.error) throw profileResult.error;
  if (!templateResult.data?.background_image_url) {
    throw new Error('No certificate template background is configured.');
  }

  const verificationUrl = `${resolveSiteUrl(req)}/verify-certificate?code=${encodeURIComponent(certificate.certificate_code)}`;

  return buildCertificatePdfBuffer({
    template: templateResult.data,
    studentName: normalizeStudentName(profileResult.data),
    wpm: Number(certificate.wpm ?? 0),
    accuracy: Number(certificate.accuracy ?? 0),
    issuedAtIso: certificate.issued_at,
    certificateCode: certificate.certificate_code,
    verificationUrl,
  });
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
      .select('certificate_code, user_id, template_id, wpm, accuracy, issued_at, pdf_url')
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

    let bytes = null;
    const pdfPath = typeof data.pdf_url === 'string' ? data.pdf_url.trim() : '';

    if (pdfPath) {
      const { data: pdfBlob, error: storageError } = await supabase.storage
        .from('certificates')
        .download(pdfPath);

      if (!storageError && pdfBlob) {
        bytes = new Uint8Array(await pdfBlob.arrayBuffer());
      } else {
        console.warn(
          'Stored certificate PDF was unavailable. Regenerating on demand:',
          storageError || 'missing blob'
        );
      }
    }

    if (!bytes) {
      bytes = await buildOnDemandCertificatePdf(supabase, data, req);
    }

    sendPdf(res, bytes, `typely-certificate-${certificateCode}.pdf`);
  } catch (error) {
    console.error('Certificate download failed:', error);
    sendJson(res, 500, { error: 'Unable to prepare certificate download.' });
  }
}
