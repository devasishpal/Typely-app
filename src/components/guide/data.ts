import type {
  FAQItem,
  FingerCluster,
  FingerId,
  FingerMeta,
  HeroFloatingKey,
  HeroInsight,
  HomeRowFingerTarget,
  KeyboardKeyDefinition,
  KeyboardRowDefinition,
  MistakeDefinition,
  PostureRule,
  PracticeLevel,
  ProgressMilestone,
  StrategyStep,
} from '@/components/guide/types';

export const fingerMetadata: FingerMeta[] = [
  {
    id: 'left-pinky',
    name: 'Left Pinky',
    instruction: 'Use Left Pinky Finger',
    shortLabel: 'LP',
    handSide: 'left',
    tintClass: 'bg-primary/20',
    borderClass: 'border-primary/45',
    textClass: 'text-primary',
    glowClass: 'shadow-[0_0_25px_hsl(var(--primary)/0.45)]',
    gradientClass: 'from-primary/40 to-primary/10',
  },
  {
    id: 'left-ring',
    name: 'Left Ring',
    instruction: 'Use Left Ring Finger',
    shortLabel: 'LR',
    handSide: 'left',
    tintClass: 'bg-secondary/20',
    borderClass: 'border-secondary/45',
    textClass: 'text-secondary',
    glowClass: 'shadow-[0_0_25px_hsl(var(--secondary)/0.45)]',
    gradientClass: 'from-secondary/40 to-secondary/10',
  },
  {
    id: 'left-middle',
    name: 'Left Middle',
    instruction: 'Use Left Middle Finger',
    shortLabel: 'LM',
    handSide: 'left',
    tintClass: 'bg-accent/20',
    borderClass: 'border-accent/45',
    textClass: 'text-accent',
    glowClass: 'shadow-[0_0_25px_hsl(var(--accent)/0.45)]',
    gradientClass: 'from-accent/40 to-accent/10',
  },
  {
    id: 'left-index',
    name: 'Left Index',
    instruction: 'Use Left Index Finger',
    shortLabel: 'LI',
    handSide: 'left',
    tintClass: 'bg-success/20',
    borderClass: 'border-success/45',
    textClass: 'text-success',
    glowClass: 'shadow-[0_0_25px_hsl(var(--success)/0.45)]',
    gradientClass: 'from-success/40 to-success/10',
  },
  {
    id: 'right-index',
    name: 'Right Index',
    instruction: 'Use Right Index Finger',
    shortLabel: 'RI',
    handSide: 'right',
    tintClass: 'bg-success/20',
    borderClass: 'border-success/45',
    textClass: 'text-success',
    glowClass: 'shadow-[0_0_25px_hsl(var(--success)/0.45)]',
    gradientClass: 'from-success/40 to-success/10',
  },
  {
    id: 'right-middle',
    name: 'Right Middle',
    instruction: 'Use Right Middle Finger',
    shortLabel: 'RM',
    handSide: 'right',
    tintClass: 'bg-accent/20',
    borderClass: 'border-accent/45',
    textClass: 'text-accent',
    glowClass: 'shadow-[0_0_25px_hsl(var(--accent)/0.45)]',
    gradientClass: 'from-accent/40 to-accent/10',
  },
  {
    id: 'right-ring',
    name: 'Right Ring',
    instruction: 'Use Right Ring Finger',
    shortLabel: 'RR',
    handSide: 'right',
    tintClass: 'bg-secondary/20',
    borderClass: 'border-secondary/45',
    textClass: 'text-secondary',
    glowClass: 'shadow-[0_0_25px_hsl(var(--secondary)/0.45)]',
    gradientClass: 'from-secondary/40 to-secondary/10',
  },
  {
    id: 'right-pinky',
    name: 'Right Pinky',
    instruction: 'Use Right Pinky Finger',
    shortLabel: 'RP',
    handSide: 'right',
    tintClass: 'bg-primary/20',
    borderClass: 'border-primary/45',
    textClass: 'text-primary',
    glowClass: 'shadow-[0_0_25px_hsl(var(--primary)/0.45)]',
    gradientClass: 'from-primary/40 to-primary/10',
  },
  {
    id: 'thumbs',
    name: 'Thumbs',
    instruction: 'Use Either Thumb',
    shortLabel: 'TH',
    handSide: 'thumbs',
    tintClass: 'bg-info/20',
    borderClass: 'border-info/45',
    textClass: 'text-info',
    glowClass: 'shadow-[0_0_25px_hsl(var(--info)/0.45)]',
    gradientClass: 'from-info/40 to-info/10',
  },
];

