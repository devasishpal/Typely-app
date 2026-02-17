import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Gauge, Rocket, TriangleAlert, Zap } from 'lucide-react';
import GameLayout from '@/components/games/GameLayout';
import PauseOverlay from '@/components/games/PauseOverlay';
import GameOverModal from '@/components/games/GameOverModal';
import { DIFFICULTY_TUNING } from '@/components/games/constants';
import { getWordsForDifficulty } from '@/components/games/data/wordBank';
import { useAnimationFrameLoop } from '@/components/games/hooks/useAnimationFrameLoop';
import { useKeyboardCapture } from '@/components/games/hooks/useKeyboardCapture';
import { useGameMetrics } from '@/components/games/hooks/useGameMetrics';
import { clamp } from '@/components/games/utils/gameMath';
import type { GameComponentProps, GameCompletionPayload, GameStatus, RacerWordChallenge } from '@/components/games/types';
import { cn } from '@/lib/utils';

const RACE_MAX_MS = 3 * 60 * 1000;

const createChallenge = (pool: string[]): RacerWordChallenge => {
  const text = pool[Math.floor(Math.random() * pool.length)] ?? 'velocity';
  return {
    id: `racer-${Math.random().toString(36).slice(2, 9)}`,
    text,
    typed: '',
    distanceValue: Math.max(22, text.length * 5),
    speedBonus: Math.max(6, text.length * 0.85),
  };
};

