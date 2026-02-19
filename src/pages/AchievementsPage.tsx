import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AchievementBadge from '@/components/AchievementBadge';
import { achievementApi } from '@/db/api';
import type { AchievementWithStatus } from '@/types';
import { getLocalAchievementStatuses } from '@/lib/guestProgress';

export default function AchievementsPage() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<AchievementWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'earned' | 'locked'>('all');

  useEffect(() => {
    loadAchievements();
  }, [user]);

  const loadAchievements = async () => {
    setLoading(true);
    const data = user
      ? await achievementApi.getUserAchievements(user.id)
      : getLocalAchievementStatuses();
    setAchievements(data);
    setLoading(false);
  };

  const filteredAchievements = achievements.filter((achievement) => {
    if (filter === 'earned') return achievement.earned;
    if (filter === 'locked') return !achievement.earned;
    return true;
  });

  const earnedCount = achievements.filter((a) => a.earned).length;
  const totalCount = achievements.length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Achievements</h1>
        <p className="text-muted-foreground">
          Unlock achievements by completing lessons and reaching milestones
        </p>
        <p className="text-lg font-semibold mt-4">
          {earnedCount} / {totalCount} Achievements Earned
        </p>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
        <TabsList className="flex flex-wrap gap-2">
          <TabsTrigger value="all">All Achievements</TabsTrigger>
          <TabsTrigger value="earned">Earned ({earnedCount})</TabsTrigger>
          <TabsTrigger value="locked">Locked ({totalCount - earnedCount})</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-6">
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-64 bg-muted" />
              ))}
            </div>
          ) : filteredAchievements.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredAchievements.map((achievement) => (
                <div key={achievement.id}>
                  <AchievementBadge achievement={achievement} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No achievements found in this category.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

    </div>
  );
}
