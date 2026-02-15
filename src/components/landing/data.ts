import {
  Activity,
  Award,
  BarChart3,
  BookOpenCheck,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  Compass,
  Crosshair,
  Gauge,
  GraduationCap,
  HandMetal,
  Keyboard,
  Layers,
  Lightbulb,
  ListChecks,
  MousePointer2,
  Rocket,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  TimerReset,
  TrendingUp,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';
import type {
  ComparisonPoint,
  FAQItemData,
  FeatureCardData,
  HeroMetric,
  KeyboardKeyData,
  LandingNavItem,
  StatCounterData,
  TestimonialData,
  TimelineStep,
} from '@/components/landing/types';

export const landingSectionOrder = [
  'hero',
  'why-typely',
  'how-it-works',
  'typing-demo',
  'social-proof',
  'stats',
  'comparison',
  'faq',
  'cta',
] as const;

export const landingNavItems: LandingNavItem[] = [
  { id: 'hero', label: 'Home', href: '#hero' },
  { id: 'why-typely', label: 'Why Typely', href: '#why-typely' },
  { id: 'how-it-works', label: 'How It Works', href: '#how-it-works' },
  { id: 'typing-demo', label: 'Live Demo', href: '#typing-demo' },
  { id: 'social-proof', label: 'Reviews', href: '#social-proof' },
  { id: 'faq', label: 'FAQ', href: '#faq' },
];

export const heroTypingPhrases = ['Improve Speed.', 'Increase Accuracy.', 'Build Confidence.'];

export const heroMetrics: HeroMetric[] = [
  { id: 'users', value: '10,000+', label: 'Active learners' },
  { id: 'words', value: '2M+', label: 'Words typed daily' },
  { id: 'accuracy', value: '95%', label: 'Accuracy gains' },
  { id: 'lessons', value: '20+', label: 'Structured lessons' },
];

export const floatingKeys: KeyboardKeyData[] = [
  { id: 'k-1', value: 'A' },
  { id: 'k-2', value: 'S' },
  { id: 'k-3', value: 'D' },
  { id: 'k-4', value: 'F' },
  { id: 'k-5', value: 'J' },
  { id: 'k-6', value: 'K' },
  { id: 'k-7', value: 'L' },
  { id: 'k-8', value: ';' },
  { id: 'k-9', value: 'Shift', widthClass: 'w-16' },
  { id: 'k-10', value: 'Enter', widthClass: 'w-16' },
];

export const whyChooseFeatures: FeatureCardData[] = [
  {
    id: 'structured-lessons',
    title: 'Structured Learning Paths',
    description:
      'Build real muscle memory with a progressive curriculum covering home row, top row, bottom row, punctuation, numbers, and real-word drills.',
    icon: BookOpenCheck,
    accent: 'primary',
  },
  {
    id: 'real-time-feedback',
    title: 'Real-Time Typing Feedback',
    description:
      'Get instant error highlights, key-by-key guidance, and actionable prompts to correct habits while you type.',
    icon: Keyboard,
    accent: 'secondary',
  },
  {
    id: 'performance-analytics',
    title: 'Performance Analytics',
    description:
      'Track WPM trends, accuracy shifts, consistency curves, and focus windows to understand exactly how your speed improves.',
    icon: BarChart3,
    accent: 'accent',
  },
  {
    id: 'adaptive-practice',
    title: 'Adaptive Practice Sessions',
    description:
      'Practice modules automatically balance speed and accuracy targets so each session remains challenging without overwhelming you.',
    icon: BrainCircuit,
    accent: 'success',
  },
  {
    id: 'goal-based-training',
    title: 'Goal-Based Training',
    description:
      'Set milestones for speed, error tolerance, and lesson completion to stay motivated with measurable progress.',
    icon: Target,
    accent: 'info',
  },
  {
    id: 'achievement-system',
    title: 'Achievement & Motivation System',
    description:
      'Unlock streak milestones, level badges, and consistency rewards that keep your momentum strong over the long term.',
    icon: Trophy,
    accent: 'warning',
  },
];

export const timelineSteps: TimelineStep[] = [
  {
    id: 'step-account',
    number: '01',
    title: 'Create Your Typely Account',
    description:
      'Sign up in seconds and get your learning dashboard ready. Your sessions, progress stats, and achievements are synced automatically.',
    icon: Rocket,
    anchorLabel: 'Create account',
  },
  {
    id: 'step-baseline',
    number: '02',
    title: 'Take a Quick Baseline Test',
    description:
      'Measure your starting WPM and accuracy. Typely uses this baseline to personalize your pacing and recommend where to begin.',
    icon: Gauge,
    anchorLabel: 'Run baseline',
  },
  {
    id: 'step-practice',
    number: '03',
    title: 'Practice Structured Lessons',
    description:
      'Follow guided lessons that build finger placement, rhythm, and precision before introducing speed-focused drills.',
    icon: GraduationCap,
    anchorLabel: 'Start lessons',
  },
  {
    id: 'step-track',
    number: '04',
    title: 'Track Growth with Insights',
    description:
      'Review your weekly charts, accuracy trends, and consistency to pinpoint what improved and what still needs tuning.',
    icon: TrendingUp,
    anchorLabel: 'View analytics',
  },
  {
    id: 'step-mastery',
    number: '05',
    title: 'Reach Mastery Milestones',
    description:
      'Stay motivated with streaks, badges, and measurable milestones. Typely keeps your next target clear at every stage.',
    icon: Award,
    anchorLabel: 'Earn milestones',
  },
];

export const typingDemoSentences: string[] = [
  'Touch typing turns focus into flow and confidence.',
  'Consistent practice compounds speed and precision.',
  'Type faster with fewer errors every single week.',
];

export const demoKeyboardRows: KeyboardKeyData[][] = [
  [
    { id: 'k-q', value: 'Q' },
    { id: 'k-w', value: 'W' },
    { id: 'k-e', value: 'E' },
    { id: 'k-r', value: 'R' },
    { id: 'k-t', value: 'T' },
    { id: 'k-y', value: 'Y' },
    { id: 'k-u', value: 'U' },
    { id: 'k-i', value: 'I' },
    { id: 'k-o', value: 'O' },
    { id: 'k-p', value: 'P' },
  ],
  [
    { id: 'k-a', value: 'A' },
    { id: 'k-s', value: 'S' },
    { id: 'k-d', value: 'D' },
    { id: 'k-f', value: 'F' },
    { id: 'k-g', value: 'G' },
    { id: 'k-h', value: 'H' },
    { id: 'k-j', value: 'J' },
    { id: 'k-k', value: 'K' },
    { id: 'k-l', value: 'L' },
    { id: 'k-semicolon', value: ';' },
  ],
  [
    { id: 'k-z', value: 'Z' },
    { id: 'k-x', value: 'X' },
    { id: 'k-c', value: 'C' },
    { id: 'k-v', value: 'V' },
    { id: 'k-b', value: 'B' },
    { id: 'k-n', value: 'N' },
    { id: 'k-m', value: 'M' },
    { id: 'k-comma', value: ',' },
    { id: 'k-dot', value: '.' },
    { id: 'k-slash', value: '/' },
  ],
  [
    { id: 'k-space', value: 'Space', widthClass: 'w-40' },
    { id: 'k-enter', value: 'Enter', widthClass: 'w-20' },
  ],
];

export const testimonialData: TestimonialData[] = [
  {
    id: 't-1',
    name: 'Ava Thompson',
    role: 'Frontend Developer',
    company: 'Studio Grid',
    quote:
      'Typely transformed my daily coding flow. I moved from 52 WPM to 83 WPM in seven weeks while reducing typo correction time dramatically.',
    rating: 5,
    avatarFallback: 'AT',
    progressLabel: '52 → 83 WPM',
  },
  {
    id: 't-2',
    name: 'Noah Patel',
    role: 'Product Manager',
    company: 'Cloudline',
    quote:
      'The structured lessons are excellent. I finally fixed long-standing bad habits and now write documents and specs much faster with fewer edits.',
    rating: 5,
    avatarFallback: 'NP',
    progressLabel: '68 → 92 WPM',
  },
  {
    id: 't-3',
    name: 'Mia Rodriguez',
    role: 'Customer Success Lead',
    company: 'PulseFlow',
    quote:
      'What impressed me most was consistency tracking. Typely helped me build a training routine that actually stuck.',
    rating: 5,
    avatarFallback: 'MR',
    progressLabel: '87% → 97% accuracy',
  },
  {
    id: 't-4',
    name: 'Ethan Nguyen',
    role: 'Data Analyst',
    company: 'NorthPeak',
    quote:
      'The live feedback loop is addictive. I can see exactly where I lose rhythm, and each session gives me a specific fix to apply next.',
    rating: 5,
    avatarFallback: 'EN',
    progressLabel: '48 → 79 WPM',
  },
  {
    id: 't-5',
    name: 'Sophia Kim',
    role: 'Student',
    company: 'State University',
    quote:
      'Before Typely, long assignments were exhausting. Now I type with far less strain and finish my coursework faster.',
    rating: 5,
    avatarFallback: 'SK',
    progressLabel: '61 → 88 WPM',
  },
  {
    id: 't-6',
    name: 'Liam Carter',
    role: 'Operations Manager',
    company: 'TransitOps',
    quote:
      'Professional UI, clear progress metrics, and excellent pacing. It feels like a serious product, not just a typing game.',
    rating: 5,
    avatarFallback: 'LC',
    progressLabel: '74 → 96 WPM',
  },
];

export const statsCounterData: StatCounterData[] = [
  {
    id: 'stats-users',
    value: 10000,
    suffix: '+',
    duration: 1700,
    label: 'Users',
    description: 'Learners training with Typely every month.',
    icon: Users,
  },
  {
    id: 'stats-words',
    value: 2000000,
    suffix: '+',
    duration: 2000,
    label: 'Words Typed',
    description: 'Practice volume completed across all sessions.',
    icon: Activity,
  },
  {
    id: 'stats-accuracy',
    value: 95,
    suffix: '%',
    duration: 1800,
    label: 'Accuracy Improvement',
    description: 'Typical accuracy gain after consistent training.',
    icon: ShieldCheck,
  },
  {
    id: 'stats-lessons',
    value: 20,
    suffix: '+',
    duration: 1500,
    label: 'Structured Lessons',
    description: 'Progressive modules for speed and precision.',
    icon: ListChecks,
  },
];

export const comparisonPoints: ComparisonPoint[] = [
  {
    id: 'cmp-guided',
    feature: 'Guided progression',
    description: 'Structured from fundamentals to advanced speed drills.',
    typely: 'Adaptive lesson path with milestones',
    traditional: 'Random practice with unclear progression',
  },
  {
    id: 'cmp-feedback',
    feature: 'Real-time feedback',
    description: 'Immediate visual cues while typing.',
    typely: 'Error highlighting and correction guidance',
    traditional: 'Feedback mostly after completion',
  },
  {
    id: 'cmp-analytics',
    feature: 'Performance analytics',
    description: 'Deep visibility into your typing behavior.',
    typely: 'WPM trends, accuracy charts, consistency tracking',
    traditional: 'Single score snapshot only',
  },
  {
    id: 'cmp-motivation',
    feature: 'Motivation system',
    description: 'Encourages long-term consistency and habit formation.',
    typely: 'Achievements, streaks, and progress goals',
    traditional: 'Minimal incentives to continue',
  },
  {
    id: 'cmp-ux',
    feature: 'Professional experience',
    description: 'Polished training environment designed for focus.',
    typely: 'Modern UI, micro-interactions, responsive UX',
    traditional: 'Basic interfaces with limited refinement',
  },
];

export const faqItems: FAQItemData[] = [
  {
    id: 'faq-1',
    question: 'Is Typely suitable for complete beginners?',
    answer:
      'Yes. Typely starts with foundational lessons like home row positioning and gradually increases complexity with guided steps.',
  },
  {
    id: 'faq-2',
    question: 'How fast can I improve my typing speed?',
    answer:
      'Most users report measurable progress within two weeks of consistent daily practice. The biggest gains usually come from routine and accuracy focus.',
  },
  {
    id: 'faq-3',
    question: 'Does Typely focus only on speed?',
    answer:
      'No. Typely balances speed with precision. Accuracy is tracked alongside WPM so you build sustainable typing habits rather than rushed habits.',
  },
  {
    id: 'faq-4',
    question: 'Can I practice on mobile and desktop?',
    answer:
      'The website is fully responsive, so you can view progress and train across devices. For best typing practice, desktop keyboard sessions are recommended.',
  },
  {
    id: 'faq-5',
    question: 'Do I need to install anything?',
    answer:
      'No installation is required. Typely runs directly in your browser with your progress saved to your account.',
  },
  {
    id: 'faq-6',
    question: 'Can teams or schools use Typely?',
    answer:
      'Typely is designed to scale from individual learners to structured cohorts. If you need organization-wide usage, contact support for guidance.',
  },
];

export const footerGroups = [
  {
    id: 'support',
    title: 'Support',
    links: [
      { label: 'Support Center', href: '/support' },
      { label: 'FAQ', href: '/faq' },
      { label: 'Contact Us', href: '/contact' },
    ],
  },
  {
    id: 'company',
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Blog', href: '/blog' },
      { label: 'Careers', href: '/careers' },
    ],
  },
  {
    id: 'legal',
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
    ],
  },
] as const;

