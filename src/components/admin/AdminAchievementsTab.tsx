import { useEffect, useState } from 'react';
import { adminApi } from '@/db/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Trash2, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Achievement } from '@/types';

export default function AdminAchievementsTab() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    setLoading(true);
    const data = await adminApi.getAllAchievements();
    setAchievements(data);
    setLoading(false);
  };

  const handleDeleteAchievement = async (achievementId: string) => {
    if (!confirm('Are you sure you want to delete this achievement?')) return;

    try {
      await adminApi.deleteAchievement(achievementId);
      toast({
        title: 'Achievement Deleted',
        description: 'Achievement has been deleted successfully.',
      });
      loadAchievements();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete achievement.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading achievements...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Achievement Management</h3>
        <Badge variant="outline">{achievements.length} Total Achievements</Badge>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Icon</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Requirement</TableHead>
              <TableHead>Value</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {achievements.map((achievement) => (
              <TableRow key={achievement.id}>
                <TableCell>
                  <div className="text-2xl">{achievement.icon}</div>
                </TableCell>
                <TableCell className="font-medium">{achievement.title}</TableCell>
                <TableCell className="max-w-xs truncate">{achievement.description}</TableCell>
                <TableCell>
                  <Badge variant="outline">{achievement.requirement_type}</Badge>
                </TableCell>
                <TableCell>{achievement.requirement_value}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDeleteAchievement(achievement.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
