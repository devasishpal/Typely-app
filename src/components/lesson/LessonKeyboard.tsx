import { motion } from 'motion/react';
import { CardContent } from '@/components/ui/card';
import LessonCardWrapper from '@/components/lesson/LessonCardWrapper';
import { FINGER_ZONE_CLASSES, FINGER_ZONE_LABELS, type FingerZone } from '@/constants/lessonTheme';
import { formatPercent } from '@/utils/formatUtils';
import { cn } from '@/lib/utils';

type KeyDefinition = {
  label: string;
  match: string;
  zone: FingerZone;
  widthClass?: string;
};

const KEY_ROWS: KeyDefinition[][] = [
  [
    { label: '`', match: '`', zone: 'pinky' },
    { label: '1', match: '1', zone: 'pinky' },
    { label: '2', match: '2', zone: 'ring' },
    { label: '3', match: '3', zone: 'middle' },
    { label: '4', match: '4', zone: 'index' },
    { label: '5', match: '5', zone: 'index' },
    { label: '6', match: '6', zone: 'index' },
    { label: '7', match: '7', zone: 'index' },
    { label: '8', match: '8', zone: 'middle' },
    { label: '9', match: '9', zone: 'ring' },
    { label: '0', match: '0', zone: 'pinky' },
    { label: '-', match: '-', zone: 'pinky' },
    { label: '=', match: '=', zone: 'pinky' },
    { label: 'Backspace', match: 'Backspace', zone: 'pinky', widthClass: 'min-w-[112px]' },
  ],
  [
    { label: 'Tab', match: 'Tab', zone: 'pinky', widthClass: 'min-w-[74px]' },
    { label: 'q', match: 'q', zone: 'pinky' },
    { label: 'w', match: 'w', zone: 'ring' },
    { label: 'e', match: 'e', zone: 'middle' },
    { label: 'r', match: 'r', zone: 'index' },
    { label: 't', match: 't', zone: 'index' },
    { label: 'y', match: 'y', zone: 'index' },
    { label: 'u', match: 'u', zone: 'index' },
    { label: 'i', match: 'i', zone: 'middle' },
    { label: 'o', match: 'o', zone: 'ring' },
    { label: 'p', match: 'p', zone: 'pinky' },
    { label: '[', match: '[', zone: 'pinky' },
    { label: ']', match: ']', zone: 'pinky' },
    { label: '\\', match: '\\', zone: 'pinky', widthClass: 'min-w-[74px]' },
  ],
  [
    { label: 'Caps', match: 'CapsLock', zone: 'pinky', widthClass: 'min-w-[92px]' },
    { label: 'a', match: 'a', zone: 'pinky' },
    { label: 's', match: 's', zone: 'ring' },
    { label: 'd', match: 'd', zone: 'middle' },
    { label: 'f', match: 'f', zone: 'index' },
    { label: 'g', match: 'g', zone: 'index' },
    { label: 'h', match: 'h', zone: 'index' },
    { label: 'j', match: 'j', zone: 'index' },
    { label: 'k', match: 'k', zone: 'middle' },
    { label: 'l', match: 'l', zone: 'ring' },
    { label: ';', match: ';', zone: 'pinky' },
    { label: "'", match: "'", zone: 'pinky' },
    { label: 'Enter', match: 'Enter', zone: 'pinky', widthClass: 'min-w-[112px]' },
  ],
  [
    { label: 'Shift', match: 'Shift', zone: 'pinky', widthClass: 'min-w-[122px]' },
    { label: 'z', match: 'z', zone: 'pinky' },
    { label: 'x', match: 'x', zone: 'ring' },
    { label: 'c', match: 'c', zone: 'middle' },
    { label: 'v', match: 'v', zone: 'index' },
    { label: 'b', match: 'b', zone: 'index' },
    { label: 'n', match: 'n', zone: 'index' },
    { label: 'm', match: 'm', zone: 'index' },
    { label: ',', match: ',', zone: 'middle' },
    { label: '.', match: '.', zone: 'ring' },
    { label: '/', match: '/', zone: 'pinky' },
    { label: 'Shift', match: 'Shift', zone: 'pinky', widthClass: 'min-w-[148px]' },
  ],
  [
    { label: 'Ctrl', match: 'Control', zone: 'pinky', widthClass: 'min-w-[74px]' },
    { label: 'Win', match: 'Meta', zone: 'thumb', widthClass: 'min-w-[74px]' },
    { label: 'Alt', match: 'Alt', zone: 'thumb', widthClass: 'min-w-[74px]' },
    { label: 'Space', match: 'Space', zone: 'thumb', widthClass: 'min-w-[420px]' },
    { label: 'Alt', match: 'Alt', zone: 'thumb', widthClass: 'min-w-[74px]' },
    { label: 'Fn', match: 'Fn', zone: 'thumb', widthClass: 'min-w-[74px]' },
    { label: 'Ctrl', match: 'Control', zone: 'pinky', widthClass: 'min-w-[74px]' },
  ],
];

