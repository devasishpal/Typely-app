import { buildCertificatePdfBuffer } from './_pdf.js';
import {
  buildLinkedInShareUrl,
  createSupabaseServerClient,
  formatTestName,
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
  const verificationUrl = `${baseUrl}/verify-certificate/${encodeURIComponent(code)}`;
  const accuracy = Number(certificate.accuracy ?? 0);
  const wpm = Number(certificate.wpm ?? 0);

  return {
    certificateCode: code,
    issuedAt: certificate.issued_at,
    wpm,
    accuracy,
    verificationUrl,
    verifyPath: `/verify-certificate/${encodeURIComponent(code)}`,
    downloadApiUrl: `${baseUrl}/api/certificates/download?code=${encodeURIComponent(code)}`,
    linkedInShareUrl: buildLinkedInShareUrl(verificationUrl, wpm, accuracy.toFixed(2)),
  };
}

function normalizeRuleTestType(value) {
  if (typeof value !== 'string') return 'timed';
  const normalized = value.trim().toLowerCase();
  if (!normalized) return 'timed';
  return normalized;
}

function isRuleEligibleForTest(ruleTestType, testType) {
  const normalizedRule = normalizeRuleTestType(ruleTestType);
  const normalizedTest = normalizeRuleTestType(testType);
  return normalizedRule === 'all' || normalizedRule === normalizedTest;
}

function isMissingRelationError(error) {
  const code = typeof error?.code === 'string' ? error.code : '';
  return code === '42P01' || code === 'PGRST205';
}

function isCertificateSetupError(error) {
  if (isMissingRelationError(error)) return true;

  const message = typeof error?.message === 'string' ? error.message.toLowerCase() : '';
  if (!message) return false;

  if (message.includes('bucket not found') && message.includes('certificates')) {
    return true;
  }

  return (
    message.includes('certificate_') ||
    message.includes('user_certificates') ||
    message.includes('get_top_certificate_earners')
  );
}

async function getExistingCertificate(supabase, testId) {
  const { data, error } = await supabase
    .from('user_certificates')
    .select(
      'certificate_code, wpm, accuracy, issued_at, verification_url, is_revoked, revoked_at, revoked_reason'
    )
    .eq('test_id', testId)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

async function getActiveRule(supabase) {
  const { data, error } = await supabase
    .from('certificate_rules')
    .select('id, minimum_wpm, minimum_accuracy, test_type, is_enabled')
    .eq('is_enabled', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

async function getActiveTemplate(supabase) {
  const { data, error } = await supabase
    .from('certificate_templates')
    .select(
      'id, name, background_image_url, title_text, show_wpm, show_accuracy, show_date, show_certificate_id, is_active'
    )
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (data) return data;

  const fallback = await supabase
    .from('certificate_templates')
    .select(
      'id, name, background_image_url, title_text, show_wpm, show_accuracy, show_date, show_certificate_id, is_active'
    )
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (fallback.error) throw fallback.error;
  return fallback.data ?? null;
}

async function getTypingTest(supabase, testId) {
  const { data, error } = await supabase
    .from('typing_tests')
    .select('id, user_id, test_type, wpm, accuracy, created_at')
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

    const [test, rule, template, profile] = await Promise.all([
      getTypingTest(supabase, testId),
      getActiveRule(supabase),
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

    if (!rule) {
      sendJson(res, 200, {
        issued: false,
        reason: 'CERTIFICATE_RULE_NOT_CONFIGURED',
        message: 'Certificate issuance is currently disabled.',
      });
      return;
    }

    if (!template) {
      sendJson(res, 200, {
        issued: false,
        reason: 'CERTIFICATE_TEMPLATE_NOT_CONFIGURED',
        message: 'No certificate template is configured. Ask an administrator to activate one.',
      });
      return;
    }

    const wpm = Number(test.wpm ?? 0);
    const accuracy = Number(test.accuracy ?? 0);

    const passesWpm = wpm >= Number(rule.minimum_wpm ?? 0);
    const passesAccuracy = accuracy >= Number(rule.minimum_accuracy ?? 0);
    const passesType = isRuleEligibleForTest(rule.test_type, test.test_type);

    if (!passesWpm || !passesAccuracy || !passesType) {
      sendJson(res, 200, {
        issued: false,
        reason: 'NOT_ELIGIBLE',
        message: 'Typing result does not match current certificate rule.',
        rule: {
          minimumWpm: Number(rule.minimum_wpm ?? 0),
          minimumAccuracy: Number(rule.minimum_accuracy ?? 0),
          testType: normalizeRuleTestType(rule.test_type),
        },
        result: {
          wpm,
          accuracy,
          testType: normalizeRuleTestType(test.test_type),
        },
      });
      return;
    }

    const issuedAt = new Date().toISOString();
    const year = new Date(issuedAt).getUTCFullYear();
    const certificateCode = await generateUniqueCertificateCode(supabase, year);
    const verificationUrl = `${baseUrl}/verify-certificate/${encodeURIComponent(certificateCode)}`;
    const logoUrl = `${baseUrl}/android-chrome-192x192.png`;
    const fileName = `typely-certificate-${certificateCode}.pdf`;
    const storagePath = `${user.id}/${year}/${fileName}`;

    const pdfBytes = await buildCertificatePdfBuffer({
      template,
      studentName: normalizeStudentName(profile),
      testName: formatTestName(test.test_type),
      wpm,
      accuracy,
      issuedAtIso: issuedAt,
      certificateCode,
      verificationUrl,
      logoUrl,
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
      wpm,
      accuracy: Number(accuracy.toFixed(2)),
      issued_at: issuedAt,
      pdf_url: storagePath,
      verification_url: verificationUrl,
    };

    const { data: inserted, error: insertError } = await supabase
      .from('user_certificates')
      .insert(insertPayload)
      .select(
        'certificate_code, wpm, accuracy, issued_at, verification_url, is_revoked, revoked_at, revoked_reason'
      )
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

      // Best effort cleanup for upload failure after insert failure.
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
        message:
          'Certificate generation is not configured yet. Your typing test was saved successfully.',
      });
      return;
    }

    sendJson(res, 500, {
      error: 'Unable to issue certificate right now. Please try again shortly.',
    });
  }
}
