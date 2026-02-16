import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { CardContent } from '@/components/ui/card';
import LessonNavbar from '@/components/lesson/LessonNavbar';
import LessonCardWrapper from '@/components/lesson/LessonCardWrapper';
import LessonStatsCard from '@/components/lesson/LessonStatsCard';
import LessonProgressCard from '@/components/lesson/LessonProgressCard';
import LessonKeyboard from '@/components/lesson/LessonKeyboard';
import LessonSidebar from '@/components/lesson/LessonSidebar';
import { cardReveal, pageFadeIn } from '@/components/lesson/animations';
import lessonsData from '@/data/lessons.json';
import { useTypingEngine } from '@/hooks/useTypingEngine';
import { useCoachTips } from '@/hooks/useCoachTips';
import { useTheme } from '@/hooks/useTheme';
import { LESSON_THEME_CLASSNAMES } from '@/constants/lessonTheme';
import { cn } from '@/lib/utils';
import type { LessonNode } from '@/store/lessonStore';
import '@/styles/scrollbar.css';

type RawLesson = {
  id: string;
  title: string;
  description: string;
  content: string;
};

type RawUnit = {
  id: string;
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  lessons: RawLesson[];
};

type RawModule = {
  id: string;
  title: string;
  description: string;
  units: RawUnit[];
};

type LessonCatalog = {
  modules: RawModule[];
};

function flattenLessons(catalog: LessonCatalog): LessonNode[] {
  const output: LessonNode[] = [];

  for (const module of catalog.modules) {
    for (const unit of module.units) {
      for (const lesson of unit.lessons) {
        output.push({
          id: lesson.id,
          title: lesson.title,
          description: lesson.description,
          difficulty: unit.difficulty,
          content: lesson.content,
          moduleId: module.id,
          moduleTitle: module.title,
          unitId: unit.id,
          unitTitle: unit.title,
        });
      }
    }
  }

  return output;
}

export default function LessonPage() {
  const { lessonId } = useParams();
  const { theme } = useTheme();
  const lessonTheme = LESSON_THEME_CLASSNAMES[theme];

  const allLessons = useMemo(() => flattenLessons(lessonsData as LessonCatalog), []);
  const lesson = useMemo(() => {
    if (!allLessons.length) return null;
    return allLessons.find((item) => item.id === lessonId) ?? allLessons[0];
  }, [allLessons, lessonId]);

  const typing = useTypingEngine(lesson);
  const { tip, loadingNextTip } = useCoachTips();

  if (!lesson) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8 text-center">
        <div>
          <h1 className="text-2xl font-bold">No lesson found</h1>
          <p className="mt-2 text-muted-foreground">Add lesson data to continue.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('lesson-theme-transition relative min-h-screen pb-6', lessonTheme.page)}>
      <div aria-hidden className="lesson-noise-overlay pointer-events-none absolute inset-0" />
      <div aria-hidden className="lesson-animated-gradient pointer-events-none absolute inset-0" />

      <LessonNavbar />

      <motion.main
        className="relative z-10 mx-auto mt-3 w-full max-w-[1520px] px-3 sm:px-4"
        variants={pageFadeIn}
        initial="hidden"
        animate="visible"
      >
        <button
          type="button"
          onClick={typing.resetEngine}
          className="sr-only"
          aria-hidden="true"
          tabIndex={-1}
        >
          Reset Lesson
        </button>

        <div className="grid gap-3 lg:gap-4 xl:grid-cols-[264px_minmax(0,1fr)_304px]">
          <motion.section variants={cardReveal} className="space-y-3 lg:space-y-4">
            <LessonCardWrapper className="border-white/15 bg-black/20" interactive>
              <CardContent className="p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300/80">
                  {lesson.unitTitle}
                </p>
                <h1 className="mt-1.5 bg-gradient-to-r from-cyan-200 via-blue-200 to-indigo-200 bg-clip-text text-3xl font-extrabold leading-[1.05] text-transparent">
                  {lesson.title}
                </h1>
                <p className="mt-3 text-sm leading-5 text-muted-foreground">{lesson.description}</p>
                <div className="mt-4 h-1.5 w-24 rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500" />
              </CardContent>
            </LessonCardWrapper>

            <LessonStatsCard
              wpm={typing.wpm}
              accuracy={typing.accuracy}
              errorRate={typing.errorRate}
              errorCount={typing.incorrectCount}
              elapsedMs={typing.elapsedMs}
            />
          </motion.section>

          <motion.section variants={cardReveal} className="space-y-3 lg:space-y-4">
            <LessonProgressCard
              contentCharacters={typing.contentCharacters}
              currentIndex={typing.currentIndex}
              progressPercent={typing.progressPercent}
              errorFlashIndex={typing.errorFlashIndex}
              correctFlashIndex={typing.correctFlashIndex}
            />
            <LessonKeyboard
              nextKey={typing.nextKey}
              activeKey={typing.activeKey}
              progressPercent={typing.progressPercent}
            />
          </motion.section>

          <LessonSidebar
            difficulty={lesson.difficulty}
            coachTip={tip}
            loadingNextTip={loadingNextTip}
            progressPercent={typing.progressPercent}
            mistakes={typing.topMistakes}
          />
        </div>
      </motion.main>
    </div>
  );
}
