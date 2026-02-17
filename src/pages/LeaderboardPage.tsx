import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, RefreshCcw, Search, Trophy } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { leaderboardApi } from '@/db/api';
import { cn } from '@/lib/utils';
import type {
  LeaderboardMode,
  LeaderboardPeriod,
  LeaderboardPersonalStats,
  LeaderboardRankingRow,
} from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const LEADERBOARD_PERIODS: Array<{ value: LeaderboardPeriod; label: string }> = [
  { value: 'global', label: '🌍 Global' },
  { value: 'daily', label: '📅 Daily' },
  { value: 'weekly', label: '📆 Weekly' },
  { value: 'monthly', label: '📊 Monthly' },
];

const MODE_FILTER_OPTIONS: Array<{ value: LeaderboardMode; label: string }> = [
  { value: 'all', label: 'All modes' },
  { value: 'practice', label: 'Practice' },
  { value: 'timed', label: 'Timed' },
  { value: 'custom', label: 'Custom' },
];

function useAnimatedValue(target: number, durationMs = 650) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const startValue = value;
    const startTime = performance.now();
    let frame = 0;

    const tick = (time: number) => {
      const progress = Math.min((time - startTime) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(startValue + (target - startValue) * eased);
      if (progress < 1) {
        frame = window.requestAnimationFrame(tick);
      }
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, durationMs]);

  return value;
}

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatModeLabel = (mode: string) => {
  if (mode === 'practice') return 'Practice';
  if (mode === 'custom') return 'Custom';
  return 'Timed';
};

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<LeaderboardPeriod>('global');
  const [modeFilter, setModeFilter] = useState<LeaderboardMode>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingRows, setLoadingRows] = useState(false);
  const [loadingPersonal, setLoadingPersonal] = useState(false);
  const [rows, setRows] = useState<LeaderboardRankingRow[]>([]);
  const [personal, setPersonal] = useState<LeaderboardPersonalStats | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setRows([]);
      setLoadingRows(false);
      return;
    }

    let cancelled = false;
    const loadRows = async () => {
      setLoadingRows(true);
      const data = await leaderboardApi.getRankings({
        userId: user.id,
        period,
        limit: 100,
      });
      if (!cancelled) {
        setRows(data);
        setLoadingRows(false);
      }
    };

    loadRows();
    return () => {
      cancelled = true;
    };
  }, [period, user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setPersonal(null);
      setLoadingPersonal(false);
      return;
    }

    let cancelled = false;
    const loadPersonal = async () => {
      setLoadingPersonal(true);
      const stats = await leaderboardApi.getPersonalStats({
        userId: user.id,
        period: 'global',
      });
      if (!cancelled) {
        setPersonal(stats);
        setLoadingPersonal(false);
      }
    };

    loadPersonal();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const filteredRows = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return rows.filter((row) => {
      if (row.wpm > 300 || row.accuracy < 85) return false;
      if (modeFilter !== 'all' && row.test_mode !== modeFilter) return false;
      if (normalizedSearch && !row.username.toLowerCase().includes(normalizedSearch)) return false;
      return true;
    });
  }, [rows, modeFilter, searchQuery]);

  const animatedBestNetWpm = useAnimatedValue(personal?.best_net_wpm ?? 0, 700);
  const animatedPercentile = useAnimatedValue(personal?.percentile ?? 0, 700);

  const refreshLeaderboard = async () => {
    if (!user?.id) return;

    setLoadingRows(true);
    setLoadingPersonal(true);

    const [freshRows, freshPersonal] = await Promise.all([
      leaderboardApi.getRankings({
        userId: user.id,
        period,
        limit: 100,
        forceRefresh: true,
      }),
      leaderboardApi.getPersonalStats({
        userId: user.id,
        period: 'global',
        forceRefresh: true,
      }),
    ]);

    setRows(freshRows);
    setPersonal(freshPersonal);
    setLoadingRows(false);
    setLoadingPersonal(false);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold gradient-text">Leaderboard</h1>
        <p className="text-sm text-muted-foreground">
          Ranked by Net WPM (WPM × Accuracy), minimum 85% accuracy required.
        </p>
      </div>

      {!user && (
        <>
          <Card className="border border-primary/30 bg-gradient-card/80 backdrop-blur-md shadow-card">
            <CardContent className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="rounded-xl border border-primary/30 bg-primary/10 p-2">
                  <Lock className="h-4 w-4 text-primary" />
                </div>
                <p className="text-base font-semibold">🔒 Sign in to compete on the global leaderboard.</p>
              </div>
              <Button asChild>
                <Link to="/login?next=%2Fleaderboard">Sign In</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border border-border/80 bg-gradient-card/80 backdrop-blur-md shadow-card">
            <CardContent className="flex flex-col items-start justify-between gap-4 py-6 sm:flex-row sm:items-center">
              <div>
                <p className="text-lg font-semibold">Compete globally. Create a free account.</p>
                <p className="text-sm text-muted-foreground">
                  Create an account to unlock verified global rankings and personal rank tracking.
                </p>
              </div>
              <div className="flex gap-2">
                <Button asChild variant="outline">
                  <Link to="/login?next=%2Fleaderboard">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link to="/signup">Create Account</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {user && (
        <>
          <Card className="border border-border/80 bg-card/75 backdrop-blur-md shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Your Global Standing</CardTitle>
              <CardDescription>Verified leaderboard stats based on your best global score.</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPersonal ? (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {[...Array(4)].map((_, idx) => (
                    <Skeleton key={idx} className="h-20 w-full rounded-xl bg-muted" />
                  ))}
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <Card className="border border-border/80 bg-muted/35">
                    <CardContent className="pt-5">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Your Global Rank</p>
                      <p className="mt-1 text-2xl font-semibold">
                        {personal?.global_rank ? `#${personal.global_rank}` : 'Unranked'}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border border-border/80 bg-muted/35">
                    <CardContent className="pt-5">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Your Best Net WPM</p>
                      <p className="mt-1 text-2xl font-semibold">{animatedBestNetWpm.toFixed(2)}</p>
                    </CardContent>
                  </Card>
                  <Card className="border border-border/80 bg-muted/35">
                    <CardContent className="pt-5">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Your Accuracy</p>
                      <p className="mt-1 text-2xl font-semibold">
                        {personal ? `${personal.accuracy.toFixed(2)}%` : '--'}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border border-border/80 bg-muted/35">
                    <CardContent className="pt-5">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Your Percentile</p>
                      <p className="mt-1 text-2xl font-semibold">
                        {personal ? `${animatedPercentile.toFixed(2)}%` : '--'}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border border-border/80 bg-card/75 backdrop-blur-md shadow-card">
            <CardHeader className="pb-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Trophy className="h-5 w-5 text-primary" />
                    Competitive Rankings
                  </CardTitle>
                  <CardDescription>
                    Top 100 players only. Scores above 300 WPM, below 85% accuracy, or suspicious runs are hidden.
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={refreshLeaderboard} disabled={loadingRows}>
                  <RefreshCcw className={cn('mr-2 h-4 w-4', loadingRows && 'animate-spin')} />
                  Refresh
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <Tabs value={period} onValueChange={(value) => setPeriod(value as LeaderboardPeriod)}>
                <TabsList className="grid h-auto w-full grid-cols-2 gap-2 rounded-xl p-1 sm:grid-cols-4">
                  {LEADERBOARD_PERIODS.map((tab) => (
                    <TabsTrigger key={tab.value} value={tab.value} className="h-9 rounded-lg text-xs sm:text-sm">
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search by username"
                    className="pl-9"
                  />
                </div>
                <Select
                  value={modeFilter}
                  onValueChange={(value) => setModeFilter(value as LeaderboardMode)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter mode" />
                  </SelectTrigger>
                  <SelectContent>
                    {MODE_FILTER_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={`${period}:${loadingRows ? 'loading' : 'ready'}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  {loadingRows ? (
                    <div className="space-y-2 rounded-xl border border-border/80 bg-muted/25 p-4">
                      {[...Array(8)].map((_, idx) => (
                        <Skeleton key={idx} className="h-10 w-full rounded-lg bg-muted" />
                      ))}
                    </div>
                  ) : filteredRows.length === 0 ? (
                    <div className="rounded-xl border border-border/80 bg-muted/30 p-8 text-center text-sm text-muted-foreground">
                      No leaderboard entries match your search and filter.
                    </div>
                  ) : (
                    <div className="max-h-[580px] overflow-auto rounded-xl border border-border/80 bg-background/55 scrollbar-orbit">
                      <Table className="min-w-[760px]">
                        <TableHeader>
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="sticky top-0 z-20 bg-background/95 backdrop-blur">Rank #</TableHead>
                            <TableHead className="sticky top-0 z-20 bg-background/95 backdrop-blur">Username</TableHead>
                            <TableHead className="sticky top-0 z-20 bg-background/95 text-right backdrop-blur">Net WPM</TableHead>
                            <TableHead className="sticky top-0 z-20 bg-background/95 text-right backdrop-blur">Accuracy %</TableHead>
                            <TableHead className="sticky top-0 z-20 bg-background/95 text-right backdrop-blur">Errors</TableHead>
                            <TableHead className="sticky top-0 z-20 bg-background/95 backdrop-blur">Test Mode</TableHead>
                            <TableHead className="sticky top-0 z-20 bg-background/95 backdrop-blur">Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredRows.map((entry) => {
                            const isCurrentUser = entry.user_id === user.id;
                            const rankBadge =
                              entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : null;

                            return (
                              <TableRow
                                key={`${entry.user_id}:${entry.rank}:${entry.created_at}`}
                                className={cn(
                                  'group transition-all duration-200 hover:-translate-y-[1px] hover:bg-muted/45',
                                  isCurrentUser &&
                                    'border-primary/50 bg-primary/5 shadow-[0_0_0_1px_hsl(var(--primary)/0.32),0_14px_28px_-20px_hsl(var(--primary)/0.75)]'
                                )}
                              >
                                <TableCell className="font-semibold">
                                  {rankBadge ? (
                                    <Badge variant="outline" className="rounded-full px-2 py-0.5">
                                      {rankBadge}
                                    </Badge>
                                  ) : (
                                    `#${entry.rank}`
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <span className="truncate font-medium">{entry.username}</span>
                                    {isCurrentUser ? (
                                      <Badge variant="outline" className="border-primary/50 bg-primary/10 text-xs">
                                        You
                                      </Badge>
                                    ) : null}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right font-semibold">{entry.net_wpm.toFixed(2)}</TableCell>
                                <TableCell className="text-right">{entry.accuracy.toFixed(2)}%</TableCell>
                                <TableCell className="text-right">{entry.mistakes}</TableCell>
                                <TableCell>{formatModeLabel(entry.test_mode)}</TableCell>
                                <TableCell className="text-muted-foreground">{formatDate(entry.created_at)}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
