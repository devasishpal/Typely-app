import { Suspense, lazy } from 'react';
import { motion } from 'motion/react';
import PageMeta from '@/components/common/PageMeta';
import HeroSection from '@/components/guide/HeroSection';
import CTASection from '@/components/guide/CTASection';

const FingerPlacement = lazy(() => import('@/components/guide/FingerPlacement'));
const KeyboardInteractive = lazy(() => import('@/components/guide/KeyboardInteractive'));
const PostureGuide = lazy(() => import('@/components/guide/PostureGuide'));
const MistakesSection = lazy(() => import('@/components/guide/MistakesSection'));
const SpeedStrategy = lazy(() => import('@/components/guide/SpeedStrategy'));
const PracticeLevels = lazy(() => import('@/components/guide/PracticeLevels'));
const ProgressPath = lazy(() => import('@/components/guide/ProgressPath'));
const FAQSection = lazy(() => import('@/components/guide/FAQSection'));

function GuideSectionSkeleton() {
  return (
    <div className="animate-pulse rounded-3xl border border-border/60 bg-card/70 p-6 shadow-card sm:p-8">
      <div className="mb-4 h-4 w-40 rounded bg-muted/80" />
      <div className="mb-3 h-8 w-72 rounded bg-muted/80" />
      <div className="mb-8 h-4 w-full rounded bg-muted/70" />
      <div className="space-y-3">
        <div className="h-24 rounded-2xl bg-muted/60" />
        <div className="h-24 rounded-2xl bg-muted/60" />
        <div className="h-24 rounded-2xl bg-muted/60" />
      </div>
    </div>
  );
}

const sectionTransition = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
};

export default function GuidePage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative space-y-6 pb-6 sm:space-y-7"
    >
      <PageMeta
        title="Typely Guide | Master Typing The Right Way"
        description="Learn correct finger placement, posture, and speed techniques with Typely's interactive animated typing guide."
      />

      <a
        href="#guide-main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[90] focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:text-foreground focus:shadow-card"
      >
        Skip to guide content
      </a>

      <HeroSection />

      <main id="guide-main-content" className="space-y-6 sm:space-y-7" aria-label="Typing guide sections">
        <Suspense fallback={<GuideSectionSkeleton />}>
          <motion.div {...sectionTransition}>
            <FingerPlacement />
          </motion.div>
        </Suspense>

        <Suspense fallback={<GuideSectionSkeleton />}>
          <motion.div {...sectionTransition}>
            <KeyboardInteractive />
          </motion.div>
        </Suspense>

        <Suspense fallback={<GuideSectionSkeleton />}>
          <motion.div {...sectionTransition}>
            <PostureGuide />
          </motion.div>
        </Suspense>

        <Suspense fallback={<GuideSectionSkeleton />}>
          <motion.div {...sectionTransition}>
            <MistakesSection />
          </motion.div>
        </Suspense>

        <Suspense fallback={<GuideSectionSkeleton />}>
          <motion.div {...sectionTransition}>
            <SpeedStrategy />
          </motion.div>
        </Suspense>

        <Suspense fallback={<GuideSectionSkeleton />}>
          <motion.div {...sectionTransition}>
            <PracticeLevels />
          </motion.div>
        </Suspense>

        <Suspense fallback={<GuideSectionSkeleton />}>
          <motion.div {...sectionTransition}>
            <ProgressPath />
          </motion.div>
        </Suspense>

        <Suspense fallback={<GuideSectionSkeleton />}>
          <motion.div {...sectionTransition}>
            <FAQSection />
          </motion.div>
        </Suspense>

        <CTASection />
      </main>
    </motion.div>
  );
}
