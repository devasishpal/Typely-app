import { memo } from 'react';
import { motion } from 'motion/react';
import { Pause, Play, RotateCcw, Swords } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import GameTimer from '@/components/games/GameTimer';
import ScoreBoard from '@/components/games/ScoreBoard';
import HealthBar from '@/components/games/HealthBar';
import ComboMeter from '@/components/games/ComboMeter';
import AnimatedBackground from '@/components/games/AnimatedBackground';
import ParticleSystem from '@/components/games/ParticleSystem';
import type { GameLayoutProps } from '@/components/games/types';
import { calcMultiplier } from '@/components/games/utils/gameMath';

function GameLayoutBase({
  gameId,
  title,
  subtitle,
  status,
  onPauseToggle,
  onRestart,
  onBack,
  timer,
  stats,
  children,
  particles = [],
  className,
}: GameLayoutProps) {
  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-card p-4 shadow-card sm:p-5 lg:p-6',
        className
      )}
      aria-label={`${title} game panel`}
    >
      <AnimatedBackground
        gameId={gameId}
        intensity={status === 'running' ? 0.78 : 0.45}
        speed={stats.wpm || 30}
        paused={status !== 'running'}
      />

      <div className="relative z-10 mb-4 flex flex-col gap-3 border-b border-border/60 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="mb-1 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium uppercase tracking-wide text-primary">
            <Swords className="h-3.5 w-3.5" /> Active Challenge
          </p>
          <h2 className="text-2xl font-bold leading-tight sm:text-3xl">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={onPauseToggle}>
            {status === 'paused' ? <Play className="mr-2 h-4 w-4" /> : <Pause className="mr-2 h-4 w-4" />}
            {status === 'paused' ? 'Resume' : 'Pause'}
          </Button>
          <Button variant="outline" size="sm" onClick={onRestart}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Restart
          </Button>
          <Button variant="ghost" size="sm" onClick={onBack}>
            Back To Hub
          </Button>
        </div>
      </div>

      <div className="relative z-10 grid gap-3 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-h-[420px] rounded-3xl border border-border/60 bg-background/55 p-3 shadow-card backdrop-blur-sm sm:p-4">
          {children}
        </div>

        <aside className="space-y-3">
          <GameTimer elapsedMs={timer.elapsedMs} maxMs={timer.maxMs} status={status} />
          <ScoreBoard
            score={stats.score}
            wpm={stats.wpm}
            accuracy={stats.accuracy}
            mistakes={stats.mistakes}
            status={status}
          />
          <ComboMeter
            combo={stats.combo}
            maxCombo={stats.maxCombo}
            multiplier={calcMultiplier(stats.combo)}
          />
          {stats.health && (
            <HealthBar
              current={stats.health.current}
              max={stats.health.max}
              label={stats.health.label}
              warningThreshold={stats.health.warningThreshold}
            />
          )}
          <motion.div
            className="rounded-2xl border border-border/60 bg-card/85 p-3 text-xs text-muted-foreground shadow-card"
            animate={status === 'running' ? { opacity: 1 } : { opacity: 0.8 }}
          >
            Keep your focus on accuracy first, then ramp speed with stable rhythm.
          </motion.div>
        </aside>
      </div>

      <ParticleSystem particles={particles} />
    </section>
  );
}

export const GameLayout = memo(GameLayoutBase);

export default GameLayout;