export const fingerMetadataMap: Record<FingerId, FingerMeta> = fingerMetadata.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<FingerId, FingerMeta>
);

const key = (
  id: string,
  display: string,
  finger: FingerId,
  row: number,
  column: number,
  options?: Pick<KeyboardKeyDefinition, 'secondaryDisplay' | 'widthClass' | 'homeRow'>
): KeyboardKeyDefinition => ({
  id,
  display,
  finger,
  row,
  column,
  secondaryDisplay: options?.secondaryDisplay,
  widthClass: options?.widthClass,
  homeRow: options?.homeRow,
});

export const keyboardRows: KeyboardRowDefinition[] = [
  {
    rowIndex: 0,
    keys: [
      key('Backquote', '`', 'left-pinky', 0, 0, { secondaryDisplay: '~' }),
      key('Digit1', '1', 'left-pinky', 0, 1, { secondaryDisplay: '!' }),
      key('Digit2', '2', 'left-ring', 0, 2, { secondaryDisplay: '@' }),
      key('Digit3', '3', 'left-middle', 0, 3, { secondaryDisplay: '#' }),
      key('Digit4', '4', 'left-index', 0, 4, { secondaryDisplay: '$' }),
      key('Digit5', '5', 'left-index', 0, 5, { secondaryDisplay: '%' }),
      key('Digit6', '6', 'right-index', 0, 6, { secondaryDisplay: '^' }),
      key('Digit7', '7', 'right-index', 0, 7, { secondaryDisplay: '&' }),
      key('Digit8', '8', 'right-middle', 0, 8, { secondaryDisplay: '*' }),
      key('Digit9', '9', 'right-ring', 0, 9, { secondaryDisplay: '(' }),
      key('Digit0', '0', 'right-pinky', 0, 10, { secondaryDisplay: ')' }),
      key('Minus', '-', 'right-pinky', 0, 11, { secondaryDisplay: '_' }),
      key('Equal', '=', 'right-pinky', 0, 12, { secondaryDisplay: '+' }),
      key('Backspace', 'Backspace', 'right-pinky', 0, 13, { widthClass: 'w-24' }),
    ],
  },
  {
    rowIndex: 1,
    keys: [
      key('Tab', 'Tab', 'left-pinky', 1, 0, { widthClass: 'w-16' }),
      key('KeyQ', 'Q', 'left-pinky', 1, 1),
      key('KeyW', 'W', 'left-ring', 1, 2),
      key('KeyE', 'E', 'left-middle', 1, 3),
      key('KeyR', 'R', 'left-index', 1, 4),
      key('KeyT', 'T', 'left-index', 1, 5),
      key('KeyY', 'Y', 'right-index', 1, 6),
      key('KeyU', 'U', 'right-index', 1, 7),
      key('KeyI', 'I', 'right-middle', 1, 8),
      key('KeyO', 'O', 'right-ring', 1, 9),
      key('KeyP', 'P', 'right-pinky', 1, 10),
      key('BracketLeft', '[', 'right-pinky', 1, 11, { secondaryDisplay: '{' }),
      key('BracketRight', ']', 'right-pinky', 1, 12, { secondaryDisplay: '}' }),
      key('Backslash', '\\', 'right-pinky', 1, 13, { secondaryDisplay: '|', widthClass: 'w-16' }),
    ],
  },
  {
    rowIndex: 2,
    keys: [
      key('CapsLock', 'Caps', 'left-pinky', 2, 0, { widthClass: 'w-20' }),
      key('KeyA', 'A', 'left-pinky', 2, 1, { homeRow: true }),
      key('KeyS', 'S', 'left-ring', 2, 2, { homeRow: true }),
      key('KeyD', 'D', 'left-middle', 2, 3, { homeRow: true }),
      key('KeyF', 'F', 'left-index', 2, 4, { homeRow: true }),
      key('KeyG', 'G', 'left-index', 2, 5),
      key('KeyH', 'H', 'right-index', 2, 6),
      key('KeyJ', 'J', 'right-index', 2, 7, { homeRow: true }),
      key('KeyK', 'K', 'right-middle', 2, 8, { homeRow: true }),
      key('KeyL', 'L', 'right-ring', 2, 9, { homeRow: true }),
      key('Semicolon', ';', 'right-pinky', 2, 10, { secondaryDisplay: ':', homeRow: true }),
      key('Quote', "'", 'right-pinky', 2, 11, { secondaryDisplay: '"' }),
      key('Enter', 'Enter', 'right-pinky', 2, 12, { widthClass: 'w-24' }),
    ],
  },
  {
    rowIndex: 3,
    keys: [
      key('ShiftLeft', 'Shift', 'left-pinky', 3, 0, { widthClass: 'w-24' }),
      key('KeyZ', 'Z', 'left-pinky', 3, 1),
      key('KeyX', 'X', 'left-ring', 3, 2),
      key('KeyC', 'C', 'left-middle', 3, 3),
      key('KeyV', 'V', 'left-index', 3, 4),
      key('KeyB', 'B', 'left-index', 3, 5),
      key('KeyN', 'N', 'right-index', 3, 6),
      key('KeyM', 'M', 'right-index', 3, 7),
      key('Comma', ',', 'right-middle', 3, 8, { secondaryDisplay: '<' }),
      key('Period', '.', 'right-ring', 3, 9, { secondaryDisplay: '>' }),
      key('Slash', '/', 'right-pinky', 3, 10, { secondaryDisplay: '?' }),
      key('ShiftRight', 'Shift', 'right-pinky', 3, 11, { widthClass: 'w-32' }),
    ],
  },
  {
    rowIndex: 4,
    keys: [
      key('ControlLeft', 'Ctrl', 'left-pinky', 4, 0, { widthClass: 'w-16' }),
      key('MetaLeft', 'Win', 'left-pinky', 4, 1, { widthClass: 'w-16' }),
      key('AltLeft', 'Alt', 'left-index', 4, 2, { widthClass: 'w-16' }),
      key('Space', 'Space', 'thumbs', 4, 3, { widthClass: 'w-[24rem]' }),
      key('AltRight', 'Alt', 'right-index', 4, 4, { widthClass: 'w-16' }),
      key('MetaRight', 'Fn', 'right-pinky', 4, 5, { widthClass: 'w-16' }),
      key('ContextMenu', 'Menu', 'right-pinky', 4, 6, { widthClass: 'w-16' }),
      key('ControlRight', 'Ctrl', 'right-pinky', 4, 7, { widthClass: 'w-16' }),
    ],
  },
];

