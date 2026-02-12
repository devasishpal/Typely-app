import { cn } from '@/lib/utils';

interface KeyboardKey {
  key: string;
  display: string;
  width?: string;
  finger?: string;
}

interface KeyboardProps {
  activeKey?: string;
  nextKey?: string;
  correctKeys?: Set<string>;
  incorrectKeys?: Set<string>;
  showFingerGuide?: boolean;
  layoutDensity?: 'default' | 'compact';
  className?: string;
}

const leftHandFingers = ['left-pinky', 'left-ring', 'left-middle', 'left-index', 'left-thumb'] as const;
const rightHandFingers = ['right-thumb', 'right-index', 'right-middle', 'right-ring', 'right-pinky'] as const;
const fingerLegendItems = [
  { label: 'Pinky', finger: 'left-pinky' },
  { label: 'Ring', finger: 'left-ring' },
  { label: 'Middle', finger: 'left-middle' },
  { label: 'Index', finger: 'left-index' },
  { label: 'Thumb', finger: 'thumb' },
] as const;

const fingerDisplayName: Record<string, string> = {
  'left-pinky': 'Left Pinky',
  'left-ring': 'Left Ring',
  'left-middle': 'Left Middle',
  'left-index': 'Left Index',
  'left-thumb': 'Left Thumb',
  'right-thumb': 'Right Thumb',
  'right-index': 'Right Index',
  'right-middle': 'Right Middle',
  'right-ring': 'Right Ring',
  'right-pinky': 'Right Pinky',
  thumb: 'Thumb',
};

const keyboardLayout: KeyboardKey[][] = [
  [
    { key: '`', display: '`~', finger: 'left-pinky' },
    { key: '1', display: '1!', finger: 'left-pinky' },
    { key: '2', display: '2@', finger: 'left-ring' },
    { key: '3', display: '3#', finger: 'left-middle' },
    { key: '4', display: '4$', finger: 'left-index' },
    { key: '5', display: '5%', finger: 'left-index' },
    { key: '6', display: '6^', finger: 'right-index' },
    { key: '7', display: '7&', finger: 'right-index' },
    { key: '8', display: '8*', finger: 'right-middle' },
    { key: '9', display: '9(', finger: 'right-ring' },
    { key: '0', display: '0)', finger: 'right-pinky' },
    { key: '-', display: '-_', finger: 'right-pinky' },
    { key: '=', display: '=+', finger: 'right-pinky' },
    { key: 'Backspace', display: 'Backspace', width: 'w-20', finger: 'right-pinky' },
  ],
  [
    { key: 'Tab', display: 'Tab', width: 'w-16', finger: 'left-pinky' },
    { key: 'q', display: 'Q', finger: 'left-pinky' },
    { key: 'w', display: 'W', finger: 'left-ring' },
    { key: 'e', display: 'E', finger: 'left-middle' },
    { key: 'r', display: 'R', finger: 'left-index' },
    { key: 't', display: 'T', finger: 'left-index' },
    { key: 'y', display: 'Y', finger: 'right-index' },
    { key: 'u', display: 'U', finger: 'right-index' },
    { key: 'i', display: 'I', finger: 'right-middle' },
    { key: 'o', display: 'O', finger: 'right-ring' },
    { key: 'p', display: 'P', finger: 'right-pinky' },
    { key: '[', display: '[{', finger: 'right-pinky' },
    { key: ']', display: ']}', finger: 'right-pinky' },
    { key: '\\', display: '\\|', width: 'w-16', finger: 'right-pinky' },
  ],
  [
    { key: 'CapsLock', display: 'Caps', width: 'w-20', finger: 'left-pinky' },
    { key: 'a', display: 'A', finger: 'left-pinky' },
    { key: 's', display: 'S', finger: 'left-ring' },
    { key: 'd', display: 'D', finger: 'left-middle' },
    { key: 'f', display: 'F', finger: 'left-index' },
    { key: 'g', display: 'G', finger: 'left-index' },
    { key: 'h', display: 'H', finger: 'right-index' },
    { key: 'j', display: 'J', finger: 'right-index' },
    { key: 'k', display: 'K', finger: 'right-middle' },
    { key: 'l', display: 'L', finger: 'right-ring' },
    { key: ';', display: ';:', finger: 'right-pinky' },
    { key: "'", display: "'\"", finger: 'right-pinky' },
    { key: 'Enter', display: 'Enter', width: 'w-24', finger: 'right-pinky' },
  ],
  [
    { key: 'Shift', display: 'Shift', width: 'w-24', finger: 'left-pinky' },
    { key: 'z', display: 'Z', finger: 'left-pinky' },
    { key: 'x', display: 'X', finger: 'left-ring' },
    { key: 'c', display: 'C', finger: 'left-middle' },
    { key: 'v', display: 'V', finger: 'left-index' },
    { key: 'b', display: 'B', finger: 'left-index' },
    { key: 'n', display: 'N', finger: 'right-index' },
    { key: 'm', display: 'M', finger: 'right-index' },
    { key: ',', display: ',<', finger: 'right-middle' },
    { key: '.', display: '.>', finger: 'right-ring' },
    { key: '/', display: '/?', finger: 'right-pinky' },
    { key: 'Shift', display: 'Shift', width: 'w-28', finger: 'right-pinky' },
  ],
  [
    { key: 'Ctrl', display: 'Ctrl', width: 'w-16', finger: 'left-pinky' },
    { key: 'Alt', display: 'Alt', width: 'w-14', finger: 'left-thumb' },
    { key: ' ', display: 'Space', width: 'flex-1', finger: 'thumb' },
    { key: 'Alt', display: 'Alt', width: 'w-14', finger: 'right-thumb' },
    { key: 'Ctrl', display: 'Ctrl', width: 'w-16', finger: 'right-pinky' },
  ],
];

