import { motion } from 'motion/react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { SectionHeading } from '@/components/landing/SectionHeading';
import { faqItems } from '@/components/landing/data';
import { fadeUpVariant } from '@/components/landing/animations';

export default function FAQAccordionSection() {
  return (
    <section id="faq" className="mx-auto w-full max-w-5xl px-4 py-20 sm:px-6 lg:px-8" aria-labelledby="faq-title">
      <SectionHeading
        eyebrow="FAQ"
        title="Answers to common questions about training with Typely."
        description="Everything you need to know before you start: onboarding, progress expectations, and product usage."
      />

      <motion.div
        variants={fadeUpVariant}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-120px 0px' }}
        className="mt-10 rounded-3xl border border-border/65 bg-background/75 p-3 shadow-card backdrop-blur-sm sm:p-4"
      >
        <Accordion type="single" collapsible className="space-y-2">
          {faqItems.map((faq) => (
            <AccordionItem
              key={faq.id}
              value={faq.id}
              className="overflow-hidden rounded-2xl border border-border/55 bg-background/85 px-4"
            >
              <AccordionTrigger className="text-base font-semibold text-foreground hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="pb-5 pt-0 text-sm leading-relaxed text-muted-foreground md:text-base">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </motion.div>
    </section>
  );
}