export const homeRowTargets: HomeRowFingerTarget[] = [
  { id: 'home-a', key: 'A', finger: 'left-pinky', x: 120, y: 118 },
  { id: 'home-s', key: 'S', finger: 'left-ring', x: 198, y: 118 },
  { id: 'home-d', key: 'D', finger: 'left-middle', x: 276, y: 118 },
  { id: 'home-f', key: 'F', finger: 'left-index', x: 354, y: 118 },
  { id: 'home-j', key: 'J', finger: 'right-index', x: 510, y: 118 },
  { id: 'home-k', key: 'K', finger: 'right-middle', x: 588, y: 118 },
  { id: 'home-l', key: 'L', finger: 'right-ring', x: 666, y: 118 },
  { id: 'home-semicolon', key: ';', finger: 'right-pinky', x: 744, y: 118 },
  { id: 'home-space', key: 'Space', finger: 'thumbs', x: 430, y: 206 },
];

export const homeRowKeyIds = ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon', 'Space'];

export const keyboardLookupById: Record<string, KeyboardKeyDefinition> = keyboardRows
  .flatMap((row) => row.keys)
  .reduce((acc, keyboardKey) => {
    acc[keyboardKey.id] = keyboardKey;
    return acc;
  }, {} as Record<string, KeyboardKeyDefinition>);

export const keyboardLookupByDisplay: Record<string, KeyboardKeyDefinition> = keyboardRows
  .flatMap((row) => row.keys)
  .reduce((acc, keyboardKey) => {
    acc[keyboardKey.display.toLowerCase()] = keyboardKey;
    if (keyboardKey.secondaryDisplay) {
      acc[keyboardKey.secondaryDisplay.toLowerCase()] = keyboardKey;
    }
    return acc;
  }, {} as Record<string, KeyboardKeyDefinition>);

