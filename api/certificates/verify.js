import {
  createSupabaseServerClient,
  formatTestName,
  getQueryValue,
  sanitizeCertificateCode,
  sendJson,
} from './_utils.js';

function getStudentName(profile) {
  const row = Array.isArray(profile) ? profile[0] : profile;
  const fullName = row?.full_name?.trim();
  if (fullName) return fullName;
  const username = row?.username?.trim();
  if (username) return username;
  return 'Typely Student';
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'Method not allowed' }, { Allow: 'GET' });
    return;
  }

  try {
    const code = sanitizeCertificateCode(getQueryValue(req, 'code'));
    if (!code) {
      sendJson(res, 400, {
        valid: false,
        message: 'Invalid or revoked certificate.',
      });
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
        profiles(full_name, username),
        typing_tests(test_type)
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
          message: 'Invalid or revoked certificate.',
        },
        { 'Cache-Control': 'public, max-age=60, s-maxage=60' }
      );
      return;
    }

    if (data.is_revoked) {
      sendJson(
        res,
        200,
        {
          valid: false,
          message: 'Invalid or revoked certificate.',
          certificate: {
            certificateId: data.certificate_code,
            studentName: getStudentName(data.profiles),
            testName: formatTestName(
              Array.isArray(data.typing_tests) ? data.typing_tests[0]?.test_type : data.typing_tests?.test_type
            ),
            wpm: Number(data.wpm ?? 0),
            accuracy: Number(data.accuracy ?? 0),
            issuedAt: data.issued_at,
            revokedAt: data.revoked_at,
            revokedReason: data.revoked_reason || null,
          },
        },
        { 'Cache-Control': 'public, max-age=60, s-maxage=60' }
      );
      return;
    }

    sendJson(
      res,
      200,
      {
        valid: true,
        certificate: {
          certificateId: data.certificate_code,
          studentName: getStudentName(data.profiles),
          testName: formatTestName(
            Array.isArray(data.typing_tests) ? data.typing_tests[0]?.test_type : data.typing_tests?.test_type
          ),
          wpm: Number(data.wpm ?? 0),
          accuracy: Number(data.accuracy ?? 0),
          issuedAt: data.issued_at,
        },
      },
      { 'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=86400' }
    );
  } catch (error) {
    console.error('Certificate verification failed:', error);
    sendJson(res, 500, {
      valid: false,
      message: 'Unable to verify certificate right now.',
    });
  }
}
