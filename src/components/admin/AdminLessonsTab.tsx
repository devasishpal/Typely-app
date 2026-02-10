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
import type { Lesson } from '@/types';

export default function AdminLessonsTab() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadLessons();
  }, []);

  const loadLessons = async () => {
    setLoading(true);
    const data = await adminApi.getAllLessons();
    setLessons(data);
    setLoading(false);
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('Are you sure you want to delete this lesson?')) return;

    try {
      await adminApi.deleteLesson(lessonId);
      toast({
        title: 'Lesson Deleted',
        description: 'Lesson has been deleted successfully.',
      });
      loadLessons();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete lesson.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading lessons...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Lesson Management</h3>
        <Badge variant="outline">{lessons.length} Total Lessons</Badge>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Difficulty</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Target Keys</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lessons.map((lesson) => (
              <TableRow key={lesson.id}>
                <TableCell className="font-medium">{lesson.title}</TableCell>
                <TableCell>
                  <Badge variant="outline">{lesson.category}</Badge>
                </TableCell>
                <TableCell>
                    <Badge
                      variant={
                        lesson.difficulty === 'beginner' ? 'default' :
                        lesson.difficulty === 'intermediate' ? 'secondary' :
                        'destructive'
                      }
                    >
                      {lesson.difficulty === 'beginner'
                        ? 'Beginner'
                        : lesson.difficulty === 'intermediate'
                          ? 'Intermediate'
                          : 'Advanced'}
                    </Badge>
                </TableCell>
                <TableCell>{lesson.order_index}</TableCell>
                <TableCell>
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    {lesson.target_keys.join(', ')}
                  </code>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDeleteLesson(lesson.id)}
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
