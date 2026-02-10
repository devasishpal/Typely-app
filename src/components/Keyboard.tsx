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
}

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
  'left-pinky': 'bg-chart-5/35 hover:bg-chart-5/45',
  'left-ring': 'bg-chart-4/35 hover:bg-chart-4/45',
  'left-middle': 'bg-chart-3/35 hover:bg-chart-3/45',
  'left-index': 'bg-chart-2/35 hover:bg-chart-2/45',
  'right-index': 'bg-chart-2/35 hover:bg-chart-2/45',
  'right-middle': 'bg-chart-3/35 hover:bg-chart-3/45',
  'right-ring': 'bg-chart-4/35 hover:bg-chart-4/45',
  'right-pinky': 'bg-chart-5/35 hover:bg-chart-5/45',
  'thumb': 'bg-chart-1/35 hover:bg-chart-1/45',
  'left-thumb': 'bg-chart-1/35 hover:bg-chart-1/45',
  'right-thumb': 'bg-chart-1/35 hover:bg-chart-1/45',
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
}: KeyboardProps) {
  const normalizedNextKey = normalizeKeyForLayout(nextKey);
  const nextRequiresShift = requiresShiftForKey(nextKey);
  const targetFinger = normalizedNextKey ? keyFingerMap.get(normalizedNextKey) : undefined;

  const getKeyClassName = (keyObj: KeyboardKey) => {
    const key = keyObj.key.toLowerCase();
    const isActive = activeKey?.toLowerCase() === key;
    const isNext = normalizedNextKey === key || (key === 'shift' && nextRequiresShift);
    const isCorrect = correctKeys?.has(key);
    const isIncorrect = incorrectKeys?.has(key);

    let className = cn(
      'h-12 rounded-md border-2 border-border/80 flex items-center justify-center text-sm font-medium transition-all duration-200',
      keyObj.width || 'w-12',
      showFingerGuide && keyObj.finger
        ? fingerColors[keyObj.finger]
        : 'bg-card/80 hover:bg-muted/80'
    );

    if (isNext) {
      className = cn(className, 'key-next border-warning');
    } else if (isActive) {
      className = cn(className, 'key-active');
    } else if (isIncorrect) {
      className = cn(className, 'key-incorrect');
    } else if (isCorrect) {
      className = cn(className, 'key-correct');
    }

    return className;
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 bg-muted/70 rounded-lg border border-border">
      {showFingerGuide && (
        <div className="mb-4 grid gap-3 md:grid-cols-2">
          <div className="flex items-center justify-center gap-2">
            {['left-pinky', 'left-ring', 'left-middle', 'left-index', 'left-thumb'].map((finger) => (
              <div
                key={finger}
                className={cn(
                  'h-10 w-10 rounded-full border border-border transition-all',
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
            {['right-thumb', 'right-index', 'right-middle', 'right-ring', 'right-pinky'].map((finger) => (
              <div
                key={finger}
                className={cn(
                  'h-10 w-10 rounded-full border border-border transition-all',
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

      <div className="space-y-2">
        {keyboardLayout.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-2 justify-center">
            {row.map((keyObj, keyIndex) => (
              <div
                key={`${rowIndex}-${keyIndex}`}
                className={getKeyClassName(keyObj)}
              >
                <span className="text-xs">{keyObj.display}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {showFingerGuide && (
        <div className="mt-4 flex flex-wrap gap-3 justify-center text-xs">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-chart-5/40 border border-border" />
            <span>Pinky</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-chart-4/40 border border-border" />
            <span>Ring</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-chart-3/40 border border-border" />
            <span>Middle</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-chart-2/40 border border-border" />
            <span>Index</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-chart-1/40 border border-border" />
            <span>Thumb</span>
          </div>
        </div>
      )}
    </div>
  );
}