const fingerColors: Record<string, string> = {
  'left-pinky': 'bg-[#B25A97] hover:bg-[#C16AA5]',
  'left-ring': 'bg-[#7BAE3C] hover:bg-[#89BF45]',
  'left-middle': 'bg-[#7D71BE] hover:bg-[#8B80CA]',
  'left-index': 'bg-[#3FA971] hover:bg-[#49B97D]',
  'right-index': 'bg-[#3FA971] hover:bg-[#49B97D]',
  'right-middle': 'bg-[#7D71BE] hover:bg-[#8B80CA]',
  'right-ring': 'bg-[#7BAE3C] hover:bg-[#89BF45]',
  'right-pinky': 'bg-[#B25A97] hover:bg-[#C16AA5]',
  'thumb': 'bg-[#4F82C3] hover:bg-[#5B90D2]',
  'left-thumb': 'bg-[#4F82C3] hover:bg-[#5B90D2]',
  'right-thumb': 'bg-[#4F82C3] hover:bg-[#5B90D2]',
};

const shiftedKeyMap: Record<string, string> = {
  '!': '1',
  '@': '2',
  '#': '3',
  '$': '4',
  '%': '5',
  '^': '6',
  '&': '7',
  '*': '8',
  '(': '9',
  ')': '0',
  '_': '-',
  '+': '=',
  '{': '[',
  '}': ']',
  '|': '\\',
  ':': ';',
  '"': "'",
  '<': ',',
  '>': '.',
  '?': '/',
  '~': '`',
};

const keyFingerMap = new Map<string, string>();
keyboardLayout.forEach((row) => {
  row.forEach((keyObj) => {
    keyFingerMap.set(keyObj.key.toLowerCase(), keyObj.finger || '');
  });
});

const normalizeKeyForLayout = (key?: string) => {
  if (!key) return '';
  if (key === ' ') return ' ';
  if (key === '\n') return 'enter';
  if (key.length === 1) {
    if (shiftedKeyMap[key]) return shiftedKeyMap[key];
    const lower = key.toLowerCase();
    if (shiftedKeyMap[lower]) return shiftedKeyMap[lower];
    return lower;
  }
  return key.toLowerCase();
};

const requiresShiftForKey = (key?: string) => {
  if (!key) return false;
  if (key.length !== 1) return false;
  if (shiftedKeyMap[key]) return true;
  return key.toLowerCase() !== key;
};

