import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import AchievementBadge from '@/components/AchievementBadge';
import Certificate from '@/components/Certificate';
import { achievementApi } from '@/db/api';
import type { AchievementWithStatus } from '@/types';

export default function AchievementsPage() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<AchievementWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'earned' | 'locked'>('all');
  const [selectedAchievement, setSelectedAchievement] = useState<AchievementWithStatus | null>(null);
  const [certificateOpen, setCertificateOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadAchievements();
    }
  }, [user]);

  const loadAchievements = async () => {
    if (!user) return;

    setLoading(true);
    const data = await achievementApi.getUserAchievements(user.id);
    setAchievements(data);
    setLoading(false);
  };

  const handleAchievementClick = (achievement: AchievementWithStatus) => {
    if (achievement.earned) {
      setSelectedAchievement(achievement);
      setCertificateOpen(true);
    }
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
                <div
                  key={achievement.id}
                  onClick={() => handleAchievementClick(achievement)}
                  className={achievement.earned ? 'cursor-pointer' : ''}
                >
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

      {/* Certificate Dialog */}
      <Dialog open={certificateOpen} onOpenChange={setCertificateOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-orbit">
          <DialogHeader>
            <DialogTitle>Achievement Certificate</DialogTitle>
            <DialogDescription>
              Congratulations on earning this achievement! Download your certificate below.
            </DialogDescription>
          </DialogHeader>
          {selectedAchievement && (
            <Certificate
              achievementTitle={selectedAchievement.title}
              achievementDescription={selectedAchievement.description}
              earnedDate={selectedAchievement.earned_at || new Date().toISOString()}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
