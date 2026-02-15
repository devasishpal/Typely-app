import { Suspense, lazy } from 'react';
import { motion } from 'motion/react';
import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { WhyChooseSection } from '@/components/landing/WhyChooseSection';
import { HowItWorksTimelineSection } from '@/components/landing/HowItWorksTimelineSection';
import { CTASection } from '@/components/landing/CTASection';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { LandingSEO } from '@/components/landing/LandingSEO';
import { SectionSkeleton } from '@/components/landing/SectionSkeleton';

const TypingDemoSection = lazy(() => import('@/components/landing/TypingDemoSection'));
const SocialProofSection = lazy(() => import('@/components/landing/SocialProofSection'));
const StatsCounterSection = lazy(() => import('@/components/landing/StatsCounterSection'));
const FeaturesComparisonSection = lazy(() => import('@/components/landing/FeaturesComparisonSection'));
const FAQAccordionSection = lazy(() => import('@/components/landing/FAQAccordionSection'));

const sectionTransition = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
};

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-gradient-background text-foreground">
      <LandingSEO />

      <a
        href="#hero"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:text-foreground focus:shadow-card"
      >
        Skip to content
      </a>

      <LandingNavbar />

      <main className="scroll-smooth">
        <HeroSection />
        <WhyChooseSection />
        <HowItWorksTimelineSection />

        <Suspense fallback={<SectionSkeleton />}>
          <motion.div {...sectionTransition}>
            <TypingDemoSection />
          </motion.div>
        </Suspense>

        <Suspense fallback={<SectionSkeleton />}>
          <motion.div {...sectionTransition}>
            <SocialProofSection />
          </motion.div>
        </Suspense>

        <Suspense fallback={<SectionSkeleton />}>
          <motion.div {...sectionTransition}>
            <StatsCounterSection />
          </motion.div>
        </Suspense>

        <Suspense fallback={<SectionSkeleton />}>
          <motion.div {...sectionTransition}>
            <FeaturesComparisonSection />
          </motion.div>
        </Suspense>

        <Suspense fallback={<SectionSkeleton />}>
          <motion.div {...sectionTransition}>
            <FAQAccordionSection />
          </motion.div>
        </Suspense>

        <CTASection />
      </main>

      <LandingFooter />
    </div>
  );
}