export default function Keyboard({
  activeKey,
  nextKey,
  correctKeys,
  incorrectKeys,
  showFingerGuide = false,
  layoutDensity = 'default',
  className,
}: KeyboardProps) {
  const isCompact = layoutDensity === 'compact';
  const useReferenceCompactStyle = isCompact && showFingerGuide;
  const normalizedNextKey = normalizeKeyForLayout(nextKey);
  const nextRequiresShift = requiresShiftForKey(nextKey);
  const targetFinger = normalizedNextKey ? keyFingerMap.get(normalizedNextKey) : undefined;

  const getWidthClass = (widthClass?: string) => {
    if (!isCompact) return widthClass || 'w-12';

    switch (widthClass) {
      case 'w-28':
        return 'w-24';
      case 'w-24':
        return 'w-[4.75rem]';
      case 'w-20':
        return 'w-[4rem]';
      case 'w-16':
        return 'w-[3.5rem]';
      case 'w-14':
        return 'w-[3rem]';
      case 'flex-1':
        return 'w-[16rem] flex-none sm:w-[18rem] lg:w-[20rem]';
      default:
        return 'w-[2.2rem]';
    }
  };

  const getKeyClassName = (keyObj: KeyboardKey) => {
    const key = keyObj.key.toLowerCase();
    const isActive = activeKey?.toLowerCase() === key;
    const isNext = normalizedNextKey === key || (key === 'shift' && nextRequiresShift);
    const isCorrect = correctKeys?.has(key);
    const isIncorrect = incorrectKeys?.has(key);

    let className = cn(
      isCompact
        ? useReferenceCompactStyle
          ? 'h-9 rounded-2xl border border-[#B8CCFF] dark:border-[#2B3E78] flex items-center justify-center text-[11px] font-semibold text-[#1C2F64] dark:text-white/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.32)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] transition-all duration-200'
          : 'h-9 rounded-lg border-2 border-border/90 dark:border-border/70 flex items-center justify-center text-xs font-semibold text-foreground/90 dark:text-foreground shadow-sm transition-all duration-200'
        : 'h-12 rounded-md border-2 border-border/90 dark:border-border/70 flex items-center justify-center text-sm font-medium text-foreground/90 dark:text-foreground shadow-sm transition-all duration-200',
      getWidthClass(keyObj.width),
      showFingerGuide && keyObj.finger
        ? fingerColors[keyObj.finger]
        : 'bg-card/90 hover:bg-muted/90 dark:bg-card/70 dark:hover:bg-muted/70'
    );

    if (isNext) {
      className = cn(
        className,
        useReferenceCompactStyle
          ? 'border-[#E5B84E] shadow-[inset_0_0_0_2px_rgba(229,184,78,0.7)]'
          : 'key-next border-warning ring-2 ring-warning/50 dark:ring-warning/40 shadow-[0_0_14px_hsl(var(--warning)/0.35)]'
      );
    } else if (isActive) {
      className = cn(
        className,
        useReferenceCompactStyle
          ? 'shadow-[inset_0_0_0_2px_rgba(108,167,255,0.65)] -translate-y-[1px]'
          : 'key-active ring-2 ring-primary/50 dark:ring-primary/40 -translate-y-[1px]'
      );
    } else if (isIncorrect) {
      className = cn(className, 'key-incorrect');
    } else if (isCorrect) {
      className = cn(className, 'key-correct');
    }

    return className;
  };

  return (
    <div
      className={cn(
        'mx-auto w-full max-w-5xl border border-border shadow-card',
        isCompact
          ? useReferenceCompactStyle
            ? 'rounded-2xl border-[#C7D7FF] bg-[#EEF3FF] p-2 dark:border-[#1C2F64] dark:bg-[#0E1A45]/95'
            : 'rounded-xl bg-gradient-to-b from-background/80 to-muted/55 p-1.5 dark:from-background/35 dark:to-muted/40'
          : 'rounded-lg bg-muted/70 p-4 dark:bg-muted/50',
        className
      )}
    >
      {showFingerGuide && useReferenceCompactStyle && (
        <div className="mb-2 flex items-center justify-center gap-10">
          <div className="flex items-center gap-2">
            {leftHandFingers.map((finger) => (
              <div
                key={finger}
                className={cn(
                  'h-7 rounded-xl border border-[#B8CCFF] dark:border-[#2B3E78] shadow-[inset_0_1px_0_rgba(255,255,255,0.32)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] transition-[width,box-shadow,transform] duration-300',
                  finger === targetFinger ? 'w-16 sm:w-[4.25rem]' : 'w-11 sm:w-12',
                  fingerColors[finger],
                  finger === targetFinger
                    ? 'ring-2 ring-[#E5B84E] shadow-[0_0_14px_rgba(229,184,78,0.5)]'
                    : 'opacity-95'
                )}
                aria-label={fingerDisplayName[finger]}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            {rightHandFingers.map((finger) => (
              <div
                key={finger}
                className={cn(
                  'h-7 rounded-xl border border-[#B8CCFF] dark:border-[#2B3E78] shadow-[inset_0_1px_0_rgba(255,255,255,0.32)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] transition-[width,box-shadow,transform] duration-300',
                  finger === targetFinger ? 'w-16 sm:w-[4.25rem]' : 'w-11 sm:w-12',
                  fingerColors[finger],
                  finger === targetFinger
                    ? 'ring-2 ring-[#E5B84E] shadow-[0_0_14px_rgba(229,184,78,0.5)]'
                    : 'opacity-95'
                )}
                aria-label={fingerDisplayName[finger]}
              />
            ))}
          </div>
        </div>
      )}

      {showFingerGuide && !isCompact && (
        <div className={cn('grid md:grid-cols-2', isCompact ? 'mb-3 gap-2' : 'mb-4 gap-3')}>
          <div className="flex items-center justify-center gap-2">
            {leftHandFingers.map((finger) => (
              <div
                key={finger}
                className={cn(
                  isCompact ? 'h-8 w-8 rounded-full border border-border transition-all' : 'h-10 w-10 rounded-full border border-border transition-all',
                  fingerColors[finger],
                  finger === targetFinger
                    ? 'ring-2 ring-warning shadow-[0_0_12px_hsl(var(--warning))]'
                    : 'opacity-80'
                )}
                aria-label={finger}
              />
            ))}
          </div>
          <div className="flex items-center justify-center gap-2">
            {rightHandFingers.map((finger) => (
              <div
                key={finger}
                className={cn(
                  isCompact ? 'h-8 w-8 rounded-full border border-border transition-all' : 'h-10 w-10 rounded-full border border-border transition-all',
                  fingerColors[finger],
                  finger === targetFinger
                    ? 'ring-2 ring-warning shadow-[0_0_12px_hsl(var(--warning))]'
                    : 'opacity-80'
                )}
                aria-label={finger}
              />
            ))}
          </div>
        </div>
      )}

      <div className={cn(isCompact ? (useReferenceCompactStyle ? 'space-y-1.5' : 'space-y-1') : 'space-y-2')}>
        {keyboardLayout.map((row, rowIndex) => (
          <div key={rowIndex} className={cn('flex justify-center', isCompact ? (useReferenceCompactStyle ? 'gap-1.5' : 'gap-1') : 'gap-2')}>
            {row.map((keyObj, keyIndex) => (
              <div
                key={`${rowIndex}-${keyIndex}`}
                className={getKeyClassName(keyObj)}
              >
                <span className={cn(isCompact ? (useReferenceCompactStyle ? 'text-[10px]' : 'text-[9px]') : 'text-xs')}>{keyObj.display}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {showFingerGuide && useReferenceCompactStyle && (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3 text-[10px] text-[#1C2F64]/80 dark:text-white/85">
          {fingerLegendItems.map(({ label, finger }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className={cn('h-3.5 w-3.5 rounded border border-[#B8CCFF] dark:border-[#2B3E78]', fingerColors[finger])} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      )}

      {showFingerGuide && !isCompact && (
        <div className="mt-4 flex flex-wrap justify-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-pink-200 dark:bg-pink-400/70 border border-border" />
            <span>Pinky</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-lime-200 dark:bg-lime-400/70 border border-border" />
            <span>Ring</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-violet-200 dark:bg-violet-400/70 border border-border" />
            <span>Middle</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-green-200 dark:bg-green-400/70 border border-border" />
            <span>Index</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-blue-200 dark:bg-blue-400/70 border border-border" />
            <span>Thumb</span>
          </div>
        </div>
      )}
    </div>
  );
}
