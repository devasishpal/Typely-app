import { buildCertificatePdfBuffer } from '../_pdf.js';
import {
  formatTestName,
  parseJsonBody,
  resolveSiteUrl,
  sendJson,
} from '../_utils.js';

function sendPdf(res, bytes, fileName) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
  res.setHeader('Cache-Control', 'no-store');
  res.end(Buffer.from(bytes));
}

function buildPreviewCertificateCode() {
  const year = new Date().getUTCFullYear();
  return `TYP-${year}-999999`;
}

function normalizeText(value, fallback = '') {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
}

function normalizeTemplateForPreview(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const name = normalizeText(raw.name, 'Template Preview');
  const titleText = normalizeText(raw.title_text, 'Certificate of Typing Excellence');
  const backgroundImageUrl = normalizeText(raw.background_image_url, '');

  return {
    name,
    title_text: titleText,
    background_image_url: backgroundImageUrl || null,
    show_wpm: raw.show_wpm !== false,
    show_accuracy: raw.show_accuracy !== false,
    show_date: raw.show_date !== false,
    show_certificate_id: raw.show_certificate_id !== false,
    is_active: Boolean(raw.is_active),
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' }, { Allow: 'POST' });
    return;
  }

  try {
    const body = parseJsonBody(req);
    const template = normalizeTemplateForPreview(body?.template);
    if (!template) {
      sendJson(res, 400, { error: 'Valid template payload is required.' });
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
