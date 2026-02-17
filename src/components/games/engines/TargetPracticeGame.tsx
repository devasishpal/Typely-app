import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Crosshair, Focus, LocateFixed, Target, Timer } from 'lucide-react';
import GameLayout from '@/components/games/GameLayout';
import PauseOverlay from '@/components/games/PauseOverlay';
import GameOverModal from '@/components/games/GameOverModal';
import { DIFFICULTY_TUNING, GAME_DIFFICULTY_CONFIG } from '@/components/games/constants';
import { getWordsForDifficulty } from '@/components/games/data/wordBank';
import { useAnimationFrameLoop } from '@/components/games/hooks/useAnimationFrameLoop';
import { useGameMetrics } from '@/components/games/hooks/useGameMetrics';
import { useKeyboardCapture } from '@/components/games/hooks/useKeyboardCapture';
import { useParticleSystem } from '@/components/games/hooks/useParticleSystem';
import { clamp, randomBetween, uid } from '@/components/games/utils/gameMath';
import { startsWithTyped } from '@/components/games/utils/random';
import type { CrosshairState, GameComponentProps, GameCompletionPayload, GameStatus, TargetEntity } from '@/components/games/types';
import { cn } from '@/lib/utils';

const createTarget = (
  width: number,
  height: number,
  pool: string[],
  speed: number,
  minRadius: number,
  maxRadius: number
): TargetEntity => {
  const radius = randomBetween(minRadius, maxRadius);
  const word = pool[Math.floor(Math.random() * pool.length)] ?? 'target';
  const x = randomBetween(radius + 6, Math.max(radius + 6, width - radius - 6));
  const y = randomBetween(radius + 6, Math.max(radius + 6, height - radius - 6));
  const angle = randomBetween(0, Math.PI * 2);

  return {
    id: uid('target'),
    word,
    typed: '',
    x,
    y,
    velocityX: Math.cos(angle) * speed * randomBetween(0.75, 1.25),
    velocityY: Math.sin(angle) * speed * randomBetween(0.75, 1.25),
    radius,
    points: Math.round(word.length * 8 + (maxRadius - radius) * 4),
    createdAt: performance.now(),
  };
};

