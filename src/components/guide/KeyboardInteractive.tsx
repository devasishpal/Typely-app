import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Info, Keyboard, Lightbulb } from 'lucide-react';
import { SectionShell } from '@/components/guide/SectionShell';
import { fingerMetadataMap, keyboardLegendOrder, keyboardRows } from '@/components/guide/data';
import { guideCardVariant, listStaggerVariant } from '@/components/guide/animations';
import type { FingerId, KeyboardKeyDefinition } from '@/components/guide/types';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface KeyboardInteractiveProps {
  className?: string;
}

interface FingerStat {
  finger: FingerId;
  keyCount: number;
  keyExamples: string[];
}

function buildFingerStats(): FingerStat[] {
  const buckets = new Map<FingerId, KeyboardKeyDefinition[]>();
  keyboardRows.forEach((row) => {
    row.keys.forEach((keyboardKey) => {
      const items = buckets.get(keyboardKey.finger) ?? [];
      items.push(keyboardKey);
      buckets.set(keyboardKey.finger, items);
    });
  });

  return keyboardLegendOrder.map((finger) => {
    const keys = buckets.get(finger) ?? [];
    return {
      finger,
      keyCount: keys.length,
      keyExamples: keys.slice(0, 6).map((item) => item.display),
    };
  });
}

