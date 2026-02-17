import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { AudioLines, ShieldAlert, Skull, Swords, Volume2, VolumeX, Zap } from 'lucide-react';
import GameLayout from '@/components/games/GameLayout';
import PauseOverlay from '@/components/games/PauseOverlay';
import GameOverModal from '@/components/games/GameOverModal';
import { DIFFICULTY_TUNING, GAME_DIFFICULTY_CONFIG } from '@/components/games/constants';
import { getWordsForDifficulty } from '@/components/games/data/wordBank';
import { useAnimationFrameLoop } from '@/components/games/hooks/useAnimationFrameLoop';
import { useGameMetrics } from '@/components/games/hooks/useGameMetrics';
import { useKeyboardCapture } from '@/components/games/hooks/useKeyboardCapture';
import { useParticleSystem } from '@/components/games/hooks/useParticleSystem';
import { useSynthSfx } from '@/components/games/hooks/useSynthSfx';
import { clamp, randomBetween, uid } from '@/components/games/utils/gameMath';
import { startsWithTyped } from '@/components/games/utils/random';
import type { GameComponentProps, GameCompletionPayload, GameStatus, ZombieEntity } from '@/components/games/types';
import { cn } from '@/lib/utils';

const SURVIVAL_MAX_MS = 4 * 60 * 1000;

const createZombie = (
  laneCount: number,
  speed: number,
  word: string,
  isBoss = false,
  wave = 1
): ZombieEntity => ({
  id: uid(isBoss ? 'boss' : 'zombie'),
  word,
  typed: '',
  lane: Math.floor(Math.random() * laneCount),
  distance: 100,
  speed: speed * randomBetween(0.86, 1.22) * (1 + wave * 0.04),
  health: isBoss ? 3 + Math.floor(wave / 4) : 1,
  maxHealth: isBoss ? 3 + Math.floor(wave / 4) : 1,
  isBoss,
  spawnTime: performance.now(),
  attackCooldownMs: 0,
});

const laneToTop = (lane: number, total: number): number => {
  if (total <= 1) return 52;
  const spacing = 86 / (total - 1);
  return 8 + lane * spacing;
};