export const heroFloatingKeys: HeroFloatingKey[] = [
  { id: 'hero-key-q', value: 'Q', left: '6%', top: '14%', delay: 0.1, duration: 4.1 },
  { id: 'hero-key-w', value: 'W', left: '11%', top: '32%', delay: 0.2, duration: 3.8 },
  { id: 'hero-key-e', value: 'E', left: '8%', top: '51%', delay: 0.35, duration: 4.4 },
  { id: 'hero-key-r', value: 'R', left: '14%', top: '68%', delay: 0.45, duration: 4.2 },
  { id: 'hero-key-u', value: 'U', left: '82%', top: '18%', delay: 0.5, duration: 4.0 },
  { id: 'hero-key-i', value: 'I', left: '88%', top: '34%', delay: 0.65, duration: 3.7 },
  { id: 'hero-key-o', value: 'O', left: '84%', top: '52%', delay: 0.82, duration: 4.5 },
  { id: 'hero-key-p', value: 'P', left: '89%', top: '70%', delay: 0.95, duration: 3.9 },
  { id: 'hero-key-a', value: 'A', left: '26%', top: '8%', delay: 0.22, duration: 4.9 },
  { id: 'hero-key-s', value: 'S', left: '31%', top: '20%', delay: 0.42, duration: 4.3 },
  { id: 'hero-key-d', value: 'D', left: '34%', top: '36%', delay: 0.68, duration: 4.1 },
  { id: 'hero-key-f', value: 'F', left: '28%', top: '58%', delay: 0.77, duration: 3.8 },
  { id: 'hero-key-j', value: 'J', left: '67%', top: '10%', delay: 0.3, duration: 4.6 },
  { id: 'hero-key-k', value: 'K', left: '72%', top: '27%', delay: 0.55, duration: 3.6 },
  { id: 'hero-key-l', value: 'L', left: '70%', top: '45%', delay: 0.75, duration: 4.4 },
  { id: 'hero-key-semicolon', value: ';', left: '74%', top: '62%', delay: 1.0, duration: 4.1 },
  { id: 'hero-key-space', value: 'SPACE', left: '43%', top: '76%', delay: 0.9, duration: 4.8 },
];

export const heroInsights: HeroInsight[] = [
  {
    id: 'insight-accuracy',
    label: 'Accuracy Focus',
    value: '95%+',
    description: 'Train precision first to build stable muscle memory and reduce backtracking.',
  },
  {
    id: 'insight-rhythm',
    label: 'Rhythm',
    value: 'Steady',
    description: 'Even cadence improves reading flow and keeps hands synchronized with visual input.',
  },
  {
    id: 'insight-posture',
    label: 'Posture',
    value: 'Aligned',
    description: 'Better ergonomics protects wrists and enables longer practice blocks.',
  },
  {
    id: 'insight-growth',
    label: 'Speed Growth',
    value: '+15 WPM',
    description: 'Structured sessions progressively lift speed while minimizing accuracy loss.',
  },
];

export const fingerClusters: FingerCluster[] = [
  { id: 'cluster-left-pinky', finger: 'left-pinky', width: 54, height: 86, x: 90, y: 12 },
  { id: 'cluster-left-ring', finger: 'left-ring', width: 58, height: 94, x: 152, y: 6 },
  { id: 'cluster-left-middle', finger: 'left-middle', width: 60, height: 102, x: 220, y: 0 },
  { id: 'cluster-left-index', finger: 'left-index', width: 64, height: 110, x: 294, y: 8 },
  { id: 'cluster-right-index', finger: 'right-index', width: 64, height: 110, x: 486, y: 8 },
  { id: 'cluster-right-middle', finger: 'right-middle', width: 60, height: 102, x: 560, y: 0 },
  { id: 'cluster-right-ring', finger: 'right-ring', width: 58, height: 94, x: 628, y: 6 },
  { id: 'cluster-right-pinky', finger: 'right-pinky', width: 54, height: 86, x: 692, y: 12 },
  { id: 'cluster-thumbs', finger: 'thumbs', width: 220, height: 64, x: 290, y: 138 },
];

