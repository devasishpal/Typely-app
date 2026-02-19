import type { Lesson } from '@/types';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuidLike(value: string) {
  return UUID_PATTERN.test(value.trim());
}

export function normalizeLessonSlug(input: string) {
  const value = typeof input === 'string' ? input : '';
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function isValidLessonSlug(input: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input);
}

function resolveLessonRouteSegment(lessonOrSlug: Pick<Lesson, 'slug' | 'id' | 'title'> | string) {
  if (typeof lessonOrSlug === 'string') {
    return normalizeLessonSlug(lessonOrSlug);
  }

  const fromSlug = normalizeLessonSlug(lessonOrSlug.slug);
  if (fromSlug) return fromSlug;

  const fromTitle = normalizeLessonSlug(lessonOrSlug.title);
  if (fromTitle) return fromTitle;

  return lessonOrSlug.id?.trim() ?? '';
}

export function buildLessonPath(lessonOrSlug: Pick<Lesson, 'slug' | 'id' | 'title'> | string) {
  const segment = resolveLessonRouteSegment(lessonOrSlug);
  return segment ? `/lesson/${segment}` : '/lessons';
}

export function buildLessonCompletionPath(lessonOrSlug: Pick<Lesson, 'slug' | 'id' | 'title'> | string) {
  const segment = resolveLessonRouteSegment(lessonOrSlug);
  return segment ? `/lesson/${segment}/complete` : '/lessons';
}

export function stripLessonContent(raw: string) {
  return raw
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildLessonMetaDescription(content: string, maxLength = 150) {
  const text = stripLessonContent(content);
  if (!text) return 'Practice this Typely lesson to improve typing speed and accuracy.';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3).trim()}...`;
}