export default function ZombieTypingSurvivalGame({
  difficulty,
  onComplete,
  onBackToHub,
}: GameComponentProps) {
  const tuning = DIFFICULTY_TUNING.zombieSurvival[difficulty];
  const difficultyConfig = GAME_DIFFICULTY_CONFIG[difficulty];

  const [status, setStatus] = useState<GameStatus>('running');
  const [zombies, setZombies] = useState<ZombieEntity[]>([]);
  const [typedBuffer, setTypedBuffer] = useState('');
  const [health, setHealth] = useState(tuning.startingHealth);
  const [wave, setWave] = useState(1);
  const [killsInWave, setKillsInWave] = useState(0);
  const [bossWaveSpawned, setBossWaveSpawned] = useState(false);
  const [shakeMagnitude, setShakeMagnitude] = useState(0);
  const [attackPulse, setAttackPulse] = useState(0);

  const metricsApi = useGameMetrics();
  const { metrics, setElapsedMs, registerCorrect, registerMistake, reset, setScore, setCombo } = metricsApi;

  const { particles, spawnBurst, updateParticles, clearParticles } = useParticleSystem();
  const sfx = useSynthSfx();

  const arenaRef = useRef<HTMLDivElement | null>(null);
  const nextSpawnRef = useRef(0);
  const completedRef = useRef(false);
  const lastCorrectRef = useRef(0);

  const normalPool = useMemo(() => {
    const source = getWordsForDifficulty(difficulty).filter((word) => word.length >= 5 && word.length <= 15);
    return source.length > 0 ? source : ['zombie', 'survive', 'hunter', 'shield'];
  }, [difficulty]);

  const bossPool = useMemo(() => {
    const source = getWordsForDifficulty('extreme').filter((word) => word.length >= 14 && word.length <= 26);
    return source.length > 0 ? source : ['hypervelocityguardian'];
  }, []);

  const waveTarget = useMemo(() => 8 + wave * 3, [wave]);

  const completeGame = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    const payload: GameCompletionPayload = {
      gameId: 'zombie-survival',
      difficulty,
      score: Math.round(metrics.score),
      wpm: Number(metrics.wpm.toFixed(2)),
      accuracy: Number(metrics.accuracy.toFixed(2)),
      mistakes: metrics.mistakes,
      maxCombo: metrics.maxCombo,
      elapsedMs: Math.min(metrics.elapsedMs, SURVIVAL_MAX_MS),
    };
    onComplete(payload);
  }, [difficulty, metrics, onComplete]);

  const restart = useCallback(() => {
    completedRef.current = false;
    setStatus('running');
    setZombies([]);
    setTypedBuffer('');
    setHealth(tuning.startingHealth);
    setWave(1);
    setKillsInWave(0);
    setBossWaveSpawned(false);
    setShakeMagnitude(0);
    setAttackPulse(0);
    nextSpawnRef.current = 0;
    lastCorrectRef.current = 0;
    reset();
    clearParticles();
  }, [clearParticles, reset, tuning.startingHealth]);

  const onBack = useCallback(() => {
    setStatus('game-over');
    if (onBackToHub) {
      onBackToHub();
    }
  }, [onBackToHub]);

  const spawnZombie = useCallback(
    (spawnBoss = false) => {
      const baseSpeed = tuning.zombieSpeed * difficultyConfig.speedMultiplier;
      const word = spawnBoss
        ? bossPool[Math.floor(Math.random() * bossPool.length)]
        : normalPool[Math.floor(Math.random() * normalPool.length)];

      setZombies((current) => {
        const hasBoss = current.some((entity) => entity.isBoss);
        if (spawnBoss && hasBoss) return current;
        if (!spawnBoss && current.length >= tuning.laneCount * 2) return current;

        const created = createZombie(tuning.laneCount, baseSpeed, word, spawnBoss, wave);
        return [...current, created];
      });

      if (spawnBoss) {
        sfx.playBoss();
      }
    },
    [tuning.zombieSpeed, difficultyConfig.speedMultiplier, bossPool, normalPool, tuning.laneCount, wave, sfx]
  );

  useEffect(() => {
    if (health <= 0 && status !== 'game-over') {
      setStatus('game-over');
    }
  }, [health, status]);

  useEffect(() => {
    if (metrics.elapsedMs >= SURVIVAL_MAX_MS && status !== 'game-over') {
      setStatus('game-over');
    }
  }, [metrics.elapsedMs, status]);

  useEffect(() => {
    if (status === 'game-over') {
      completeGame();
    }
  }, [completeGame, status]);

  useEffect(() => {
    if (killsInWave >= waveTarget) {
      setWave((current) => current + 1);
      setKillsInWave(0);
      setBossWaveSpawned(false);
    }
  }, [killsInWave, waveTarget]);

  useKeyboardCapture({
    enabled: status === 'running',
    allowSpaces: false,
    allowBackspace: true,
    onType: (key) => {
      const char = key.toLowerCase();
      if (!/^[a-z0-9-]$/.test(char)) return;

      setTypedBuffer((current) => {
        const next = `${current}${char}`;
        const matches = zombies
          .filter((entity) => startsWithTyped(entity.word, next))
          .sort((a, b) => a.distance - b.distance);

        if (matches.length === 0) {
          registerMistake();
          setShakeMagnitude((value) => value + 1.8);
          sfx.playFail();
          return '';
        }

        const target = matches[0];
        if (target.word.toLowerCase() === next.toLowerCase()) {
          lastCorrectRef.current = performance.now();
          setAttackPulse((value) => value + 1);

          setZombies((existing) => {
            const index = existing.findIndex((entity) => entity.id === target.id);
            if (index < 0) return existing;

            const selected = existing[index];
            if (selected.health > 1) {
              const replacementWord =
                bossPool[Math.floor(Math.random() * bossPool.length)] ?? selected.word;
              const updated = [...existing];
              updated[index] = {
                ...selected,
                health: selected.health - 1,
                word: replacementWord,
              };
              return updated;
            }

            return existing.filter((entity) => entity.id !== target.id);
          });

          const scoreGain = Math.round(target.word.length * 14 * (target.isBoss ? 4 : 1) * (1 + wave * 0.08));
          registerCorrect(target.word.length, scoreGain);
          setScore((value) => value + scoreGain);
          setKillsInWave((value) => value + 1);
          sfx.playHit();

          const arena = arenaRef.current;
          if (arena) {
            const x = (target.distance / 100) * arena.clientWidth;
            const y = (laneToTop(target.lane, tuning.laneCount) / 100) * arena.clientHeight;
            spawnBurst(x, y, target.isBoss ? 28 : 165, target.isBoss ? 28 : 16);
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

      const needsBoss = wave % tuning.bossIntervalWaves === 0 && !bossWaveSpawned;
      if (needsBoss && !zombies.some((entity) => entity.isBoss)) {
        spawnZombie(true);
        setBossWaveSpawned(true);
        nextSpawnRef.current = elapsedMs + randomBetween(900, 1300);
      } else if (elapsedMs >= nextSpawnRef.current) {
        spawnZombie(false);
        const paceFactor = clamp(1 - wave * 0.03, 0.55, 1);
        nextSpawnRef.current =
          elapsedMs + randomBetween(tuning.spawn.minMs * paceFactor, tuning.spawn.maxMs * paceFactor);
      }

      let breaches = 0;
      setZombies((current) =>
        current
          .map((entity) => ({
            ...entity,
            distance: entity.distance - (entity.speed * deltaMs) / 1000,
          }))
          .filter((entity) => {
            const safe = entity.distance > 0;
            if (!safe) {
              breaches += entity.isBoss ? 2 : 1;
            }
            return safe;
          })
      );

      if (breaches > 0) {
        const damagePerBreach = difficulty === 'extreme' ? 14 : difficulty === 'hard' ? 12 : 10;
        setHealth((current) => Math.max(0, current - damagePerBreach * breaches));
        for (let i = 0; i < breaches; i += 1) {
          registerMistake();
        }
        setShakeMagnitude((value) => value + breaches * 2.2);
        sfx.playFail();
      }

      if (lastCorrectRef.current > 0 && performance.now() - lastCorrectRef.current > difficultyConfig.comboWindowMs) {
        setCombo(0);
      }

      setShakeMagnitude((value) => Math.max(0, value - (deltaMs / 1000) * 7));
    },
  });

  const highlightedId = useMemo(() => {
    if (!typedBuffer) return null;
    return (
      zombies
        .filter((entity) => startsWithTyped(entity.word, typedBuffer))
        .sort((a, b) => a.distance - b.distance)[0]
        ?.id ?? null
    );
  }, [typedBuffer, zombies]);

  const shakeStyle = useMemo(() => {
    if (shakeMagnitude <= 0.05) return undefined;
    const x = randomBetween(-shakeMagnitude, shakeMagnitude);
    const y = randomBetween(-shakeMagnitude, shakeMagnitude);
    return { transform: `translate3d(${x}px, ${y}px, 0)` };
  }, [shakeMagnitude]);

  const progress = clamp((metrics.elapsedMs / SURVIVAL_MAX_MS) * 100, 0, 100);

  return (
    <GameLayout
      gameId="zombie-survival"
      title="Zombie Typing Survival"
      subtitle="Type zombie words before they reach your base. Survive waves and defeat boss rounds."
      status={status}
      onPauseToggle={() => setStatus((current) => (current === 'running' ? 'paused' : 'running'))}
      onRestart={restart}
      onBack={onBack}
      timer={{ elapsedMs: metrics.elapsedMs, maxMs: SURVIVAL_MAX_MS }}
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
          label: 'Base Integrity',
          warningThreshold: 0.35,
        },
      }}
      particles={particles}
    >
      <div className="relative h-full min-h-[400px]" style={shakeStyle} ref={arenaRef}>
        <div className="mb-3 grid gap-2 sm:grid-cols-4">
          <div className="rounded-xl border border-border/70 bg-card/70 px-3 py-2 text-xs text-muted-foreground">
            Wave: <span className="font-semibold text-foreground">{wave}</span>
          </div>
          <div className="rounded-xl border border-border/70 bg-card/70 px-3 py-2 text-xs text-muted-foreground">
            Kills: <span className="font-semibold text-foreground">{killsInWave}/{waveTarget}</span>
          </div>
          <div className="rounded-xl border border-border/70 bg-card/70 px-3 py-2 text-xs text-muted-foreground">
            Enemies: <span className="font-semibold text-foreground">{zombies.length}</span>
          </div>
          <button
            type="button"
            onClick={() => sfx.setEnabled((value) => !value)}
            className="rounded-xl border border-border/70 bg-card/70 px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:bg-muted/50"
          >
            <span className="inline-flex items-center gap-1 font-semibold text-foreground">
              {sfx.enabled ? <Volume2 className="h-3.5 w-3.5 text-success" /> : <VolumeX className="h-3.5 w-3.5" />}
              SFX {sfx.enabled ? 'On' : 'Off'}
            </span>
          </button>
        </div>

        <div className="relative h-[280px] overflow-hidden rounded-2xl border border-border/70 bg-background/65">
          <div className="absolute inset-0 bg-gradient-to-r from-destructive/10 via-transparent to-success/10" />

          {Array.from({ length: tuning.laneCount }).map((_, lane) => (
            <div
              key={`lane-${lane}`}
              className="absolute left-0 right-0 h-px bg-border/50"
              style={{ top: `${laneToTop(lane, tuning.laneCount)}%` }}
            />
          ))}

          <motion.div
            key={attackPulse}
            className="absolute bottom-4 left-4 flex h-20 w-20 items-center justify-center rounded-2xl border border-success/45 bg-success/10"
            animate={{ scale: [1, 1.08, 1], rotate: [0, -4, 4, 0] }}
            transition={{ duration: 0.28 }}
          >
            <Swords className="h-8 w-8 text-success" />
          </motion.div>

          {zombies.map((entity) => {
            const top = laneToTop(entity.lane, tuning.laneCount);
            const left = clamp(entity.distance, 2, 95);
            const typedPart = startsWithTyped(entity.word, typedBuffer) ? typedBuffer : '';
            const highlighted = highlightedId === entity.id;

            return (
              <motion.div
                key={entity.id}
                className={cn(
                  'absolute -translate-y-1/2 rounded-xl border px-2.5 py-1.5 text-sm font-semibold shadow-card',
                  entity.isBoss
                    ? 'border-warning/50 bg-warning/15 text-warning-foreground'
                    : 'border-border/70 bg-card/90 text-foreground',
                  highlighted && 'ring-2 ring-primary/40'
                )}
                style={{
                  top: `${top}%`,
                  left: `${left}%`,
                  transform: 'translate3d(0,-50%,0)',
                  willChange: 'transform',
                  minWidth: entity.isBoss ? '180px' : '120px',
                }}
                animate={{ scale: entity.isBoss ? [1, 1.03, 1] : 1 }}
                transition={{ duration: entity.isBoss ? 0.8 : 0.2, repeat: entity.isBoss ? Number.POSITIVE_INFINITY : 0 }}
              >
                <div className="mb-1 flex items-center justify-between gap-2 text-[10px] uppercase tracking-wide text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    {entity.isBoss ? <Zap className="h-3 w-3 text-warning" /> : <Skull className="h-3 w-3 text-destructive" />}
                    {entity.isBoss ? 'Boss' : 'Zombie'}
                  </span>
                  {entity.maxHealth > 1 && (
                    <span className="text-warning-foreground">
                      {entity.health}/{entity.maxHealth}
                    </span>
                  )}
                </div>
                <p className="leading-tight">
                  <span className="text-success">{typedPart}</span>
                  <span>{entity.word.slice(typedPart.length)}</span>
                </p>
              </motion.div>
            );
          })}

          {zombies.length === 0 && status === 'running' && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
              <AudioLines className="mr-2 h-4 w-4 text-primary" />
              Quiet wave... hostiles incoming.
            </div>
          )}
        </div>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="rounded-xl border border-border/70 bg-card/70 px-3 py-2 text-sm text-primary">
            Typed Buffer: <span className="font-semibold">{typedBuffer || '...'}</span>
          </div>
          <div className="rounded-xl border border-border/70 bg-card/70 px-3 py-2 text-xs text-muted-foreground">
            Survival Progress {progress.toFixed(1)}% • Boss every {tuning.bossIntervalWaves} waves
          </div>
        </div>

        {health <= tuning.startingHealth * 0.3 && (
          <motion.div
            className="mt-2 inline-flex items-center gap-1 rounded-lg border border-destructive/40 bg-destructive/10 px-2 py-1 text-xs text-destructive"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 0.8, repeat: Number.POSITIVE_INFINITY }}
          >
            <ShieldAlert className="h-3.5 w-3.5" /> Base critical
          </motion.div>
        )}
      </div>

      <PauseOverlay
        open={status === 'paused'}
        onResume={() => setStatus('running')}
        onRestart={restart}
        onBack={onBack}
      />

      <GameOverModal
        open={status === 'game-over'}
        title={health <= 0 ? 'Base Overrun' : 'Survival Complete'}
        subtitle={
          health <= 0
            ? 'The horde breached your base. Build cleaner streaks and protect your lanes.'
            : 'You held the line to the end of the timer. Strong defensive rhythm.'
        }
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
