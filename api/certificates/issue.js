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

function isMissingColumnError(error) {
  const code = typeof error?.code === 'string' ? error.code : '';
  if (code === '42703') return true;

  const message = typeof error?.message === 'string' ? error.message.toLowerCase() : '';
  return message.includes('column') && message.includes('does not exist');
}

function isCodeFormatCheckError(error) {
  const code = typeof error?.code === 'string' ? error.code : '';
  if (code !== '23514') return false;

  const messageParts = [
    typeof error?.message === 'string' ? error.message : '',
    typeof error?.details === 'string' ? error.details : '',
    typeof error?.hint === 'string' ? error.hint : '',
  ]
    .join(' ')
    .toLowerCase();

  return messageParts.includes('user_certificates_code_format_check');
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
    .select('*')
    .eq('test_id', testId)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

async function getActiveTemplate(supabase) {
  const { data, error } = await supabase
    .from('certificate_templates')
    .select('*')
    .eq('is_active', true)
    .not('background_image_url', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data?.background_image_url) return null;
  return data;
}

async function getActiveRule(supabase) {
  const { data, error } = await supabase
    .from('certificate_rules')
    .select('minimum_wpm, minimum_accuracy, test_type, is_enabled')
    .eq('is_enabled', true)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

function normalizeRuleTestType(value) {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (normalized === 'all') return 'all';
  if (normalized === 'custom') return 'custom';
  if (normalized === 'easy') return 'easy';
  if (normalized === 'medium') return 'medium';
  if (normalized === 'hard') return 'hard';
  return 'timed';
}

function normalizeAttemptTestType(value) {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (normalized === 'custom') return 'custom';
  if (normalized === 'easy') return 'easy';
  if (normalized === 'medium') return 'medium';
  if (normalized === 'hard') return 'hard';
  if (normalized === 'timed') return 'timed';
  return 'timed';
}

function doesRuleMatchTestType(ruleTestType, attemptTestType) {
  if (ruleTestType === 'all') return true;
  if (ruleTestType === attemptTestType) return true;

  if (ruleTestType === 'timed') {
    return attemptTestType === 'timed' || attemptTestType === 'easy' || attemptTestType === 'medium' || attemptTestType === 'hard';
  }

  return false;
}

function randomLegacyCertificateCodeSuffix(length = 6) {
  let value = '';
  for (let i = 0; i < length; i += 1) {
    value += Math.floor(Math.random() * 10).toString();
  }
  return value;
}

async function generateUniqueLegacyCertificateCode(supabase, date = new Date(), maxAttempts = 40) {
  const parsed = date instanceof Date ? date : new Date(date);
  const safeDate = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  const yearSegment = safeDate.getUTCFullYear().toString().padStart(4, '0');

  for (let i = 0; i < maxAttempts; i += 1) {
    const candidate = `TYP-${yearSegment}-${randomLegacyCertificateCodeSuffix(6)}`;

    const { data, error } = await supabase
      .from('user_certificates')
      .select('id')
      .eq('certificate_code', candidate)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return candidate;
    }
  }

  throw new Error('Unable to generate a legacy certificate code.');
}

async function getTypingTest(supabase, testId) {
  const { data, error } = await supabase
    .from('typing_tests')
    .select('id, user_id, test_type, wpm, accuracy')
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
    const [test, template, profile, activeRule] = await Promise.all([
      getTypingTest(supabase, testId),
      getActiveTemplate(supabase),
      getProfile(supabase, user.id),
      getActiveRule(supabase),
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
    const resultTestType = normalizeAttemptTestType(test.test_type);

    if (!activeRule) {
      sendJson(res, 200, {
        issued: false,
        reason: 'NOT_ELIGIBLE',
        message: 'No active certificate rule matched.',
        result: {
          wpm,
          accuracy: Number(accuracy.toFixed(2)),
          testType: resultTestType,
        },
      });
      return;
    }

    const minimumWpm = Number.isFinite(Number(activeRule.minimum_wpm))
      ? Math.max(0, Math.round(Number(activeRule.minimum_wpm)))
      : 0;
    const minimumAccuracy = Number.isFinite(Number(activeRule.minimum_accuracy))
      ? Math.max(0, Math.min(100, Number(activeRule.minimum_accuracy)))
      : 0;
    const ruleTestType = normalizeRuleTestType(activeRule.test_type);
    const matchesTestType = doesRuleMatchTestType(ruleTestType, resultTestType);
    const meetsThresholds = wpm >= minimumWpm && accuracy >= minimumAccuracy;

    if (!matchesTestType || !meetsThresholds) {
      sendJson(res, 200, {
        issued: false,
        reason: 'NOT_ELIGIBLE',
        message: 'This attempt does not meet the active certificate rule.',
        rule: {
          minimumWpm,
          minimumAccuracy,
          testType: ruleTestType,
        },
        result: {
          wpm,
          accuracy: Number(accuracy.toFixed(2)),
          testType: resultTestType,
        },
      });
      return;
    }

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

    let storedPdfPath = storagePath;
    const uploadResult = await supabase.storage
      .from('certificates')
      .upload(storagePath, pdfBytes, {
        contentType: 'application/pdf',
        cacheControl: '31536000',
        upsert: false,
      });

    if (uploadResult.error) {
      console.warn(
        'Certificate PDF upload failed. Falling back to on-demand PDF generation during download:',
        uploadResult.error
      );
      storedPdfPath = '';
    }

    const buildInsertPayload = (issuedCode, includeTemplateVersion = true) => {
      const payload = {
        certificate_code: issuedCode,
        user_id: user.id,
        test_id: test.id,
        template_id: template.id,
        wpm,
        accuracy: Number(accuracy.toFixed(2)),
        issued_at: issuedAt,
        pdf_url: storedPdfPath,
        verification_url: `${baseUrl}/verify-certificate?code=${encodeURIComponent(issuedCode)}`,
      };

      if (includeTemplateVersion) {
        payload.template_version = templateVersion;
      }

      return payload;
    };

    let includeTemplateVersion = true;
    let finalCertificateCode = certificateCode;
    let insertResponse = null;

    for (let attempt = 0; attempt < 4; attempt += 1) {
      const insertPayload = buildInsertPayload(finalCertificateCode, includeTemplateVersion);
      insertResponse = await supabase.from('user_certificates').insert(insertPayload).select('*').maybeSingle();

      const attemptError = insertResponse.error;
      if (!attemptError) {
        break;
      }

      if (isMissingColumnError(attemptError) && includeTemplateVersion) {
        includeTemplateVersion = false;
        continue;
      }

      if (isCodeFormatCheckError(attemptError) && finalCertificateCode === certificateCode) {
        finalCertificateCode = await generateUniqueLegacyCertificateCode(supabase, issuedAt);
        if (storedPdfPath) {
          await supabase.storage.from('certificates').remove([storedPdfPath]).catch(() => null);
          storedPdfPath = '';
        }
        continue;
      }

      break;
    }

    const inserted = insertResponse?.data ?? null;
    const insertError = insertResponse?.error ?? new Error('Certificate insert request failed.');

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

      if (storedPdfPath) {
        await supabase.storage.from('certificates').remove([storedPdfPath]).catch(() => null);
      }
      throw insertError;
    }

    if (!inserted) {
      if (storedPdfPath) {
        await supabase.storage.from('certificates').remove([storedPdfPath]).catch(() => null);
      }
      throw new Error('Certificate insert returned no row.');
    }

    const insertedWithDefaults = {
      ...inserted,
      template_version: Number(inserted.template_version ?? templateVersion ?? 1),
    };

    sendJson(res, 201, {
      issued: true,
      alreadyExisted: false,
      certificate: mapCertificateResponse(insertedWithDefaults, baseUrl),
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