export const postureRules: PostureRule[] = [
  {
    id: 'posture-back',
    title: 'Straight Back',
    bad: 'Slouching rounds your spine and compresses your breathing.',
    good: 'Keep your back tall with shoulders relaxed and chest open.',
    detail: 'A neutral spine keeps forearms aligned and lowers neck fatigue across long sessions.',
    anchorY: 0.1,
  },
  {
    id: 'posture-elbows',
    title: 'Elbows at 90 Degrees',
    bad: 'Raised or collapsed elbows introduce shoulder tension.',
    good: 'Rest elbows slightly away from the body at a right angle.',
    detail: 'This angle keeps arm movement minimal and gives fingers a direct approach to the keys.',
    anchorY: 0.32,
  },
  {
    id: 'posture-wrists',
    title: 'Wrists Floating',
    bad: 'Resting wrists on the desk can compress nerves and reduce mobility.',
    good: 'Keep wrists lifted and neutral while typing.',
    detail: 'Floating wrists let finger joints do the movement while avoiding friction and strain.',
    anchorY: 0.52,
  },
  {
    id: 'posture-feet',
    title: 'Feet Flat on Floor',
    bad: 'Dangling legs reduce stability and tilt your pelvis.',
    good: 'Keep feet planted with knees and hips comfortably aligned.',
    detail: 'Grounded feet stabilize your torso and help maintain consistent upper-body posture.',
    anchorY: 0.74,
  },
  {
    id: 'posture-screen',
    title: 'Screen at Eye Level',
    bad: 'A low screen forces neck flexion and shoulder collapse.',
    good: 'Align top of screen near eye line to keep neck neutral.',
    detail: 'Eye-level viewing reduces forward head posture and keeps your reading flow smooth.',
    anchorY: 0.9,
  },
];

export const commonMistakes: MistakeDefinition[] = [
  {
    id: 'mistake-looking-down',
    title: 'Looking at the Keyboard',
    shortDescription: 'Visual dependency slows symbol recognition and delays reflexive typing.',
    detailedExplanation:
      'When your eyes keep jumping to the keyboard, your brain never fully forms position memory. This creates a constant reaction loop instead of an automated pattern. It also disrupts reading flow because your attention is split between source text and keys.',
    correctionPlan: [
      'Cover your hands during short drills to force tactile awareness.',
      'Use home row resets after every sentence.',
      'Practice with simple text until comfort improves, then increase complexity.',
      'Track error spikes by key to identify which positions need targeted training.',
    ],
    impact: 'High impact on both accuracy and long-term speed ceiling.',
  },
  {
    id: 'mistake-pressing-hard',
    title: 'Pressing Keys Too Hard',
    shortDescription: 'Excess force increases fatigue and slows rebound to the next key.',
    detailedExplanation:
      'Hard keystrokes create unnecessary muscular effort in fingers, wrists, and forearms. Over time this causes fatigue, noisy typing, and inconsistent timing between letters. Lighter, controlled taps preserve speed and reduce strain.',
    correctionPlan: [
      'Lower your key actuation force intentionally for one-minute intervals.',
      'Maintain relaxed shoulders and check for jaw tension.',
      'Use metronome-style typing at slow pace to find minimal force.',
      'Stop immediately if pain appears and reset your hand position.',
    ],
    impact: 'Moderate-to-high impact on endurance and comfort.',
  },
  {
    id: 'mistake-finger-overlap',
    title: 'Wrong Finger Usage',
    shortDescription: 'Crossing fingers reduces consistency and causes position confusion.',
    detailedExplanation:
      'Typing with whichever finger feels nearest may seem faster short term, but it creates unstable movement patterns. Your hands lose clear territory, making difficult words unpredictable and increasing correction pauses.',
    correctionPlan: [
      'Follow a fixed finger map for every letter and punctuation key.',
      'Slow down to 70% speed when introducing proper finger assignments.',
      'Use the interactive keyboard highlight to reinforce each finger zone.',
      'Prioritize accuracy over speed during remapping weeks.',
    ],
    impact: 'High impact on advanced progress beyond intermediate speed.',
  },
  {
    id: 'mistake-posture',
    title: 'Poor Sitting Posture',
    shortDescription: 'Body misalignment creates pain and inconsistent hand positioning.',
    detailedExplanation:
      'When posture collapses, the typing angle changes continuously. This affects finger travel distance and introduces unnecessary arm compensation. Chronic poor posture can also trigger neck and wrist discomfort that interrupts training momentum.',
    correctionPlan: [
      'Set chair height so elbows stay near ninety degrees.',
      'Pull keyboard close enough to avoid overreaching.',
      'Use posture checks every 15 minutes during long sessions.',
      'Adjust monitor height to prevent neck flexion.',
    ],
    impact: 'High impact on comfort, consistency, and injury prevention.',
  },
  {
    id: 'mistake-inconsistent-practice',
    title: 'Inconsistent Practice',
    shortDescription: 'Irregular sessions weaken retention and reset progress repeatedly.',
    detailedExplanation:
      'Typing skill improves through frequent reinforcement. Long breaks cause finger routes to fade, so each comeback session spends time rebuilding basics. Short, predictable practice blocks outperform occasional marathon sessions.',
    correctionPlan: [
      'Schedule fixed daily practice windows, even if only 15 minutes.',
      'Split sessions into warm-up, focused drill, and cool-down review.',
      'Log daily WPM and error rate to stay accountable.',
      'Use low-friction routines that are easy to repeat every day.',
    ],
    impact: 'Very high impact on cumulative growth over weeks.',
  },
];