function Keycap({
  keyboardKey,
  isActive,
  onHover,
  onLeave,
}: {
  keyboardKey: KeyboardKeyDefinition;
  isActive: boolean;
  onHover: (targetKey: KeyboardKeyDefinition) => void;
  onLeave: () => void;
}) {
  const fingerMeta = fingerMetadataMap[keyboardKey.finger];

  return (
    <TooltipProvider delayDuration={90}>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            type="button"
            aria-label={`${keyboardKey.display} key. ${fingerMeta.instruction}.`}
            onMouseEnter={() => onHover(keyboardKey)}
            onMouseLeave={onLeave}
            onFocus={() => onHover(keyboardKey)}
            onBlur={onLeave}
            whileHover={{ y: -2, scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              'relative flex h-11 items-center justify-center rounded-xl border text-xs font-semibold transition-colors sm:h-12',
              keyboardKey.widthClass ?? 'w-11',
              keyboardKey.homeRow ? 'ring-1 ring-success/50 shadow-[0_0_16px_hsl(var(--success)/0.22)]' : '',
              isActive
                ? cn(fingerMeta.tintClass, fingerMeta.borderClass, fingerMeta.textClass, fingerMeta.glowClass)
                : 'border-border/70 bg-card/90 text-foreground hover:border-primary/30 hover:bg-primary/8'
            )}
          >
            <span>{keyboardKey.display}</span>
            {keyboardKey.secondaryDisplay && (
              <span className="absolute right-1 top-1 text-[10px] font-medium text-muted-foreground">
                {keyboardKey.secondaryDisplay}
              </span>
            )}
          </motion.button>
        </TooltipTrigger>
        <TooltipContent className="border-border/70 bg-background/95 text-foreground shadow-card">
          {fingerMeta.instruction}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function FingerIndicatorRail({ activeFinger }: { activeFinger: FingerId | null }) {
  return (
    <motion.div
      variants={listStaggerVariant(0.05)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3"
    >
      {keyboardLegendOrder.map((fingerId) => {
        const finger = fingerMetadataMap[fingerId];
        const isActive = activeFinger === fingerId;
        return (
          <motion.article
            key={`interactive-finger-${finger.id}`}
            variants={guideCardVariant}
            className={cn(
              'rounded-2xl border p-3 shadow-sm transition-all',
              isActive ? cn(finger.tintClass, finger.borderClass, finger.glowClass) : 'border-border/70 bg-background/70'
            )}
          >
            <p className={cn('text-sm font-semibold', isActive ? finger.textClass : 'text-foreground')}>{finger.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">{finger.instruction}</p>
          </motion.article>
        );
      })}
    </motion.div>
  );
}

function FingerHeatSummary({ activeFinger }: { activeFinger: FingerId | null }) {
  const fingerStats = useMemo(() => buildFingerStats(), []);

  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {fingerStats.map((stat) => {
        const fingerMeta = fingerMetadataMap[stat.finger];
        const isActive = activeFinger === stat.finger;

        return (
          <motion.article
            key={`heat-${stat.finger}`}
            className={cn(
              'rounded-2xl border px-3 py-3 shadow-sm transition-all',
              isActive ? cn(fingerMeta.tintClass, fingerMeta.borderClass, fingerMeta.glowClass) : 'border-border/70 bg-card/75'
            )}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.35 }}
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className={cn('text-sm font-semibold', isActive ? fingerMeta.textClass : 'text-foreground')}>
                {fingerMeta.shortLabel} Zone
              </h3>
              <span className="rounded-full border border-border/60 bg-background/70 px-2 py-0.5 text-[10px] text-muted-foreground">
                {stat.keyCount} keys
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {stat.keyExamples.map((exampleKey) => (
                <span
                  key={`example-${stat.finger}-${exampleKey}`}
                  className={cn(
                    'inline-flex h-6 min-w-6 items-center justify-center rounded-md border px-1.5 text-[10px] font-semibold',
                    isActive ? cn(fingerMeta.borderClass, fingerMeta.tintClass, fingerMeta.textClass) : 'border-border/70 bg-background/80 text-muted-foreground'
                  )}
                >
                  {exampleKey}
                </span>
              ))}
            </div>
          </motion.article>
        );
      })}
    </div>
  );
}

function KeyboardGrid({ activeKey, setActiveKey }: { activeKey: KeyboardKeyDefinition | null; setActiveKey: (value: KeyboardKeyDefinition | null) => void; }) {
  const activeFinger = activeKey?.finger ?? null;

  return (
    <div className="rounded-3xl border border-border/60 bg-background/75 p-4 shadow-card lg:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-foreground sm:text-base">Full Interactive Keyboard Layout</h3>
          <p className="text-xs text-muted-foreground">Hover or focus any key to reveal required finger usage</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
          <Keyboard className="h-3.5 w-3.5" aria-hidden="true" />
          Touch Typing Mode
        </span>
      </div>

      <div className="overflow-x-auto pb-2 scrollbar-orbit">
        <div className="space-y-2 min-w-max">
          {keyboardRows.map((row) => (
            <div key={`interactive-row-${row.rowIndex}`} className="flex justify-center gap-1.5">
              {row.keys.map((keyboardKey) => (
                <Keycap
                  key={`interactive-${keyboardKey.id}`}
                  keyboardKey={keyboardKey}
                  isActive={Boolean(activeFinger && activeFinger === keyboardKey.finger)}
                  onHover={setActiveKey}
                  onLeave={() => setActiveKey(null)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-border/70 bg-card/85 p-4">
        <AnimatePresence mode="wait">
          {activeKey ? (
            <motion.div
              key={`active-${activeKey.id}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="flex flex-wrap items-start justify-between gap-3"
            >
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Current Key</p>
                <p className="mt-1 text-xl font-semibold text-foreground">{activeKey.display}</p>
                <p className="mt-2 text-sm text-muted-foreground">{fingerMetadataMap[activeKey.finger].instruction}</p>
              </div>
              <div
                className={cn(
                  'rounded-xl border px-4 py-3 text-sm font-semibold',
                  fingerMetadataMap[activeKey.finger].tintClass,
                  fingerMetadataMap[activeKey.finger].borderClass,
                  fingerMetadataMap[activeKey.finger].textClass
                )}
              >
                {fingerMetadataMap[activeKey.finger].name}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="inactive"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="flex items-start gap-2 text-sm text-muted-foreground"
            >
              <Info className="mt-0.5 h-4 w-4 text-info" aria-hidden="true" />
              Hover over any key to preview which finger should press it.
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function CoachingTips() {
  const tips = [
    'Start each line with fingers reset on ASDF and JKL;.',
    'Use gentle taps and avoid pressing keys with force.',
    'If a finger misses repeatedly, slow down and isolate that key route.',
    'Practice punctuation with the same finger discipline as letters.',
  ];

  return (
    <div className="rounded-3xl border border-border/60 bg-card/80 p-4 shadow-card lg:p-5">
      <h3 className="mb-3 text-sm font-semibold text-foreground sm:text-base">Keyboard Coaching Tips</h3>
      <ul className="space-y-2">
        {tips.map((tip) => (
          <motion.li
            key={tip}
            className="flex gap-2 rounded-xl border border-border/60 bg-background/75 px-3 py-2 text-sm text-muted-foreground"
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.3 }}
          >
            <Lightbulb className="mt-0.5 h-4 w-4 flex-none text-warning" aria-hidden="true" />
            {tip}
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

export default function KeyboardInteractive({ className }: KeyboardInteractiveProps) {
  const [activeKey, setActiveKey] = useState<KeyboardKeyDefinition | null>(null);
  const activeFinger = activeKey?.finger ?? null;

  return (
    <SectionShell
      id="guide-keyboard-interactive"
      title="Keyboard Layout Interactive"
      subtitle="Explore the complete keyboard map. Hovering a key highlights the exact finger assignment and reinforces reliable touch typing habits."
      className={className}
    >
      <FingerIndicatorRail activeFinger={activeFinger} />
      <KeyboardGrid activeKey={activeKey} setActiveKey={setActiveKey} />
      <FingerHeatSummary activeFinger={activeFinger} />
      <CoachingTips />
    </SectionShell>
  );
}
