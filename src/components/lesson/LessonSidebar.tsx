import { motion } from 'motion/react';
import BeginnerCard from '@/components/lesson/BeginnerCard';
import CoachTipCard from '@/components/lesson/CoachTipCard';
import FocusMeterCard from '@/components/lesson/FocusMeterCard';
import MistakesCard from '@/components/lesson/MistakesCard';
import { sidebarReveal } from '@/components/lesson/animations';
import type { CoachTip } from '@/data/coachTips';

interface LessonSidebarProps {
  difficulty: string;
  coachTip: CoachTip;
  loadingNextTip: boolean;
  progressPercent: number;
  mistakes: Array<{ key: string; total: number }>;
}

export default function LessonSidebar({
  difficulty,
  coachTip,
  loadingNextTip,
  progressPercent,
  mistakes,
}: LessonSidebarProps) {
  return (
    <motion.aside
      variants={sidebarReveal}
      className="lesson-scrollbar max-h-[calc(100vh-148px)] space-y-3 overflow-y-auto pr-1"
    >
      <BeginnerCard title={difficulty} />
      <CoachTipCard tip={coachTip} loadingNextTip={loadingNextTip} />
      <FocusMeterCard progressPercent={progressPercent} />
      <MistakesCard mistakes={mistakes} />
    </motion.aside>
  );
}
