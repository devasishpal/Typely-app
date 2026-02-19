import {
  createSupabaseServerClient,
  getQueryValue,
  sanitizeCertificateCode,
  sendJson,
} from './_utils.js';

const VERIFY_RATE_LIMIT_WINDOW_MS = 60_000;
const VERIFY_RATE_LIMIT_MAX_REQUESTS = 25;

const rateLimitStore = globalThis.__typelyVerifyRateLimitStore || new Map();
globalThis.__typelyVerifyRateLimitStore = rateLimitStore;

function getStudentName(profile) {
  const row = Array.isArray(profile) ? profile[0] : profile;
  const fullName = row?.full_name?.trim();
  if (fullName) return fullName;
  const username = row?.username?.trim();
  if (username) return username;
  return 'Typely Student';
}

function getTestName() {
  return 'Typely Typing Speed Test';
}

function getRequestIp(req) {
  const forwardedFor = req?.headers?.['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = req?.headers?.['x-real-ip'];
  if (typeof realIp === 'string' && realIp.trim()) {
    return realIp.trim();
  }

  return 'unknown';
}

function pruneRateLimitEntries(now) {
  for (const [key, record] of rateLimitStore.entries()) {
    if (!record || now - record.windowStart >= VERIFY_RATE_LIMIT_WINDOW_MS) {
      rateLimitStore.delete(key);
    }
  }
}

function isRateLimited(ip, now = Date.now()) {
  pruneRateLimitEntries(now);

  const current = rateLimitStore.get(ip);
  if (!current || now - current.windowStart >= VERIFY_RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(ip, { windowStart: now, count: 1 });
    return false;
  }

  if (current.count >= VERIFY_RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  current.count += 1;
  rateLimitStore.set(ip, current);
  return false;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'Method not allowed' }, { Allow: 'GET' });
    return;
  }

  const requestIp = getRequestIp(req);
  if (isRateLimited(requestIp)) {
    sendJson(
      res,
      429,
      {
        valid: false,
        message: 'Too many verification requests. Please try again shortly.',
      },
      {
        'Cache-Control': 'no-store',
      }
    );
    return;
  }

  try {
    const code = sanitizeCertificateCode(getQueryValue(req, 'code'), { allowLegacy: true });
    if (!code) {
      sendJson(
        res,
        400,
        {
          valid: false,
          message: 'Invalid certificate ID format.',
        },
        { 'Cache-Control': 'no-store' }
      );
      return;
    }

    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from('user_certificates')
      .select(
        `
        certificate_code,
        wpm,
        accuracy,
        issued_at,
        is_revoked,
        revoked_at,
        revoked_reason,
        template_version,
        profiles(full_name, username)
      `
      )
      .eq('certificate_code', code)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      sendJson(
        res,
        404,
        {
          valid: false,
          message: 'Invalid certificate.',
        },
        { 'Cache-Control': 'no-store' }
      );
      return;
    }

    if (data.is_revoked) {
      sendJson(
        res,
        200,
        {
          valid: false,
          message: 'Invalid certificate.',
          certificate: {
            certificateId: data.certificate_code,
            studentName: getStudentName(data.profiles),
            testName: getTestName(),
            wpm: Number(data.wpm ?? 0),
            accuracy: Number(data.accuracy ?? 0),
            issuedAt: data.issued_at,
            revokedAt: data.revoked_at,
            revokedReason: data.revoked_reason || null,
            templateVersion: Number(data.template_version ?? 1),
          },
        },
        { 'Cache-Control': 'no-store' }
      );
      return;
    }

    sendJson(
      res,
      200,
      {
        valid: true,
        message: 'Valid certificate.',
        certificate: {
          certificateId: data.certificate_code,
          studentName: getStudentName(data.profiles),
          testName: getTestName(),
          wpm: Number(data.wpm ?? 0),
          accuracy: Number(data.accuracy ?? 0),
          issuedAt: data.issued_at,
          templateVersion: Number(data.template_version ?? 1),
        },
      },
      { 'Cache-Control': 'public, max-age=120, s-maxage=120' }
    );
  } catch (error) {
    console.error('Certificate verification failed:', error);
    sendJson(
      res,
      500,
      {
        valid: false,
        message: 'Unable to verify certificate right now.',
      },
      { 'Cache-Control': 'no-store' }
    );
  }
}
