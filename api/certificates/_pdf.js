import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import QRCode from 'qrcode';

const A4_LANDSCAPE_WIDTH = 841.89;
const A4_LANDSCAPE_HEIGHT = 595.28;

const DEFAULT_CERTIFICATE_TITLE = 'CERTIFICATE OF ACHIEVEMENT';
const DEFAULT_CERTIFICATE_SUBTITLE = 'This certificate is proudly presented to';
const DEFAULT_CERTIFICATE_BODY = 'For successfully completing the Typely Typing Speed Test';

function clampNumber(value, min, max, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function sanitizeHexColor(value, fallback = '#111827') {
  if (typeof value !== 'string') return fallback;
  const normalized = value.trim();
  if (!/^#[0-9A-Fa-f]{6}$/.test(normalized)) return fallback;
  return normalized;
}

function hexToRgb(hex) {
  const cleaned = sanitizeHexColor(hex, '#111827').slice(1);
  const r = Number.parseInt(cleaned.slice(0, 2), 16) / 255;
  const g = Number.parseInt(cleaned.slice(2, 4), 16) / 255;
  const b = Number.parseInt(cleaned.slice(4, 6), 16) / 255;
  return rgb(r, g, b);
}

function normalizeFontFamily(value) {
  const raw = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (raw.includes('times')) return 'times';
  if (raw.includes('courier')) return 'courier';
  return 'helvetica';
}

function normalizeFontWeight(value) {
  const raw = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (raw === 'bold' || raw === 'semibold' || raw === 'medium') return 'bold';
  return 'normal';
}

function normalizeTemplateText(value, fallback) {
  if (typeof value !== 'string') return fallback;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : fallback;
}

function normalizeTemplate(template) {
  return {
    background_image_url: typeof template?.background_image_url === 'string' ? template.background_image_url : '',
    title_text: normalizeTemplateText(template?.title_text, DEFAULT_CERTIFICATE_TITLE),
    subtitle_text: normalizeTemplateText(template?.subtitle_text, DEFAULT_CERTIFICATE_SUBTITLE),
    body_text: normalizeTemplateText(template?.body_text, DEFAULT_CERTIFICATE_BODY),
    name_x_pct: clampNumber(template?.name_x_pct, 0, 100, 50),
    name_y_pct: clampNumber(template?.name_y_pct, 0, 100, 34),
    wpm_x_pct: clampNumber(template?.wpm_x_pct, 0, 100, 50),
    wpm_y_pct: clampNumber(template?.wpm_y_pct, 0, 100, 56),
    accuracy_x_pct: clampNumber(template?.accuracy_x_pct, 0, 100, 50),
    accuracy_y_pct: clampNumber(template?.accuracy_y_pct, 0, 100, 62),
    date_x_pct: clampNumber(template?.date_x_pct, 0, 100, 30),
    date_y_pct: clampNumber(template?.date_y_pct, 0, 100, 74),
    certificate_id_x_pct: clampNumber(template?.certificate_id_x_pct, 0, 100, 70),
    certificate_id_y_pct: clampNumber(template?.certificate_id_y_pct, 0, 100, 74),
    show_qr_code: Boolean(template?.show_qr_code),
    qr_x_pct: clampNumber(template?.qr_x_pct, 0, 100, 86),
    qr_y_pct: clampNumber(template?.qr_y_pct, 0, 100, 80),
    qr_size_pct: clampNumber(template?.qr_size_pct, 4, 40, 12),
    font_family: normalizeFontFamily(template?.font_family),
    font_weight: normalizeFontWeight(template?.font_weight),
    font_color: sanitizeHexColor(template?.font_color),
    title_font_size: clampNumber(template?.title_font_size, 8, 180, 48),
    subtitle_font_size: clampNumber(template?.subtitle_font_size, 8, 180, 22),
    body_font_size: clampNumber(template?.body_font_size, 8, 180, 20),
    name_font_size: clampNumber(template?.name_font_size, 8, 180, 52),
    wpm_font_size: clampNumber(template?.wpm_font_size, 8, 180, 24),
    accuracy_font_size: clampNumber(template?.accuracy_font_size, 8, 180, 24),
    date_font_size: clampNumber(template?.date_font_size, 8, 180, 18),
    certificate_id_font_size: clampNumber(template?.certificate_id_font_size, 8, 180, 18),
  };
}

async function fetchBinary(url) {
  if (!url || typeof url !== 'string') return null;

  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) return null;

  const bytes = new Uint8Array(await response.arrayBuffer());
  const contentType = (response.headers.get('content-type') || '').toLowerCase();
  return { bytes, contentType };
}

async function embedImage(pdfDoc, payload) {
  if (!payload) return null;

  if (payload.contentType.includes('png')) {
    return pdfDoc.embedPng(payload.bytes);
  }

  if (payload.contentType.includes('jpeg') || payload.contentType.includes('jpg')) {
    return pdfDoc.embedJpg(payload.bytes);
  }

  try {
    return await pdfDoc.embedPng(payload.bytes);
  } catch {
    return pdfDoc.embedJpg(payload.bytes);
  }
}

function drawImageCover(page, image, pageWidth, pageHeight) {
  const widthScale = pageWidth / image.width;
  const heightScale = pageHeight / image.height;
  const scale = Math.max(widthScale, heightScale);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  const drawX = (pageWidth - drawWidth) / 2;
  const drawY = (pageHeight - drawHeight) / 2;

  page.drawImage(image, {
    x: drawX,
    y: drawY,
    width: drawWidth,
    height: drawHeight,
  });
}

function yPercentToPdfY(yPercent, pageHeight, fontSize) {
  const fromTop = (clampNumber(yPercent, 0, 100, 50) / 100) * pageHeight;
  return pageHeight - fromTop - fontSize / 2;
}

function centerAlignedX(text, font, size, xPercent, pageWidth) {
  const centerX = (clampNumber(xPercent, 0, 100, 50) / 100) * pageWidth;
  const textWidth = font.widthOfTextAtSize(text, size);
  return centerX - textWidth / 2;
}

function toDisplayName(value) {
  if (typeof value !== 'string') return 'Typely Student';
  const trimmed = value.trim();
  return trimmed || 'Typely Student';
}

function formatIssuedDate(issuedAtIso) {
  const date = new Date(issuedAtIso);
  const safeDate = Number.isNaN(date.getTime()) ? new Date() : date;
  return safeDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

async function resolveFonts(pdfDoc, family) {
  if (family === 'times') {
    return Promise.all([
      pdfDoc.embedFont(StandardFonts.TimesRoman),
      pdfDoc.embedFont(StandardFonts.TimesRomanBold),
    ]);
  }

  if (family === 'courier') {
    return Promise.all([
      pdfDoc.embedFont(StandardFonts.Courier),
      pdfDoc.embedFont(StandardFonts.CourierBold),
    ]);
  }

  return Promise.all([
    pdfDoc.embedFont(StandardFonts.Helvetica),
    pdfDoc.embedFont(StandardFonts.HelveticaBold),
  ]);
}

async function buildVerificationQrPngBytes(verificationUrl) {
  if (typeof verificationUrl !== 'string' || !verificationUrl.trim()) return null;

  const dataUrl = await QRCode.toDataURL(verificationUrl.trim(), {
    errorCorrectionLevel: 'M',
    margin: 0,
    width: 1024,
    color: {
      dark: '#000000',
      light: '#FFFFFFFF',
    },
  });

  const parts = dataUrl.split(',');
  if (parts.length !== 2) return null;

  return Uint8Array.from(Buffer.from(parts[1], 'base64'));
}

export async function buildCertificatePdfBuffer(input) {
  const {
    template,
    studentName,
    wpm,
    accuracy,
    issuedAtIso,
    certificateCode,
    verificationUrl,
  } = input;

  const normalizedTemplate = normalizeTemplate(template);

  if (!normalizedTemplate.background_image_url) {
    throw new Error('No certificate template background is configured.');
  }

  const backgroundPayload = await fetchBinary(normalizedTemplate.background_image_url);
  if (!backgroundPayload) {
    throw new Error('Unable to load certificate template background image.');
  }

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([A4_LANDSCAPE_WIDTH, A4_LANDSCAPE_HEIGHT]);
  const [fontPair, backgroundImage] = await Promise.all([
    resolveFonts(pdfDoc, normalizedTemplate.font_family),
    embedImage(pdfDoc, backgroundPayload),
  ]);
  const [fontRegular, fontBold] = fontPair;

  if (!backgroundImage) {
    throw new Error('Unable to embed certificate template background image.');
  }

  drawImageCover(page, backgroundImage, A4_LANDSCAPE_WIDTH, A4_LANDSCAPE_HEIGHT);

  const color = hexToRgb(normalizedTemplate.font_color);
  const dynamicFont = normalizedTemplate.font_weight === 'bold' ? fontBold : fontRegular;
  const renderedStudentName = toDisplayName(studentName);
  const renderedWpm = Number.isFinite(Number(wpm)) ? Math.max(0, Math.round(Number(wpm))) : 0;
  const renderedAccuracy = Number.isFinite(Number(accuracy))
    ? Math.max(0, Math.min(100, Number(accuracy)))
    : 0;
  const issuedDateText = formatIssuedDate(issuedAtIso);
  const headlineY = Math.max(8, normalizedTemplate.name_y_pct - 18);
  const subtitleY = Math.max(8, normalizedTemplate.name_y_pct - 10);
  const bodyY = Math.max(8, Math.min(normalizedTemplate.wpm_y_pct, normalizedTemplate.accuracy_y_pct) - 7);

  const lines = [
    {
      text: normalizedTemplate.title_text,
      xPct: 50,
      yPct: headlineY,
      size: normalizedTemplate.title_font_size,
      font: dynamicFont,
    },
    {
      text: normalizedTemplate.subtitle_text,
      xPct: 50,
      yPct: subtitleY,
      size: normalizedTemplate.subtitle_font_size,
      font: fontRegular,
    },
    {
      text: renderedStudentName,
      xPct: normalizedTemplate.name_x_pct,
      yPct: normalizedTemplate.name_y_pct,
      size: normalizedTemplate.name_font_size,
      font: dynamicFont,
    },
    {
      text: normalizedTemplate.body_text,
      xPct: 50,
      yPct: bodyY,
      size: normalizedTemplate.body_font_size,
      font: fontRegular,
    },
    {
      text: `with a speed of ${renderedWpm} Words Per Minute`,
      xPct: normalizedTemplate.wpm_x_pct,
      yPct: normalizedTemplate.wpm_y_pct,
      size: normalizedTemplate.wpm_font_size,
      font: fontRegular,
    },
    {
      text: `and an accuracy of ${renderedAccuracy.toFixed(2)}%.`,
      xPct: normalizedTemplate.accuracy_x_pct,
      yPct: normalizedTemplate.accuracy_y_pct,
      size: normalizedTemplate.accuracy_font_size,
      font: fontRegular,
    },
    {
      text: `Date: ${issuedDateText}`,
      xPct: normalizedTemplate.date_x_pct,
      yPct: normalizedTemplate.date_y_pct,
      size: normalizedTemplate.date_font_size,
      font: fontRegular,
    },
    {
      text: `Certificate ID: ${certificateCode}`,
      xPct: normalizedTemplate.certificate_id_x_pct,
      yPct: normalizedTemplate.certificate_id_y_pct,
      size: normalizedTemplate.certificate_id_font_size,
      font: fontRegular,
    },
  ];

  for (const line of lines) {
    page.drawText(line.text, {
      x: centerAlignedX(line.text, line.font, line.size, line.xPct, A4_LANDSCAPE_WIDTH),
      y: yPercentToPdfY(line.yPct, A4_LANDSCAPE_HEIGHT, line.size),
      size: line.size,
      font: line.font,
      color,
    });
  }

  if (normalizedTemplate.show_qr_code) {
    try {
      const qrBytes = await buildVerificationQrPngBytes(verificationUrl);
      if (qrBytes) {
        const qrImage = await pdfDoc.embedPng(qrBytes);
        const qrSize = clampNumber(
          (normalizedTemplate.qr_size_pct / 100) * A4_LANDSCAPE_WIDTH,
          24,
          A4_LANDSCAPE_WIDTH * 0.4,
          96
        );
        const xCenter = (normalizedTemplate.qr_x_pct / 100) * A4_LANDSCAPE_WIDTH;
        const yCenter = A4_LANDSCAPE_HEIGHT - (normalizedTemplate.qr_y_pct / 100) * A4_LANDSCAPE_HEIGHT;
        const x = Math.min(Math.max(0, xCenter - qrSize / 2), A4_LANDSCAPE_WIDTH - qrSize);
        const y = Math.min(Math.max(0, yCenter - qrSize / 2), A4_LANDSCAPE_HEIGHT - qrSize);

        page.drawImage(qrImage, {
          x,
          y,
          width: qrSize,
          height: qrSize,
        });
      }
    } catch (error) {
      console.warn('Unable to render certificate verification QR code:', error);
    }
  }

  return pdfDoc.save();
}
