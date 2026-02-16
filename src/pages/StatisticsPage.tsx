import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Target, Keyboard, Clock } from 'lucide-react';
import StatsChart from '@/components/StatsChart';
import { lessonApi, statisticsApi, typingSessionApi } from '@/db/api';
import type { DailyStats, LessonWithProgress, OverallStats, TypingSession } from '@/types';
import {
  attachLocalProgressToLessons,
  getLocalDailyStats,
  getLocalOverallStats,
  getLocalRecentSessions,
} from '@/lib/guestProgress';

export default function StatisticsPage() {
  const { user } = useAuth();
  const [overallStats, setOverallStats] = useState<OverallStats | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [recentSessions, setRecentSessions] = useState<TypingSession[]>([]);
  const [lessonPerformance, setLessonPerformance] = useState<LessonWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7' | '30' | '90'>('30');

  useEffect(() => {
    loadStatistics();
  }, [user, timeRange]);

  const loadStatistics = async () => {
    setLoading(true);

    const days = parseInt(timeRange);
    if (user) {
      const [overall, daily, sessions, lessons] = await Promise.all([
        statisticsApi.getOverallStats(user.id),
        statisticsApi.getDailyStats(user.id, days),
        typingSessionApi.getRecentSessions(user.id, days),
        lessonApi.getLessonsWithProgress(user.id),
      ]);

      setOverallStats(overall);
      setDailyStats(daily);
      setRecentSessions(sessions);
      setLessonPerformance(lessons);
      setLoading(false);
      return;
    }

    const lessons = await lessonApi.getAllLessons();
    setOverallStats(getLocalOverallStats(lessons.length || 20));
    setDailyStats(getLocalDailyStats(days));
    setRecentSessions(getLocalRecentSessions(days));
    setLessonPerformance(attachLocalProgressToLessons(lessons));
    setLoading(false);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Statistics & Analytics</h1>
        <p className="text-muted-foreground">Track your typing performance and progress over time</p>
      </div>

      {/* Overall Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average WPM</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20 bg-muted" />
            ) : (
              <>
                <div className="text-2xl font-bold">{overallStats?.average_wpm || 0}</div>
                <p className="text-xs text-muted-foreground">Best: {overallStats?.best_wpm || 0} WPM</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Accuracy</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20 bg-muted" />
            ) : (
              <>
                <div className="text-2xl font-bold">{overallStats?.average_accuracy || 0}%</div>
                <p className="text-xs text-muted-foreground">
                  Best: {overallStats?.best_accuracy?.toFixed(1) || 0}%
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Keyboard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20 bg-muted" />
            ) : (
              <>
                <div className="text-2xl font-bold">{overallStats?.total_sessions || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {overallStats?.total_keystrokes.toLocaleString() || 0} keystrokes
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Practice Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20 bg-muted" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {Math.round((overallStats?.total_duration_seconds || 0) / 60)}m
                </div>
                <p className="text-xs text-muted-foreground">Total time</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Lesson Best Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Lesson Best Performance</CardTitle>
          <CardDescription>Your best WPM and accuracy per lesson</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full bg-muted" />
              ))}
            </div>
          ) : (
            <>
              {lessonPerformance.filter((lesson) => (lesson.progress?.attempts || 0) > 0).length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  No lesson performance yet. Start practicing to see your best results!
                </div>
              ) : (
                <div className="space-y-3">
                  {lessonPerformance
                    .filter((lesson) => (lesson.progress?.attempts || 0) > 0)
                    .map((lesson) => (
                      <div
                        key={lesson.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/50 p-3"
                      >
                        <div>
                          <div className="text-sm font-medium">{lesson.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {lesson.progress?.attempts || 0} attempt{(lesson.progress?.attempts || 0) !== 1 ? 's' : ''}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="font-medium">{lesson.progress?.best_wpm || 0} WPM</span>
                          <span className="text-muted-foreground">
                            {(lesson.progress?.best_accuracy || 0).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Time Range Selector */}
      <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as any)}>
        <TabsList>
          <TabsTrigger value="7">Last 7 Days</TabsTrigger>
          <TabsTrigger value="30">Last 30 Days</TabsTrigger>
          <TabsTrigger value="90">Last 90 Days</TabsTrigger>
        </TabsList>

        <TabsContent value={timeRange} className="space-y-6 mt-6">
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2">
              <Skeleton className="h-96 bg-muted" />
              <Skeleton className="h-96 bg-muted" />
            </div>
          ) : (
            <>
              {/* Charts */}
              <div className="grid gap-6 md:grid-cols-2">
                <StatsChart
                  data={dailyStats}
                  title="Typing Speed Progress"
                  description="Words per minute over time"
                  dataKey="wpm"
                />
                <StatsChart
                  data={dailyStats}
                  title="Accuracy Progress"
                  description="Accuracy percentage over time"
                  dataKey="accuracy"
                />
              </div>

              {/* Recent Sessions */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Practice Sessions</CardTitle>
                  <CardDescription>Your latest typing sessions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentSessions.length > 0 ? (
                      recentSessions.slice(0, 10).map((session) => (
                        <div
                          key={session.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <div className="text-sm font-medium">{session.wpm} WPM</div>
                              <div className="text-sm text-muted-foreground">
                                {session.accuracy.toFixed(1)}% accuracy
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {session.duration_seconds}s
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {new Date(session.created_at).toLocaleString()}
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {session.total_keystrokes} keystrokes
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No practice sessions yet. Start practicing to see your progress!
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
