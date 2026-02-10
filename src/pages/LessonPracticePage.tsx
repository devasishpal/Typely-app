import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, RotateCcw, CheckCircle2 } from 'lucide-react';
import Keyboard from '@/components/Keyboard';
import { lessonApi, lessonProgressApi, typingSessionApi, statisticsApi } from '@/db/api';
import { useToast } from '@/hooks/use-toast';
import type { Lesson, TypingSessionData } from '@/types';
import { cn } from '@/lib/utils';

export default function LessonPracticePage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);

  // Typing state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [errors, setErrors] = useState<number[]>([]);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [activeKey, setActiveKey] = useState<string | null>(null);

  // Stats
  const [correctKeystrokes, setCorrectKeystrokes] = useState(0);
  const [incorrectKeystrokes, setIncorrectKeystrokes] = useState(0);
  const [backspaceCount, setBackspaceCount] = useState(0);
  const [errorKeys, setErrorKeys] = useState<Record<string, number>>({});
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const currentCharRef = useRef<HTMLSpanElement>(null);
  const contentContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (lessonId) {
      loadLesson();
    }
  }, [lessonId]);

  useEffect(() => {
    if (started && !finished && inputRef.current) {
      inputRef.current.focus();
    }
  }, [started, finished]);

  useEffect(() => {
    if (!started || finished) return;
    const container = contentContainerRef.current;
    const currentChar = currentCharRef.current;
    if (!container || !currentChar) return;

    requestAnimationFrame(() => {
      const containerRect = container.getBoundingClientRect();
      const charRect = currentChar.getBoundingClientRect();

      if (charRect.top < containerRect.top || charRect.bottom > containerRect.bottom) {
        currentChar.scrollIntoView({ block: 'center', inline: 'nearest' });
      }
    });
  }, [currentIndex, started, finished]);

  useEffect(() => {
    if (!started || finished || !startTime) return;
    setElapsedSeconds(0);
    const timer = setInterval(() => {
      setElapsedSeconds(Math.round((Date.now() - startTime) / 1000));
    }, 500);
    return () => clearInterval(timer);
  }, [started, finished, startTime]);

  const loadLesson = async () => {
    if (!lessonId) return;

    setLoading(true);
    const data = await lessonApi.getLesson(lessonId);
    setLesson(data);
    setLoading(false);
  };

  const handleStart = () => {
    setStarted(true);
    setStartTime(Date.now());
    setCurrentIndex(0);
    setTypedText('');
    setErrors([]);
    setCorrectKeystrokes(0);
    setIncorrectKeystrokes(0);
    setBackspaceCount(0);
    setErrorKeys({});
    setFinished(false);
    setEndTime(null);
  };

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!lesson || !started || finished) return;

      const targetText = lesson.content;
      const key = e.key;
      setActiveKey(key);

      if (key === 'Tab') {
        e.preventDefault();
        return;
      }

      if (key === 'Backspace') {
        e.preventDefault();
        setBackspaceCount((prev) => prev + 1);
        if (errors.includes(currentIndex)) {
          setErrors((prev) => prev.filter((idx) => idx !== currentIndex));
          return;
        }
        if (currentIndex > 0) {
          setCurrentIndex((prev) => prev - 1);
          setTypedText((prev) => prev.slice(0, -1));
          setErrors((prev) => prev.filter((idx) => idx !== currentIndex - 1));
        }
        return;
      }

      const inputChar = key === 'Enter' ? '\n' : key;
      if (inputChar.length !== 1) return; // Ignore special keys
      e.preventDefault();

      const expectedChar = targetText[currentIndex];
      const isCorrect = inputChar === expectedChar;

      if (isCorrect) {
        setCorrectKeystrokes((prev) => prev + 1);
        setErrors((prev) => prev.filter((idx) => idx !== currentIndex));
        setTypedText((prev) => prev + inputChar);
        setCurrentIndex((prev) => prev + 1);
      } else {
        setIncorrectKeystrokes((prev) => prev + 1);
        setErrors((prev) => (prev.includes(currentIndex) ? prev : [...prev, currentIndex]));
        setErrorKeys((prev) => ({
          ...prev,
          [expectedChar]: (prev[expectedChar] || 0) + 1,
        }));
        return;
      }

      // Check if finished
      if (currentIndex + 1 >= targetText.length) {
        handleFinish();
      }
    },
    [lesson, started, finished, currentIndex, errors]
  );

  const handleKeyUp = () => {
    setActiveKey(null);
  };

  const handleBlur = () => {
    if (started && !finished) {
      // Re-focus so typing continues even after clicking outside
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const handleFinish = async () => {
    if (!lesson || !user || !startTime) return;

    const end = Date.now();
    setEndTime(end);
    setFinished(true);

    const durationSeconds = Math.round((end - startTime) / 1000);
    setElapsedSeconds(durationSeconds);
    const totalKeystrokes = correctKeystrokes + incorrectKeystrokes;
    const accuracy = totalKeystrokes > 0 ? (correctKeystrokes / totalKeystrokes) * 100 : 0;
    const cpm = Math.round((correctKeystrokes / durationSeconds) * 60);
    const wpm = Math.round(cpm / 5);

    const sessionData: TypingSessionData = {
      lesson_id: lesson.id,
      wpm,
      cpm,
      accuracy: Math.round(accuracy * 100) / 100,
      total_keystrokes: totalKeystrokes,
      correct_keystrokes: correctKeystrokes,
      incorrect_keystrokes: incorrectKeystrokes,
      backspace_count: backspaceCount,
      error_keys: errorKeys,
      duration_seconds: durationSeconds,
    };

    // Save session
    await typingSessionApi.createSession(user.id, sessionData);

    // Update lesson progress
    const progress = await lessonProgressApi.getProgress(user.id, lesson.id);
    const isNewBest = !progress || !progress.best_wpm || wpm > progress.best_wpm;
    const isCompleted = accuracy >= 90 && wpm >= 20; // Completion criteria

    await lessonProgressApi.upsertProgress({
      user_id: user.id,
      lesson_id: lesson.id,
      completed: isCompleted || (progress?.completed || false),
      best_wpm: isNewBest ? wpm : progress?.best_wpm || wpm,
      best_accuracy: isNewBest ? accuracy : progress?.best_accuracy || accuracy,
      attempts: (progress?.attempts || 0) + 1,
      last_practiced_at: new Date().toISOString(),
    });

    // Update daily statistics
    const today = new Date().toISOString().split('T')[0];
    await statisticsApi.upsertDailyStats(user.id, today, {
      total_sessions: 1,
      total_keystrokes: totalKeystrokes,
      total_duration_seconds: durationSeconds,
      average_wpm: wpm,
      average_accuracy: accuracy,
      lessons_completed: isCompleted ? 1 : 0,
    });

    toast({
      title: 'Lesson Complete!',
      description: `You typed at ${wpm} WPM with ${accuracy.toFixed(1)}% accuracy.`,
    });

    // Auto-navigate to next lesson if completed
    if (isCompleted) {
      const allLessons = await lessonApi.getAllLessons();
      const currentIndex = allLessons.findIndex(l => l.id === lesson.id);
      if (currentIndex !== -1 && currentIndex < allLessons.length - 1) {
        const nextLesson = allLessons[currentIndex + 1];
        setTimeout(() => {
          toast({
            title: 'Great job! 🎉',
            description: 'Moving to the next lesson...',
          });
          navigate(`/lesson/${nextLesson.id}`);
        }, 3000);
      }
    }
  };

  const currentWordRange = useMemo(() => {
    if (!lesson) return { start: 0, end: 0 };
    const text = lesson.content;
    if (!text.length) return { start: 0, end: 0 };

    const isWhitespace = (char: string) => /\s/.test(char);
    let start = currentIndex;
    let end = currentIndex;

    if (isWhitespace(text[currentIndex] || '')) {
      let i = currentIndex + 1;
      while (i < text.length && isWhitespace(text[i])) i += 1;
      start = i;
      end = i;
    } else {
      while (start > 0 && !isWhitespace(text[start - 1])) start -= 1;
      end = currentIndex;
    }

    while (end < text.length && !isWhitespace(text[end])) end += 1;
    return { start, end };
  }, [lesson, currentIndex]);

  const getCharClassName = (index: number) => {
    const inCurrentWord = index >= currentWordRange.start && index < currentWordRange.end;
    if (index === currentIndex) {
      return errors.includes(index)
        ? 'text-destructive bg-destructive/20 border-b-2 border-destructive'
        : 'bg-primary/20 border-b-2 border-primary';
    }
    if (index < currentIndex) {
      return errors.includes(index) ? 'text-destructive bg-destructive/20' : 'text-success';
    }
    return inCurrentWord ? 'bg-accent/40 text-foreground' : 'text-muted-foreground';
  };

  const progress = lesson ? (currentIndex / lesson.content.length) * 100 : 0;
  const currentChar = lesson && currentIndex < lesson.content.length ? lesson.content[currentIndex] : '';

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64 bg-muted" />
        <Skeleton className="h-96 w-full bg-muted" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Lesson not found</AlertDescription>
      </Alert>
    );
  }

  const liveDurationSeconds = elapsedSeconds;
  const totalKeystrokes = correctKeystrokes + incorrectKeystrokes;
  const accuracy = totalKeystrokes > 0 ? (correctKeystrokes / totalKeystrokes) * 100 : 0;
  const cpm = liveDurationSeconds > 0 ? Math.round((correctKeystrokes / liveDurationSeconds) * 60) : 0;
  const wpm = Math.round(cpm / 5);

  const formattedTimer = new Date(liveDurationSeconds * 1000).toISOString().slice(14, 19);

  const typedDisplayValue = typedText.replace(/\n/g, '\u23CE');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/lessons')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{lesson.title}</h1>
            <p className="text-muted-foreground">{lesson.description}</p>
          </div>
        </div>
        <Badge>
          {lesson.difficulty === 'beginner'
            ? 'Beginner'
            : lesson.difficulty === 'intermediate'
              ? 'Intermediate'
              : 'Advanced'}
        </Badge>
      </div>

      {/* Main Practice Area */}
      <Card className="flex flex-1 flex-col overflow-hidden">
        {!started && (
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Practice Area</CardTitle>
            </div>
          </CardHeader>
        )}

        {started && !finished && (
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex gap-4 text-sm">
                <span>WPM: {wpm}</span>
                <span>Accuracy: {accuracy.toFixed(1)}%</span>
              </div>
            </div>
            <Progress value={progress} className="mt-2" />
          </CardHeader>
        )}

        <CardContent className="space-y-6">
          {!started ? (
            <div className="text-center py-12 space-y-4">
              <p className="text-lg text-muted-foreground">
                Ready to practice? Click the button below to start.
              </p>
              <Button onClick={handleStart} size="lg">
                Start Lesson
              </Button>
            </div>
          ) : finished ? (
            <div className="text-center py-12 space-y-6">
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-success" />
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-2">Lesson Complete!</h2>
                <p className="text-muted-foreground">Great job! Here are your results:</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-3xl font-bold text-primary">{wpm}</div>
                    <div className="text-sm text-muted-foreground">WPM</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-3xl font-bold text-success">{accuracy.toFixed(1)}%</div>
                    <div className="text-sm text-muted-foreground">Accuracy</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-3xl font-bold">{elapsedSeconds}s</div>
                    <div className="text-sm text-muted-foreground">Time</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-3xl font-bold text-destructive">{incorrectKeystrokes}</div>
                    <div className="text-sm text-muted-foreground">Errors</div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex gap-4 justify-center">
                <Button onClick={handleStart}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Start Practice
                </Button>
                <Button variant="outline" onClick={() => navigate('/lessons')}>
                  Back to Lessons
                </Button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => inputRef.current?.focus()}
              className="space-y-6"
            >
              <div
                ref={contentContainerRef}
                className="bg-muted/50 p-6 rounded-lg border border-border max-w-full overflow-hidden"
                style={{
                  maxHeight: '10rem',
                  overflowY: 'auto',
                  scrollBehavior: 'smooth',
                }}
              >
                <div className="text-2xl font-mono leading-relaxed tracking-wide break-words whitespace-pre-wrap">
                  {lesson.content.split('').map((char, index) => {
                    const isNewLine = char === '\n';
                    return (
                      <span
                        key={index}
                        ref={index === currentIndex ? currentCharRef : null}
                        className={cn('transition-colors', getCharClassName(index), isNewLine && 'typing-enter')}
                      >
                        {isNewLine ? '\u23CE' : char === ' ' ? '\u00A0' : char}
                        {isNewLine ? <br /> : null}
                      </span>
                    );
                  })}
                </div>
              </div>

              <input
                ref={inputRef}
                type="text"
                className="sr-only"
                value={typedDisplayValue}
                onChange={() => {}}
                onKeyDown={handleKeyPress}
                onKeyUp={handleKeyUp}
                onBlur={handleBlur}
                onPaste={(e) => e.preventDefault()}
                onCopy={(e) => e.preventDefault()}
                onCut={(e) => e.preventDefault()}
                autoFocus
                spellCheck={false}
                autoComplete="off"
              />

              <Keyboard
                activeKey={activeKey ?? undefined}
                nextKey={currentChar}
                showFingerGuide={true}
              />

              <div className="flex flex-wrap gap-4 text-sm justify-center">
                <span>WPM: {wpm}</span>
                <span>Accuracy: {accuracy.toFixed(1)}%</span>
                <span>Errors: {incorrectKeystrokes}</span>
                <span>Timer: {formattedTimer}</span>
              </div>

              <div className="text-center text-sm text-muted-foreground">
                Click anywhere to focus and start typing
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