export const speedStrategySteps: StrategyStep[] = [
  {
    id: 'strategy-accuracy',
    title: 'Step 1: Accuracy First',
    subtitle: 'Build clean keystroke patterns before chasing speed.',
    description:
      'Accuracy creates the foundation for every speed gain. If error rates are high, your brain spends effort correcting rather than flowing forward. Slow down until each word is intentional and precise.',
    tacticalChecklist: [
      'Target 95% accuracy in short sessions.',
      'Pause after each paragraph and review repeated mistakes.',
      'Use deliberate finger assignments on every key.',
      'Keep pace controlled rather than rushed.',
    ],
    targetRange: 'Goal: 95-98% accuracy at any comfortable speed.',
  },
  {
    id: 'strategy-muscle-memory',
    title: 'Step 2: Muscle Memory',
    subtitle: 'Repeat correct motions until they become automatic.',
    description:
      'Consistent repetition turns key positions into reflexes. Your fingers should move from touch feedback rather than conscious searching. This stage rewards frequent, focused drills over random long practice.',
    tacticalChecklist: [
      'Run 10-minute home-row and top-row drills daily.',
      'Repeat weak key pairs in controlled sets.',
      'Avoid switching finger plans mid-session.',
      'Use short breaks to prevent fatigue-driven errors.',
    ],
    targetRange: 'Goal: stable motion patterns across common words.',
  },
  {
    id: 'strategy-rhythm',
    title: 'Step 3: Rhythm',
    subtitle: 'Develop steady cadence for smoother word flow.',
    description:
      'Typing rhythm keeps transitions efficient between letters and words. Instead of burst-and-stop behavior, aim for predictable tempo. Rhythm improves readability, confidence, and overall consistency.',
    tacticalChecklist: [
      'Use sentence drills with punctuation for timing control.',
      'Keep breathing steady during long passages.',
      'Reduce sudden speed spikes that cause mistakes.',
      'Practice with metered timing blocks.',
    ],
    targetRange: 'Goal: sustained cadence with minimal pauses.',
  },
  {
    id: 'strategy-speed',
    title: 'Step 4: Speed Increase',
    subtitle: 'Raise pace gradually while preserving technique.',
    description:
      'Increase speed in small increments only after consistency appears. Jumping too quickly usually degrades form and accuracy. Controlled acceleration lets your motor system adapt without collapsing quality.',
    tacticalChecklist: [
      'Increase target pace by 2-3 WPM per week.',
      'Use interval rounds: fast burst then recovery.',
      'Record where errors rise and adjust pace.',
      'Stop escalation when accuracy drops below threshold.',
    ],
    targetRange: 'Goal: progressive WPM gains with steady accuracy.',
  },
  {
    id: 'strategy-consistency',
    title: 'Step 5: Consistency',
    subtitle: 'Maintain reliable results across different content styles.',
    description:
      'Final progress depends on repeatable performance. Your average should remain strong across essays, technical text, and punctuation-heavy passages. Consistency means your process is robust under variation.',
    tacticalChecklist: [
      'Rotate content types weekly.',
      'Track median WPM, not just peak runs.',
      'Monitor fatigue and maintain ergonomic habits.',
      'Set review checkpoints every weekend.',
    ],
    targetRange: 'Goal: dependable output across all practice modes.',
  },
];

