import { buildCertificatePdfBuffer } from '../_pdf.js';
import {
  createSupabaseServerClient,
  formatTestName,
  isAdminUser,
  requireAuthenticatedUser,
  resolveSiteUrl,
  sendJson,
  sanitizeUuid,
} from '../_utils.js';

function sendPdf(res, bytes, fileName) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
  res.setHeader('Cache-Control', 'no-store');
  res.end(Buffer.from(bytes));
}

function resolveTemplateId(req) {
  const value = req?.query?.templateId;
  if (Array.isArray(value)) {
    return sanitizeUuid(value[0]);
  }
  return sanitizeUuid(typeof value === 'string' ? value : '');
}

function buildPreviewCertificateCode() {
  const year = new Date().getUTCFullYear();
  return `TYP-${year}-999999`;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'Method not allowed' }, { Allow: 'GET' });
    return;
  }

  try {
    const templateId = resolveTemplateId(req);
    if (!templateId) {
      sendJson(res, 400, { error: 'Valid templateId is required.' });
      return;
    }

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

    const { data: template, error } = await supabase
      .from('certificate_templates')
      .select(
        'id, name, background_image_url, title_text, show_wpm, show_accuracy, show_date, show_certificate_id, is_active'
      )
      .eq('id', templateId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!template) {
      sendJson(res, 404, { error: 'Template not found.' });
      return;
    }

    const baseUrl = resolveSiteUrl(req);
    const certificateCode = buildPreviewCertificateCode();
    const verificationUrl = `${baseUrl}/verify-certificate/${encodeURIComponent(certificateCode)}`;

    const pdfBytes = await buildCertificatePdfBuffer({
      template,
      studentName: 'Preview Student',
      testName: formatTestName('timed'),
      wpm: 72,
      accuracy: 98.5,
      issuedAtIso: new Date().toISOString(),
      certificateCode,
      verificationUrl,
      logoUrl: `${baseUrl}/android-chrome-192x192.png`,
    });

    const safeTemplateName = (template.name || 'template')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'template';

    sendPdf(res, pdfBytes, `certificate-preview-${safeTemplateName}.pdf`);
  } catch (error) {
    console.error('Template preview generation failed:', error);
    sendJson(res, 500, { error: 'Unable to generate template preview.' });
  }
}
