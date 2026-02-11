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
}

const leftHandFingers = ['left-pinky', 'left-ring', 'left-middle', 'left-index', 'left-thumb'] as const;
const rightHandFingers = ['right-thumb', 'right-index', 'right-middle', 'right-ring', 'right-pinky'] as const;

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
  'left-pinky':
    'bg-pink-200 hover:bg-pink-300 dark:bg-pink-400/70 dark:hover:bg-pink-400/80',
  'left-ring':
    'bg-lime-200 hover:bg-lime-300 dark:bg-lime-400/70 dark:hover:bg-lime-400/80',
  'left-middle':
    'bg-violet-200 hover:bg-violet-300 dark:bg-violet-400/70 dark:hover:bg-violet-400/80',
  'left-index':
    'bg-green-200 hover:bg-green-300 dark:bg-green-400/70 dark:hover:bg-green-400/80',
  'right-index':
    'bg-green-200 hover:bg-green-300 dark:bg-green-400/70 dark:hover:bg-green-400/80',
  'right-middle':
    'bg-violet-200 hover:bg-violet-300 dark:bg-violet-400/70 dark:hover:bg-violet-400/80',
  'right-ring':
    'bg-lime-200 hover:bg-lime-300 dark:bg-lime-400/70 dark:hover:bg-lime-400/80',
  'right-pinky':
    'bg-pink-200 hover:bg-pink-300 dark:bg-pink-400/70 dark:hover:bg-pink-400/80',
  'thumb':
    'bg-blue-200 hover:bg-blue-300 dark:bg-blue-400/70 dark:hover:bg-blue-400/80',
  'left-thumb':
    'bg-blue-200 hover:bg-blue-300 dark:bg-blue-400/70 dark:hover:bg-blue-400/80',
  'right-thumb':
    'bg-blue-200 hover:bg-blue-300 dark:bg-blue-400/70 dark:hover:bg-blue-400/80',
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
}: KeyboardProps) {
  const isCompact = layoutDensity === 'compact';
  const normalizedNextKey = normalizeKeyForLayout(nextKey);
  const nextRequiresShift = requiresShiftForKey(nextKey);
  const targetFinger = normalizedNextKey ? keyFingerMap.get(normalizedNextKey) : undefined;
  const targetFingerLabel = targetFinger ? fingerDisplayName[targetFinger] || 'Finger Tip' : 'Finger Tip';

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
        return 'flex-1';
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
        ? 'h-9 rounded-lg border-2 border-border/90 dark:border-border/70 flex items-center justify-center text-xs font-semibold text-foreground/90 dark:text-foreground shadow-sm transition-all duration-200'
        : 'h-12 rounded-md border-2 border-border/90 dark:border-border/70 flex items-center justify-center text-sm font-medium text-foreground/90 dark:text-foreground shadow-sm transition-all duration-200',
      getWidthClass(keyObj.width),
      showFingerGuide && keyObj.finger
        ? fingerColors[keyObj.finger]
        : 'bg-card/90 hover:bg-muted/90 dark:bg-card/70 dark:hover:bg-muted/70'
    );

    if (isNext) {
      className = cn(
        className,
        'key-next border-warning ring-2 ring-warning/50 dark:ring-warning/40 shadow-[0_0_18px_hsl(var(--warning)/0.35)]'
      );
    } else if (isActive) {
      className = cn(className, 'key-active ring-2 ring-primary/60 dark:ring-primary/40 -translate-y-[1px]');
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
        'mx-auto w-full max-w-5xl rounded-xl border border-border bg-gradient-to-b from-background/85 to-muted/60 shadow-card dark:from-background/40 dark:to-muted/40',
        isCompact ? 'p-2' : 'p-4'
      )}
    >
      {showFingerGuide && isCompact && (
        <div className="mb-2 rounded-lg border border-border/70 bg-background/70 px-2 py-1.5">
          <div className="mb-1 flex items-center justify-between">
            <p className="text-[9px] font-semibold tracking-[0.12em] text-muted-foreground">FINGER TIP</p>
            <p className="text-[9px] font-semibold text-foreground/90">{targetFingerLabel}</p>
          </div>
          <div className="grid grid-cols-10 gap-1">
            {leftHandFingers.map((finger) => (
              <div
                key={finger}
                className={cn(
                  'h-2.5 rounded-full border border-border/70 transition-all',
                  fingerColors[finger],
                  finger === targetFinger
                    ? 'ring-1 ring-warning shadow-[0_0_8px_hsl(var(--warning)/0.5)]'
                    : 'opacity-70'
                )}
                aria-label={fingerDisplayName[finger]}
              />
            ))}
            {rightHandFingers.map((finger) => (
              <div
                key={finger}
                className={cn(
                  'h-2.5 rounded-full border border-border/70 transition-all',
                  fingerColors[finger],
                  finger === targetFinger
                    ? 'ring-1 ring-warning shadow-[0_0_8px_hsl(var(--warning)/0.5)]'
                    : 'opacity-70'
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

      <div className={cn(isCompact ? 'space-y-1' : 'space-y-2')}>
        {keyboardLayout.map((row, rowIndex) => (
          <div key={rowIndex} className={cn('flex justify-center', isCompact ? 'gap-1' : 'gap-2')}>
            {row.map((keyObj, keyIndex) => (
              <div
                key={`${rowIndex}-${keyIndex}`}
                className={getKeyClassName(keyObj)}
              >
                <span className={cn(isCompact ? 'text-[9px]' : 'text-xs')}>{keyObj.display}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

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
