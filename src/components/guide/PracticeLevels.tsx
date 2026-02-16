import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Clock3, GaugeCircle, ShieldCheck } from 'lucide-react';
import { SectionShell } from '@/components/guide/SectionShell';
import { practiceLevels } from '@/components/guide/data';
import { typingDrillLibrary } from '@/components/guide/drillLibrary';
import { cn } from '@/lib/utils';

interface PracticeLevelsProps {
  className?: string;
}

const DRILLS_PER_PAGE = 8;

function getLevelAccent(level: string) {
  switch (level) {
    case 'Beginner':
      return {
        tint: 'bg-info/10',
        border: 'border-info/35',
        text: 'text-info',
      };
    case 'Intermediate':
      return {
        tint: 'bg-secondary/10',
        border: 'border-secondary/35',
        text: 'text-secondary',
      };
    case 'Advanced':
      return {
        tint: 'bg-primary/10',
        border: 'border-primary/35',
        text: 'text-primary',
      };
    default:
      return {
        tint: 'bg-success/10',
        border: 'border-success/35',
        text: 'text-success',
      };
  }
}

function estimatePercent(level: string) {
  switch (level) {
    case 'Beginner':
      return 25;
    case 'Intermediate':
      return 52;
    case 'Advanced':
      return 75;
    default:
      return 96;
  }
}