export const practiceLevels: PracticeLevel[] = [
  {
    id: 'level-beginner',
    level: 'Beginner',
    wpmGoal: '20-35 WPM',
    practiceTime: '15-20 minutes/day',
    mistakeTolerance: 'Up to 8% errors while learning layout',
    focusAreas: [
      'Home row confidence and finger mapping',
      'Basic punctuation and capitalization control',
      'Light drills focused on accuracy consistency',
      'Posture and breathing awareness from day one',
    ],
    sessionBlueprint: [
      '3 min home row warm-up',
      '8 min guided paragraph typing',
      '4 min error correction replay',
      '2 min posture reset and reflection',
    ],
  },
  {
    id: 'level-intermediate',
    level: 'Intermediate',
    wpmGoal: '36-55 WPM',
    practiceTime: '25-35 minutes/day',
    mistakeTolerance: 'Below 6% with controlled speed growth',
    focusAreas: [
      'Rhythm consistency through sentence-level drills',
      'Reducing hesitation on symbols and numbers',
      'Stabilizing performance for longer passages',
      'Maintaining low tension during speed increases',
    ],
    sessionBlueprint: [
      '5 min rhythm warm-up',
      '12 min mixed difficulty practice',
      '10 min targeted weak-key drills',
      '5 min review and progress logging',
    ],
  },
  {
    id: 'level-advanced',
    level: 'Advanced',
    wpmGoal: '56-80 WPM',
    practiceTime: '35-45 minutes/day',
    mistakeTolerance: 'Below 4% on varied text',
    focusAreas: [
      'Advanced punctuation and symbol fluency',
      'High-accuracy bursts at elevated pace',
      'Recovery control after error events',
      'Endurance for sustained typing intervals',
    ],
    sessionBlueprint: [
      '5 min advanced warm-up',
      '15 min interval speed blocks',
      '12 min technical-text sessions',
      '8 min cooldown accuracy pass',
    ],
  },
  {
    id: 'level-pro',
    level: 'Pro',
    wpmGoal: '81-110+ WPM',
    practiceTime: '45-60 minutes/day',
    mistakeTolerance: 'Below 2% with professional consistency',
    focusAreas: [
      'Elite consistency under fatigue and complexity',
      'Domain-specific vocabulary adaptability',
      'Precision under speed pressure',
      'Sustainable ergonomics for heavy workloads',
    ],
    sessionBlueprint: [
      '8 min calibration and mobility prep',
      '20 min performance intervals',
      '15 min advanced punctuation challenge',
      '10 min analytical review and correction drills',
    ],
  },
];

