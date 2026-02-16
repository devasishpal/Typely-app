import { supabase } from '@/db/supabase';
import type { GuestTypingResult } from '@/types';

export const GUEST_PROGRESS_STORAGE_KEY = 'typely_guest_progress';
const MAX_GUEST_RESULTS = 20;

type GuestTypingResultInput = {
  wpm: number;
  accuracy: number;
  mistakes: number;
  duration: number;
  date?: string;
};

type MergeGuestProgressResult = {
  mergedCount: number;
  error: string | null;
};

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function toSafeNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function buildGuestResultId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

function normalizeGuestResult(raw: unknown): GuestTypingResult | null {
  if (!raw || typeof raw !== 'object') return null;

  const item = raw as Record<string, unknown>;
  const id = typeof item.id === 'string' && item.id.trim() ? item.id : null;
  const date = typeof item.date === 'string' && item.date.trim() ? item.date : null;

  if (!id || !date) return null;

  const wpm = Math.max(0, Math.round(toSafeNumber(item.wpm)));
  const accuracy = Math.min(100, Math.max(0, Number(toSafeNumber(item.accuracy).toFixed(2))));
  const mistakes = Math.max(0, Math.round(toSafeNumber(item.mistakes)));
  const duration = Math.max(1, Math.round(toSafeNumber(item.duration, 1)));

  return {
    id,
    wpm,
    accuracy,
    mistakes,
    duration,
    date,
  };
}

function writeGuestTypingResults(results: GuestTypingResult[]) {
  if (!canUseStorage()) return;

  try {
    window.localStorage.setItem(GUEST_PROGRESS_STORAGE_KEY, JSON.stringify(results));
  } catch (error) {
    console.error('Failed to write guest typing results:', error);
  }
}

export function readGuestTypingResults(): GuestTypingResult[] {
  if (!canUseStorage()) return [];

  const raw = window.localStorage.getItem(GUEST_PROGRESS_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const dedupe = new Set<string>();
    const normalized = parsed
      .map((item) => normalizeGuestResult(item))
      .filter((item): item is GuestTypingResult => Boolean(item))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .filter((item) => {
        if (dedupe.has(item.id)) return false;
        dedupe.add(item.id);
        return true;
      })
      .slice(0, MAX_GUEST_RESULTS);

    if (normalized.length !== parsed.length) {
      writeGuestTypingResults(normalized);
    }

    return normalized;
  } catch (error) {
    console.error('Failed to parse guest typing results:', error);
    return [];
  }
}

export function saveGuestTypingResult(input: GuestTypingResultInput): GuestTypingResult[] {
  const nextEntry: GuestTypingResult = {
    id: buildGuestResultId(),
    wpm: Math.max(0, Math.round(toSafeNumber(input.wpm))),
    accuracy: Math.min(100, Math.max(0, Number(toSafeNumber(input.accuracy).toFixed(2)))),
    mistakes: Math.max(0, Math.round(toSafeNumber(input.mistakes))),
    duration: Math.max(1, Math.round(toSafeNumber(input.duration, 1))),
    date: input.date ?? new Date().toISOString(),
  };

  const updated = [nextEntry, ...readGuestTypingResults()].slice(0, MAX_GUEST_RESULTS);
  writeGuestTypingResults(updated);
  return updated;
}

export function clearGuestTypingResults() {
  if (!canUseStorage()) return;

  try {
    window.localStorage.removeItem(GUEST_PROGRESS_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear guest typing results:', error);
  }
}

export function hasGuestTypingResults() {
  return readGuestTypingResults().length > 0;
}

export async function mergeGuestTypingResults(userId: string): Promise<MergeGuestProgressResult> {
  const guestResults = readGuestTypingResults();
  if (guestResults.length === 0) {
    return { mergedCount: 0, error: null };
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  const sessionUserId = sessionData.session?.user?.id;

  if (sessionError || !sessionUserId || sessionUserId !== userId) {
    return { mergedCount: 0, error: 'Session validation failed. Please sign in again.' };
  }

  const rows = guestResults.map((result) => ({
    user_id: userId,
    client_result_id: result.id,
    wpm: result.wpm,
    accuracy: result.accuracy,
    mistakes: result.mistakes,
    duration: result.duration,
    created_at: result.date,
  }));

  const { error } = await supabase
    .from('typing_results')
    .upsert(rows, { onConflict: 'user_id,client_result_id' });

  if (error) {
    console.error('Failed to merge guest typing results:', error);
    return { mergedCount: 0, error: error.message || 'Unable to sync guest progress right now.' };
  }

  clearGuestTypingResults();
  return { mergedCount: rows.length, error: null };
}
