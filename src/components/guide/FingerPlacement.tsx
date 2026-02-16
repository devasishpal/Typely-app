import { useMemo } from 'react';
import { motion } from 'motion/react';
import { SectionShell } from '@/components/guide/SectionShell';
import {
  fingerClusters,
  fingerMetadata,
  fingerMetadataMap,
  homeRowTargets,
  keyboardLegendOrder,
  keyboardRows,
} from '@/components/guide/data';
import { guideCardVariant, listStaggerVariant } from '@/components/guide/animations';
import type { FingerId, KeyboardKeyDefinition } from '@/components/guide/types';
import { cn } from '@/lib/utils';

interface FingerPlacementProps {
  className?: string;
}

const fingerSvgPalette: Record<FingerId, { fill: string; stroke: string; glow: string }> = {
  'left-pinky': {
    fill: 'hsl(var(--primary) / 0.2)',
    stroke: 'hsl(var(--primary) / 0.45)',
    glow: 'hsl(var(--primary) / 0.25)',
  },
  'left-ring': {
    fill: 'hsl(var(--secondary) / 0.2)',
    stroke: 'hsl(var(--secondary) / 0.45)',
    glow: 'hsl(var(--secondary) / 0.25)',
  },
  'left-middle': {
    fill: 'hsl(var(--accent) / 0.2)',
    stroke: 'hsl(var(--accent) / 0.45)',
    glow: 'hsl(var(--accent) / 0.25)',
  },
  'left-index': {
    fill: 'hsl(var(--success) / 0.2)',
    stroke: 'hsl(var(--success) / 0.45)',
    glow: 'hsl(var(--success) / 0.25)',
  },
  'right-index': {
    fill: 'hsl(var(--success) / 0.2)',
    stroke: 'hsl(var(--success) / 0.45)',
    glow: 'hsl(var(--success) / 0.25)',
  },
  'right-middle': {
    fill: 'hsl(var(--accent) / 0.2)',
    stroke: 'hsl(var(--accent) / 0.45)',
    glow: 'hsl(var(--accent) / 0.25)',
  },
  'right-ring': {
    fill: 'hsl(var(--secondary) / 0.2)',
    stroke: 'hsl(var(--secondary) / 0.45)',
    glow: 'hsl(var(--secondary) / 0.25)',
  },
  'right-pinky': {
    fill: 'hsl(var(--primary) / 0.2)',
    stroke: 'hsl(var(--primary) / 0.45)',
    glow: 'hsl(var(--primary) / 0.25)',
  },
  thumbs: {
    fill: 'hsl(var(--info) / 0.2)',
    stroke: 'hsl(var(--info) / 0.5)',
    glow: 'hsl(var(--info) / 0.3)',
  },
};

