import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, ChevronRight, RotateCcw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { lessonApi } from '@/db/api';
import type { Lesson } from '@/types';

type CompletionLocationState = {
  result?: {
    wpm: number;
    cpm: number;
    accuracy: number;
    duration_seconds: number;
    total_keystrokes: number;
    incorrect_keystrokes: number;
    backspace_count: number;
    is_completed: boolean;
  };
  mode?: 'guest' | 'account';
  sync_status?: 'local' | 'cloud' | 'fallback';
};

export default function LessonCompletionPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const state = (location.state as CompletionLocationState | null) ?? null;

  const [loading, setLoading] = useState(true);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [nextLesson, setNextLesson] = useState<Lesson | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!lessonId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const lessons = await lessonApi.getAllLessons();
      const lessonIndex = lessons.findIndex((item) => item.id === lessonId);
      const currentLesson = lessonIndex >= 0 ? lessons[lessonIndex] : null;
      const followingLesson =
        lessonIndex >= 0 && lessonIndex < lessons.length - 1 ? lessons[lessonIndex + 1] : null;

      setLesson(currentLesson);
      setNextLesson(followingLesson);
      setLoading(false);
    };

    load();
  }, [lessonId]);

  const result = state?.result;
  const mode = state?.mode ?? (user ? 'account' : 'guest');
  const isGuest = mode === 'guest';
  const syncStatus = state?.sync_status ?? (isGuest ? 'local' : 'cloud');
  const durationMinutes = useMemo(
    () => (result ? Math.max(1, Math.round(result.duration_seconds / 60)) : 0),
    [result]
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64 bg-muted" />
        <Skeleton className="h-48 w-full bg-muted" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-success/30 bg-success/10 px-3 py-1 text-sm font-medium text-success">
          <CheckCircle2 className="h-4 w-4" />
          Lesson Completed
        </div>
        <h1 className="text-3xl font-bold gradient-text">{lesson?.title || 'Lesson Complete'}</h1>
        <p className="text-muted-foreground">
          Great work finishing this lesson. Continue to the next chapter when you are ready.
        </p>
      </div>

      {syncStatus === 'fallback' && (
        <Alert variant="destructive">
          <AlertDescription>
            Cloud sync failed for this lesson. A local backup was saved on this device.
          </AlertDescription>
        </Alert>
      )}

      {syncStatus === 'local' && (
        <Alert>
          <AlertDescription>
            Progress saved locally. Sign in anytime to sync across devices.
          </AlertDescription>
        </Alert>
      )}

      {result ? (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">WPM</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{result.wpm}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Accuracy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">{result.accuracy.toFixed(1)}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{durationMinutes}m</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Mistakes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">{result.incorrect_keystrokes}</div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Session Summary</CardTitle>
            <CardDescription>
              Refreshing this page can clear local completion details. You can still continue.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Next Step</CardTitle>
          <CardDescription>
            {nextLesson
              ? `Continue to ${nextLesson.title}.`
              : 'You have finished the final chapter in the current lesson path.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {nextLesson ? (
            <Button onClick={() => navigate(`/lesson/${nextLesson.id}`)}>
              Next Chapter
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button asChild>
              <Link to="/lessons">Back to Lessons</Link>
            </Button>
          )}

          {lessonId ? (
            <Button asChild variant="outline">
              <Link to={`/lesson/${lessonId}`}>
                <RotateCcw className="mr-1 h-4 w-4" />
                Retry Lesson
              </Link>
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
