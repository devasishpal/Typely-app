import { createClient } from '@supabase/supabase-js';

const DEFAULT_SITE_URL = 'https://typelyapp.vercel.app';
const CERTIFICATE_CODE_PATTERN = /^TYP-\d{8}-[A-Z0-9]{4}$/;
const LEGACY_CERTIFICATE_CODE_PATTERN = /^TYP-\d{4}-\d{6}$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function trimTrailingSlash(value) {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

export function createSupabaseServerClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Missing Supabase env vars. Set SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.'
    );
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function sendJson(res, statusCode, payload, headers = {}) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  for (const [key, value] of Object.entries(headers)) {
    res.setHeader(key, value);
  }

  res.end(JSON.stringify(payload));
}

export function getBearerToken(req) {
  const header = req?.headers?.authorization;
  if (!header) return null;
  const raw = Array.isArray(header) ? header[0] : header;
  if (typeof raw !== 'string') return null;

  const [scheme, token] = raw.trim().split(/\s+/);
  if (!scheme || !token) return null;
  if (scheme.toLowerCase() !== 'bearer') return null;
  if (token.trim().length === 0) return null;
  return token.trim();
}

export async function requireAuthenticatedUser(req, supabase) {
  const token = getBearerToken(req);
  if (!token) return null;

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    return null;
  }

  return data.user;
}

export async function isAdminUser(supabase, userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) return false;
  return data.role === 'admin';
}

export function resolveSiteUrl(req) {
  const envUrl =
    process.env.PUBLIC_SITE_URL || process.env.SITE_URL || process.env.VITE_SITE_URL || DEFAULT_SITE_URL;
  const host = req?.headers?.host;

  if (host && typeof host === 'string') {
    const protoHeader = req.headers['x-forwarded-proto'];
    const proto = Array.isArray(protoHeader) ? protoHeader[0] : protoHeader;
    const protocol = proto || 'https';
    return trimTrailingSlash(`${protocol}://${host}`);
  }

  if (typeof envUrl === 'string' && envUrl.trim()) {
    return trimTrailingSlash(envUrl.trim());
  }

  return DEFAULT_SITE_URL;
}

export function sanitizeCertificateCode(input, options = {}) {
  const allowLegacy = options?.allowLegacy === true;
  if (typeof input !== 'string') return null;
  const value = input.trim().toUpperCase();
  if (CERTIFICATE_CODE_PATTERN.test(value)) return value;
  if (allowLegacy && LEGACY_CERTIFICATE_CODE_PATTERN.test(value)) return value;
  return null;
}

export function sanitizeUuid(input) {
  if (typeof input !== 'string') return null;
  const value = input.trim();
  if (!UUID_PATTERN.test(value)) return null;
  return value;
}

export function getQueryValue(req, key) {
  const value = req?.query?.[key];
  if (Array.isArray(value)) {
    return typeof value[0] === 'string' ? value[0].trim() : '';
  }
  return typeof value === 'string' ? value.trim() : '';
}

export function normalizeStudentName(profile) {
  const fullName = profile?.full_name?.trim();
  if (fullName) return fullName;

  const username = profile?.username?.trim();
  if (username) return username;

  return 'Typely Student';
}

export function formatTestName(testType) {
  const value = typeof testType === 'string' ? testType.trim().toLowerCase() : '';
  if (value === 'easy') return 'Typing Test (Easy)';
  if (value === 'medium') return 'Typing Test (Medium)';
  if (value === 'hard') return 'Typing Test (Hard)';
  if (value === 'custom') return 'Typing Test (Custom)';
  if (value === 'timed') return 'Timed Typing Test';
  return 'Typing Test';
}

export function buildLinkedInShareUrl(verificationUrl, wpm, accuracy) {
  const text = `I just earned my Typely Typing Certificate with ${wpm} WPM and ${accuracy}% accuracy.\n\nVerify here:\n${verificationUrl}`;
  return `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(text)}`;
}

export function formatCertificateDateSegment(date = new Date()) {
  const parsed = date instanceof Date ? date : new Date(date);
  const safeDate = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  const year = safeDate.getUTCFullYear().toString().padStart(4, '0');
  const month = (safeDate.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = safeDate.getUTCDate().toString().padStart(2, '0');
  return `${year}${month}${day}`;
}

function randomCodeSuffix(length = 4) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let value = '';
  for (let i = 0; i < length; i += 1) {
    value += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return value;
}

export async function generateUniqueCertificateCode(supabase, date = new Date(), maxAttempts = 40) {
  const dateSegment = formatCertificateDateSegment(date);

  for (let i = 0; i < maxAttempts; i += 1) {
    const candidate = `TYP-${dateSegment}-${randomCodeSuffix(4)}`;

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

  throw new Error('Unable to generate a unique certificate code.');
}

export function parseJsonBody(req) {
  if (!req?.body) return {};
  if (typeof req.body === 'object') return req.body;

  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }

  return {};
}