export const progressMilestones: ProgressMilestone[] = [
  {
    id: 'milestone-1',
    title: 'Setup Foundation',
    subtitle: 'Configure posture and hand position',
    metric: 'Day 1',
    details: 'Establish proper desk alignment, monitor height, and home row orientation.',
  },
  {
    id: 'milestone-2',
    title: 'Home Row Lock-in',
    subtitle: 'Develop confident ASDF / JKL; anchoring',
    metric: 'Week 1',
    details: 'Return to home row without visual confirmation after each word.',
  },
  {
    id: 'milestone-3',
    title: 'Top Row Reach',
    subtitle: 'Expand to QWERTYUIOP with controlled accuracy',
    metric: 'Week 2',
    details: 'Reach top-row letters cleanly while maintaining finger discipline.',
  },
  {
    id: 'milestone-4',
    title: 'Bottom Row Reach',
    subtitle: 'Complete alphabet coverage',
    metric: 'Week 3',
    details: 'Integrate lower row movement without collapsing wrist posture.',
  },
  {
    id: 'milestone-5',
    title: 'Punctuation Control',
    subtitle: 'Handle commas, periods, and semicolons smoothly',
    metric: 'Week 4',
    details: 'Develop steady rhythm across sentence transitions and punctuation marks.',
  },
  {
    id: 'milestone-6',
    title: 'Accuracy Plateau Break',
    subtitle: 'Sustain 95%+ over multi-minute sessions',
    metric: 'Month 2',
    details: 'Build reliable precision before aggressive speed escalation.',
  },
  {
    id: 'milestone-7',
    title: 'Speed Expansion',
    subtitle: 'Push controlled WPM increments',
    metric: 'Month 3',
    details: 'Introduce interval training to increase pace while preserving quality.',
  },
  {
    id: 'milestone-8',
    title: 'Consistency Upgrade',
    subtitle: 'Perform steadily across varied texts',
    metric: 'Month 4',
    details: 'Maintain balanced output on conversational, technical, and formal writing.',
  },
  {
    id: 'milestone-9',
    title: 'Endurance Layer',
    subtitle: 'Type longer sessions with low fatigue',
    metric: 'Month 5',
    details: 'Train sustainable mechanics and pacing for prolonged practice.',
  },
  {
    id: 'milestone-10',
    title: 'Expert Flow',
    subtitle: 'Achieve high-speed confidence with minimal corrections',
    metric: 'Month 6+',
    details: 'Blend precision, rhythm, and posture into dependable real-world performance.',
  },
];

export const faqItems: FAQItem[] = [
  {
    id: 'faq-speed',
    question: 'How to increase typing speed?',
    answer:
      'Increase speed through a sequence: maintain high accuracy, reinforce correct finger routes, then add gradual pace increments. Short daily drills with measurable goals are more effective than occasional long sessions.',
  },
  {
    id: 'faq-60wpm',
    question: 'How long does it take to reach 60 WPM?',
    answer:
      'For most learners practicing consistently, reaching 60 WPM can take roughly 8 to 16 weeks. Prior experience, practice quality, and ergonomic habits all affect that timeline.',
  },
  {
    id: 'faq-look',
    question: 'Should I look at keyboard?',
    answer:
      'Avoid looking at the keyboard. Touch typing depends on positional memory and finger discipline. Looking down interrupts reading flow and slows your long-term progress.',
  },
  {
    id: 'faq-accuracy-priority',
    question: 'Is accuracy more important than speed?',
    answer:
      'Yes. Accuracy is the base layer of speed. Every typo introduces correction time and rhythm breaks, so high accuracy directly raises effective words per minute.',
  },
  {
    id: 'faq-frequency',
    question: 'How often should I practice?',
    answer:
      'Practice daily if possible, even for 15 to 20 minutes. Consistent repetition is better than sporadic long sessions because it reinforces motor memory more reliably.',
  },
  {
    id: 'faq-wrist-pain',
    question: 'How to avoid wrist pain?',
    answer:
      'Keep wrists neutral and lifted, reduce keystroke force, and maintain a comfortable elbow angle. Take short breaks every 20 to 30 minutes and stop immediately if pain persists.',
  },
  {
    id: 'faq-finger-keys',
    question: 'Which fingers press which keys?',
    answer:
      'Each key belongs to a finger zone around the home row. The interactive keyboard in this guide highlights exact assignments so you can build stable finger-to-key mapping.',
  },
  {
    id: 'faq-fix-habits',
    question: 'How to fix bad typing habits?',
    answer:
      'Slow down and retrain with strict finger mapping, posture checks, and targeted drills for weak keys. Habit correction takes repetition and patience, but consistent form rewires patterns over time.',
  },
];

export const keyboardLegendOrder: FingerId[] = [
  'left-pinky',
  'left-ring',
  'left-middle',
  'left-index',
  'right-index',
  'right-middle',
  'right-ring',
  'right-pinky',
  'thumbs',
];

export const keyboardCoachingNotes = [
  'Keep both index fingers lightly resting on F and J bumps between bursts.',
  'Return to home row after every word to preserve orientation.',
  'Use minimal force and let key travel do the work.',
  'When accuracy drops, reduce speed by 10% and rebuild control.',
];

export const heroPracticeHighlights = [
  'Finger placement mastery with visual guidance',
  'Posture corrections with ergonomic checkpoints',
  'Step-based roadmap from accuracy to speed',
  'Progress journey milestones for long-term consistency',
];