export default function PracticeLevels({ className }: PracticeLevelsProps) {
  const [activeLevelId, setActiveLevelId] = useState(practiceLevels[0]?.id ?? '');
  const [drillPage, setDrillPage] = useState(0);

  const activeLevel = useMemo(
    () => practiceLevels.find((level) => level.id === activeLevelId) ?? practiceLevels[0],
    [activeLevelId]
  );

  const filteredDrills = useMemo(
    () => typingDrillLibrary.filter((drill) => drill.level === activeLevel.level),
    [activeLevel.level]
  );

  const totalDrillPages = Math.max(1, Math.ceil(filteredDrills.length / DRILLS_PER_PAGE));

  const visibleDrills = useMemo(() => {
    const startIndex = drillPage * DRILLS_PER_PAGE;
    const endIndex = startIndex + DRILLS_PER_PAGE;
    return filteredDrills.slice(startIndex, endIndex);
  }, [drillPage, filteredDrills]);

  useEffect(() => {
    setDrillPage(0);
  }, [activeLevel.id]);

  return (
    <SectionShell
      id="guide-practice-levels"
      title="Practice Recommendation Levels"
      subtitle="Choose your current stage to follow practical targets for WPM, daily duration, and acceptable error range."
      className={className}
    >
      <div className="grid gap-3 lg:grid-cols-4">
        {practiceLevels.map((level, index) => {
          const accent = getLevelAccent(level.level);
          const isActive = level.id === activeLevelId;
          const completionPercent = estimatePercent(level.level);

          return (
            <motion.button
              key={level.id}
              type="button"
              onClick={() => setActiveLevelId(level.id)}
              className={cn(
                'rounded-2xl border p-4 text-left shadow-sm transition-all',
                isActive
                  ? cn(accent.tint, accent.border, 'shadow-card')
                  : 'border-border/70 bg-card/80 hover:border-primary/30'
              )}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.35, delay: index * 0.05 }}
              whileHover={{ y: -2 }}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className={cn('text-base font-semibold', isActive ? accent.text : 'text-foreground')}>{level.level}</h3>
                <span className="rounded-full border border-border/60 bg-background/70 px-2 py-0.5 text-[10px] text-muted-foreground">
                  {completionPercent}%
                </span>
              </div>

              <p className="text-sm text-muted-foreground">Goal: {level.wpmGoal}</p>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted/70">
                <motion.div
                  className={cn(
                    'h-full rounded-full',
                    isActive
                      ? 'bg-[linear-gradient(90deg,hsl(var(--secondary))_0%,hsl(var(--primary))_100%)]'
                      : 'bg-border'
                  )}
                  animate={{ width: `${completionPercent}%` }}
                  transition={{ duration: 0.45, ease: 'easeOut' }}
                />
              </div>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.article
          key={activeLevel.id}
          className="rounded-3xl border border-border/70 bg-background/75 p-5 shadow-card"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold text-foreground">{activeLevel.level} Practice Blueprint</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Tailored recommendation for this level to maintain measurable and sustainable typing improvement.
              </p>
            </div>
            <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              WPM: {activeLevel.wpmGoal}
            </span>
          </header>

          <div className="grid gap-3 lg:grid-cols-3">
            <div className="rounded-2xl border border-border/60 bg-card/80 p-4">
              <h4 className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                <Clock3 className="h-4 w-4 text-secondary" />
                Practice Time
              </h4>
              <p className="text-sm text-muted-foreground">{activeLevel.practiceTime}</p>
            </div>

            <div className="rounded-2xl border border-border/60 bg-card/80 p-4">
              <h4 className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                <GaugeCircle className="h-4 w-4 text-primary" />
                Mistake Tolerance
              </h4>
              <p className="text-sm text-muted-foreground">{activeLevel.mistakeTolerance}</p>
            </div>

            <div className="rounded-2xl border border-border/60 bg-card/80 p-4">
              <h4 className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                <ShieldCheck className="h-4 w-4 text-success" />
                Consistency Goal
              </h4>
              <p className="text-sm text-muted-foreground">
                Maintain posture, finger discipline, and controlled progression every session.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-border/60 bg-card/80 p-4">
              <h4 className="text-sm font-semibold text-foreground">Primary Focus Areas</h4>
              <ul className="mt-2 space-y-2">
                {activeLevel.focusAreas.map((focusArea) => (
                  <li
                    key={`${activeLevel.id}-${focusArea}`}
                    className="rounded-lg border border-border/60 bg-background/70 px-3 py-2 text-sm text-muted-foreground"
                  >
                    {focusArea}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-border/60 bg-card/80 p-4">
              <h4 className="text-sm font-semibold text-foreground">Session Blueprint</h4>
              <ol className="mt-2 space-y-2">
                {activeLevel.sessionBlueprint.map((blueprintStep, index) => (
                  <li
                    key={`${activeLevel.id}-${blueprintStep}`}
                    className="rounded-lg border border-border/60 bg-background/70 px-3 py-2 text-sm text-muted-foreground"
                  >
                    <span className="mr-2 text-xs font-semibold text-primary">{index + 1}.</span>
                    {blueprintStep}
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-border/60 bg-card/80 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-sm font-semibold text-foreground">Level Drill Library</h4>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDrillPage((currentPage) => Math.max(0, currentPage - 1))}
                  disabled={drillPage === 0}
                  className="rounded-md border border-border/70 bg-background/70 px-2.5 py-1 text-xs font-medium text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-xs text-muted-foreground">
                  Page {drillPage + 1} of {totalDrillPages}
                </span>
                <button
                  type="button"
                  onClick={() => setDrillPage((currentPage) => Math.min(totalDrillPages - 1, currentPage + 1))}
                  disabled={drillPage >= totalDrillPages - 1}
                  className="rounded-md border border-border/70 bg-background/70 px-2.5 py-1 text-xs font-medium text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              {visibleDrills.map((drill) => (
                <motion.article
                  key={drill.id}
                  className="rounded-xl border border-border/60 bg-background/70 p-3"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <h5 className="text-sm font-semibold text-foreground">{drill.title}</h5>
                    <span className="rounded-full border border-border/60 bg-card/80 px-2 py-0.5 text-[10px] text-muted-foreground">
                      {drill.duration}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Focus: {drill.focus}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Objective: {drill.objective}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Passage: {drill.passage}</p>
                </motion.article>
              ))}
            </div>
          </div>
        </motion.article>
      </AnimatePresence>
    </SectionShell>
  );
}