export default function SpeedRacerGame({ difficulty, onComplete, onBackToHub }: GameComponentProps) {
  const tuning = DIFFICULTY_TUNING.speedRacer[difficulty];

  const [status, setStatus] = useState<GameStatus>('running');
  const [typedBuffer, setTypedBuffer] = useState('');
  const [roadOffset, setRoadOffset] = useState(0);
  const [distance, setDistance] = useState(0);
  const [speed, setSpeed] = useState(tuning.startingSpeed);
  const [nitro, setNitro] = useState(0);
  const [shake, setShake] = useState(0);
  const [challenge, setChallenge] = useState<RacerWordChallenge>(() => createChallenge(getWordsForDifficulty(difficulty)));

  const metricsApi = useGameMetrics();
  const { metrics, setElapsedMs, registerCorrect, registerMistake, reset, setScore, setCombo } = metricsApi;

  const completeRef = useRef(false);

  const pool = useMemo(() => {
    const base = getWordsForDifficulty(difficulty).filter((word) => word.length >= 5 && word.length <= 18);
    return base.length > 0 ? base : ['velocity', 'nitro', 'engine', 'racing'];
  }, [difficulty]);

  const finishDistance = tuning.finishDistance;
  const progress = clamp((distance / finishDistance) * 100, 0, 100);

  const finishRace = useCallback(() => {
    if (completeRef.current) return;
    completeRef.current = true;

    const payload: GameCompletionPayload = {
      gameId: 'speed-racer',
      difficulty,
      score: Math.round(metrics.score + distance),
      wpm: Number(metrics.wpm.toFixed(2)),
      accuracy: Number(metrics.accuracy.toFixed(2)),
      mistakes: metrics.mistakes,
      maxCombo: metrics.maxCombo,
      elapsedMs: Math.min(metrics.elapsedMs, RACE_MAX_MS),
    };

    onComplete(payload);
  }, [difficulty, distance, metrics, onComplete]);

  const restart = useCallback(() => {
    completeRef.current = false;
    setStatus('running');
    setTypedBuffer('');
    setRoadOffset(0);
    setDistance(0);
    setSpeed(tuning.startingSpeed);
    setNitro(0);
    setShake(0);
    setChallenge(createChallenge(pool));
    reset();
  }, [pool, reset, tuning.startingSpeed]);

  const onBack = useCallback(() => {
    setStatus('game-over');
    if (onBackToHub) {
      onBackToHub();
    }
  }, [onBackToHub]);

  useEffect(() => {
    if ((distance >= finishDistance || metrics.elapsedMs >= RACE_MAX_MS) && status !== 'game-over') {
      setStatus('game-over');
    }
  }, [distance, finishDistance, metrics.elapsedMs, status]);

  useEffect(() => {
    if (status === 'game-over') {
      finishRace();
    }
  }, [finishRace, status]);

  useKeyboardCapture({
    enabled: status === 'running',
    allowSpaces: false,
    allowBackspace: true,
    onType: (key) => {
      const char = key.toLowerCase();
      if (!/^[a-z]$/.test(char)) return;

      const expected = challenge.text[typedBuffer.length]?.toLowerCase() ?? '';

      if (char === expected) {
        const next = `${typedBuffer}${char}`;
        setTypedBuffer(next);
        registerCorrect(1, 2);

        if (next.length >= challenge.text.length) {
          const boost = challenge.speedBonus + metrics.combo * 0.5;
          const nitroGain = Math.min(100, nitro + boost * 0.6);
          setNitro(nitroGain);
          setSpeed((current) => Math.min(tuning.maxSpeed, current + tuning.accelerationGain + boost * 0.08));
          setDistance((current) => current + challenge.distanceValue + boost * 0.9);
          setScore((current) => current + Math.round(challenge.distanceValue * (1 + metrics.combo * 0.05)));
          setChallenge(createChallenge(pool));
          setTypedBuffer('');
        }
      } else {
        registerMistake();
        setSpeed((current) => Math.max(tuning.startingSpeed * 0.65, current - tuning.mistakePenalty));
        setNitro((current) => Math.max(0, current - 20));
        setShake((current) => current + 1);
        setTypedBuffer('');
      }
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

      const decay = (tuning.speedDecayPerSecond * deltaMs) / 1000;
      setSpeed((current) => {
        const nitroBoost = nitro > 0 ? 28 : 0;
        return clamp(current - decay + nitroBoost * (deltaMs / 1000), tuning.startingSpeed * 0.65, tuning.maxSpeed);
      });

      setNitro((current) => Math.max(0, current - (deltaMs / 1000) * 24));
      setRoadOffset((current) => (current + (speed * deltaMs) / 120) % 1000);
      setDistance((current) => current + (speed * deltaMs) / 1000);

      if (metrics.combo > 0 && elapsedMs % 1600 < deltaMs) {
        setCombo((combo) => Math.max(0, combo - 1));
      }
    },
  });

  const carLaneOffset = Math.sin(metrics.elapsedMs / 280) * 14;
  const nitroActive = nitro > 45;
  const typedCorrect = challenge.text.slice(0, typedBuffer.length);

  return (
    <GameLayout
      gameId="speed-racer"
      title="Speed Racer"
      subtitle="Type with precision to accelerate, trigger nitro boosts, and finish the track before timeout."
      status={status}
      onPauseToggle={() => setStatus((current) => (current === 'running' ? 'paused' : 'running'))}
      onRestart={restart}
      onBack={onBack}
      timer={{ elapsedMs: metrics.elapsedMs, maxMs: RACE_MAX_MS }}
      stats={{
        score: metrics.score,
        wpm: metrics.wpm,
        accuracy: metrics.accuracy,
        mistakes: metrics.mistakes,
        combo: metrics.combo,
        maxCombo: metrics.maxCombo,
      }}
    >
      <div className="relative h-full min-h-[380px]">
        <div className="mb-3 grid gap-2 sm:grid-cols-3">
          <div className="rounded-2xl border border-border/70 bg-card/70 px-3 py-2 text-xs text-muted-foreground">
            Distance: <span className="font-semibold text-foreground">{distance.toFixed(1)} m</span>
          </div>
          <div className="rounded-2xl border border-border/70 bg-card/70 px-3 py-2 text-xs text-muted-foreground">
            Speed: <span className="font-semibold text-primary">{speed.toFixed(0)} km/h</span>
          </div>
          <div className="rounded-2xl border border-border/70 bg-card/70 px-3 py-2 text-xs text-muted-foreground">
            Nitro: <span className="font-semibold text-accent">{nitro.toFixed(0)}%</span>
          </div>
        </div>

        <div className="relative h-[250px] overflow-hidden rounded-2xl border border-border/70 bg-background/60">
          <div className="absolute inset-0 bg-gradient-to-b from-accent/15 via-transparent to-primary/10" />

          <motion.div
            className="absolute inset-x-0 bottom-0 top-10"
            animate={{ x: [0, 4, -4, 0] }}
            transition={{ duration: 1.2, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
            style={{
              backgroundImage:
                'repeating-linear-gradient(to right, hsl(var(--muted-foreground) / 0.25) 0, hsl(var(--muted-foreground) / 0.25) 10px, transparent 10px, transparent 28px)',
              backgroundPositionX: `${roadOffset}px`,
            }}
          />

          <motion.div
            className={cn(
              'absolute bottom-8 left-1/2 h-20 w-36 -translate-x-1/2 rounded-3xl border border-border/70 bg-gradient-to-r from-primary/35 via-accent/35 to-secondary/35 shadow-hover',
              nitroActive && 'ring-2 ring-accent/50'
            )}
            animate={{
              x: carLaneOffset,
              y: shake > 0 ? [0, -2, 2, -1, 0] : 0,
              scale: nitroActive ? [1, 1.04, 1] : 1,
            }}
            transition={{
              x: { duration: 0.18, ease: 'easeOut' },
              y: { duration: 0.2 },
              scale: { duration: 0.45, repeat: nitroActive ? Number.POSITIVE_INFINITY : 0 },
            }}
            onAnimationComplete={() => {
              if (shake > 0) {
                setShake((current) => Math.max(0, current - 1));
              }
            }}
          >
            <div className="absolute left-2 top-2 text-[10px] font-semibold uppercase tracking-wide text-foreground/90">
              Typely GT
            </div>
            <div className="absolute bottom-2 left-3 h-3 w-3 rounded-full bg-card/90" />
            <div className="absolute bottom-2 right-3 h-3 w-3 rounded-full bg-card/90" />
            {nitroActive && (
              <motion.div
                className="absolute -right-7 top-1/2 h-3 w-8 -translate-y-1/2 rounded-full bg-accent/70 blur-sm"
                animate={{ scaleX: [0.7, 1.3, 0.9], opacity: [0.45, 0.85, 0.35] }}
                transition={{ duration: 0.3, repeat: Number.POSITIVE_INFINITY }}
              />
            )}
          </motion.div>

          <div className="absolute right-3 top-3 rounded-xl border border-border/70 bg-card/70 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Speedometer</p>
            <div className="mt-1 flex items-center gap-2">
              <Gauge className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">{speed.toFixed(0)} km/h</span>
            </div>
          </div>

          {nitroActive && (
            <motion.div
              className="absolute inset-0 border-2 border-accent/40"
              animate={{ opacity: [0.15, 0.45, 0.15] }}
              transition={{ duration: 0.5, repeat: Number.POSITIVE_INFINITY }}
            />
          )}
        </div>

        <div className="mt-4 rounded-2xl border border-border/70 bg-card/70 p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Current Challenge Word</p>
            {nitroActive ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                <Zap className="h-3.5 w-3.5" /> Nitro Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-muted/40 px-2 py-0.5 text-xs text-muted-foreground">
                <Rocket className="h-3.5 w-3.5" /> Build Combo
              </span>
            )}
          </div>

          <p className="text-xl font-semibold tracking-wide">
            <span className="text-success">{typedCorrect}</span>
            <span>{challenge.text.slice(typedBuffer.length)}</span>
          </p>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted/70">
            <motion.div
              className="h-full bg-gradient-to-r from-primary via-accent to-secondary"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Track Progress: {progress.toFixed(1)}%</p>

          {metrics.mistakes > 0 && (
            <div className="mt-3 inline-flex items-center gap-1 rounded-lg border border-warning/40 bg-warning/10 px-2 py-1 text-xs text-warning-foreground">
              <TriangleAlert className="h-3.5 w-3.5" /> Mistakes reduce speed and nitro.
            </div>
          )}
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
        title={distance >= finishDistance ? 'Finish Line Reached' : 'Race Time Ended'}
        subtitle={
          distance >= finishDistance
            ? 'Excellent run. You crossed the finish with controlled speed and accuracy.'
            : 'Time expired before the finish line. Tune your rhythm and push harder next run.'
        }
        score={metrics.score + distance}
        wpm={metrics.wpm}
        accuracy={metrics.accuracy}
        maxCombo={metrics.maxCombo}
        onRestart={restart}
        onBack={onBack}
      />
    </GameLayout>
  );
}
