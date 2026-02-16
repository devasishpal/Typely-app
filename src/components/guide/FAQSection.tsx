import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown, MessageCircleQuestion } from 'lucide-react';
import { SectionShell } from '@/components/guide/SectionShell';
import { faqItems } from '@/components/guide/data';
import { cn } from '@/lib/utils';

interface FAQSectionProps {
  className?: string;
}

export default function FAQSection({ className }: FAQSectionProps) {
  const [activeFaqId, setActiveFaqId] = useState<string | null>(faqItems[0]?.id ?? null);

  return (
    <SectionShell
      id="guide-faq"
      title="Frequently Asked Questions"
      subtitle="Answers to the most common questions about improving speed, accuracy, posture, and overall typing consistency."
      className={className}
    >
      <div className="space-y-3">
        {faqItems.map((faq, index) => {
          const isOpen = activeFaqId === faq.id;

          return (
            <motion.article
              key={faq.id}
              className={cn(
                'overflow-hidden rounded-2xl border bg-card/85 shadow-sm transition-colors',
                isOpen ? 'border-primary/35' : 'border-border/70'
              )}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.35, delay: index * 0.05 }}
            >
              <h3>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left sm:px-5"
                  aria-expanded={isOpen}
                  aria-controls={`faq-panel-${faq.id}`}
                  onClick={() => setActiveFaqId((current) => (current === faq.id ? null : faq.id))}
                >
                  <span className="inline-flex items-start gap-2">
                    <MessageCircleQuestion className="mt-0.5 h-4 w-4 flex-none text-primary" aria-hidden="true" />
                    <span className="text-sm font-semibold text-foreground sm:text-base">{faq.question}</span>
                  </span>

                  <motion.span
                    className="inline-flex h-8 w-8 flex-none items-center justify-center rounded-full border border-border/70 bg-background/70 text-muted-foreground"
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.24 }}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </motion.span>
                </button>
              </h3>

              <AnimatePresence initial={false}>
                {isOpen ? (
                  <motion.div
                    id={`faq-panel-${faq.id}`}
                    role="region"
                    aria-labelledby={`faq-title-${faq.id}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden border-t border-border/60"
                  >
                    <div className="px-4 py-4 sm:px-5">
                      <p className="text-sm leading-relaxed text-muted-foreground">{faq.answer}</p>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </motion.article>
          );
        })}
      </div>
    </SectionShell>
  );
}
