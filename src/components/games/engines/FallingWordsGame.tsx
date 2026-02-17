import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { AlertCircle, CloudRain, PauseCircle, PlayCircle } from 'lucide-react';
import GameLayout from '@/components/games/GameLayout';
import PauseOverlay from '@/components/games/PauseOverlay';
import GameOverModal from '@/components/games/GameOverModal';
import { DIFFICULTY_TUNING, GAME_DIFFICULTY_CONFIG } from '@/components/games/constants';
import { getWordsForDifficulty } from '@/components/games/data/wordBank';
import { useAnimationFrameLoop } from '@/components/games/hooks/useAnimationFrameLoop';
import { useKeyboardCapture } from '@/components/games/hooks/useKeyboardCapture';
import { useGameMetrics } from '@/components/games/hooks/useGameMetrics';
import { useParticleSystem } from '@/components/games/hooks/useParticleSystem';
import { clamp, randomBetween, uid } from '@/components/games/utils/gameMath';
import { isExactTyped, startsWithTyped } from '@/components/games/utils/random';
import type {
  FloatingWordEntity,
  GameComponentProps,
  GameCompletionPayload,
  GameStatus,
} from '@/components/games/types';
import { cn } from '@/lib/utils';

const FALLING_ROUND_MS = 3 * 60 * 1000;

const getSpawnDelay = (difficulty: GameComponentProps['difficulty'], elapsedMs: number): number => {
  const tuning = DIFFICULTY_TUNING.fallingWords[difficulty];
  const timePressure = clamp(elapsedMs / FALLING_ROUND_MS, 0, 1);
  const min = tuning.spawn.minMs * (1 - timePressure * 0.3);
  const max = tuning.spawn.maxMs * (1 - timePressure * 0.2);
  return randomBetween(min, max);
};

const createWordEntity = (
  difficulty: GameComponentProps['difficulty'],
  elapsedMs: number,
  pool: string[]
): FloatingWordEntity => {
  const tuning = DIFFICULTY_TUNING.fallingWords[difficulty];
  const difficultyConfig = GAME_DIFFICULTY_CONFIG[difficulty];
  const gravityPressure = 1 + clamp(elapsedMs / FALLING_ROUND_MS, 0, 1) * 0.55;
  const text = pool[Math.floor(Math.random() * pool.length)] ?? 'typing';

  return {
    id: uid('fall-word'),
    text,
    typedText: '',
    x: randomBetween(8, 86),
    y: randomBetween(-18, -6),
    velocityY:
      tuning.baseWordSpeed * difficultyConfig.speedMultiplier * randomBetween(0.82, 1.28) * gravityPressure,
    width: Math.max(52, text.length * 11),
    createdAt: performance.now(),
    value: Math.max(30, Math.round(text.length * 9 * tuning.scoreScale)),
  };
};