function FingerPlacementKeyboard() {
  return (
    <div className="rounded-3xl border border-border/60 bg-background/70 p-4 shadow-card lg:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">Home Row Focus Keyboard</p>
        <p className="text-xs text-muted-foreground">Glow indicates ASDF JKL; plus Space thumb usage</p>
      </div>

      <div className="space-y-2 overflow-x-auto pb-2 scrollbar-orbit">
        {keyboardRows.map((row) => (
          <div key={row.rowIndex} className={cn('flex min-w-max justify-center gap-1.5', row.alignClass)}>
            {row.keys.map((keyboardKey) => {
              const fingerMeta = fingerMetadataMap[keyboardKey.finger];
              const isHomeRow = Boolean(keyboardKey.homeRow) || keyboardKey.id === 'Space';

              return (
                <motion.div
                  key={keyboardKey.id}
                  className={cn(
                    'relative flex h-11 items-center justify-center rounded-xl border text-xs font-semibold transition-colors sm:h-12',
                    keyboardKey.widthClass ?? 'w-11',
                    fingerMeta.tintClass,
                    fingerMeta.borderClass,
                    fingerMeta.textClass,
                    isHomeRow && 'shadow-[0_0_16px_hsl(var(--success)/0.3)] ring-1 ring-success/40'
                  )}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.35, delay: row.rowIndex * 0.08 + keyboardKey.column * 0.015 }}
                >
                  <span>{keyboardKey.display}</span>
                  {keyboardKey.secondaryDisplay && (
                    <span className="absolute right-1 top-1 text-[10px] font-medium opacity-70">{keyboardKey.secondaryDisplay}</span>
                  )}
                </motion.div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function HomeRowAnimationLayer() {
  const leftFingerTarget = useMemo(
    () => homeRowTargets.filter((target) => target.finger.startsWith('left')),
    []
  );
  const rightFingerTarget = useMemo(
    () => homeRowTargets.filter((target) => target.finger.startsWith('right')),
    []
  );

  return (
    <div className="rounded-3xl border border-border/60 bg-card/80 p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground sm:text-base">Animated Home Row Finger Landing</h3>
        <p className="text-xs text-muted-foreground">Fingers slide into ASDF JKL; and thumbs align over Space</p>
      </div>

      <div className="relative mx-auto w-full max-w-[860px] overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-b from-background/70 to-muted/30 px-4 py-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_80%,hsl(var(--info)/0.12),transparent_45%)]" />

        <svg viewBox="0 0 860 230" role="img" aria-label="Animated fingers moving to home row" className="relative z-10 h-auto w-full">
          <title>Animated finger landing visualization</title>

          {leftFingerTarget.map((target, index) => {
            const palette = fingerSvgPalette[target.finger];
            return (
              <motion.g
                key={target.id}
                initial={{ x: -170 - index * 14, y: -44, opacity: 0 }}
                whileInView={{ x: target.x, y: target.y, opacity: 1 }}
                viewport={{ once: true, amount: 0.7 }}
                transition={{ duration: 0.75, delay: 0.18 + index * 0.12, ease: [0.22, 1, 0.36, 1] }}
              >
                <rect
                  width="56"
                  height="42"
                  rx="14"
                  fill={palette.fill}
                  stroke={palette.stroke}
                  strokeWidth="1.8"
                  style={{ filter: `drop-shadow(0px 0px 12px ${palette.glow})` }}
                />
                <text x="28" y="26" textAnchor="middle" className="fill-current text-[13px] font-bold" style={{ color: 'hsl(var(--foreground))' }}>
                  {target.key}
                </text>
              </motion.g>
            );
          })}

          {rightFingerTarget.map((target, index) => {
            const palette = fingerSvgPalette[target.finger];
            return (
              <motion.g
                key={target.id}
                initial={{ x: 960 + index * 16, y: -44, opacity: 0 }}
                whileInView={{ x: target.x, y: target.y, opacity: 1 }}
                viewport={{ once: true, amount: 0.7 }}
                transition={{ duration: 0.75, delay: 0.21 + index * 0.12, ease: [0.22, 1, 0.36, 1] }}
              >
                <rect
                  width="56"
                  height="42"
                  rx="14"
                  fill={palette.fill}
                  stroke={palette.stroke}
                  strokeWidth="1.8"
                  style={{ filter: `drop-shadow(0px 0px 12px ${palette.glow})` }}
                />
                <text x="28" y="26" textAnchor="middle" className="fill-current text-[13px] font-bold" style={{ color: 'hsl(var(--foreground))' }}>
                  {target.key}
                </text>
              </motion.g>
            );
          })}

          <motion.g
            initial={{ x: 420, y: 250, opacity: 0 }}
            whileInView={{ x: 430, y: 194, opacity: 1 }}
            viewport={{ once: true, amount: 0.7 }}
            transition={{ duration: 0.82, delay: 0.95, ease: [0.22, 1, 0.36, 1] }}
          >
            <rect
              width="96"
              height="42"
              rx="14"
              fill={fingerSvgPalette.thumbs.fill}
              stroke={fingerSvgPalette.thumbs.stroke}
              strokeWidth="1.8"
              style={{ filter: 'drop-shadow(0px 0px 14px hsl(var(--info) / 0.28))' }}
            />
            <text x="48" y="26" textAnchor="middle" className="fill-current text-[11px] font-bold" style={{ color: 'hsl(var(--foreground))' }}>
              SPACE
            </text>
          </motion.g>
        </svg>
      </div>
    </div>
  );
}

function AnimatedHandSvg() {
  const leftFingers = fingerClusters.filter((item) => item.finger.startsWith('left'));
  const rightFingers = fingerClusters.filter((item) => item.finger.startsWith('right'));
  const thumbs = fingerClusters.find((item) => item.finger === 'thumbs');

  return (
    <div className="rounded-3xl border border-border/60 bg-background/75 p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground sm:text-base">Animated Hand Guide</h3>
        <p className="text-xs text-muted-foreground">Each finger color maps directly to assigned keyboard zones</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-b from-background/70 to-muted/25 p-3 sm:p-4">
        <svg viewBox="0 0 860 320" role="img" aria-label="Animated hand placement guide" className="h-auto w-full">
          <title>Finger placement hand guide</title>

          <defs>
            <linearGradient id="handPalmGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--background))" stopOpacity="0.95" />
              <stop offset="100%" stopColor="hsl(var(--muted))" stopOpacity="0.6" />
            </linearGradient>
          </defs>

          <rect x="70" y="140" width="320" height="150" rx="80" fill="url(#handPalmGradient)" stroke="hsl(var(--border))" strokeWidth="2" />
          <rect x="470" y="140" width="320" height="150" rx="80" fill="url(#handPalmGradient)" stroke="hsl(var(--border))" strokeWidth="2" />

          {leftFingers.map((cluster, index) => {
            const palette = fingerSvgPalette[cluster.finger];
            return (
              <motion.g
                key={cluster.id}
                initial={{ x: -80, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ duration: 0.6, delay: 0.12 + index * 0.08 }}
              >
                <motion.rect
                  x={cluster.x}
                  y={cluster.y}
                  width={cluster.width}
                  height={cluster.height}
                  rx="22"
                  fill={palette.fill}
                  stroke={palette.stroke}
                  strokeWidth="1.8"
                  animate={{ y: [cluster.y, cluster.y - 4, cluster.y] }}
                  transition={{
                    duration: 3 + index * 0.2,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: 'easeInOut',
                  }}
                />
              </motion.g>
            );
          })}

          {rightFingers.map((cluster, index) => {
            const palette = fingerSvgPalette[cluster.finger];
            return (
              <motion.g
                key={cluster.id}
                initial={{ x: 80, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ duration: 0.6, delay: 0.18 + index * 0.08 }}
              >
                <motion.rect
                  x={cluster.x}
                  y={cluster.y}
                  width={cluster.width}
                  height={cluster.height}
                  rx="22"
                  fill={palette.fill}
                  stroke={palette.stroke}
                  strokeWidth="1.8"
                  animate={{ y: [cluster.y, cluster.y - 4, cluster.y] }}
                  transition={{
                    duration: 3.1 + index * 0.2,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: 'easeInOut',
                  }}
                />
              </motion.g>
            );
          })}

          {thumbs ? (
            <motion.rect
              x={thumbs.x}
              y={thumbs.y}
              width={thumbs.width}
              height={thumbs.height}
              rx="32"
              fill={fingerSvgPalette.thumbs.fill}
              stroke={fingerSvgPalette.thumbs.stroke}
              strokeWidth="2"
              initial={{ opacity: 0, scale: 0.85, transformOrigin: 'center' }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.65, delay: 0.72 }}
            />
          ) : null}

          <text x="170" y="250" className="fill-muted-foreground text-[12px] font-medium">
            Left Hand
          </text>
          <text x="610" y="250" className="fill-muted-foreground text-[12px] font-medium">
            Right Hand
          </text>
          <text x="378" y="206" className="fill-muted-foreground text-[11px] font-semibold">
            Thumb Zone
          </text>
        </svg>
      </div>
    </div>
  );
}

function FingerLegend() {
  return (
    <motion.div
      className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3"
      variants={listStaggerVariant(0.05)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      {keyboardLegendOrder.map((fingerId) => {
        const finger = fingerMetadataMap[fingerId];
        return (
          <motion.article
            key={finger.id}
            variants={guideCardVariant}
            className={cn(
              'rounded-2xl border p-3 shadow-sm transition-transform hover:-translate-y-0.5',
              finger.tintClass,
              finger.borderClass
            )}
          >
            <h3 className={cn('text-sm font-semibold', finger.textClass)}>{finger.name}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{finger.instruction}</p>
          </motion.article>
        );
      })}
    </motion.div>
  );
}

function FingerCoverageRows() {
  const groupedByFinger = useMemo(() => {
    const groups = new Map<FingerId, KeyboardKeyDefinition[]>();

    keyboardRows.forEach((row) => {
      row.keys.forEach((keyboardKey) => {
        const list = groups.get(keyboardKey.finger) ?? [];
        list.push(keyboardKey);
        groups.set(keyboardKey.finger, list);
      });
    });

    return groups;
  }, []);

  return (
    <div className="grid gap-3">
      {keyboardLegendOrder.map((fingerId) => {
        const finger = fingerMetadataMap[fingerId];
        const assignedKeys = groupedByFinger.get(fingerId) ?? [];

        return (
          <motion.article
            key={`coverage-${fingerId}`}
            className={cn('rounded-2xl border p-4 shadow-sm', finger.tintClass, finger.borderClass)}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.35 }}
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className={cn('text-sm font-semibold', finger.textClass)}>{finger.name} Key Zone</h3>
              <span className="rounded-full border border-border/60 bg-background/75 px-2.5 py-1 text-[11px] text-muted-foreground">
                {assignedKeys.length} keys
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {assignedKeys.map((keyboardKey) => (
                <span
                  key={`${fingerId}-${keyboardKey.id}`}
                  className={cn(
                    'inline-flex h-7 items-center justify-center rounded-lg border px-2 text-[11px] font-semibold',
                    finger.borderClass,
                    finger.tintClass,
                    finger.textClass
                  )}
                >
                  {keyboardKey.display}
                </span>
              ))}
            </div>
          </motion.article>
        );
      })}
    </div>
  );
}

export default function FingerPlacement({ className }: FingerPlacementProps) {
  return (
    <SectionShell
      id="guide-finger-placement"
      title="Finger Placement Fundamentals"
      subtitle="Lock in the correct touch typing map so every key is tied to a specific finger. This removes guesswork, boosts accuracy, and prepares your hands for faster rhythm."
      className={className}
    >
      <FingerLegend />

      <div className="grid gap-5 xl:grid-cols-2">
        <HomeRowAnimationLayer />
        <AnimatedHandSvg />
      </div>

      <FingerPlacementKeyboard />

      <FingerCoverageRows />
    </SectionShell>
  );
}
