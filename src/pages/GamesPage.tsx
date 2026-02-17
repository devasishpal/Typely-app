import type { ComponentType } from 'react';
import { Suspense, lazy, useCallback, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'motion/react';
import { Loader2, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  ACHIEVEMENT_PREVIEW_SEED,
  DEFAULT_DIFFICULTY,
  GAME_CARDS,
  GAME_ID_TO_LABEL,
} from '@/components/games/constants';
import { usePersistentGamesData } from '@/components/games/hooks/usePersistentGamesData';
import type {
  AchievementPreviewItem,
  GameCompletionPayload,
  GameDifficulty,
  GameId,
} from '@/components/games/types';
import {
  AchievementPreviewSection,
  DifficultyFilterSection,
  GameCardsGridSection,
  GamePreviewSection,
  GamesCtaSection,
  GamesHeroSection,
  LeaderboardSection,
  PlayerStatsSection,
} from '@/components/games/scenes';

const FallingWordsGame = lazy(() => import('@/components/games/engines/FallingWordsGame'));
const SpeedRacerGame = lazy(() => import('@/components/games/engines/SpeedRacerGame'));
const ZombieTypingSurvivalGame = lazy(() => import('@/components/games/engines/ZombieTypingSurvivalGame'));
const TargetPracticeGame = lazy(() => import('@/components/games/engines/TargetPracticeGame'));

const gameComponentMap: Record<GameId, ComponentType<any>> = {
  'falling-words': FallingWordsGame,
  'speed-racer': SpeedRacerGame,
  'zombie-survival': ZombieTypingSurvivalGame,
  'target-practice': TargetPracticeGame,
};

const buildAchievements = (stats: ReturnType<typeof usePersistentGamesData>['stats']): AchievementPreviewItem[] => {
  const totalScoreEstimate = Math.max(0, stats.bestScore + stats.gamesCompleted * 120);
  const zombiesEliminated = Math.round(stats.perGame['zombie-survival'].gamesCompleted * 18);
  const precision = stats.perGame['target-practice'].bestAccuracy;
  const topSpeed = stats.perGame['speed-racer'].highestWpm * 3.2;

  return ACHIEVEMENT_PREVIEW_SEED.map((achievement) => {
    if (achievement.id === 'first-1000') {
      const progress = totalScoreEstimate;
      return { ...achievement, progress, unlocked: progress >= achievement.goal };
    }
    if (achievement.id === 'combo-legend') {
      const progress = Math.min(achievement.goal, Math.round(stats.bestAccuracy / 3));
      return { ...achievement, progress, unlocked: progress >= achievement.goal };
    }
    if (achievement.id === 'night-rider') {
      const progress = topSpeed;
      return { ...achievement, progress, unlocked: progress >= achievement.goal };
    }
    if (achievement.id === 'undead-hunter') {
      const progress = zombiesEliminated;
      return { ...achievement, progress, unlocked: progress >= achievement.goal };
    }
    if (achievement.id === 'pinpoint') {
      const progress = precision;
      return { ...achievement, progress, unlocked: progress >= achievement.goal };
    }
    if (achievement.id === 'marathon') {
      const progress = stats.totalTimePlayedMs / 60000;
      return { ...achievement, progress, unlocked: progress >= achievement.goal };
    }
    return achievement;
  });
};

function GameLoaderCard() {
  return (
    <div className="flex min-h-[380px] items-center justify-center rounded-3xl border border-border/65 bg-card/75 p-8 shadow-card">
      <div className="text-center">
        <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading game engine...</p>
      </div>
    </div>
  );
}

export default function GamesPage() {
  const [activeGame, setActiveGame] = useState<GameId>('falling-words');
  const [difficulty, setDifficulty] = useState<GameDifficulty>(DEFAULT_DIFFICULTY);
  const [isPlaying, setIsPlaying] = useState(false);
  const [lastRun, setLastRun] = useState<GameCompletionPayload | null>(null);

  const persistent = usePersistentGamesData();
  const { stats, leaderboard, addRun } = persistent;

  const gameStageRef = useRef<HTMLElement | null>(null);

  const ActiveGameComponent = useMemo(() => gameComponentMap[activeGame], [activeGame]);

  const achievements = useMemo(() => buildAchievements(stats), [stats]);

  const handleLaunchGame = useCallback(() => {
    setIsPlaying(true);
    window.requestAnimationFrame(() => {
      gameStageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, []);

  const handleGameComplete = useCallback(
    (payload: GameCompletionPayload) => {
      setLastRun(payload);
      addRun(payload);
    },
    [addRun]
  );

  const handleSelectGame = useCallback((id: GameId) => {
    setActiveGame(id);
    setIsPlaying(false);
  }, []);

  const structuredData = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Typely Games',
      description:
        'Animated typing games in Typely including Falling Words, Speed Racer, Zombie Survival, and Target Practice.',
      isPartOf: {
        '@type': 'WebSite',
        name: 'Typely',
      },
      about: GAME_CARDS.map((card) => ({
        '@type': 'Game',
        name: card.title,
        description: card.description,
      })),
    }),
    []
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-6 pb-8"
    >
      <Helmet>
        <title>Typely Games | Animated Typing Challenges</title>
        <meta
          name="description"
          content="Play Typely typing games: Falling Words, Speed Racer, Zombie Survival, and Target Practice. Track local stats, WPM, and leaderboard progress."
        />
        <meta property="og:title" content="Typely Games | Animated Typing Challenges" />
        <meta
          property="og:description"
          content="Train speed, precision, and accuracy with Typely's animated typing game hub."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://typely.app/games" />
        <meta property="og:site_name" content="Typely" />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>

      <a
        href="#games-main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[95] focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:shadow-card"
      >
        Skip to games content
      </a>

      <GamesHeroSection
        activeGame={activeGame}
        difficulty={difficulty}
        totalGamesCompleted={stats.gamesCompleted}
      />

      <main id="games-main-content" className="space-y-6" aria-label="Games Hub Content">
        <GameCardsGridSection cards={GAME_CARDS} activeGame={activeGame} onSelectGame={handleSelectGame} />

        <PlayerStatsSection stats={stats} lastRun={lastRun} />

        <DifficultyFilterSection difficulty={difficulty} onChangeDifficulty={setDifficulty} />

        <GamePreviewSection activeGame={activeGame} difficulty={difficulty} />

        <section ref={gameStageRef} aria-label="Gameplay Stage" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Gameplay Stage</h2>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Lazy Loaded Engine</p>
          </div>

          {isPlaying ? (
            <Suspense fallback={<GameLoaderCard />}>
              <ActiveGameComponent
                difficulty={difficulty}
                onComplete={handleGameComplete}
                onBackToHub={() => setIsPlaying(false)}
              />
            </Suspense>
          ) : (
            <div className="rounded-3xl border border-border/65 bg-card/75 p-6 shadow-card">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-xl font-semibold">{GAME_ID_TO_LABEL[activeGame]}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Difficulty: {difficulty}. Launch to initialize the full gameplay engine.
                  </p>
                </div>
                <Button size="lg" onClick={handleLaunchGame}>
                  <PlayCircle className="mr-2 h-4 w-4" /> Start Game
                </Button>
              </div>
            </div>
          )}
        </section>

        <LeaderboardSection
          leaderboard={leaderboard}
          activeGame={activeGame}
          difficulty={difficulty}
        />

        <AchievementPreviewSection achievements={achievements} />

        <GamesCtaSection
          activeGame={activeGame}
          difficulty={difficulty}
          onLaunch={handleLaunchGame}
        />
      </main>
    </motion.div>
  );
}

