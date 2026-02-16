export type CoachTip = {
  id: string;
  badge: 'Flow' | 'Accuracy' | 'Speed' | 'Consistency';
  title: string;
  description: string;
};

export const coachTips: CoachTip[] = [
  {
    id: 'tip-001',
    badge: 'Flow',
    title: 'Soft Rhythm Cue 001',
    description:
      'Press lightly and keep your wrists floating. Rhythm first, speed second. A smooth tempo always outperforms sharp bursts.',
  },
  {
    id: 'tip-002',
    badge: 'Accuracy',
    title: 'Micro Focus Cue 002',
    description:
      'Look one word ahead while finishing the current word. This reduces hesitation and stabilizes your error rate.',
  },
  {
    id: 'tip-003',
    badge: 'Speed',
    title: 'Pace Control Cue 003',
    description:
      'When you miss twice in a row, drop speed by 10 percent for one line and rebuild from precision.',
  },
  {
    id: 'tip-004',
    badge: 'Consistency',
    title: 'Cadence Anchor 004',
    description:
      'Keep finger travel short. Return immediately to home row after every keystroke to lock in muscle memory.',
  },
  {
    id: 'tip-005',
    badge: 'Flow',
    title: 'Breathing Cue 005',
    description:
      'Exhale during long words to avoid shoulder tension. Relaxation directly improves endurance and timing.',
  },
  {
    id: 'tip-006',
    badge: 'Accuracy',
    title: 'Vision Cue 006',
    description:
      'Do not stare at one letter. Scan chunks so your hands can move continuously without reactive pauses.',
  },
  {
    id: 'tip-007',
    badge: 'Speed',
    title: 'Momentum Cue 007',
    description:
      'Avoid slamming keys. Light keystrokes reduce fatigue and keep your top speed sustainable through the full lesson.',
  },
  {
    id: 'tip-008',
    badge: 'Consistency',
    title: 'Stability Cue 008',
    description:
      'Use punctuation or line breaks as reset points. Re-center posture and continue at controlled pace.',
  },
];
