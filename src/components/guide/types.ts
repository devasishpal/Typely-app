export type FingerId =
  | 'left-pinky'
  | 'left-ring'
  | 'left-middle'
  | 'left-index'
  | 'right-index'
  | 'right-middle'
  | 'right-ring'
  | 'right-pinky'
  | 'thumbs';

export type HandSide = 'left' | 'right' | 'thumbs';

export interface FingerMeta {
  id: FingerId;
  name: string;
  instruction: string;
  shortLabel: string;
  handSide: HandSide;
  tintClass: string;
  borderClass: string;
  textClass: string;
  glowClass: string;
  gradientClass: string;
}

export interface KeyboardKeyDefinition {
  id: string;
  display: string;
  secondaryDisplay?: string;
  widthClass?: string;
  finger: FingerId;
  homeRow?: boolean;
  row: number;
  column: number;
}

export interface KeyboardRowDefinition {
  rowIndex: number;
  alignClass?: string;
  keys: KeyboardKeyDefinition[];
}

export interface HomeRowFingerTarget {
  id: string;
  key: string;
  finger: FingerId;
  x: number;
  y: number;
}

export interface PostureRule {
  id: string;
  title: string;
  bad: string;
  good: string;
  detail: string;
  anchorY: number;
}

export interface MistakeDefinition {
  id: string;
  title: string;
  shortDescription: string;
  detailedExplanation: string;
  correctionPlan: string[];
  impact: string;
}

export interface StrategyStep {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  tacticalChecklist: string[];
  targetRange: string;
}

export interface PracticeLevel {
  id: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Pro';
  wpmGoal: string;
  practiceTime: string;
  mistakeTolerance: string;
  focusAreas: string[];
  sessionBlueprint: string[];
}

export interface ProgressMilestone {
  id: string;
  title: string;
  subtitle: string;
  metric: string;
  details: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface HeroFloatingKey {
  id: string;
  value: string;
  left: string;
  top: string;
  delay: number;
  duration: number;
}

export interface HeroInsight {
  id: string;
  label: string;
  value: string;
  description: string;
}

export interface FingerCluster {
  id: string;
  finger: FingerId;
  width: number;
  height: number;
  x: number;
  y: number;
}

export interface KeyboardTooltipInfo {
  key: string;
  finger: FingerId;
  instruction: string;
}