interface LessonKeyboardProps {
  nextKey: string;
  activeKey: string | null;
  progressPercent: number;
}

const normalizeMatch = (value: string): string => {
  if (value === ' ') return 'Space';
  if (value === '\n') return 'Enter';
  return value;
};

export default function LessonKeyboard({ nextKey, activeKey, progressPercent }: LessonKeyboardProps) {
  const normalizedNext = normalizeMatch(nextKey);

  return (
    <LessonCardWrapper className="h-full border-white/15 bg-black/20" interactive>
      <CardContent className="flex h-full flex-col gap-3 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Next key: <span className="text-foreground">{normalizedNext || 'Done'}</span>
          </h3>
          <p className="rounded-full border border-cyan-400/35 bg-cyan-500/10 px-2 py-0.5 text-xs font-semibold text-cyan-200">
            {formatPercent(progressPercent)}
          </p>
        </div>

        <div className="rounded-2xl border border-white/15 bg-gradient-to-b from-white/5 via-white/[0.03] to-transparent p-3 shadow-inner">
          <div className="space-y-1.5">
            {KEY_ROWS.map((row, rowIndex) => (
              <div key={`row-${rowIndex}`} className="flex flex-wrap items-center gap-1.5">
                {row.map((keyDef, keyIndex) => {
                  const isExpected = normalizedNext.toLowerCase() === keyDef.match.toLowerCase();
                  const isActive = !!activeKey && activeKey.toLowerCase() === keyDef.match.toLowerCase();

                  return (
                    <motion.div
                      key={`${keyDef.label}-${rowIndex}-${keyIndex}`}
                      className={cn(
                        'relative flex h-10 min-w-[44px] select-none items-center justify-center rounded-lg border text-[11px] font-semibold tracking-wide backdrop-blur-md transition-all',
                        keyDef.widthClass,
                        FINGER_ZONE_CLASSES[keyDef.zone],
                        isExpected &&
                          'border-cyan-300/70 bg-cyan-500/25 text-cyan-100 shadow-[0_0_16px_rgba(34,211,238,0.42)] animate-[lesson-glow-pulse_1.3s_ease-in-out_infinite]',
                        isActive && 'scale-95'
                      )}
                      animate={
                        isActive
                          ? {
                              scale: [1, 0.92, 1.02, 1],
                              transition: { duration: 0.22, ease: [0.2, 1, 0.3, 1] },
                            }
                          : { scale: 1 }
                      }
                    >
                      {keyDef.label}
                    </motion.div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
          {(Object.keys(FINGER_ZONE_LABELS) as FingerZone[]).map((zone) => (
            <span
              key={zone}
              className={cn(
                'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-[0.08em]',
                FINGER_ZONE_CLASSES[zone]
              )}
            >
              {FINGER_ZONE_LABELS[zone]}
            </span>
          ))}
        </div>
      </CardContent>
    </LessonCardWrapper>
  );
}
