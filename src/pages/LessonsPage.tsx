import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import LessonCard from '@/components/LessonCard';
import { lessonApi } from '@/db/api';
import type { LessonWithProgress, LessonCategory } from '@/types';
import { attachLocalProgressToLessons } from '@/lib/guestProgress';

const categories: { value: LessonCategory; label: string }[] = [
  { value: 'home_row', label: 'Home Row' },
  { value: 'top_row', label: 'Top Row' },
  { value: 'bottom_row', label: 'Bottom Row' },
  { value: 'numbers', label: 'Numbers' },
  { value: 'special_chars', label: 'Special Chars' },
  { value: 'punctuation', label: 'Punctuation' },
  { value: 'combination', label: 'Combination' },
];

export default function LessonsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [lessons, setLessons] = useState<LessonWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadLessons();
  }, [user]);

  const loadLessons = async () => {
    setLoading(true);

    if (user) {
      const data = await lessonApi.getLessonsWithProgress(user.id);
      setLessons(data);
      setLoading(false);
      return;
    }

    const lessonRows = await lessonApi.getAllLessons();
    setLessons(attachLocalProgressToLessons(lessonRows));
    setLoading(false);
  };

  const filteredLessons =
    selectedCategory === 'all'
      ? lessons
      : lessons.filter((lesson) => lesson.category === selectedCategory);

  const handleLessonClick = (lessonId: string) => {
    navigate(`/lesson/${lessonId}`);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2 gradient-text">Typing Lessons</h1>
        <p className="text-muted-foreground">
          Master typing with our structured lesson plan. Start from the basics and progress to advanced skills.
        </p>
      </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="all">All Lessons</TabsTrigger>
          {categories.map((category) => (
            <TabsTrigger key={category.value} value={category.value}>
              {category.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-6">
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-48 bg-muted" />
              ))}
            </div>
          ) : filteredLessons.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredLessons.map((lesson) => (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  onClick={() => handleLessonClick(lesson.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No lessons found in this category.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