export default function TargetPracticeGame({ difficulty, onComplete, onBackToHub }: GameComponentProps) {
  const tuning = DIFFICULTY_TUNING.targetPractice[difficulty];
  const difficultyConfig = GAME_DIFFICULTY_CONFIG[difficulty];

  const [status, setStatus] = useState<GameStatus>('running');
  const [typedBuffer, setTypedBuffer] = useState('');
  const [targets, setTargets] = useState<TargetEntity[]>([]);
  const [crosshair, setCrosshair] = useState<CrosshairState>({ x: 0, y: 0, visible: false });
  const [precisionShots, setPrecisionShots] = useState(0);
  const [precisionHits, setPrecisionHits] = useState(0);

  const metricsApi = useGameMetrics();
  const { metrics, setElapsedMs, registerCorrect, registerMistake, reset, setScore, setCombo } = metricsApi;

  const { particles, spawnBurst, updateParticles, clearParticles } = useParticleSystem();

  const arenaRef = useRef<HTMLDivElement | null>(null);
  const nextSpawnRef = useRef(0);
  const completedRef = useRef(false);
  const lastCorrectRef = useRef(0);

  const pool = useMemo(() => {
    const source = getWordsForDifficulty(difficulty).filter((word) => word.length >= 4 && word.length <= 16);
    return source.length > 0 ? source : ['target', 'precision', 'focus', 'combo'];
  }, [difficulty]);

  const roundMs = tuning.roundTimeMs;

  const precisionAccuracy = precisionShots > 0 ? (precisionHits / precisionShots) * 100 : 100;

  const completeGame = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;

    const payload: GameCompletionPayload = {
      gameId: 'target-practice',
      difficulty,
      score: Math.round(metrics.score + precisionAccuracy * 5),
      wpm: Number(metrics.wpm.toFixed(2)),
      accuracy: Number(metrics.accuracy.toFixed(2)),
      mistakes: metrics.mistakes,
      maxCombo: metrics.maxCombo,
      elapsedMs: Math.min(metrics.elapsedMs, roundMs),
    };

    onComplete(payload);
  }, [difficulty, metrics, onComplete, precisionAccuracy, roundMs]);

  const restart = useCallback(() => {
    completedRef.current = false;
    setStatus('running');
    setTypedBuffer('');
    setTargets([]);
    setCrosshair({ x: 0, y: 0, visible: false });
    setPrecisionHits(0);
    setPrecisionShots(0);
    nextSpawnRef.current = 0;
    lastCorrectRef.current = 0;
    reset();
    clearParticles();
  }, [clearParticles, reset]);

  const onBack = useCallback(() => {
    setStatus('game-over');
    if (onBackToHub) {
      onBackToHub();
    }
  }, [onBackToHub]);

  useEffect(() => {
    if (metrics.elapsedMs >= roundMs && status !== 'game-over') {
      setStatus('game-over');
    }
  }, [metrics.elapsedMs, roundMs, status]);

  useEffect(() => {
    if (status === 'game-over') {
      completeGame();
    }
  }, [completeGame, status]);

  useKeyboardCapture({
    enabled: status === 'running',
    allowSpaces: false,
    allowBackspace: true,
    onType: (key) => {
      const char = key.toLowerCase();
      if (!/^[a-z0-9-]$/.test(char)) return;

      setTypedBuffer((current) => {
        const next = `${current}${char}`;
        const matches = targets
          .filter((target) => startsWithTyped(target.word, next))
          .sort((a, b) => a.radius - b.radius || a.createdAt - b.createdAt);

        if (matches.length === 0) {
          registerMistake();
          setPrecisionShots((value) => value + 1);
          return '';
        }

        const target = matches[0];
        if (target.word.toLowerCase() === next.toLowerCase()) {
          lastCorrectRef.current = performance.now();
          const scoreGain = Math.round(target.points * (1 + metrics.combo * 0.06));
          registerCorrect(target.word.length, scoreGain);
          setScore((value) => value + scoreGain);
          setPrecisionShots((value) => value + 1);
          setPrecisionHits((value) => value + 1);

          setTargets((existing) => existing.filter((entry) => entry.id !== target.id));

          const arena = arenaRef.current;
          if (arena) {
            spawnBurst(target.x, target.y, 210, 14);
          }
          return '';
        }

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
        nextSpawnRef.current = elapsedMs + randomBetween(tuning.spawn.minMs, tuning.spawn.maxMs);
      }

      const arena = arenaRef.current;
      const width = arena?.clientWidth ?? 640;
      const height = arena?.clientHeight ?? 320;

      if (elapsedMs >= nextSpawnRef.current) {
        setTargets((current) => {
          if (current.length >= tuning.maxTargets) return current;
          const created = createTarget(
            width,
            height,
            pool,
            tuning.targetSpeed * difficultyConfig.speedMultiplier,
            tuning.minRadius,
            tuning.maxRadius
          );
          return [...current, created];
        });

        const pacing = clamp(1 - elapsedMs / roundMs / 2, 0.52, 1);
        nextSpawnRef.current =
          elapsedMs + randomBetween(tuning.spawn.minMs * pacing, tuning.spawn.maxMs * pacing);
      }

      setTargets((current) =>
        current.map((target) => {
          let nextX = target.x + (target.velocityX * deltaMs) / 1000;
          let nextY = target.y + (target.velocityY * deltaMs) / 1000;
          let nextVX = target.velocityX;
          let nextVY = target.velocityY;

          if (nextX <= target.radius || nextX >= width - target.radius) {
            nextVX *= -1;
            nextX = clamp(nextX, target.radius, width - target.radius);
          }

          if (nextY <= target.radius || nextY >= height - target.radius) {
            nextVY *= -1;
            nextY = clamp(nextY, target.radius, height - target.radius);
          }

          return {
            ...target,
            x: nextX,
            y: nextY,
            velocityX: nextVX,
            velocityY: nextVY,
          };
        })
      );

      if (lastCorrectRef.current > 0 && performance.now() - lastCorrectRef.current > difficultyConfig.comboWindowMs) {
        setCombo(0);
      }
    },
  });

  const highlightedId = useMemo(() => {
    if (!typedBuffer) return null;
    return (
      targets
        .filter((target) => startsWithTyped(target.word, typedBuffer))
        .sort((a, b) => a.radius - b.radius || a.createdAt - b.createdAt)[0]
        ?.id ?? null
    );
  }, [targets, typedBuffer]);

  const roundProgress = clamp((metrics.elapsedMs / roundMs) * 100, 0, 100);

  return (
    <GameLayout
      gameId="target-practice"
      title="Target Practice"
      subtitle="Track moving word targets and type with precision to maximize score and combo continuity."
      status={status}
      onPauseToggle={() => setStatus((current) => (current === 'running' ? 'paused' : 'running'))}
      onRestart={restart}
      onBack={onBack}
      timer={{ elapsedMs: metrics.elapsedMs, maxMs: roundMs }}
      stats={{
        score: metrics.score,
        wpm: metrics.wpm,
        accuracy: metrics.accuracy,
        mistakes: metrics.mistakes,
        combo: metrics.combo,
        maxCombo: metrics.maxCombo,
      }}
      particles={particles}
    >
      <div className="relative h-full min-h-[390px]" ref={arenaRef}
        onMouseMove={(event) => {
          const rect = arenaRef.current?.getBoundingClientRect();
          if (!rect) return;
          setCrosshair({
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
            visible: true,
          });
        }}
        onMouseLeave={() => {
          setCrosshair((current) => ({ ...current, visible: false }));
        }}
      >
        <div className="mb-3 grid gap-2 sm:grid-cols-4">
          <div className="rounded-xl border border-border/70 bg-card/70 px-3 py-2 text-xs text-muted-foreground">
            Precision: <span className="font-semibold text-foreground">{precisionAccuracy.toFixed(1)}%</span>
          </div>
          <div className="rounded-xl border border-border/70 bg-card/70 px-3 py-2 text-xs text-muted-foreground">
            Hits/Shots: <span className="font-semibold text-foreground">{precisionHits}/{precisionShots}</span>
          </div>
          <div className="rounded-xl border border-border/70 bg-card/70 px-3 py-2 text-xs text-muted-foreground">
            Targets Live: <span className="font-semibold text-foreground">{targets.length}</span>
          </div>
          <div className="rounded-xl border border-border/70 bg-card/70 px-3 py-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Timer className="h-3.5 w-3.5" /> Progress {roundProgress.toFixed(0)}%
            </span>
          </div>
        </div>

        <div className="relative h-[290px] overflow-hidden rounded-2xl border border-border/70 bg-background/60">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-warning/10" />

          {targets.map((target) => {
            const typed = startsWithTyped(target.word, typedBuffer) ? typedBuffer : '';
            const highlighted = highlightedId === target.id;

            return (
              <motion.div
                key={target.id}
                className={cn(
                  'absolute -translate-x-1/2 -translate-y-1/2 rounded-full border text-center shadow-card',
                  highlighted
                    ? 'border-primary/55 bg-primary/14'
                    : 'border-border/70 bg-card/85'
                )}
                style={{
                  left: `${target.x}px`,
                  top: `${target.y}px`,
                  width: `${target.radius * 2}px`,
                  height: `${target.radius * 2}px`,
                  willChange: 'transform',
                  transform: 'translate3d(-50%, -50%, 0)',
                }}
                animate={{ scale: highlighted ? [1, 1.07, 1] : 1 }}
                transition={{ duration: 0.42, repeat: highlighted ? Number.POSITIVE_INFINITY : 0 }}
              >
                <div className="absolute inset-1 rounded-full border border-border/50" />
                <div className="absolute inset-0 flex items-center justify-center px-2 text-[11px] font-semibold leading-tight">
                  <span className="text-success">{typed}</span>
                  <span>{target.word.slice(typed.length)}</span>
                </div>
              </motion.div>
            );
          })}

          {crosshair.visible && (
            <motion.div
              className="pointer-events-none absolute"
              style={{ left: crosshair.x, top: crosshair.y, transform: 'translate3d(-50%, -50%, 0)' }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 0.6, repeat: Number.POSITIVE_INFINITY }}
            >
              <Crosshair className="h-8 w-8 text-primary/85" />
            </motion.div>
          )}

          {targets.length === 0 && status === 'running' && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
              <Target className="mr-2 h-4 w-4" /> Waiting for targets...
            </div>
          )}
        </div>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="rounded-xl border border-border/70 bg-card/70 px-3 py-2 text-sm text-primary">
            Typed Buffer: <span className="font-semibold">{typedBuffer || '...'}</span>
          </div>
          <div className="rounded-xl border border-border/70 bg-card/70 px-3 py-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Focus className="h-3.5 w-3.5 text-success" />
              Smaller targets reward higher points.
            </span>
          </div>
        </div>

        <div className="mt-2 rounded-xl border border-border/70 bg-card/70 px-3 py-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <LocateFixed className="h-3.5 w-3.5" />
            Track targets with your eyes, then type complete words in one pass.
          </span>
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
        title="Range Session Complete"
        subtitle="Your precision summary is ready. Push for cleaner one-pass eliminations next round."
        score={metrics.score + precisionAccuracy * 5}
        wpm={metrics.wpm}
        accuracy={metrics.accuracy}
        maxCombo={metrics.maxCombo}
        onRestart={restart}
        onBack={onBack}
      />
    </GameLayout>
  );
}
