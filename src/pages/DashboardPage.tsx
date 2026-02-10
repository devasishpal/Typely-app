import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Target, TrendingUp, Clock, Keyboard, ArrowRight } from 'lucide-react';
import { lessonProgressApi, statisticsApi, achievementApi } from '@/db/api';
import type { OverallStats, AchievementWithStatus } from '@/types';

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<OverallStats | null>(null);
  const [recentAchievements, setRecentAchievements] = useState<AchievementWithStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    setLoading(true);

    const [overallStats, achievements] = await Promise.all([
      statisticsApi.getOverallStats(user.id),
      achievementApi.getUserAchievements(user.id),
    ]);

    setStats(overallStats);
    setRecentAchievements(achievements.filter(a => a.earned).slice(0, 3));
    setLoading(false);
  };

  const progressPercentage = stats
    ? Math.round((stats.lessons_completed / stats.total_lessons) * 100)
    : 0;

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold mb-2 gradient-text">
          Welcome back, {profile?.username || 'Typist'}!
        </h1>
        <p className="text-muted-foreground">
          Continue your typing journey and track your progress
        </p>
      </div>

      {/* Stats Overview */}
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
                <div className="text-2xl font-bold">{stats?.average_wpm || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Best: {stats?.best_wpm || 0} WPM
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accuracy</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20 bg-muted" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.average_accuracy || 0}%</div>
                <p className="text-xs text-muted-foreground">
                  Best: {stats?.best_accuracy?.toFixed(1) || 0}%
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Practice Sessions</CardTitle>
            <Keyboard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20 bg-muted" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.total_sessions || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.total_keystrokes.toLocaleString() || 0} keystrokes
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Practiced</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20 bg-muted" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {Math.round((stats?.total_duration_seconds || 0) / 60)}m
                </div>
                <p className="text-xs text-muted-foreground">Total practice time</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Progress Section */}
      <Card>
        <CardHeader>
          <CardTitle>Learning Progress</CardTitle>
          <CardDescription>
            You've completed {stats?.lessons_completed || 0} out of {stats?.total_lessons || 20} lessons
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <Skeleton className="h-4 w-full bg-muted" />
          ) : (
            <>
              <Progress value={progressPercentage} className="h-3" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{progressPercentage}% Complete</span>
                <span>{stats?.total_lessons! - stats?.lessons_completed!} lessons remaining</span>
              </div>
            </>
          )}

          <div className="pt-4">
            <Button asChild>
              <Link to="/lessons" className="inline-flex items-center">
                Continue Learning
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Achievements */}
      {recentAchievements.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Achievements</CardTitle>
                <CardDescription>Your latest accomplishments</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link to="/achievements">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {recentAchievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border"
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                    style={{ backgroundColor: `${achievement.badge_color}20` }}
                  >
                    {achievement.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm truncate">{achievement.title}</h4>
                    <p className="text-xs text-muted-foreground">
                      {new Date(achievement.earned_at!).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-hover transition-shadow">
          <Link to="/lessons">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Keyboard className="h-5 w-5" />
                Practice Lessons
              </CardTitle>
              <CardDescription>Continue with structured lessons</CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="cursor-pointer hover:shadow-hover transition-shadow">
          <Link to="/typing-test">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Take a Test
              </CardTitle>
              <CardDescription>Test your typing speed and accuracy</CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="cursor-pointer hover:shadow-hover transition-shadow">
          <Link to="/statistics">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                View Statistics
              </CardTitle>
              <CardDescription>Analyze your performance data</CardDescription>
            </CardHeader>
          </Link>
        </Card>
      </div>
    </div>
  );
}
