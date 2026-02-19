import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';

const PAGE_WIDTH = 1120;
const PAGE_HEIGHT = 790;

function centerTextX(text, font, size, width) {
  const textWidth = font.widthOfTextAtSize(text, size);
  return (width - textWidth) / 2;
}

function toTitleCase(value) {
  return value
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}

async function fetchBinary(url) {
  if (!url || typeof url !== 'string') return null;

  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const contentType = response.headers.get('content-type') || '';
    const bytes = new Uint8Array(await response.arrayBuffer());
    return {
      bytes,
      contentType: contentType.toLowerCase(),
    };
  } catch {
    return null;
  }
}

async function embedImage(pdfDoc, payload) {
  if (!payload) return null;

  try {
    if (payload.contentType.includes('png')) {
      return await pdfDoc.embedPng(payload.bytes);
    }
    if (payload.contentType.includes('jpeg') || payload.contentType.includes('jpg')) {
      return await pdfDoc.embedJpg(payload.bytes);
    }

    // Content-type can be missing for static assets.
    try {
      return await pdfDoc.embedPng(payload.bytes);
    } catch {
      return await pdfDoc.embedJpg(payload.bytes);
    }
  } catch {
    return null;
  }
}

export async function buildCertificatePdfBuffer(input) {
  const {
    template,
    studentName,
    testName,
    wpm,
    accuracy,
    issuedAtIso,
    certificateCode,
    verificationUrl,
    logoUrl,
  } = input;

  const issuedAt = new Date(issuedAtIso);
  const issuedDateText = Number.isNaN(issuedAt.getTime())
    ? new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : issuedAt.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

  const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
    width: 220,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#111827',
      light: '#ffffff',
    },
  });

  const qrBase64 = qrDataUrl.replace(/^data:image\/png;base64,/, '');
  const qrBytes = Uint8Array.from(Buffer.from(qrBase64, 'base64'));

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

  const [fontRegular, fontBold, qrImage, backgroundPayload, logoPayload] = await Promise.all([
    pdfDoc.embedFont(StandardFonts.Helvetica),
    pdfDoc.embedFont(StandardFonts.HelveticaBold),
    pdfDoc.embedPng(qrBytes),
    fetchBinary(template.background_image_url),
    fetchBinary(logoUrl),
  ]);

  const backgroundImage = await embedImage(pdfDoc, backgroundPayload);
  const logoImage = await embedImage(pdfDoc, logoPayload);

  // Base background.
  page.drawRectangle({
    x: 0,
    y: 0,
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
    color: rgb(0.96, 0.97, 0.99),
  });

  if (backgroundImage) {
    page.drawImage(backgroundImage, {
      x: 0,
      y: 0,
      width: PAGE_WIDTH,
      height: PAGE_HEIGHT,
      opacity: 0.22,
    });
  }

  // Certificate surface.
  page.drawRectangle({
    x: 32,
    y: 32,
    width: PAGE_WIDTH - 64,
    height: PAGE_HEIGHT - 64,
    color: rgb(1, 1, 1),
  });

  page.drawRectangle({
    x: 44,
    y: 44,
    width: PAGE_WIDTH - 88,
    height: PAGE_HEIGHT - 88,
    borderColor: rgb(0.11, 0.36, 0.77),
    borderWidth: 2,
  });

  if (logoImage) {
    const size = 60;
    page.drawImage(logoImage, {
      x: PAGE_WIDTH / 2 - size / 2,
      y: PAGE_HEIGHT - 130,
      width: size,
      height: size,
    });
  }

  const title = template.title_text?.trim() || 'Certificate of Typing Excellence';
  page.drawText(title.toUpperCase(), {
    x: centerTextX(title.toUpperCase(), fontBold, 34, PAGE_WIDTH),
    y: PAGE_HEIGHT - 190,
    size: 34,
    font: fontBold,
    color: rgb(0.09, 0.17, 0.32),
  });

  page.drawText('This certificate is proudly awarded to', {
    x: centerTextX('This certificate is proudly awarded to', fontRegular, 16, PAGE_WIDTH),
    y: PAGE_HEIGHT - 240,
    size: 16,
    font: fontRegular,
    color: rgb(0.29, 0.33, 0.39),
  });

  const normalizedStudent = toTitleCase(studentName.trim()) || 'Typely Student';
  page.drawText(normalizedStudent, {
    x: centerTextX(normalizedStudent, fontBold, 42, PAGE_WIDTH),
    y: PAGE_HEIGHT - 300,
    size: 42,
    font: fontBold,
    color: rgb(0.08, 0.16, 0.28),
  });

  page.drawText(`For outstanding performance in ${testName}`, {
    x: centerTextX(`For outstanding performance in ${testName}`, fontRegular, 16, PAGE_WIDTH),
    y: PAGE_HEIGHT - 344,
    size: 16,
    font: fontRegular,
    color: rgb(0.29, 0.33, 0.39),
  });

  let metaY = PAGE_HEIGHT - 410;
  const metaLines = [];
  if (template.show_wpm) metaLines.push(`Speed: ${wpm} WPM`);
  if (template.show_accuracy) metaLines.push(`Accuracy: ${accuracy.toFixed(2)}%`);
  if (template.show_date) metaLines.push(`Issued: ${issuedDateText}`);
  if (template.show_certificate_id) metaLines.push(`Certificate ID: ${certificateCode}`);

  for (const line of metaLines) {
    page.drawText(line, {
      x: centerTextX(line, fontRegular, 15, PAGE_WIDTH),
      y: metaY,
      size: 15,
      font: fontRegular,
      color: rgb(0.19, 0.23, 0.29),
    });
    metaY -= 28;
  }

  // Signature line.
  page.drawLine({
    start: { x: 120, y: 135 },
    end: { x: 330, y: 135 },
    thickness: 1,
    color: rgb(0.73, 0.75, 0.8),
  });
  page.drawText('Typely Certification Board', {
    x: 120,
    y: 112,
    size: 12,
    font: fontRegular,
    color: rgb(0.29, 0.33, 0.39),
  });

  // QR container with white padding for scan reliability.
  const qrSize = 128;
  const qrPadding = 12;
  const qrX = PAGE_WIDTH - 210;
  const qrY = 86;

  page.drawRectangle({
    x: qrX - qrPadding,
    y: qrY - qrPadding,
    width: qrSize + qrPadding * 2,
    height: qrSize + qrPadding * 2,
    color: rgb(1, 1, 1),
    borderColor: rgb(0.86, 0.88, 0.92),
    borderWidth: 1,
  });

  page.drawImage(qrImage, {
    x: qrX,
    y: qrY,
    width: qrSize,
    height: qrSize,
  });

  page.drawText('Scan to verify', {
    x: qrX + 14,
    y: qrY - 20,
    size: 10,
    font: fontRegular,
    color: rgb(0.29, 0.33, 0.39),
  });

  return pdfDoc.save();
}