export const landingFeatureHighlights = [
  {
    id: 'highlight-speed',
    title: 'Speed Training',
    description: 'Improve rhythm, key reach, and sustained pace with structured drills.',
    icon: Zap,
  },
  {
    id: 'highlight-accuracy',
    title: 'Accuracy First',
    description: 'Reduce errors with guided correction flows and precision feedback.',
    icon: Crosshair,
  },
  {
    id: 'highlight-focus',
    title: 'Focused Workflow',
    description: 'Minimal friction interface that keeps your training sessions distraction free.',
    icon: Compass,
  },
  {
    id: 'highlight-guidance',
    title: 'Smart Guidance',
    description: 'Contextual hints identify weak points and suggest what to improve next.',
    icon: Lightbulb,
  },
  {
    id: 'highlight-consistency',
    title: 'Consistency Engine',
    description: 'Streaks and milestones keep momentum high across long-term practice.',
    icon: Clock3,
  },
  {
    id: 'highlight-confidence',
    title: 'Confidence Growth',
    description: 'Build confidence through measurable progress and clear milestones.',
    icon: Sparkles,
  },
] as const;

export const motionCards = [
  { id: 'motion-1', icon: HandMetal, label: 'Magnetic CTA Buttons' },
  { id: 'motion-2', icon: MousePointer2, label: 'Ripple Click Interactions' },
  { id: 'motion-3', icon: TimerReset, label: 'Staggered Reveal Animations' },
  { id: 'motion-4', icon: Layers, label: 'Subtle Glassmorphism Layers' },
] as const;

export const trustSignals = [
  { id: 'signal-1', label: 'Trusted by learners worldwide', icon: Users },
  { id: 'signal-2', label: 'Designed for measurable outcomes', icon: TrendingUp },
  { id: 'signal-3', label: 'Built for consistency and growth', icon: CheckCircle2 },
  { id: 'signal-4', label: '5-star learner satisfaction', icon: Star },
] as const;
