import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertCircle, Gauge, Info, Sparkles, Target, Timer } from 'lucide-react';
import Keyboard from '@/components/Keyboard';
import { lessonApi, lessonProgressApi, typingSessionApi, statisticsApi } from '@/db/api';
import { useToast } from '@/hooks/use-toast';
import type { Lesson, TypingSessionData } from '@/types';
import { cn } from '@/lib/utils';

type DifficultyTheme = {
  labelClass: string;
  cardBorderClass: string;
  ringClass: string;
  glowClass: string;
  gradientRibbonClass: string;
  chipClass: string;
};

type CoachMood = 'flow' | 'accuracy' | 'speed' | 'consistency';

type PracticeCoachTip = {
  id: string;
  title: string;
  detail: string;
  mood: CoachMood;
};

const DIFFICULTY_THEMES: Record<string, DifficultyTheme> = {
  beginner: {
    labelClass: 'from-emerald-500 to-cyan-500',
    cardBorderClass: 'border-emerald-300/45 dark:border-emerald-400/30',
    ringClass: 'ring-emerald-300/30 dark:ring-emerald-400/20',
    glowClass: 'bg-emerald-400/20',
    gradientRibbonClass: 'from-emerald-400/20 via-cyan-400/20 to-blue-400/20',
    chipClass: 'border-emerald-300/40 bg-emerald-100/70 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  },
  intermediate: {
    labelClass: 'from-sky-500 to-indigo-500',
    cardBorderClass: 'border-sky-300/45 dark:border-sky-400/30',
    ringClass: 'ring-sky-300/30 dark:ring-sky-400/20',
    glowClass: 'bg-sky-400/20',
    gradientRibbonClass: 'from-sky-400/20 via-indigo-400/20 to-violet-400/20',
    chipClass: 'border-sky-300/40 bg-sky-100/70 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
  },
  advanced: {
    labelClass: 'from-amber-500 to-rose-500',
    cardBorderClass: 'border-amber-300/45 dark:border-amber-400/30',
    ringClass: 'ring-amber-300/30 dark:ring-amber-400/20',
    glowClass: 'bg-amber-400/20',
    gradientRibbonClass: 'from-amber-400/20 via-rose-400/20 to-fuchsia-400/20',
    chipClass: 'border-amber-300/40 bg-amber-100/70 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  },
};

const MOOD_STYLES: Record<CoachMood, { chipClass: string; iconClass: string }> = {
  flow: {
    chipClass: 'border-cyan-300/45 bg-cyan-100/70 text-cyan-700 dark:bg-cyan-900/25 dark:text-cyan-300',
    iconClass: 'text-cyan-500',
  },
  accuracy: {
    chipClass: 'border-emerald-300/45 bg-emerald-100/70 text-emerald-700 dark:bg-emerald-900/25 dark:text-emerald-300',
    iconClass: 'text-emerald-500',
  },
  speed: {
    chipClass: 'border-amber-300/45 bg-amber-100/70 text-amber-700 dark:bg-amber-900/25 dark:text-amber-300',
    iconClass: 'text-amber-500',
  },
  consistency: {
    chipClass: 'border-indigo-300/45 bg-indigo-100/70 text-indigo-700 dark:bg-indigo-900/25 dark:text-indigo-300',
    iconClass: 'text-indigo-500',
  },
};

const COACH_MOOD_LABELS: Record<CoachMood, string> = {
  flow: 'Flow',
  accuracy: 'Accuracy',
  speed: 'Speed',
  consistency: 'Consistency',
};

const PRACTICE_COACH_TIPS: readonly PracticeCoachTip[] = [
  {
    id: 'tip-001',
    title: 'Soft Rhythm Cue 001',
    detail: 'Keep your shoulders loose and let the fingers return to home row. Your goal is an even cadence, not burst typing.',
    mood: 'flow',
  },
  {
    id: 'tip-002',
    title: 'Accuracy Anchor 002',
    detail: 'Look ahead one word while your fingers finish the current one. This keeps both speed and confidence stable.',
    mood: 'accuracy',
  },
  {
    id: 'tip-003',
    title: 'Cadence Reminder 003',
    detail: 'Press with minimal force and avoid hammering the keycaps. Small corrections early prevent long error chains.',
    mood: 'speed',
  },
  {
    id: 'tip-004',
    title: 'Focus Signal 004',
    detail: 'Use tiny pauses after punctuation to reset rhythm cleanly. Control first, then pace.',
    mood: 'consistency',
  },
  {
    id: 'tip-005',
    title: 'Speed Balance 005',
    detail: 'Prioritize smooth consistency before trying to accelerate. A light touch produces better endurance.',
    mood: 'flow',
  },
  {
    id: 'tip-006',
    title: 'Posture Check 006',
    detail: 'Track the next two letters to reduce reactive typing. Consistency will raise your WPM naturally.',
    mood: 'accuracy',
  },
  {
    id: 'tip-007',
    title: 'Hand Relaxation 007',
    detail: 'Keep wrists neutral and float the hands instead of resting hard. Precision now means fewer backspaces later.',
    mood: 'speed',
  },
  {
    id: 'tip-008',
    title: 'Breathing Marker 008',
    detail: 'If errors spike, reduce speed by 10 percent for one line. This helps lock muscle memory faster.',
    mood: 'consistency',
  },
  {
    id: 'tip-009',
    title: 'Finger Control 009',
    detail: 'Let each keystroke finish fully before moving to the next key. Stay calm and keep the same finger pattern.',
    mood: 'flow',
  },
  {
    id: 'tip-010',
    title: 'Tempo Guidance 010',
    detail: 'Breathe out slowly on longer words to prevent tension. Your best runs come from relaxed repetition.',
    mood: 'accuracy',
  },
  {
    id: 'tip-011',
    title: 'Soft Rhythm Cue 011',
    detail: 'Keep your shoulders loose and let the fingers return to home row. Your goal is an even cadence, not burst typing.',
    mood: 'speed',
  },
  {
    id: 'tip-012',
    title: 'Accuracy Anchor 012',
    detail: 'Look ahead one word while your fingers finish the current one. This keeps both speed and confidence stable.',
    mood: 'consistency',
  },
  {
    id: 'tip-013',
    title: 'Cadence Reminder 013',
    detail: 'Press with minimal force and avoid hammering the keycaps. Small corrections early prevent long error chains.',
    mood: 'flow',
  },
  {
    id: 'tip-014',
    title: 'Focus Signal 014',
    detail: 'Use tiny pauses after punctuation to reset rhythm cleanly. Control first, then pace.',
    mood: 'accuracy',
  },
  {
    id: 'tip-015',
    title: 'Speed Balance 015',
    detail: 'Prioritize smooth consistency before trying to accelerate. A light touch produces better endurance.',
    mood: 'speed',
  },
  {
    id: 'tip-016',
    title: 'Posture Check 016',
    detail: 'Track the next two letters to reduce reactive typing. Consistency will raise your WPM naturally.',
    mood: 'consistency',
  },
  {
    id: 'tip-017',
    title: 'Hand Relaxation 017',
    detail: 'Keep wrists neutral and float the hands instead of resting hard. Precision now means fewer backspaces later.',
    mood: 'flow',
  },
  {
    id: 'tip-018',
    title: 'Breathing Marker 018',
    detail: 'If errors spike, reduce speed by 10 percent for one line. This helps lock muscle memory faster.',
    mood: 'accuracy',
  },
  {
    id: 'tip-019',
    title: 'Finger Control 019',
    detail: 'Let each keystroke finish fully before moving to the next key. Stay calm and keep the same finger pattern.',
    mood: 'speed',
  },
  {
    id: 'tip-020',
    title: 'Tempo Guidance 020',
    detail: 'Breathe out slowly on longer words to prevent tension. Your best runs come from relaxed repetition.',
    mood: 'consistency',
  },
  {
    id: 'tip-021',
    title: 'Soft Rhythm Cue 021',
    detail: 'Keep your shoulders loose and let the fingers return to home row. Your goal is an even cadence, not burst typing.',
    mood: 'flow',
  },
  {
    id: 'tip-022',
    title: 'Accuracy Anchor 022',
    detail: 'Look ahead one word while your fingers finish the current one. This keeps both speed and confidence stable.',
    mood: 'accuracy',
  },
  {
    id: 'tip-023',
    title: 'Cadence Reminder 023',
    detail: 'Press with minimal force and avoid hammering the keycaps. Small corrections early prevent long error chains.',
    mood: 'speed',
  },
  {
    id: 'tip-024',
    title: 'Focus Signal 024',
    detail: 'Use tiny pauses after punctuation to reset rhythm cleanly. Control first, then pace.',
    mood: 'consistency',
  },
  {
    id: 'tip-025',
    title: 'Speed Balance 025',
    detail: 'Prioritize smooth consistency before trying to accelerate. A light touch produces better endurance.',
    mood: 'flow',
  },
  {
    id: 'tip-026',
    title: 'Posture Check 026',
    detail: 'Track the next two letters to reduce reactive typing. Consistency will raise your WPM naturally.',
    mood: 'accuracy',
  },
  {
    id: 'tip-027',
    title: 'Hand Relaxation 027',
    detail: 'Keep wrists neutral and float the hands instead of resting hard. Precision now means fewer backspaces later.',
    mood: 'speed',
  },
  {
    id: 'tip-028',
    title: 'Breathing Marker 028',
    detail: 'If errors spike, reduce speed by 10 percent for one line. This helps lock muscle memory faster.',
    mood: 'consistency',
  },
  {
    id: 'tip-029',
    title: 'Finger Control 029',
    detail: 'Let each keystroke finish fully before moving to the next key. Stay calm and keep the same finger pattern.',
    mood: 'flow',
  },
  {
    id: 'tip-030',
    title: 'Tempo Guidance 030',
    detail: 'Breathe out slowly on longer words to prevent tension. Your best runs come from relaxed repetition.',
    mood: 'accuracy',
  },
  {
    id: 'tip-031',
    title: 'Soft Rhythm Cue 031',
    detail: 'Keep your shoulders loose and let the fingers return to home row. Your goal is an even cadence, not burst typing.',
    mood: 'speed',
  },
  {
    id: 'tip-032',
    title: 'Accuracy Anchor 032',
    detail: 'Look ahead one word while your fingers finish the current one. This keeps both speed and confidence stable.',
    mood: 'consistency',
  },
  {
    id: 'tip-033',
    title: 'Cadence Reminder 033',
    detail: 'Press with minimal force and avoid hammering the keycaps. Small corrections early prevent long error chains.',
    mood: 'flow',
  },
  {
    id: 'tip-034',
    title: 'Focus Signal 034',
    detail: 'Use tiny pauses after punctuation to reset rhythm cleanly. Control first, then pace.',
    mood: 'accuracy',
  },
  {
    id: 'tip-035',
    title: 'Speed Balance 035',
    detail: 'Prioritize smooth consistency before trying to accelerate. A light touch produces better endurance.',
    mood: 'speed',
  },
  {
    id: 'tip-036',
    title: 'Posture Check 036',
    detail: 'Track the next two letters to reduce reactive typing. Consistency will raise your WPM naturally.',
    mood: 'consistency',
  },
  {
    id: 'tip-037',
    title: 'Hand Relaxation 037',
    detail: 'Keep wrists neutral and float the hands instead of resting hard. Precision now means fewer backspaces later.',
    mood: 'flow',
  },
  {
    id: 'tip-038',
    title: 'Breathing Marker 038',
    detail: 'If errors spike, reduce speed by 10 percent for one line. This helps lock muscle memory faster.',
    mood: 'accuracy',
  },
  {
    id: 'tip-039',
    title: 'Finger Control 039',
    detail: 'Let each keystroke finish fully before moving to the next key. Stay calm and keep the same finger pattern.',
    mood: 'speed',
  },
  {
    id: 'tip-040',
    title: 'Tempo Guidance 040',
    detail: 'Breathe out slowly on longer words to prevent tension. Your best runs come from relaxed repetition.',
    mood: 'consistency',
  },
  {
    id: 'tip-041',
    title: 'Soft Rhythm Cue 041',
    detail: 'Keep your shoulders loose and let the fingers return to home row. Your goal is an even cadence, not burst typing.',
    mood: 'flow',
  },
  {
    id: 'tip-042',
    title: 'Accuracy Anchor 042',
    detail: 'Look ahead one word while your fingers finish the current one. This keeps both speed and confidence stable.',
    mood: 'accuracy',
  },
  {
    id: 'tip-043',
    title: 'Cadence Reminder 043',
    detail: 'Press with minimal force and avoid hammering the keycaps. Small corrections early prevent long error chains.',
    mood: 'speed',
  },
  {
    id: 'tip-044',
    title: 'Focus Signal 044',
    detail: 'Use tiny pauses after punctuation to reset rhythm cleanly. Control first, then pace.',
    mood: 'consistency',
  },
  {
    id: 'tip-045',
    title: 'Speed Balance 045',
    detail: 'Prioritize smooth consistency before trying to accelerate. A light touch produces better endurance.',
    mood: 'flow',
  },
  {
    id: 'tip-046',
    title: 'Posture Check 046',
    detail: 'Track the next two letters to reduce reactive typing. Consistency will raise your WPM naturally.',
    mood: 'accuracy',
  },
  {
    id: 'tip-047',
    title: 'Hand Relaxation 047',
    detail: 'Keep wrists neutral and float the hands instead of resting hard. Precision now means fewer backspaces later.',
    mood: 'speed',
  },
  {
    id: 'tip-048',
    title: 'Breathing Marker 048',
    detail: 'If errors spike, reduce speed by 10 percent for one line. This helps lock muscle memory faster.',
    mood: 'consistency',
  },
  {
    id: 'tip-049',
    title: 'Finger Control 049',
    detail: 'Let each keystroke finish fully before moving to the next key. Stay calm and keep the same finger pattern.',
    mood: 'flow',
  },
  {
    id: 'tip-050',
    title: 'Tempo Guidance 050',
    detail: 'Breathe out slowly on longer words to prevent tension. Your best runs come from relaxed repetition.',
    mood: 'accuracy',
  },
  {
    id: 'tip-051',
    title: 'Soft Rhythm Cue 051',
    detail: 'Keep your shoulders loose and let the fingers return to home row. Your goal is an even cadence, not burst typing.',
    mood: 'speed',
  },
  {
    id: 'tip-052',
    title: 'Accuracy Anchor 052',
    detail: 'Look ahead one word while your fingers finish the current one. This keeps both speed and confidence stable.',
    mood: 'consistency',
  },
  {
    id: 'tip-053',
    title: 'Cadence Reminder 053',
    detail: 'Press with minimal force and avoid hammering the keycaps. Small corrections early prevent long error chains.',
    mood: 'flow',
  },
  {
    id: 'tip-054',
    title: 'Focus Signal 054',
    detail: 'Use tiny pauses after punctuation to reset rhythm cleanly. Control first, then pace.',
    mood: 'accuracy',
  },
  {
    id: 'tip-055',
    title: 'Speed Balance 055',
    detail: 'Prioritize smooth consistency before trying to accelerate. A light touch produces better endurance.',
    mood: 'speed',
  },
  {
    id: 'tip-056',
    title: 'Posture Check 056',
    detail: 'Track the next two letters to reduce reactive typing. Consistency will raise your WPM naturally.',
    mood: 'consistency',
  },
  {
    id: 'tip-057',
    title: 'Hand Relaxation 057',
    detail: 'Keep wrists neutral and float the hands instead of resting hard. Precision now means fewer backspaces later.',
    mood: 'flow',
  },
  {
    id: 'tip-058',
    title: 'Breathing Marker 058',
    detail: 'If errors spike, reduce speed by 10 percent for one line. This helps lock muscle memory faster.',
    mood: 'accuracy',
  },
  {
    id: 'tip-059',
    title: 'Finger Control 059',
    detail: 'Let each keystroke finish fully before moving to the next key. Stay calm and keep the same finger pattern.',
    mood: 'speed',
  },
  {
    id: 'tip-060',
    title: 'Tempo Guidance 060',
    detail: 'Breathe out slowly on longer words to prevent tension. Your best runs come from relaxed repetition.',
    mood: 'consistency',
  },
  {
    id: 'tip-061',
    title: 'Soft Rhythm Cue 061',
    detail: 'Keep your shoulders loose and let the fingers return to home row. Your goal is an even cadence, not burst typing.',
    mood: 'flow',
  },
  {
    id: 'tip-062',
    title: 'Accuracy Anchor 062',
    detail: 'Look ahead one word while your fingers finish the current one. This keeps both speed and confidence stable.',
    mood: 'accuracy',
  },
  {
    id: 'tip-063',
    title: 'Cadence Reminder 063',
    detail: 'Press with minimal force and avoid hammering the keycaps. Small corrections early prevent long error chains.',
    mood: 'speed',
  },
  {
    id: 'tip-064',
    title: 'Focus Signal 064',
    detail: 'Use tiny pauses after punctuation to reset rhythm cleanly. Control first, then pace.',
    mood: 'consistency',
  },
  {
    id: 'tip-065',
    title: 'Speed Balance 065',
    detail: 'Prioritize smooth consistency before trying to accelerate. A light touch produces better endurance.',
    mood: 'flow',
  },
  {
    id: 'tip-066',
    title: 'Posture Check 066',
    detail: 'Track the next two letters to reduce reactive typing. Consistency will raise your WPM naturally.',
    mood: 'accuracy',
  },
  {
    id: 'tip-067',
    title: 'Hand Relaxation 067',
    detail: 'Keep wrists neutral and float the hands instead of resting hard. Precision now means fewer backspaces later.',
    mood: 'speed',
  },
  {
    id: 'tip-068',
    title: 'Breathing Marker 068',
    detail: 'If errors spike, reduce speed by 10 percent for one line. This helps lock muscle memory faster.',
    mood: 'consistency',
  },
  {
    id: 'tip-069',
    title: 'Finger Control 069',
    detail: 'Let each keystroke finish fully before moving to the next key. Stay calm and keep the same finger pattern.',
    mood: 'flow',
  },
  {
    id: 'tip-070',
    title: 'Tempo Guidance 070',
    detail: 'Breathe out slowly on longer words to prevent tension. Your best runs come from relaxed repetition.',
    mood: 'accuracy',
  },
  {
    id: 'tip-071',
    title: 'Soft Rhythm Cue 071',
    detail: 'Keep your shoulders loose and let the fingers return to home row. Your goal is an even cadence, not burst typing.',
    mood: 'speed',
  },
  {
    id: 'tip-072',
    title: 'Accuracy Anchor 072',
    detail: 'Look ahead one word while your fingers finish the current one. This keeps both speed and confidence stable.',
    mood: 'consistency',
  },
  {
    id: 'tip-073',
    title: 'Cadence Reminder 073',
    detail: 'Press with minimal force and avoid hammering the keycaps. Small corrections early prevent long error chains.',
    mood: 'flow',
  },
  {
    id: 'tip-074',
    title: 'Focus Signal 074',
    detail: 'Use tiny pauses after punctuation to reset rhythm cleanly. Control first, then pace.',
    mood: 'accuracy',
  },
  {
    id: 'tip-075',
    title: 'Speed Balance 075',
    detail: 'Prioritize smooth consistency before trying to accelerate. A light touch produces better endurance.',
    mood: 'speed',
  },
  {
    id: 'tip-076',
    title: 'Posture Check 076',
    detail: 'Track the next two letters to reduce reactive typing. Consistency will raise your WPM naturally.',
    mood: 'consistency',
  },
  {
    id: 'tip-077',
    title: 'Hand Relaxation 077',
    detail: 'Keep wrists neutral and float the hands instead of resting hard. Precision now means fewer backspaces later.',
    mood: 'flow',
  },
  {
    id: 'tip-078',
    title: 'Breathing Marker 078',
    detail: 'If errors spike, reduce speed by 10 percent for one line. This helps lock muscle memory faster.',
    mood: 'accuracy',
  },
  {
    id: 'tip-079',
    title: 'Finger Control 079',
    detail: 'Let each keystroke finish fully before moving to the next key. Stay calm and keep the same finger pattern.',
    mood: 'speed',
  },
  {
    id: 'tip-080',
    title: 'Tempo Guidance 080',
    detail: 'Breathe out slowly on longer words to prevent tension. Your best runs come from relaxed repetition.',
    mood: 'consistency',
  },
  {
    id: 'tip-081',
    title: 'Soft Rhythm Cue 081',
    detail: 'Keep your shoulders loose and let the fingers return to home row. Your goal is an even cadence, not burst typing.',
    mood: 'flow',
  },
  {
    id: 'tip-082',
    title: 'Accuracy Anchor 082',
    detail: 'Look ahead one word while your fingers finish the current one. This keeps both speed and confidence stable.',
    mood: 'accuracy',
  },
  {
    id: 'tip-083',
    title: 'Cadence Reminder 083',
    detail: 'Press with minimal force and avoid hammering the keycaps. Small corrections early prevent long error chains.',
    mood: 'speed',
  },
  {
    id: 'tip-084',
    title: 'Focus Signal 084',
    detail: 'Use tiny pauses after punctuation to reset rhythm cleanly. Control first, then pace.',
    mood: 'consistency',
  },
  {
    id: 'tip-085',
    title: 'Speed Balance 085',
    detail: 'Prioritize smooth consistency before trying to accelerate. A light touch produces better endurance.',
    mood: 'flow',
  },
  {
    id: 'tip-086',
    title: 'Posture Check 086',
    detail: 'Track the next two letters to reduce reactive typing. Consistency will raise your WPM naturally.',
    mood: 'accuracy',
  },
  {
    id: 'tip-087',
    title: 'Hand Relaxation 087',
    detail: 'Keep wrists neutral and float the hands instead of resting hard. Precision now means fewer backspaces later.',
    mood: 'speed',
  },
  {
    id: 'tip-088',
    title: 'Breathing Marker 088',
    detail: 'If errors spike, reduce speed by 10 percent for one line. This helps lock muscle memory faster.',
    mood: 'consistency',
  },
  {
    id: 'tip-089',
    title: 'Finger Control 089',
    detail: 'Let each keystroke finish fully before moving to the next key. Stay calm and keep the same finger pattern.',
    mood: 'flow',
  },
  {
    id: 'tip-090',
    title: 'Tempo Guidance 090',
    detail: 'Breathe out slowly on longer words to prevent tension. Your best runs come from relaxed repetition.',
    mood: 'accuracy',
  },
  {
    id: 'tip-091',
    title: 'Soft Rhythm Cue 091',
    detail: 'Keep your shoulders loose and let the fingers return to home row. Your goal is an even cadence, not burst typing.',
    mood: 'speed',
  },
  {
    id: 'tip-092',
    title: 'Accuracy Anchor 092',
    detail: 'Look ahead one word while your fingers finish the current one. This keeps both speed and confidence stable.',
    mood: 'consistency',
  },
  {
    id: 'tip-093',
    title: 'Cadence Reminder 093',
    detail: 'Press with minimal force and avoid hammering the keycaps. Small corrections early prevent long error chains.',
    mood: 'flow',
  },
  {
    id: 'tip-094',
    title: 'Focus Signal 094',
    detail: 'Use tiny pauses after punctuation to reset rhythm cleanly. Control first, then pace.',
    mood: 'accuracy',
  },
  {
    id: 'tip-095',
    title: 'Speed Balance 095',
    detail: 'Prioritize smooth consistency before trying to accelerate. A light touch produces better endurance.',
    mood: 'speed',
  },
  {
    id: 'tip-096',
    title: 'Posture Check 096',
    detail: 'Track the next two letters to reduce reactive typing. Consistency will raise your WPM naturally.',
    mood: 'consistency',
  },
  {
    id: 'tip-097',
    title: 'Hand Relaxation 097',
    detail: 'Keep wrists neutral and float the hands instead of resting hard. Precision now means fewer backspaces later.',
    mood: 'flow',
  },
  {
    id: 'tip-098',
    title: 'Breathing Marker 098',
    detail: 'If errors spike, reduce speed by 10 percent for one line. This helps lock muscle memory faster.',
    mood: 'accuracy',
  },
  {
    id: 'tip-099',
    title: 'Finger Control 099',
    detail: 'Let each keystroke finish fully before moving to the next key. Stay calm and keep the same finger pattern.',
    mood: 'speed',
  },
  {
    id: 'tip-100',
    title: 'Tempo Guidance 100',
    detail: 'Breathe out slowly on longer words to prevent tension. Your best runs come from relaxed repetition.',
    mood: 'consistency',
  },
  {
    id: 'tip-101',
    title: 'Soft Rhythm Cue 101',
    detail: 'Keep your shoulders loose and let the fingers return to home row. Your goal is an even cadence, not burst typing.',
    mood: 'flow',
  },
  {
    id: 'tip-102',
    title: 'Accuracy Anchor 102',
    detail: 'Look ahead one word while your fingers finish the current one. This keeps both speed and confidence stable.',
    mood: 'accuracy',
  },
  {
    id: 'tip-103',
    title: 'Cadence Reminder 103',
    detail: 'Press with minimal force and avoid hammering the keycaps. Small corrections early prevent long error chains.',
    mood: 'speed',
  },
  {
    id: 'tip-104',
    title: 'Focus Signal 104',
    detail: 'Use tiny pauses after punctuation to reset rhythm cleanly. Control first, then pace.',
    mood: 'consistency',
  },
  {
    id: 'tip-105',
    title: 'Speed Balance 105',
    detail: 'Prioritize smooth consistency before trying to accelerate. A light touch produces better endurance.',
    mood: 'flow',
  },
  {
    id: 'tip-106',
    title: 'Posture Check 106',
    detail: 'Track the next two letters to reduce reactive typing. Consistency will raise your WPM naturally.',
    mood: 'accuracy',
  },
  {
    id: 'tip-107',
    title: 'Hand Relaxation 107',
    detail: 'Keep wrists neutral and float the hands instead of resting hard. Precision now means fewer backspaces later.',
    mood: 'speed',
  },
  {
    id: 'tip-108',
    title: 'Breathing Marker 108',
    detail: 'If errors spike, reduce speed by 10 percent for one line. This helps lock muscle memory faster.',
    mood: 'consistency',
  },
  {
    id: 'tip-109',
    title: 'Finger Control 109',
    detail: 'Let each keystroke finish fully before moving to the next key. Stay calm and keep the same finger pattern.',
    mood: 'flow',
  },
  {
    id: 'tip-110',
    title: 'Tempo Guidance 110',
    detail: 'Breathe out slowly on longer words to prevent tension. Your best runs come from relaxed repetition.',
    mood: 'accuracy',
  },
  {
    id: 'tip-111',
    title: 'Soft Rhythm Cue 111',
    detail: 'Keep your shoulders loose and let the fingers return to home row. Your goal is an even cadence, not burst typing.',
    mood: 'speed',
  },
  {
    id: 'tip-112',
    title: 'Accuracy Anchor 112',
    detail: 'Look ahead one word while your fingers finish the current one. This keeps both speed and confidence stable.',
    mood: 'consistency',
  },
  {
    id: 'tip-113',
    title: 'Cadence Reminder 113',
    detail: 'Press with minimal force and avoid hammering the keycaps. Small corrections early prevent long error chains.',
    mood: 'flow',
  },
  {
    id: 'tip-114',
    title: 'Focus Signal 114',
    detail: 'Use tiny pauses after punctuation to reset rhythm cleanly. Control first, then pace.',
    mood: 'accuracy',
  },
  {
    id: 'tip-115',
    title: 'Speed Balance 115',
    detail: 'Prioritize smooth consistency before trying to accelerate. A light touch produces better endurance.',
    mood: 'speed',
  },
  {
    id: 'tip-116',
    title: 'Posture Check 116',
    detail: 'Track the next two letters to reduce reactive typing. Consistency will raise your WPM naturally.',
    mood: 'consistency',
  },
  {
    id: 'tip-117',
    title: 'Hand Relaxation 117',
    detail: 'Keep wrists neutral and float the hands instead of resting hard. Precision now means fewer backspaces later.',
    mood: 'flow',
  },
  {
    id: 'tip-118',
    title: 'Breathing Marker 118',
    detail: 'If errors spike, reduce speed by 10 percent for one line. This helps lock muscle memory faster.',
    mood: 'accuracy',
  },
  {
    id: 'tip-119',
    title: 'Finger Control 119',
    detail: 'Let each keystroke finish fully before moving to the next key. Stay calm and keep the same finger pattern.',
    mood: 'speed',
  },
  {
    id: 'tip-120',
    title: 'Tempo Guidance 120',
    detail: 'Breathe out slowly on longer words to prevent tension. Your best runs come from relaxed repetition.',
    mood: 'consistency',
  },
  {
    id: 'tip-121',
    title: 'Soft Rhythm Cue 121',
    detail: 'Keep your shoulders loose and let the fingers return to home row. Your goal is an even cadence, not burst typing.',
    mood: 'flow',
  },
  {
    id: 'tip-122',
    title: 'Accuracy Anchor 122',
    detail: 'Look ahead one word while your fingers finish the current one. This keeps both speed and confidence stable.',
    mood: 'accuracy',
  },
  {
    id: 'tip-123',
    title: 'Cadence Reminder 123',
    detail: 'Press with minimal force and avoid hammering the keycaps. Small corrections early prevent long error chains.',
    mood: 'speed',
  },
  {
    id: 'tip-124',
    title: 'Focus Signal 124',
    detail: 'Use tiny pauses after punctuation to reset rhythm cleanly. Control first, then pace.',
    mood: 'consistency',
  },
  {
    id: 'tip-125',
    title: 'Speed Balance 125',
    detail: 'Prioritize smooth consistency before trying to accelerate. A light touch produces better endurance.',
    mood: 'flow',
  },
  {
    id: 'tip-126',
    title: 'Posture Check 126',
    detail: 'Track the next two letters to reduce reactive typing. Consistency will raise your WPM naturally.',
    mood: 'accuracy',
  },
  {
    id: 'tip-127',
    title: 'Hand Relaxation 127',
    detail: 'Keep wrists neutral and float the hands instead of resting hard. Precision now means fewer backspaces later.',
    mood: 'speed',
  },
  {
    id: 'tip-128',
    title: 'Breathing Marker 128',
    detail: 'If errors spike, reduce speed by 10 percent for one line. This helps lock muscle memory faster.',
    mood: 'consistency',
  },
  {
    id: 'tip-129',
    title: 'Finger Control 129',
    detail: 'Let each keystroke finish fully before moving to the next key. Stay calm and keep the same finger pattern.',
    mood: 'flow',
  },
  {
    id: 'tip-130',
    title: 'Tempo Guidance 130',
    detail: 'Breathe out slowly on longer words to prevent tension. Your best runs come from relaxed repetition.',
    mood: 'accuracy',
  },
  {
    id: 'tip-131',
    title: 'Soft Rhythm Cue 131',
    detail: 'Keep your shoulders loose and let the fingers return to home row. Your goal is an even cadence, not burst typing.',
    mood: 'speed',
  },
  {
    id: 'tip-132',
    title: 'Accuracy Anchor 132',
    detail: 'Look ahead one word while your fingers finish the current one. This keeps both speed and confidence stable.',
    mood: 'consistency',
  },
  {
    id: 'tip-133',
    title: 'Cadence Reminder 133',
    detail: 'Press with minimal force and avoid hammering the keycaps. Small corrections early prevent long error chains.',
    mood: 'flow',
  },
  {
    id: 'tip-134',
    title: 'Focus Signal 134',
    detail: 'Use tiny pauses after punctuation to reset rhythm cleanly. Control first, then pace.',
    mood: 'accuracy',
  },
  {
    id: 'tip-135',
    title: 'Speed Balance 135',
    detail: 'Prioritize smooth consistency before trying to accelerate. A light touch produces better endurance.',
    mood: 'speed',
  },
  {
    id: 'tip-136',
    title: 'Posture Check 136',
    detail: 'Track the next two letters to reduce reactive typing. Consistency will raise your WPM naturally.',
    mood: 'consistency',
  },
  {
    id: 'tip-137',
    title: 'Hand Relaxation 137',
    detail: 'Keep wrists neutral and float the hands instead of resting hard. Precision now means fewer backspaces later.',
    mood: 'flow',
  },
  {
    id: 'tip-138',
    title: 'Breathing Marker 138',
    detail: 'If errors spike, reduce speed by 10 percent for one line. This helps lock muscle memory faster.',
    mood: 'accuracy',
  },
  {
    id: 'tip-139',
    title: 'Finger Control 139',
    detail: 'Let each keystroke finish fully before moving to the next key. Stay calm and keep the same finger pattern.',
    mood: 'speed',
  },
  {
    id: 'tip-140',
    title: 'Tempo Guidance 140',
    detail: 'Breathe out slowly on longer words to prevent tension. Your best runs come from relaxed repetition.',
    mood: 'consistency',
  },
  {
    id: 'tip-141',
    title: 'Soft Rhythm Cue 141',
    detail: 'Keep your shoulders loose and let the fingers return to home row. Your goal is an even cadence, not burst typing.',
    mood: 'flow',
  },
  {
    id: 'tip-142',
    title: 'Accuracy Anchor 142',
    detail: 'Look ahead one word while your fingers finish the current one. This keeps both speed and confidence stable.',
    mood: 'accuracy',
  },
  {
    id: 'tip-143',
    title: 'Cadence Reminder 143',
    detail: 'Press with minimal force and avoid hammering the keycaps. Small corrections early prevent long error chains.',
    mood: 'speed',
  },
  {
    id: 'tip-144',
    title: 'Focus Signal 144',
    detail: 'Use tiny pauses after punctuation to reset rhythm cleanly. Control first, then pace.',
    mood: 'consistency',
  },
  {
    id: 'tip-145',
    title: 'Speed Balance 145',
    detail: 'Prioritize smooth consistency before trying to accelerate. A light touch produces better endurance.',
    mood: 'flow',
  },
  {
    id: 'tip-146',
    title: 'Posture Check 146',
    detail: 'Track the next two letters to reduce reactive typing. Consistency will raise your WPM naturally.',
    mood: 'accuracy',
  },
  {
    id: 'tip-147',
    title: 'Hand Relaxation 147',
    detail: 'Keep wrists neutral and float the hands instead of resting hard. Precision now means fewer backspaces later.',
    mood: 'speed',
  },
  {
    id: 'tip-148',
    title: 'Breathing Marker 148',
    detail: 'If errors spike, reduce speed by 10 percent for one line. This helps lock muscle memory faster.',
    mood: 'consistency',
  },
  {
    id: 'tip-149',
    title: 'Finger Control 149',
    detail: 'Let each keystroke finish fully before moving to the next key. Stay calm and keep the same finger pattern.',
    mood: 'flow',
  },
  {
    id: 'tip-150',
    title: 'Tempo Guidance 150',
    detail: 'Breathe out slowly on longer words to prevent tension. Your best runs come from relaxed repetition.',
    mood: 'accuracy',
  },
  {
    id: 'tip-151',
    title: 'Soft Rhythm Cue 151',
    detail: 'Keep your shoulders loose and let the fingers return to home row. Your goal is an even cadence, not burst typing.',
    mood: 'speed',
  },
  {
    id: 'tip-152',
    title: 'Accuracy Anchor 152',
    detail: 'Look ahead one word while your fingers finish the current one. This keeps both speed and confidence stable.',
    mood: 'consistency',
  },
  {
    id: 'tip-153',
    title: 'Cadence Reminder 153',
    detail: 'Press with minimal force and avoid hammering the keycaps. Small corrections early prevent long error chains.',
    mood: 'flow',
  },
  {
    id: 'tip-154',
    title: 'Focus Signal 154',
    detail: 'Use tiny pauses after punctuation to reset rhythm cleanly. Control first, then pace.',
    mood: 'accuracy',
  },
  {
    id: 'tip-155',
    title: 'Speed Balance 155',
    detail: 'Prioritize smooth consistency before trying to accelerate. A light touch produces better endurance.',
    mood: 'speed',
  },
  {
    id: 'tip-156',
    title: 'Posture Check 156',
    detail: 'Track the next two letters to reduce reactive typing. Consistency will raise your WPM naturally.',
    mood: 'consistency',
  },
  {
    id: 'tip-157',
    title: 'Hand Relaxation 157',
    detail: 'Keep wrists neutral and float the hands instead of resting hard. Precision now means fewer backspaces later.',
    mood: 'flow',
  },
  {
    id: 'tip-158',
    title: 'Breathing Marker 158',
    detail: 'If errors spike, reduce speed by 10 percent for one line. This helps lock muscle memory faster.',
    mood: 'accuracy',
  },
  {
    id: 'tip-159',
    title: 'Finger Control 159',
    detail: 'Let each keystroke finish fully before moving to the next key. Stay calm and keep the same finger pattern.',
    mood: 'speed',
  },
  {
    id: 'tip-160',
    title: 'Tempo Guidance 160',
    detail: 'Breathe out slowly on longer words to prevent tension. Your best runs come from relaxed repetition.',
    mood: 'consistency',
  },
  {
    id: 'tip-161',
    title: 'Soft Rhythm Cue 161',
    detail: 'Keep your shoulders loose and let the fingers return to home row. Your goal is an even cadence, not burst typing.',
    mood: 'flow',
  },
  {
    id: 'tip-162',
    title: 'Accuracy Anchor 162',
    detail: 'Look ahead one word while your fingers finish the current one. This keeps both speed and confidence stable.',
    mood: 'accuracy',
  },
  {
    id: 'tip-163',
    title: 'Cadence Reminder 163',
    detail: 'Press with minimal force and avoid hammering the keycaps. Small corrections early prevent long error chains.',
    mood: 'speed',
  },
  {
    id: 'tip-164',
    title: 'Focus Signal 164',
    detail: 'Use tiny pauses after punctuation to reset rhythm cleanly. Control first, then pace.',
    mood: 'consistency',
  },
  {
    id: 'tip-165',
    title: 'Speed Balance 165',
    detail: 'Prioritize smooth consistency before trying to accelerate. A light touch produces better endurance.',
    mood: 'flow',
  },
  {
    id: 'tip-166',
    title: 'Posture Check 166',
    detail: 'Track the next two letters to reduce reactive typing. Consistency will raise your WPM naturally.',
    mood: 'accuracy',
  },
  {
    id: 'tip-167',
    title: 'Hand Relaxation 167',
    detail: 'Keep wrists neutral and float the hands instead of resting hard. Precision now means fewer backspaces later.',
    mood: 'speed',
  },
  {
    id: 'tip-168',
    title: 'Breathing Marker 168',
    detail: 'If errors spike, reduce speed by 10 percent for one line. This helps lock muscle memory faster.',
    mood: 'consistency',
  },
  {
    id: 'tip-169',
    title: 'Finger Control 169',
    detail: 'Let each keystroke finish fully before moving to the next key. Stay calm and keep the same finger pattern.',
    mood: 'flow',
  },
  {
    id: 'tip-170',
    title: 'Tempo Guidance 170',
    detail: 'Breathe out slowly on longer words to prevent tension. Your best runs come from relaxed repetition.',
    mood: 'accuracy',
  },
  {
    id: 'tip-171',
    title: 'Soft Rhythm Cue 171',
    detail: 'Keep your shoulders loose and let the fingers return to home row. Your goal is an even cadence, not burst typing.',
    mood: 'speed',
  },
  {
    id: 'tip-172',
    title: 'Accuracy Anchor 172',
    detail: 'Look ahead one word while your fingers finish the current one. This keeps both speed and confidence stable.',
    mood: 'consistency',
  },
  {
    id: 'tip-173',
    title: 'Cadence Reminder 173',
    detail: 'Press with minimal force and avoid hammering the keycaps. Small corrections early prevent long error chains.',
    mood: 'flow',
  },
  {
    id: 'tip-174',
    title: 'Focus Signal 174',
    detail: 'Use tiny pauses after punctuation to reset rhythm cleanly. Control first, then pace.',
    mood: 'accuracy',
  },
  {
    id: 'tip-175',
    title: 'Speed Balance 175',
    detail: 'Prioritize smooth consistency before trying to accelerate. A light touch produces better endurance.',
    mood: 'speed',
  },
  {
    id: 'tip-176',
    title: 'Posture Check 176',
    detail: 'Track the next two letters to reduce reactive typing. Consistency will raise your WPM naturally.',
    mood: 'consistency',
  },
  {
    id: 'tip-177',
    title: 'Hand Relaxation 177',
    detail: 'Keep wrists neutral and float the hands instead of resting hard. Precision now means fewer backspaces later.',
    mood: 'flow',
  },
  {
    id: 'tip-178',
    title: 'Breathing Marker 178',
    detail: 'If errors spike, reduce speed by 10 percent for one line. This helps lock muscle memory faster.',
    mood: 'accuracy',
  },
  {
    id: 'tip-179',
    title: 'Finger Control 179',
    detail: 'Let each keystroke finish fully before moving to the next key. Stay calm and keep the same finger pattern.',
    mood: 'speed',
  },
  {
    id: 'tip-180',
    title: 'Tempo Guidance 180',
    detail: 'Breathe out slowly on longer words to prevent tension. Your best runs come from relaxed repetition.',
    mood: 'consistency',
  },
  {
    id: 'tip-181',
    title: 'Soft Rhythm Cue 181',
    detail: 'Keep your shoulders loose and let the fingers return to home row. Your goal is an even cadence, not burst typing.',
    mood: 'flow',
  },
  {
    id: 'tip-182',
    title: 'Accuracy Anchor 182',
    detail: 'Look ahead one word while your fingers finish the current one. This keeps both speed and confidence stable.',
    mood: 'accuracy',
  },
  {
    id: 'tip-183',
    title: 'Cadence Reminder 183',
    detail: 'Press with minimal force and avoid hammering the keycaps. Small corrections early prevent long error chains.',
    mood: 'speed',
  },
  {
    id: 'tip-184',
    title: 'Focus Signal 184',
    detail: 'Use tiny pauses after punctuation to reset rhythm cleanly. Control first, then pace.',
    mood: 'consistency',
  },
  {
    id: 'tip-185',
    title: 'Speed Balance 185',
    detail: 'Prioritize smooth consistency before trying to accelerate. A light touch produces better endurance.',
    mood: 'flow',
  },
  {
    id: 'tip-186',
    title: 'Posture Check 186',
    detail: 'Track the next two letters to reduce reactive typing. Consistency will raise your WPM naturally.',
    mood: 'accuracy',
  },
  {
    id: 'tip-187',
    title: 'Hand Relaxation 187',
    detail: 'Keep wrists neutral and float the hands instead of resting hard. Precision now means fewer backspaces later.',
    mood: 'speed',
  },
  {
    id: 'tip-188',
    title: 'Breathing Marker 188',
    detail: 'If errors spike, reduce speed by 10 percent for one line. This helps lock muscle memory faster.',
    mood: 'consistency',
  },
  {
    id: 'tip-189',
    title: 'Finger Control 189',
    detail: 'Let each keystroke finish fully before moving to the next key. Stay calm and keep the same finger pattern.',
    mood: 'flow',
  },
  {
    id: 'tip-190',
    title: 'Tempo Guidance 190',
    detail: 'Breathe out slowly on longer words to prevent tension. Your best runs come from relaxed repetition.',
    mood: 'accuracy',
  },
  {
    id: 'tip-191',
    title: 'Soft Rhythm Cue 191',
    detail: 'Keep your shoulders loose and let the fingers return to home row. Your goal is an even cadence, not burst typing.',
    mood: 'speed',
  },
  {
    id: 'tip-192',
    title: 'Accuracy Anchor 192',
    detail: 'Look ahead one word while your fingers finish the current one. This keeps both speed and confidence stable.',
    mood: 'consistency',
  },
  {
    id: 'tip-193',
    title: 'Cadence Reminder 193',
    detail: 'Press with minimal force and avoid hammering the keycaps. Small corrections early prevent long error chains.',
    mood: 'flow',
  },
  {
    id: 'tip-194',
    title: 'Focus Signal 194',
    detail: 'Use tiny pauses after punctuation to reset rhythm cleanly. Control first, then pace.',
    mood: 'accuracy',
  },
  {
    id: 'tip-195',
    title: 'Speed Balance 195',
    detail: 'Prioritize smooth consistency before trying to accelerate. A light touch produces better endurance.',
    mood: 'speed',
  },
  {
    id: 'tip-196',
    title: 'Posture Check 196',
    detail: 'Track the next two letters to reduce reactive typing. Consistency will raise your WPM naturally.',
    mood: 'consistency',
  },
  {
    id: 'tip-197',
    title: 'Hand Relaxation 197',
    detail: 'Keep wrists neutral and float the hands instead of resting hard. Precision now means fewer backspaces later.',
    mood: 'flow',
  },
  {
    id: 'tip-198',
    title: 'Breathing Marker 198',
    detail: 'If errors spike, reduce speed by 10 percent for one line. This helps lock muscle memory faster.',
    mood: 'accuracy',
  },
  {
    id: 'tip-199',
    title: 'Finger Control 199',
    detail: 'Let each keystroke finish fully before moving to the next key. Stay calm and keep the same finger pattern.',
    mood: 'speed',
  },
  {
    id: 'tip-200',
    title: 'Tempo Guidance 200',
    detail: 'Breathe out slowly on longer words to prevent tension. Your best runs come from relaxed repetition.',
    mood: 'consistency',
  },
  {
    id: 'tip-201',
    title: 'Soft Rhythm Cue 201',
    detail: 'Keep your shoulders loose and let the fingers return to home row. Your goal is an even cadence, not burst typing.',
    mood: 'flow',
  },
  {
    id: 'tip-202',
    title: 'Accuracy Anchor 202',
    detail: 'Look ahead one word while your fingers finish the current one. This keeps both speed and confidence stable.',
    mood: 'accuracy',
  },
  {
    id: 'tip-203',
    title: 'Cadence Reminder 203',
    detail: 'Press with minimal force and avoid hammering the keycaps. Small corrections early prevent long error chains.',
    mood: 'speed',
  },
  {
    id: 'tip-204',
    title: 'Focus Signal 204',
    detail: 'Use tiny pauses after punctuation to reset rhythm cleanly. Control first, then pace.',
    mood: 'consistency',
  },
  {
    id: 'tip-205',
    title: 'Speed Balance 205',
    detail: 'Prioritize smooth consistency before trying to accelerate. A light touch produces better endurance.',
    mood: 'flow',
  },
  {
    id: 'tip-206',
    title: 'Posture Check 206',
    detail: 'Track the next two letters to reduce reactive typing. Consistency will raise your WPM naturally.',
    mood: 'accuracy',
  },
  {
    id: 'tip-207',
    title: 'Hand Relaxation 207',
    detail: 'Keep wrists neutral and float the hands instead of resting hard. Precision now means fewer backspaces later.',
    mood: 'speed',
  },
  {
    id: 'tip-208',
    title: 'Breathing Marker 208',
    detail: 'If errors spike, reduce speed by 10 percent for one line. This helps lock muscle memory faster.',
    mood: 'consistency',
  },
  {
    id: 'tip-209',
    title: 'Finger Control 209',
    detail: 'Let each keystroke finish fully before moving to the next key. Stay calm and keep the same finger pattern.',
    mood: 'flow',
  },
  {
    id: 'tip-210',
    title: 'Tempo Guidance 210',
    detail: 'Breathe out slowly on longer words to prevent tension. Your best runs come from relaxed repetition.',
    mood: 'accuracy',
  },
  {
    id: 'tip-211',
    title: 'Soft Rhythm Cue 211',
    detail: 'Keep your shoulders loose and let the fingers return to home row. Your goal is an even cadence, not burst typing.',
    mood: 'speed',
  },
  {
    id: 'tip-212',
    title: 'Accuracy Anchor 212',
    detail: 'Look ahead one word while your fingers finish the current one. This keeps both speed and confidence stable.',
    mood: 'consistency',
  },
  {
    id: 'tip-213',
    title: 'Cadence Reminder 213',
    detail: 'Press with minimal force and avoid hammering the keycaps. Small corrections early prevent long error chains.',
    mood: 'flow',
  },
  {
    id: 'tip-214',
    title: 'Focus Signal 214',
    detail: 'Use tiny pauses after punctuation to reset rhythm cleanly. Control first, then pace.',
    mood: 'accuracy',
  },
  {
    id: 'tip-215',
    title: 'Speed Balance 215',
    detail: 'Prioritize smooth consistency before trying to accelerate. A light touch produces better endurance.',
    mood: 'speed',
  },
  {
    id: 'tip-216',
    title: 'Posture Check 216',
    detail: 'Track the next two letters to reduce reactive typing. Consistency will raise your WPM naturally.',
    mood: 'consistency',
  },
  {
    id: 'tip-217',
    title: 'Hand Relaxation 217',
    detail: 'Keep wrists neutral and float the hands instead of resting hard. Precision now means fewer backspaces later.',
    mood: 'flow',
  },
  {
    id: 'tip-218',
    title: 'Breathing Marker 218',
    detail: 'If errors spike, reduce speed by 10 percent for one line. This helps lock muscle memory faster.',
    mood: 'accuracy',
  },
  {
    id: 'tip-219',
    title: 'Finger Control 219',
    detail: 'Let each keystroke finish fully before moving to the next key. Stay calm and keep the same finger pattern.',
    mood: 'speed',
  },
  {
    id: 'tip-220',
    title: 'Tempo Guidance 220',
    detail: 'Breathe out slowly on longer words to prevent tension. Your best runs come from relaxed repetition.',
    mood: 'consistency',
  },
  {
    id: 'tip-221',
    title: 'Soft Rhythm Cue 221',
    detail: 'Keep your shoulders loose and let the fingers return to home row. Your goal is an even cadence, not burst typing.',
    mood: 'flow',
  },
  {
    id: 'tip-222',
    title: 'Accuracy Anchor 222',
    detail: 'Look ahead one word while your fingers finish the current one. This keeps both speed and confidence stable.',
    mood: 'accuracy',
  },
  {
    id: 'tip-223',
    title: 'Cadence Reminder 223',
    detail: 'Press with minimal force and avoid hammering the keycaps. Small corrections early prevent long error chains.',
    mood: 'speed',
  },
  {
    id: 'tip-224',
    title: 'Focus Signal 224',
    detail: 'Use tiny pauses after punctuation to reset rhythm cleanly. Control first, then pace.',
    mood: 'consistency',
  },
  {
    id: 'tip-225',
    title: 'Speed Balance 225',
    detail: 'Prioritize smooth consistency before trying to accelerate. A light touch produces better endurance.',
    mood: 'flow',
  },
  {
    id: 'tip-226',
    title: 'Posture Check 226',
    detail: 'Track the next two letters to reduce reactive typing. Consistency will raise your WPM naturally.',
    mood: 'accuracy',
  },
  {
    id: 'tip-227',
    title: 'Hand Relaxation 227',
    detail: 'Keep wrists neutral and float the hands instead of resting hard. Precision now means fewer backspaces later.',
    mood: 'speed',
  },
  {
    id: 'tip-228',
    title: 'Breathing Marker 228',
    detail: 'If errors spike, reduce speed by 10 percent for one line. This helps lock muscle memory faster.',
    mood: 'consistency',
  },
  {
    id: 'tip-229',
    title: 'Finger Control 229',
    detail: 'Let each keystroke finish fully before moving to the next key. Stay calm and keep the same finger pattern.',
    mood: 'flow',
  },
  {
    id: 'tip-230',
    title: 'Tempo Guidance 230',
    detail: 'Breathe out slowly on longer words to prevent tension. Your best runs come from relaxed repetition.',
    mood: 'accuracy',
  },
  {
    id: 'tip-231',
    title: 'Soft Rhythm Cue 231',
    detail: 'Keep your shoulders loose and let the fingers return to home row. Your goal is an even cadence, not burst typing.',
    mood: 'speed',
  },
  {
    id: 'tip-232',
    title: 'Accuracy Anchor 232',
    detail: 'Look ahead one word while your fingers finish the current one. This keeps both speed and confidence stable.',
    mood: 'consistency',
  },
  {
    id: 'tip-233',
    title: 'Cadence Reminder 233',
    detail: 'Press with minimal force and avoid hammering the keycaps. Small corrections early prevent long error chains.',
    mood: 'flow',
  },
  {
    id: 'tip-234',
    title: 'Focus Signal 234',
    detail: 'Use tiny pauses after punctuation to reset rhythm cleanly. Control first, then pace.',
    mood: 'accuracy',
  },
  {
    id: 'tip-235',
    title: 'Speed Balance 235',
    detail: 'Prioritize smooth consistency before trying to accelerate. A light touch produces better endurance.',
    mood: 'speed',
  },
  {
    id: 'tip-236',
    title: 'Posture Check 236',
    detail: 'Track the next two letters to reduce reactive typing. Consistency will raise your WPM naturally.',
    mood: 'consistency',
  },
  {
    id: 'tip-237',
    title: 'Hand Relaxation 237',
    detail: 'Keep wrists neutral and float the hands instead of resting hard. Precision now means fewer backspaces later.',
    mood: 'flow',
  },
  {
    id: 'tip-238',
    title: 'Breathing Marker 238',
    detail: 'If errors spike, reduce speed by 10 percent for one line. This helps lock muscle memory faster.',
    mood: 'accuracy',
  },
  {
    id: 'tip-239',
    title: 'Finger Control 239',
    detail: 'Let each keystroke finish fully before moving to the next key. Stay calm and keep the same finger pattern.',
    mood: 'speed',
  },
  {
    id: 'tip-240',
    title: 'Tempo Guidance 240',
    detail: 'Breathe out slowly on longer words to prevent tension. Your best runs come from relaxed repetition.',
    mood: 'consistency',
  },
  {
    id: 'tip-241',
    title: 'Soft Rhythm Cue 241',
    detail: 'Keep your shoulders loose and let the fingers return to home row. Your goal is an even cadence, not burst typing.',
    mood: 'flow',
  },
  {
    id: 'tip-242',
    title: 'Accuracy Anchor 242',
    detail: 'Look ahead one word while your fingers finish the current one. This keeps both speed and confidence stable.',
    mood: 'accuracy',
  },
  {
    id: 'tip-243',
    title: 'Cadence Reminder 243',
    detail: 'Press with minimal force and avoid hammering the keycaps. Small corrections early prevent long error chains.',
    mood: 'speed',
  },
  {
    id: 'tip-244',
    title: 'Focus Signal 244',
    detail: 'Use tiny pauses after punctuation to reset rhythm cleanly. Control first, then pace.',
    mood: 'consistency',
  },
  {
    id: 'tip-245',
    title: 'Speed Balance 245',
    detail: 'Prioritize smooth consistency before trying to accelerate. A light touch produces better endurance.',
    mood: 'flow',
  },
  {
    id: 'tip-246',
    title: 'Posture Check 246',
    detail: 'Track the next two letters to reduce reactive typing. Consistency will raise your WPM naturally.',
    mood: 'accuracy',
  },
  {
    id: 'tip-247',
    title: 'Hand Relaxation 247',
    detail: 'Keep wrists neutral and float the hands instead of resting hard. Precision now means fewer backspaces later.',
    mood: 'speed',
  },
  {
    id: 'tip-248',
    title: 'Breathing Marker 248',
    detail: 'If errors spike, reduce speed by 10 percent for one line. This helps lock muscle memory faster.',
    mood: 'consistency',
  },
  {
    id: 'tip-249',
    title: 'Finger Control 249',
    detail: 'Let each keystroke finish fully before moving to the next key. Stay calm and keep the same finger pattern.',
    mood: 'flow',
  },
  {
    id: 'tip-250',
    title: 'Tempo Guidance 250',
    detail: 'Breathe out slowly on longer words to prevent tension. Your best runs come from relaxed repetition.',
    mood: 'accuracy',
  },
  {
    id: 'tip-251',
    title: 'Soft Rhythm Cue 251',
    detail: 'Keep your shoulders loose and let the fingers return to home row. Your goal is an even cadence, not burst typing.',
    mood: 'speed',
  },
  {
    id: 'tip-252',
    title: 'Accuracy Anchor 252',
    detail: 'Look ahead one word while your fingers finish the current one. This keeps both speed and confidence stable.',
    mood: 'consistency',
  },
  {
    id: 'tip-253',
    title: 'Cadence Reminder 253',
    detail: 'Press with minimal force and avoid hammering the keycaps. Small corrections early prevent long error chains.',
    mood: 'flow',
  },
  {
    id: 'tip-254',
    title: 'Focus Signal 254',
    detail: 'Use tiny pauses after punctuation to reset rhythm cleanly. Control first, then pace.',
    mood: 'accuracy',
  },
  {
    id: 'tip-255',
    title: 'Speed Balance 255',
    detail: 'Prioritize smooth consistency before trying to accelerate. A light touch produces better endurance.',
    mood: 'speed',
  },
  {
    id: 'tip-256',
    title: 'Posture Check 256',
    detail: 'Track the next two letters to reduce reactive typing. Consistency will raise your WPM naturally.',
    mood: 'consistency',
  },
  {
    id: 'tip-257',
    title: 'Hand Relaxation 257',
    detail: 'Keep wrists neutral and float the hands instead of resting hard. Precision now means fewer backspaces later.',
    mood: 'flow',
  },
  {
    id: 'tip-258',
    title: 'Breathing Marker 258',
    detail: 'If errors spike, reduce speed by 10 percent for one line. This helps lock muscle memory faster.',
    mood: 'accuracy',
  },
  {
    id: 'tip-259',
    title: 'Finger Control 259',
    detail: 'Let each keystroke finish fully before moving to the next key. Stay calm and keep the same finger pattern.',
    mood: 'speed',
  },
  {
    id: 'tip-260',
    title: 'Tempo Guidance 260',
    detail: 'Breathe out slowly on longer words to prevent tension. Your best runs come from relaxed repetition.',
    mood: 'consistency',
  },
  {
    id: 'tip-261',
    title: 'Soft Rhythm Cue 261',
    detail: 'Keep your shoulders loose and let the fingers return to home row. Your goal is an even cadence, not burst typing.',
    mood: 'flow',
  },
  {
    id: 'tip-262',
    title: 'Accuracy Anchor 262',
    detail: 'Look ahead one word while your fingers finish the current one. This keeps both speed and confidence stable.',
    mood: 'accuracy',
  },
  {
    id: 'tip-263',
    title: 'Cadence Reminder 263',
    detail: 'Press with minimal force and avoid hammering the keycaps. Small corrections early prevent long error chains.',
    mood: 'speed',
  },
  {
    id: 'tip-264',
    title: 'Focus Signal 264',
    detail: 'Use tiny pauses after punctuation to reset rhythm cleanly. Control first, then pace.',
    mood: 'consistency',
  },
  {
    id: 'tip-265',
    title: 'Speed Balance 265',
    detail: 'Prioritize smooth consistency before trying to accelerate. A light touch produces better endurance.',
    mood: 'flow',
  },
  {
    id: 'tip-266',
    title: 'Posture Check 266',
    detail: 'Track the next two letters to reduce reactive typing. Consistency will raise your WPM naturally.',
    mood: 'accuracy',
  },
  {
    id: 'tip-267',
    title: 'Hand Relaxation 267',
    detail: 'Keep wrists neutral and float the hands instead of resting hard. Precision now means fewer backspaces later.',
    mood: 'speed',
  },
  {
    id: 'tip-268',
    title: 'Breathing Marker 268',
    detail: 'If errors spike, reduce speed by 10 percent for one line. This helps lock muscle memory faster.',
    mood: 'consistency',
  },
  {
    id: 'tip-269',
    title: 'Finger Control 269',
    detail: 'Let each keystroke finish fully before moving to the next key. Stay calm and keep the same finger pattern.',
    mood: 'flow',
  },
  {
    id: 'tip-270',
    title: 'Tempo Guidance 270',
    detail: 'Breathe out slowly on longer words to prevent tension. Your best runs come from relaxed repetition.',
    mood: 'accuracy',
  },
  {
    id: 'tip-271',
    title: 'Soft Rhythm Cue 271',
    detail: 'Keep your shoulders loose and let the fingers return to home row. Your goal is an even cadence, not burst typing.',
    mood: 'speed',
  },
  {
    id: 'tip-272',
    title: 'Accuracy Anchor 272',
    detail: 'Look ahead one word while your fingers finish the current one. This keeps both speed and confidence stable.',
    mood: 'consistency',
  },
  {
    id: 'tip-273',
    title: 'Cadence Reminder 273',
    detail: 'Press with minimal force and avoid hammering the keycaps. Small corrections early prevent long error chains.',
    mood: 'flow',
  },
  {
    id: 'tip-274',
    title: 'Focus Signal 274',
    detail: 'Use tiny pauses after punctuation to reset rhythm cleanly. Control first, then pace.',
    mood: 'accuracy',
  },
  {
    id: 'tip-275',
    title: 'Speed Balance 275',
    detail: 'Prioritize smooth consistency before trying to accelerate. A light touch produces better endurance.',
    mood: 'speed',
  },
  {
    id: 'tip-276',
    title: 'Posture Check 276',
    detail: 'Track the next two letters to reduce reactive typing. Consistency will raise your WPM naturally.',
    mood: 'consistency',
  },
  {
    id: 'tip-277',
    title: 'Hand Relaxation 277',
    detail: 'Keep wrists neutral and float the hands instead of resting hard. Precision now means fewer backspaces later.',
    mood: 'flow',
  },
  {
    id: 'tip-278',
    title: 'Breathing Marker 278',
    detail: 'If errors spike, reduce speed by 10 percent for one line. This helps lock muscle memory faster.',
    mood: 'accuracy',
  },
  {
    id: 'tip-279',
    title: 'Finger Control 279',
    detail: 'Let each keystroke finish fully before moving to the next key. Stay calm and keep the same finger pattern.',
    mood: 'speed',
  },
  {
    id: 'tip-280',
    title: 'Tempo Guidance 280',
    detail: 'Breathe out slowly on longer words to prevent tension. Your best runs come from relaxed repetition.',
    mood: 'consistency',
  },
  {
    id: 'tip-281',
    title: 'Soft Rhythm Cue 281',
    detail: 'Keep your shoulders loose and let the fingers return to home row. Your goal is an even cadence, not burst typing.',
    mood: 'flow',
  },
  {
    id: 'tip-282',
    title: 'Accuracy Anchor 282',
    detail: 'Look ahead one word while your fingers finish the current one. This keeps both speed and confidence stable.',
    mood: 'accuracy',
  },
  {
    id: 'tip-283',
    title: 'Cadence Reminder 283',
    detail: 'Press with minimal force and avoid hammering the keycaps. Small corrections early prevent long error chains.',
    mood: 'speed',
  },
  {
    id: 'tip-284',
    title: 'Focus Signal 284',
    detail: 'Use tiny pauses after punctuation to reset rhythm cleanly. Control first, then pace.',
    mood: 'consistency',
  },
  {
    id: 'tip-285',
    title: 'Speed Balance 285',
    detail: 'Prioritize smooth consistency before trying to accelerate. A light touch produces better endurance.',
    mood: 'flow',
  },
  {
    id: 'tip-286',
    title: 'Posture Check 286',
    detail: 'Track the next two letters to reduce reactive typing. Consistency will raise your WPM naturally.',
    mood: 'accuracy',
  },
  {
    id: 'tip-287',
    title: 'Hand Relaxation 287',
    detail: 'Keep wrists neutral and float the hands instead of resting hard. Precision now means fewer backspaces later.',
    mood: 'speed',
  },
  {
    id: 'tip-288',
    title: 'Breathing Marker 288',
    detail: 'If errors spike, reduce speed by 10 percent for one line. This helps lock muscle memory faster.',
    mood: 'consistency',
  },
  {
    id: 'tip-289',
    title: 'Finger Control 289',
    detail: 'Let each keystroke finish fully before moving to the next key. Stay calm and keep the same finger pattern.',
    mood: 'flow',
  },
  {
    id: 'tip-290',
    title: 'Tempo Guidance 290',
    detail: 'Breathe out slowly on longer words to prevent tension. Your best runs come from relaxed repetition.',
    mood: 'accuracy',
  },
  {
    id: 'tip-291',
    title: 'Soft Rhythm Cue 291',
    detail: 'Keep your shoulders loose and let the fingers return to home row. Your goal is an even cadence, not burst typing.',
    mood: 'speed',
  },
  {
    id: 'tip-292',
    title: 'Accuracy Anchor 292',
    detail: 'Look ahead one word while your fingers finish the current one. This keeps both speed and confidence stable.',
    mood: 'consistency',
  },
  {
    id: 'tip-293',
    title: 'Cadence Reminder 293',
    detail: 'Press with minimal force and avoid hammering the keycaps. Small corrections early prevent long error chains.',
    mood: 'flow',
  },
  {
    id: 'tip-294',
    title: 'Focus Signal 294',
    detail: 'Use tiny pauses after punctuation to reset rhythm cleanly. Control first, then pace.',
    mood: 'accuracy',
  },
  {
    id: 'tip-295',
    title: 'Speed Balance 295',
    detail: 'Prioritize smooth consistency before trying to accelerate. A light touch produces better endurance.',
    mood: 'speed',
  },
  {
    id: 'tip-296',
    title: 'Posture Check 296',
    detail: 'Track the next two letters to reduce reactive typing. Consistency will raise your WPM naturally.',
    mood: 'consistency',
  },
  {
    id: 'tip-297',
    title: 'Hand Relaxation 297',
    detail: 'Keep wrists neutral and float the hands instead of resting hard. Precision now means fewer backspaces later.',
    mood: 'flow',
  },
  {
    id: 'tip-298',
    title: 'Breathing Marker 298',
    detail: 'If errors spike, reduce speed by 10 percent for one line. This helps lock muscle memory faster.',
    mood: 'accuracy',
  },
  {
    id: 'tip-299',
    title: 'Finger Control 299',
    detail: 'Let each keystroke finish fully before moving to the next key. Stay calm and keep the same finger pattern.',
    mood: 'speed',
  },
  {
    id: 'tip-300',
    title: 'Tempo Guidance 300',
    detail: 'Breathe out slowly on longer words to prevent tension. Your best runs come from relaxed repetition.',
    mood: 'consistency',
  },
];

const clampPercent = (value: number) => Math.max(0, Math.min(100, value));

const formatPercent = (value: number) => `${clampPercent(value).toFixed(0)}%`;
const COACH_TIP_ROTATION_SECONDS = 30;

const getTopErrorKeys = (errorMap: Record<string, number>, limit = 4): Array<[string, number]> => {
  return Object.entries(errorMap)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
};

export default function LessonPracticePage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);

  // Typing state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [errors, setErrors] = useState<number[]>([]);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [activeKey, setActiveKey] = useState<string | null>(null);

  // Stats
  const [correctKeystrokes, setCorrectKeystrokes] = useState(0);
  const [incorrectKeystrokes, setIncorrectKeystrokes] = useState(0);
  const [backspaceCount, setBackspaceCount] = useState(0);
  const [errorKeys, setErrorKeys] = useState<Record<string, number>>({});
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const currentCharRef = useRef<HTMLSpanElement>(null);
  const contentContainerRef = useRef<HTMLDivElement>(null);
  const keyboardViewportRef = useRef<HTMLDivElement>(null);
  const keyboardContentRef = useRef<HTMLDivElement>(null);
  const [keyboardScale, setKeyboardScale] = useState(1);

  useEffect(() => {
    if (lessonId) {
      loadLesson();
    }
  }, [lessonId]);

  useEffect(() => {
    if (started && !finished && inputRef.current) {
      inputRef.current.focus();
    }
  }, [started, finished]);

  useEffect(() => {
    if (!started || finished) return;
    const container = contentContainerRef.current;
    const currentChar = currentCharRef.current;
    if (!container || !currentChar) return;

    requestAnimationFrame(() => {
      const containerRect = container.getBoundingClientRect();
      const charRect = currentChar.getBoundingClientRect();
      if (charRect.top < containerRect.top || charRect.bottom > containerRect.bottom) {
        currentChar.scrollIntoView({ block: 'center', inline: 'nearest' });
      }
    });
  }, [currentIndex, started, finished]);

  useEffect(() => {
    if (!started || finished || !startTime) return;
    setElapsedSeconds(0);
    const timer = setInterval(() => {
      setElapsedSeconds(Math.round((Date.now() - startTime) / 1000));
    }, 500);
    return () => clearInterval(timer);
  }, [started, finished, startTime]);

  useEffect(() => {
    const viewport = keyboardViewportRef.current;
    const content = keyboardContentRef.current;
    if (!viewport || !content || typeof ResizeObserver === 'undefined') return;

    let frameId: number | null = null;

    const applyScale = () => {
      frameId = null;
      const availableWidth = viewport.clientWidth - 4;
      const availableHeight = viewport.clientHeight - 4;
      const contentWidth = content.scrollWidth;
      const contentHeight = content.scrollHeight;

      if (availableWidth <= 0 || availableHeight <= 0 || contentWidth <= 0 || contentHeight <= 0) {
        return;
      }

      const nextScale = Math.min(1, availableWidth / contentWidth, availableHeight / contentHeight);
      setKeyboardScale((prev) => (Math.abs(prev - nextScale) < 0.01 ? prev : nextScale));
    };

    const scheduleScale = () => {
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }
      frameId = requestAnimationFrame(applyScale);
    };

    const observer = new ResizeObserver(scheduleScale);
    observer.observe(viewport);
    observer.observe(content);
    window.addEventListener('resize', scheduleScale);
    scheduleScale();

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', scheduleScale);
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }
    };
  }, []);

  const loadLesson = async () => {
    if (!lessonId) return;

    setLoading(true);
    const data = await lessonApi.getLesson(lessonId);
    setLesson(data);
    setLoading(false);
  };

  const handleStart = () => {
    setStarted(true);
    setStartTime(Date.now());
    setCurrentIndex(0);
    setTypedText('');
    setErrors([]);
    setCorrectKeystrokes(0);
    setIncorrectKeystrokes(0);
    setBackspaceCount(0);
    setErrorKeys({});
    setFinished(false);
  };

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!lesson || finished) return;

      if (!started) {
        setStarted(true);
        setStartTime(Date.now());
      }

      const targetText = lesson.content;
      const key = e.key;
      setActiveKey(key);

      if (key === 'Tab') {
        e.preventDefault();
        return;
      }

      if (key === 'Backspace') {
        e.preventDefault();
        setBackspaceCount((prev) => prev + 1);
        if (errors.includes(currentIndex)) {
          setErrors((prev) => prev.filter((idx) => idx !== currentIndex));
          return;
        }
        if (currentIndex > 0) {
          setCurrentIndex((prev) => prev - 1);
          setTypedText((prev) => prev.slice(0, -1));
          setErrors((prev) => prev.filter((idx) => idx !== currentIndex - 1));
        }
        return;
      }

      const inputChar = key === 'Enter' ? '\n' : key;
      if (inputChar.length !== 1) return; // Ignore special keys
      e.preventDefault();

      const expectedChar = targetText[currentIndex];
      const isCorrect = inputChar === expectedChar;

      if (isCorrect) {
        setCorrectKeystrokes((prev) => prev + 1);
        setErrors((prev) => prev.filter((idx) => idx !== currentIndex));
        setTypedText((prev) => prev + inputChar);
        setCurrentIndex((prev) => prev + 1);
      } else {
        setIncorrectKeystrokes((prev) => prev + 1);
        setErrors((prev) => (prev.includes(currentIndex) ? prev : [...prev, currentIndex]));
        setErrorKeys((prev) => ({
          ...prev,
          [expectedChar]: (prev[expectedChar] || 0) + 1,
        }));
        return;
      }

      // Check if finished
      if (currentIndex + 1 >= targetText.length) {
        handleFinish();
      }
    },
    [lesson, started, finished, currentIndex, errors]
  );

  const handleKeyUp = () => {
    setActiveKey(null);
  };

  const handleBlur = () => {
    if (started && !finished) {
      // Re-focus so typing continues even after clicking outside
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const handleFinish = async () => {
    if (!lesson || !user || !startTime) return;

    const end = Date.now();
    setFinished(true);

    const durationSeconds = Math.round((end - startTime) / 1000);
    setElapsedSeconds(durationSeconds);
    const totalKeystrokes = correctKeystrokes + incorrectKeystrokes;
    const accuracy = totalKeystrokes > 0 ? (correctKeystrokes / totalKeystrokes) * 100 : 0;
    const cpm = Math.round((correctKeystrokes / durationSeconds) * 60);
    const wpm = Math.round(cpm / 5);

    const sessionData: TypingSessionData = {
      lesson_id: lesson.id,
      wpm,
      cpm,
      accuracy: Math.round(accuracy * 100) / 100,
      total_keystrokes: totalKeystrokes,
      correct_keystrokes: correctKeystrokes,
      incorrect_keystrokes: incorrectKeystrokes,
      backspace_count: backspaceCount,
      error_keys: errorKeys,
      duration_seconds: durationSeconds,
    };

    // Save session
    await typingSessionApi.createSession(user.id, sessionData);

    // Update lesson progress
    const progress = await lessonProgressApi.getProgress(user.id, lesson.id);
    const isNewBest = !progress || !progress.best_wpm || wpm > progress.best_wpm;
    const isCompleted = accuracy >= 90 && wpm >= 20; // Completion criteria

    await lessonProgressApi.upsertProgress({
      user_id: user.id,
      lesson_id: lesson.id,
      completed: isCompleted || (progress?.completed || false),
      best_wpm: isNewBest ? wpm : progress?.best_wpm || wpm,
      best_accuracy: isNewBest ? accuracy : progress?.best_accuracy || accuracy,
      attempts: (progress?.attempts || 0) + 1,
      last_practiced_at: new Date().toISOString(),
    });

    // Update daily statistics
    const today = new Date().toISOString().split('T')[0];
    await statisticsApi.upsertDailyStats(user.id, today, {
      total_sessions: 1,
      total_keystrokes: totalKeystrokes,
      total_duration_seconds: durationSeconds,
      average_wpm: wpm,
      average_accuracy: accuracy,
      lessons_completed: isCompleted ? 1 : 0,
    });

    toast({
      title: 'Lesson Complete!',
      description: `You typed at ${wpm} WPM with ${accuracy.toFixed(1)}% accuracy.`,
    });

    // Auto-navigate to next lesson if completed
    if (isCompleted) {
      const allLessons = await lessonApi.getAllLessons();
      const currentIndex = allLessons.findIndex(l => l.id === lesson.id);
      if (currentIndex !== -1 && currentIndex < allLessons.length - 1) {
        const nextLesson = allLessons[currentIndex + 1];
        setTimeout(() => {
          toast({
            title: 'Great job!',
            description: 'Moving to the next lesson...',
          });
          navigate(`/lesson/${nextLesson.id}`);
        }, 3000);
      }
    }
  };

  const currentWordRange = useMemo(() => {
    if (!lesson) return { start: 0, end: 0 };
    const text = lesson.content;
    if (!text.length) return { start: 0, end: 0 };

    const isWhitespace = (char: string) => /\s/.test(char);
    let start = currentIndex;
    let end = currentIndex;

    if (isWhitespace(text[currentIndex] || '')) {
      let i = currentIndex + 1;
      while (i < text.length && isWhitespace(text[i])) i += 1;
      start = i;
      end = i;
    } else {
      while (start > 0 && !isWhitespace(text[start - 1])) start -= 1;
      end = currentIndex;
    }

    while (end < text.length && !isWhitespace(text[end])) end += 1;
    return { start, end };
  }, [lesson, currentIndex]);

  const getCharClassName = (index: number) => {
    const inCurrentWord = index >= currentWordRange.start && index < currentWordRange.end;
    if (index === currentIndex) {
      return errors.includes(index)
        ? 'text-destructive bg-destructive/20 border-b-2 border-destructive'
        : 'bg-primary/20 border-b-2 border-primary';
    }
    if (index < currentIndex) {
      return errors.includes(index) ? 'text-destructive bg-destructive/20' : 'text-success';
    }
    return inCurrentWord ? 'bg-accent/40 text-foreground' : 'text-muted-foreground';
  };

  const currentChar = lesson && currentIndex < lesson.content.length ? lesson.content[currentIndex] : '';

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64 bg-muted" />
        <Skeleton className="h-96 w-full bg-muted" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Lesson not found</AlertDescription>
      </Alert>
    );
  }

  const difficultyValue = lesson?.difficulty ?? 'beginner';
  const difficultyLabel =
    difficultyValue === 'beginner'
      ? 'Beginner'
      : difficultyValue === 'intermediate'
        ? 'Intermediate'
        : 'Advanced';
  const difficultyTheme = DIFFICULTY_THEMES[difficultyValue] ?? DIFFICULTY_THEMES.beginner;

  const liveDurationSeconds = elapsedSeconds;
  const totalKeystrokes = correctKeystrokes + incorrectKeystrokes;
  const accuracy = totalKeystrokes > 0 ? (correctKeystrokes / totalKeystrokes) * 100 : 0;
  const cpm = liveDurationSeconds > 0 ? Math.round((correctKeystrokes / liveDurationSeconds) * 60) : 0;
  const wpm = Math.round(cpm / 5);
  const completionPercent = lesson.content.length > 0 ? (currentIndex / lesson.content.length) * 100 : 0;
  const progressPercent = clampPercent(completionPercent);
  const errorRate = totalKeystrokes > 0 ? (incorrectKeystrokes / totalKeystrokes) * 100 : 0;
  const topErrorKeys = getTopErrorKeys(errorKeys, 4);

  const formattedTimer = new Date(liveDurationSeconds * 1000).toISOString().slice(14, 19);

  const typedDisplayValue = typedText.replace(/\n/g, '\u23CE');
  const lessonTipSeed = lesson.id.split('').reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + 1), 0);
  const coachTipStep = Math.floor(liveDurationSeconds / COACH_TIP_ROTATION_SECONDS);
  const coachTipIndex = PRACTICE_COACH_TIPS.length > 0 ? (lessonTipSeed + coachTipStep) % PRACTICE_COACH_TIPS.length : 0;
  const coachTip = PRACTICE_COACH_TIPS[coachTipIndex] ?? {
    id: 'fallback',
    title: 'Keep a light touch',
    detail: 'Let your fingers float between keys and avoid pressing harder than necessary.',
    mood: 'flow' as const,
  };
  const coachMoodStyle = MOOD_STYLES[coachTip.mood] ?? MOOD_STYLES.flow;

  return (
    <div className="relative mx-auto h-auto w-full max-w-[1400px] overflow-x-hidden overflow-y-auto py-1 lg:h-[calc(100vh-6rem)]">
      <div aria-hidden className="pointer-events-none absolute -left-24 top-14 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -right-20 bottom-8 h-64 w-64 rounded-full bg-secondary/10 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute left-1/3 top-24 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />

      <div className="relative z-10 grid h-full grid-cols-1 gap-3 md:gap-4 xl:grid-cols-[220px_minmax(0,1fr)_220px] xl:grid-rows-[148px_minmax(0,1fr)]">
        <Card className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-card shadow-card ring-1 ring-primary/10 transition-shadow duration-200 hover:shadow-glow xl:row-start-1">
          <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute -left-10 bottom-0 h-24 w-24 rounded-full bg-secondary/20 blur-2xl" />
          <CardContent className="relative h-full p-3 pt-2.5">
            <div className="flex items-start justify-between gap-2">
              <p className="line-clamp-2 bg-gradient-primary bg-clip-text text-[20px] font-extrabold leading-[1.15] text-transparent sm:text-[22px]">
                {lesson.title}
              </p>
              {lesson.description ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background/80 text-muted-foreground transition-colors duration-150 hover:border-primary/60 hover:bg-primary/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      aria-label="Lesson description"
                    >
                      <Info className="h-3 w-3" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs text-sm">
                    {lesson.description}
                  </TooltipContent>
                </Tooltip>
              ) : null}
            </div>
            <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-muted-foreground">
              {lesson.description || 'No description available for this lesson.'}
            </p>
            <div className="mt-1.5 h-[3px] w-16 rounded-full bg-gradient-primary opacity-85" />
          </CardContent>
        </Card>

        <Card className="h-full overflow-hidden rounded-2xl border border-border/90 bg-gradient-card shadow-card transition-shadow duration-150 hover:shadow-md xl:row-start-1">
          <CardContent className="flex h-full min-h-0 flex-col gap-1.5 p-2">
            <div className="shrink-0 rounded-xl border border-border/70 bg-background/75 px-3 py-1">
              <div className="flex items-center justify-between text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                <span>Lesson Progress</span>
                <span>{formatPercent(progressPercent)}</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-muted/70">
                <div
                  className="h-1.5 rounded-full bg-gradient-primary transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <div
              onClick={() => {
                if (!started) handleStart();
                inputRef.current?.focus();
              }}
              className="min-h-0 flex-1"
            >
              <div
                ref={contentContainerRef}
                className="h-full min-h-0 overflow-y-auto rounded-xl border border-border/80 bg-background/70 px-3 py-1.5 shadow-inner"
              >
                <div className="font-mono text-[19px] leading-8 whitespace-pre-wrap break-words text-foreground/80">
                  {lesson.content.split('').map((char, index) => {
                    const isNewLine = char === '\n';
                    return (
                      <span
                        key={index}
                        ref={index === currentIndex ? currentCharRef : null}
                        className={cn('rounded-sm px-[1px] transition-all duration-150', getCharClassName(index), isNewLine && 'typing-enter')}
                      >
                        {isNewLine ? '\u23CE' : char === ' ' ? '\u00A0' : char}
                        {isNewLine ? <br /> : null}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={cn(
            'relative overflow-hidden rounded-2xl bg-gradient-card shadow-card transition-shadow duration-200 hover:shadow-glow xl:row-start-1',
            difficultyTheme.cardBorderClass,
            difficultyTheme.ringClass,
            'border ring-1'
          )}
        >
          <div aria-hidden className={cn('pointer-events-none absolute inset-x-0 top-0 h-14 bg-gradient-to-r', difficultyTheme.gradientRibbonClass)} />
          <div aria-hidden className={cn('pointer-events-none absolute -right-10 bottom-2 h-28 w-28 rounded-full blur-3xl', difficultyTheme.glowClass)} />
          <CardContent className="relative flex h-full flex-col items-center justify-center p-3 text-center">
            <div className="inline-flex rounded-xl border border-primary/20 bg-background/75 px-5 py-2.5 shadow-card backdrop-blur-sm">
              <p
                className={cn(
                  'bg-clip-text pb-[2px] text-[20px] font-semibold leading-[1.15] tracking-tight text-transparent md:text-[24px]',
                  'bg-gradient-to-r',
                  difficultyTheme.labelClass
                )}
              >
                {difficultyLabel}
              </p>
            </div>
            <div className="mx-auto mt-2 h-[3px] w-24 rounded-full bg-gradient-primary opacity-90 animate-pulse" />
            <p className="mt-2 text-[10px] text-muted-foreground">Focus on smooth rhythm over force.</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border bg-gradient-card shadow-card transition-shadow duration-150 hover:shadow-md xl:row-start-2">
          <CardContent className="space-y-3 p-4">
            <div className="mb-1 flex items-center justify-between">
              <div className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground">LIVE STATS</div>
              <span className="inline-flex items-center rounded-full border border-border/70 bg-background/70 px-2 py-1 text-[10px] text-muted-foreground">
                <Timer className="mr-1 h-3 w-3" />
                {formattedTimer}
              </span>
            </div>

            <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-2">
              <div className="flex items-center justify-between">
                <p className="text-[14px] leading-none text-muted-foreground">WPM</p>
                <p className="text-lg leading-none text-foreground">{wpm}</p>
              </div>
              <div className="h-1.5 rounded-full bg-background/70">
                <div className="h-1.5 rounded-full bg-gradient-primary transition-all duration-200" style={{ width: `${clampPercent((wpm / 120) * 100)}%` }} />
              </div>
            </div>

            <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-2">
              <div className="flex items-center justify-between">
                <p className="text-[14px] leading-none text-muted-foreground">ACCURACY</p>
                <p className="text-lg leading-none text-foreground">{accuracy.toFixed(1)}%</p>
              </div>
              <div className="h-1.5 rounded-full bg-background/70">
                <div className="h-1.5 rounded-full bg-emerald-500/80 transition-all duration-200" style={{ width: `${clampPercent(accuracy)}%` }} />
              </div>
            </div>

            <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-2">
              <div className="flex items-center justify-between">
                <p className="text-[14px] leading-none text-muted-foreground">ERROR RATE</p>
                <p className="text-lg leading-none text-foreground">{errorRate.toFixed(1)}%</p>
              </div>
              <div className="h-1.5 rounded-full bg-background/70">
                <div className="h-1.5 rounded-full bg-destructive/70 transition-all duration-200" style={{ width: `${clampPercent(errorRate)}%` }} />
              </div>
            </div>

            <div className="rounded-lg border border-border bg-muted/30 p-2">
              <div className="flex items-center justify-between">
                <p className="text-[14px] leading-none text-muted-foreground">ERROR COUNT</p>
                <p className="text-lg leading-none text-foreground">{incorrectKeystrokes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border bg-gradient-card shadow-card transition-shadow duration-150 hover:shadow-md xl:col-start-2 xl:row-start-2">
          <CardContent className="flex h-full min-h-0 flex-col gap-2 overflow-hidden p-2">
            <div className="flex items-center justify-between rounded-lg border border-border/70 bg-background/60 px-3 py-1">
              <p className="inline-flex items-center text-[11px] font-semibold text-muted-foreground">
                <Target className="mr-1.5 h-3.5 w-3.5 text-primary" />
                Next key: <span className="ml-1 text-foreground">{currentChar === ' ' ? 'Space' : currentChar || 'Done'}</span>
              </p>
              <p className="inline-flex items-center text-[11px] text-muted-foreground">
                <Gauge className="mr-1.5 h-3.5 w-3.5 text-secondary" />
                {formatPercent(progressPercent)}
              </p>
            </div>
            <div
              ref={keyboardViewportRef}
              className="flex min-h-0 flex-1 w-full items-center justify-center overflow-hidden [&_.key-active]:brightness-95 [&_.key-active]:shadow-inner [&_.key-active]:transition-all [&_.key-active]:duration-150 [&_.key-correct]:transition-colors [&_.key-correct]:duration-150 [&_.key-incorrect]:transition-colors [&_.key-incorrect]:duration-150"
            >
              <div
                className="w-full origin-top px-0.5 transition-transform duration-150"
                style={{ transform: `scale(${keyboardScale})` }}
              >
                <div ref={keyboardContentRef} className="mx-auto w-full max-w-[980px]">
                  <Keyboard activeKey={activeKey ?? undefined} nextKey={currentChar} showFingerGuide={true} layoutDensity="compact" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hidden h-full overflow-hidden rounded-2xl border border-border bg-gradient-card shadow-card transition-shadow duration-150 hover:shadow-md xl:block xl:col-start-3 xl:row-start-2">
          <CardContent className="grid h-full min-h-0 grid-rows-[auto_auto_auto_auto] gap-2.5 overflow-y-auto p-3 pr-2">
            <div className="rounded-xl border border-border/70 bg-background/85 p-2.5">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold tracking-[0.12em] text-muted-foreground">COACH TIP</p>
                <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold', coachMoodStyle.chipClass)}>
                  <Sparkles className={cn('mr-1 h-3 w-3', coachMoodStyle.iconClass)} />
                  {COACH_MOOD_LABELS[coachTip.mood]}
                </span>
              </div>
              <p className="mt-1 text-[9px] uppercase tracking-[0.12em] text-muted-foreground/80">
                Updates every {COACH_TIP_ROTATION_SECONDS}s
              </p>
              <p className="mt-1.5 text-sm font-semibold text-foreground">{coachTip.title}</p>
              <p className="mt-1 text-[11px] leading-4 text-muted-foreground">{coachTip.detail}</p>
            </div>

            <div className="rounded-xl border border-border/70 bg-background/85 p-2.5">
              <p className="text-[11px] font-semibold tracking-[0.12em] text-muted-foreground">FOCUS METER</p>
              <div className="mt-1.5 h-2 rounded-full bg-muted/70">
                <div className="h-2 rounded-full bg-gradient-primary transition-all duration-200" style={{ width: `${progressPercent}%` }} />
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">{formatPercent(progressPercent)} lesson completion</p>
            </div>

            <div className="rounded-xl border border-border/70 bg-background/85 p-2.5">
              <p className="text-[11px] font-semibold tracking-[0.12em] text-muted-foreground">TOP MISTAKES</p>
              <div className="mt-1.5 flex flex-col gap-1.5">
                {topErrorKeys.length === 0 ? (
                  <p className="inline-flex items-center text-[11px] text-emerald-600 dark:text-emerald-400">
                    <Sparkles className="mr-1 h-3 w-3" />
                    Clean run so far.
                  </p>
                ) : (
                  topErrorKeys.map(([keyName, count]) => (
                    <div key={keyName} className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/40 px-2 py-1">
                      <p className="inline-flex items-center text-[11px] text-foreground">
                        <AlertCircle className="mr-1 h-2.5 w-2.5 text-destructive" />
                        {keyName === ' ' ? 'Space' : keyName}
                      </p>
                      <span className="text-[11px] font-semibold text-destructive">{count}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-xl border border-border/70 bg-background/85 p-2.5">
              <p className="text-[11px] font-semibold tracking-[0.12em] text-muted-foreground">SESSION STATUS</p>
              <div className="mt-1.5 flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">Backspaces</span>
                <span className="text-foreground">{backspaceCount}</span>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">Correct Keys</span>
                <span className="text-foreground">{correctKeystrokes}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <input
        ref={inputRef}
        type="text"
        className="sr-only"
        value={typedDisplayValue}
        onChange={() => {}}
        onKeyDown={handleKeyPress}
        onKeyUp={handleKeyUp}
        onBlur={handleBlur}
        onPaste={(e) => e.preventDefault()}
        onCopy={(e) => e.preventDefault()}
        onCut={(e) => e.preventDefault()}
        autoFocus
        spellCheck={false}
        autoComplete="off"
      />
    </div>
  );
}