export default function FallingWordsGame({ difficulty, onComplete, onBackToHub }: GameComponentProps) {
  const [status, setStatus] = useState<GameStatus>('running');
  const [words, setWords] = useState<FloatingWordEntity[]>([]);
  const [typedBuffer, setTypedBuffer] = useState('');
  const [health, setHealth] = useState(DIFFICULTY_TUNING.fallingWords[difficulty].startingHealth);
  const [lastCorrectAt, setLastCorrectAt] = useState(0);
  const [comboPulse, setComboPulse] = useState(0);

  const metricsApi = useGameMetrics();
  const { metrics, registerCorrect, registerMistake, reset, setElapsedMs, setCombo } = metricsApi;

  const { particles, spawnBurst, updateParticles, clearParticles } = useParticleSystem();

  const arenaRef = useRef<HTMLDivElement | null>(null);
  const nextSpawnRef = useRef(0);
  const completedRef = useRef(false);

  const wordPool = useMemo(() => {
    const source = getWordsForDifficulty(difficulty);
    return source.length > 0 ? source : ['typing', 'focus', 'combo', 'accuracy'];
  }, [difficulty]);

  const difficultyConfig = GAME_DIFFICULTY_CONFIG[difficulty];
  const tuning = DIFFICULTY_TUNING.fallingWords[difficulty];

  const completeGame = useCallback(
    (state: GameStatus) => {
      if (completedRef.current) return;
      if (state !== 'game-over') return;
      completedRef.current = true;

      const payload: GameCompletionPayload = {
        gameId: 'falling-words',
        difficulty,
        score: Math.round(metrics.score),
        wpm: Number(metrics.wpm.toFixed(2)),
        accuracy: Number(metrics.accuracy.toFixed(2)),
        mistakes: metrics.mistakes,
        maxCombo: metrics.maxCombo,
        elapsedMs: Math.min(metrics.elapsedMs, FALLING_ROUND_MS),
      };
      onComplete(payload);
    },
    [difficulty, metrics, onComplete]
  );

  const restart = useCallback(() => {
    completedRef.current = false;
    setStatus('running');
    setWords([]);
    setTypedBuffer('');
    setHealth(tuning.startingHealth);
    setLastCorrectAt(0);
    setComboPulse((current) => current + 1);
    nextSpawnRef.current = 0;
    reset();
    clearParticles();
  }, [reset, clearParticles, tuning.startingHealth]);

  const onBack = useCallback(() => {
    setStatus('game-over');
    if (onBackToHub) {
      onBackToHub();
    }
  }, [onBackToHub]);

  const markMiss = useCallback((missedCount: number) => {
    if (missedCount <= 0) return;
    const damage = missedCount * (difficulty === 'extreme' ? 11 : difficulty === 'hard' ? 10 : 8);
    setHealth((current) => Math.max(0, current - damage));
    for (let i = 0; i < missedCount; i += 1) {
      registerMistake();
    }
  }, [difficulty, registerMistake]);

  useEffect(() => {
    setHealth(tuning.startingHealth);
  }, [difficulty, tuning.startingHealth]);

  useEffect(() => {
    if (health <= 0 && status !== 'game-over') {
      setStatus('game-over');
    }
  }, [health, status]);

  useEffect(() => {
    if (metrics.elapsedMs >= FALLING_ROUND_MS && status !== 'game-over') {
      setStatus('game-over');
    }
  }, [metrics.elapsedMs, status]);

  useEffect(() => {
    if (status === 'game-over') {
      completeGame('game-over');
    }
  }, [completeGame, status]);

  useEffect(() => {
    if (status !== 'running') return;
    if (!lastCorrectAt) return;

    const age = performance.now() - lastCorrectAt;
    if (age > difficultyConfig.comboWindowMs && metrics.combo > 0) {
      setCombo(0);
    }
  }, [difficultyConfig.comboWindowMs, lastCorrectAt, metrics.combo, setCombo, status]);

  const removeWordById = useCallback((id: string) => {
    setWords((current) => current.filter((word) => word.id !== id));
  }, []);

  const matchTypedWord = useCallback(
    (candidate: string) => {
      if (!candidate) return;
      const exact = words.find((word) => isExactTyped(word.text, candidate));

      if (exact) {
        removeWordById(exact.id);

        const multiplier = metrics.combo >= 30 ? 4 : metrics.combo >= 20 ? 3 : metrics.combo >= 10 ? 2 : 1;
        const scoreGain = Math.round(exact.value * difficultyConfig.scoreMultiplier * multiplier);

        registerCorrect(exact.text.length, scoreGain);
        setLastCorrectAt(performance.now());
        setComboPulse((current) => current + 1);

        const arena = arenaRef.current;
        if (arena) {
          const width = arena.clientWidth || 1;
          const height = arena.clientHeight || 1;
          spawnBurst((exact.x / 100) * width, (exact.y / 100) * height, 175, 18);
        }

        setTypedBuffer('');
        return;
      }

      const hasPrefix = words.some((word) => startsWithTyped(word.text, candidate));
      if (!hasPrefix) {
        registerMistake();
        setTypedBuffer('');
      }
    },
    [words, removeWordById, metrics.combo, difficultyConfig.scoreMultiplier, registerCorrect, spawnBurst, registerMistake]
  );

  useKeyboardCapture({
    enabled: status === 'running',
    allowSpaces: false,
    allowBackspace: true,
    onType: (key) => {
      const normalized = key.toLowerCase();
      if (!/^[a-z0-9-]$/.test(normalized)) return;

      setTypedBuffer((current) => {
        const next = `${current}${normalized}`;
        queueMicrotask(() => matchTypedWord(next));
        return next;
      });
    },
    onBackspace: () => {
      setTypedBuffer((current) => (current.length > 0 ? current.slice(0, -1) : ''));
    },
    onSubmit: () => {
      setTypedBuffer('');
    },
  });

  useAnimationFrameLoop({
    enabled: status === 'running',
    onFrame: ({ deltaMs, elapsedMs }) => {
      setElapsedMs(elapsedMs);
      updateParticles(deltaMs);

      if (nextSpawnRef.current <= 0) {
        nextSpawnRef.current = elapsedMs + getSpawnDelay(difficulty, elapsedMs);
      }

      if (elapsedMs >= nextSpawnRef.current) {
        setWords((current) => {
          if (current.length >= tuning.maxConcurrentWords) return current;
          return [...current, createWordEntity(difficulty, elapsedMs, wordPool)];
        });
        nextSpawnRef.current = elapsedMs + getSpawnDelay(difficulty, elapsedMs);
      }

      let missed = 0;
      setWords((current) => {
        const advanced = current
          .map((word) => ({
            ...word,
            y: word.y + (word.velocityY * deltaMs) / 1000,
          }))
          .filter((word) => {
            const keep = word.y < 104;
            if (!keep) missed += 1;
            return keep;
          });
        return advanced;
      });

      if (missed > 0) {
        markMiss(missed);
      }
    },
  });

  const highlightedWordId = useMemo(
    () => words.find((word) => startsWithTyped(word.text, typedBuffer))?.id,
    [words, typedBuffer]
  );

  const progressPercent = clamp((metrics.elapsedMs / FALLING_ROUND_MS) * 100, 0, 100);

  return (
    <GameLayout
      gameId="falling-words"
      title="Falling Words"
      subtitle="Type each falling word before it hits the floor. Keep combos alive for score multipliers."
      status={status}
      onPauseToggle={() => setStatus((current) => (current === 'running' ? 'paused' : 'running'))}
      onRestart={restart}
      onBack={onBack}
      timer={{ elapsedMs: metrics.elapsedMs, maxMs: FALLING_ROUND_MS }}
      stats={{
        score: metrics.score,
        wpm: metrics.wpm,
        accuracy: metrics.accuracy,
        mistakes: metrics.mistakes,
        combo: metrics.combo,
        maxCombo: metrics.maxCombo,
        health: {
          current: health,
          max: tuning.startingHealth,
          label: 'Shield',
          warningThreshold: 0.3,
        },
      }}
      particles={particles}
    >
      <div className="relative h-full min-h-[380px]" ref={arenaRef}>
        <div className="mb-4 flex flex-col gap-2 rounded-2xl border border-border/70 bg-card/70 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CloudRain className="h-4 w-4 text-primary" />
            Falling intensity rises over time. Missed words reduce shield.
          </div>
          <motion.div
            key={`${typedBuffer}-${comboPulse}`}
            initial={{ scale: 0.96, opacity: 0.4 }}
            animate={{ scale: 1, opacity: 1 }}
            className="rounded-xl border border-primary/40 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary"
          >
            Input: {typedBuffer || '...'}
          </motion.div>
        </div>

        <div className="relative h-[330px] overflow-hidden rounded-2xl border border-border/70 bg-background/60">
          <motion.div
            className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-primary/15 to-transparent"
            animate={{ opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 2.4, repeat: Number.POSITIVE_INFINITY }}
          />

          <div className="absolute inset-x-0 bottom-0 h-5 border-t border-destructive/40 bg-destructive/10" />

          {words.map((word) => {
            const isHighlighted = highlightedWordId === word.id;
            const typedPortion = typedBuffer && startsWithTyped(word.text, typedBuffer) ? typedBuffer : '';

            return (
              <motion.div
                key={word.id}
                className={cn(
                  'absolute select-none rounded-xl border px-2.5 py-1.5 text-sm font-semibold shadow-card',
                  isHighlighted
                    ? 'border-success/50 bg-success/15 text-success'
                    : 'border-border/70 bg-card/90 text-foreground'
                )}
                style={{
                  left: `${word.x}%`,
                  top: `${word.y}%`,
                  width: `${word.width}px`,
                  transform: 'translate3d(0,0,0)',
                  willChange: 'transform',
                }}
              >
                <span className="text-success">{typedPortion}</span>
                <span>{word.text.slice(typedPortion.length)}</span>
              </motion.div>
            );
          })}

          {words.length === 0 && status === 'running' && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
              Words will start raining in a moment...
            </div>
          )}

          {status === 'paused' && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/55 text-sm text-muted-foreground backdrop-blur-sm">
              <PauseCircle className="mr-2 h-4 w-4" /> Game paused
            </div>
          )}
        </div>

        <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
          <div className="rounded-xl border border-border/70 bg-card/70 px-3 py-2">
            Round Progress: <span className="font-semibold text-foreground">{progressPercent.toFixed(1)}%</span>
          </div>
          <div className="rounded-xl border border-border/70 bg-card/70 px-3 py-2">
            Combo Window: <span className="font-semibold text-foreground">{difficultyConfig.comboWindowMs}ms</span>
          </div>
          <div className="rounded-xl border border-border/70 bg-card/70 px-3 py-2">
            {status === 'running' ? (
              <span className="inline-flex items-center gap-1">
                <PlayCircle className="h-3.5 w-3.5 text-success" /> Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5 text-warning" /> Paused / Ended
              </span>
            )}
          </div>
        </div>
      </div>

      <PauseOverlay
        open={status === 'paused'}
        onResume={() => setStatus('running')}
        onRestart={restart}
        onBack={onBack}
      />

      <GameOverModal
        open={status === 'game-over'}
        title="Rain Stopped"
        subtitle={health <= 0 ? 'Your shield collapsed before the storm ended.' : 'You completed the full storm run.'}
        score={metrics.score}
        wpm={metrics.wpm}
        accuracy={metrics.accuracy}
        maxCombo={metrics.maxCombo}
        onRestart={restart}
        onBack={onBack}
      />
    </GameLayout>
  );
}
