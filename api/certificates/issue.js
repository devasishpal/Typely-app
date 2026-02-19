import { buildCertificatePdfBuffer } from './_pdf.js';
import {
  buildLinkedInShareUrl,
  createSupabaseServerClient,
  generateUniqueCertificateCode,
  normalizeStudentName,
  parseJsonBody,
  requireAuthenticatedUser,
  resolveSiteUrl,
  sanitizeUuid,
  sendJson,
} from './_utils.js';

function mapCertificateResponse(certificate, baseUrl) {
  const code = certificate.certificate_code;
  const verificationUrl = `${baseUrl}/verify-certificate?code=${encodeURIComponent(code)}`;
  const accuracy = Number(certificate.accuracy ?? 0);
  const wpm = Number(certificate.wpm ?? 0);

  return {
    certificateCode: code,
    issuedAt: certificate.issued_at,
    wpm,
    accuracy,
    templateVersion: Number(certificate.template_version ?? 1),
    verificationUrl,
    verifyPath: `/verify-certificate?code=${encodeURIComponent(code)}`,
    downloadApiUrl: `${baseUrl}/api/certificates/download?code=${encodeURIComponent(code)}`,
    linkedInShareUrl: buildLinkedInShareUrl(verificationUrl, wpm, accuracy.toFixed(2)),
  };
}

function isMissingRelationError(error) {
  const code = typeof error?.code === 'string' ? error.code : '';
  return code === '42P01' || code === 'PGRST205';
}

function isCertificateSetupError(error) {
  if (isMissingRelationError(error)) return true;

  const messageParts = [
    typeof error?.message === 'string' ? error.message : '',
    typeof error?.details === 'string' ? error.details : '',
    typeof error?.hint === 'string' ? error.hint : '',
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (!messageParts) return false;

  if (messageParts.includes('missing supabase env vars')) return true;
  if (messageParts.includes('supabase_service_role_key')) return true;
  if (messageParts.includes('invalid api key')) return true;

  if (messageParts.includes('bucket not found') && messageParts.includes('certificates')) {
    return true;
  }

  return (
    messageParts.includes('certificate_') ||
    messageParts.includes('user_certificates') ||
    messageParts.includes('certificate_templates')
  );
}

async function getExistingCertificate(supabase, testId) {
  const { data, error } = await supabase
    .from('user_certificates')
    .select('certificate_code, wpm, accuracy, issued_at, template_version, is_revoked, revoked_at, revoked_reason')
    .eq('test_id', testId)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

async function getActiveTemplate(supabase) {
  const { data, error } = await supabase
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
    .eq('is_active', true)
    .not('background_image_url', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data?.background_image_url) return null;
  return data;
}

async function getTypingTest(supabase, testId) {
  const { data, error } = await supabase
    .from('typing_tests')
    .select('id, user_id, wpm, accuracy')
    .eq('id', testId)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

async function getProfile(supabase, userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, username')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
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

    const payload = parseJsonBody(req);
    const testId = sanitizeUuid(payload?.testId);
    if (!testId) {
      sendJson(res, 400, { error: 'Valid testId is required.' });
      return;
    }

    const baseUrl = resolveSiteUrl(req);
    const [test, template, profile] = await Promise.all([
      getTypingTest(supabase, testId),
      getActiveTemplate(supabase),
      getProfile(supabase, user.id),
    ]);

    if (!test) {
      sendJson(res, 404, { error: 'Typing test attempt not found.' });
      return;
    }

    if (test.user_id !== user.id) {
      sendJson(res, 403, { error: 'You can only issue certificates for your own test attempts.' });
      return;
    }

    const existing = await getExistingCertificate(supabase, testId);
    if (existing) {
      sendJson(res, 200, {
        issued: true,
        alreadyExisted: true,
        certificate: mapCertificateResponse(existing, baseUrl),
      });
      return;
    }

    if (!template) {
      sendJson(res, 200, {
        issued: false,
        reason: 'CERTIFICATE_TEMPLATE_NOT_CONFIGURED',
        message: 'No certificate template uploaded.',
      });
      return;
    }

    const wpm = Number.isFinite(Number(test.wpm)) ? Math.max(0, Math.round(Number(test.wpm))) : 0;
    const accuracy = Number.isFinite(Number(test.accuracy))
      ? Math.max(0, Math.min(100, Number(test.accuracy)))
      : 0;
    const issuedAt = new Date().toISOString();
    const certificateCode = await generateUniqueCertificateCode(supabase, issuedAt);
    const verificationUrl = `${baseUrl}/verify-certificate?code=${encodeURIComponent(certificateCode)}`;
    const dateSegment = issuedAt.slice(0, 10).replace(/-/g, '');
    const storagePath = `${user.id}/${dateSegment}/typely-certificate-${certificateCode}.pdf`;
    const templateVersion = Number(template.template_version ?? 1);

    const pdfBytes = await buildCertificatePdfBuffer({
      template,
      studentName: normalizeStudentName(profile),
      wpm,
      accuracy,
      issuedAtIso: issuedAt,
      certificateCode,
      verificationUrl,
    });

    const uploadResult = await supabase.storage
      .from('certificates')
      .upload(storagePath, pdfBytes, {
        contentType: 'application/pdf',
        cacheControl: '31536000',
        upsert: false,
      });

    if (uploadResult.error) {
      throw uploadResult.error;
    }

    const insertPayload = {
      certificate_code: certificateCode,
      user_id: user.id,
      test_id: test.id,
      template_id: template.id,
      template_version: templateVersion,
      wpm,
      accuracy: Number(accuracy.toFixed(2)),
      issued_at: issuedAt,
      pdf_url: storagePath,
      verification_url: verificationUrl,
    };

    const { data: inserted, error: insertError } = await supabase
      .from('user_certificates')
      .insert(insertPayload)
      .select('certificate_code, wpm, accuracy, issued_at, template_version, is_revoked, revoked_at, revoked_reason')
      .maybeSingle();

    if (insertError) {
      const code = (insertError.code || '').toString();
      if (code === '23505') {
        const duplicate = await getExistingCertificate(supabase, testId);
        if (duplicate) {
          sendJson(res, 200, {
            issued: true,
            alreadyExisted: true,
            certificate: mapCertificateResponse(duplicate, baseUrl),
          });
          return;
        }
      }

      await supabase.storage.from('certificates').remove([storagePath]).catch(() => null);
      throw insertError;
    }

    sendJson(res, 201, {
      issued: true,
      alreadyExisted: false,
      certificate: mapCertificateResponse(inserted, baseUrl),
    });
  } catch (error) {
    console.error('Certificate issuance failed:', error);

    if (isCertificateSetupError(error)) {
      sendJson(res, 200, {
        issued: false,
        reason: 'CERTIFICATE_SYSTEM_NOT_READY',
        message: 'Certificate generation is not configured yet. Your typing test was saved successfully.',
      });
      return;
    }

    sendJson(res, 200, {
      issued: false,
      reason: 'CERTIFICATE_ISSUE_FAILED',
      message: 'Certificate generation is temporarily unavailable. Your typing test was saved successfully.',
    });
  }
}
