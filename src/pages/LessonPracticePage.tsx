import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
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
  };

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!lesson || finished) return;

      if (!started) {
        setStarted(true);
        setStartTime(Date.now());
      }

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

  const difficultyValue = lesson?.difficulty ?? 'beginner';
  const difficultyLabel =
    difficultyValue === 'beginner'
      ? 'Beginner'
      : difficultyValue === 'intermediate'
        ? 'Intermediate'
        : 'Advanced';

  const liveDurationSeconds = elapsedSeconds;
  const totalKeystrokes = correctKeystrokes + incorrectKeystrokes;
  const accuracy = totalKeystrokes > 0 ? (correctKeystrokes / totalKeystrokes) * 100 : 0;
  const cpm = liveDurationSeconds > 0 ? Math.round((correctKeystrokes / liveDurationSeconds) * 60) : 0;
  const wpm = Math.round(cpm / 5);

  const formattedTimer = new Date(liveDurationSeconds * 1000).toISOString().slice(14, 19);

  const typedDisplayValue = typedText.replace(/\n/g, '\u23CE');

  return (
    <div className="mx-auto h-[calc(100vh-7rem)] w-full max-w-[1400px] overflow-hidden py-1">
      <div className="grid h-full grid-cols-1 gap-3 xl:grid-cols-[220px_minmax(0,1fr)_220px] xl:grid-rows-[160px_minmax(0,1fr)]">
        <Card className="rounded-2xl border border-border bg-gradient-card shadow-card xl:row-start-1">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="line-clamp-2 text-[20px] font-bold leading-[1.15] text-primary sm:text-[22px]">
                {lesson.title}
              </p>
              {lesson.description ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background/80 text-muted-foreground transition hover:border-primary/60 hover:bg-primary/10 hover:text-foreground"
                      aria-label="Lesson description"
                    >
                      <Info className="h-3 w-3" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs text-sm">
                    {lesson.description}
                  </TooltipContent>
                </Tooltip>
              ) : null}
            </div>
            <p className="mt-2 line-clamp-3 text-[10px] leading-4 text-muted-foreground">
              {lesson.description || 'No description available for this lesson.'}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border bg-gradient-card shadow-card xl:row-start-1">
          <CardContent className="p-3">
            <div
              onClick={() => {
                if (!started) handleStart();
                inputRef.current?.focus();
              }}
              className="space-y-2"
            >
              <div
                ref={contentContainerRef}
                className="h-[96px] overflow-y-auto rounded-xl border border-border bg-muted/50 px-3 py-2"
              >
                <div className="font-mono text-[20px] leading-10 whitespace-pre-wrap break-words text-foreground/80">
                  {lesson.content.split('').map((char, index) => {
                    const isNewLine = char === '\n';
                    return (
                      <span
                        key={index}
                        ref={index === currentIndex ? currentCharRef : null}
                        className={cn('rounded-sm px-[1px] transition-colors', getCharClassName(index), isNewLine && 'typing-enter')}
                      >
                        {isNewLine ? '\u23CE' : char === ' ' ? '\u00A0' : char}
                        {isNewLine ? <br /> : null}
                      </span>
                      );
                    })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border bg-gradient-card shadow-card xl:row-start-1">
          <CardContent className="p-4 text-center">
            <p className="text-[20px] leading-none tracking-tight text-primary md:text-[24px]">
              {difficultyLabel}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border bg-gradient-card shadow-card xl:row-start-2">
          <CardContent className="space-y-3 p-4">
            <div className="mb-1 text-[11px] font-semibold tracking-[0.18em] text-muted-foreground">LIVE STATS</div>
            <div className="rounded-lg border border-border bg-muted/40 p-2">
              <div className="flex items-center justify-between">
                <p className="text-[14px] leading-none text-muted-foreground">WPM</p>
                <p className="text-lg leading-none text-foreground">{wpm}</p>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-muted/40 p-2">
              <div className="flex items-center justify-between">
                <p className="text-[14px] leading-none text-muted-foreground">ACCURACY</p>
                <p className="text-lg leading-none text-foreground">{accuracy.toFixed(1)}%</p>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-muted/40 p-2">
              <div className="flex items-center justify-between">
                <p className="text-[14px] leading-none text-muted-foreground">ERROR</p>
                <p className="text-lg leading-none text-foreground">{incorrectKeystrokes}</p>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-muted/40 p-2">
              <div className="flex items-center justify-between">
                <p className="text-[14px] leading-none text-muted-foreground">TIME</p>
                <p className="text-lg leading-none text-foreground">{formattedTimer}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border bg-gradient-card shadow-card xl:col-start-2 xl:row-start-2">
          <CardContent className="h-full overflow-hidden p-2">
            <div className="flex h-full w-full items-center justify-center">
              <div className="origin-center scale-[0.92] lg:scale-[0.96] xl:scale-[0.9]">
              <Keyboard activeKey={activeKey ?? undefined} nextKey={currentChar} showFingerGuide={true} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hidden rounded-2xl border border-dashed border-border bg-muted/30 shadow-card xl:block xl:col-start-3 xl:row-start-2">
          <CardContent className="flex h-full aspect-square items-center justify-center p-4">
            <div className="text-center">
              <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground">AD SLOT</p>
              <p className="mt-1 text-[11px] text-muted-foreground">Square ad space</p>
            </div>
          </CardContent>
        </Card>
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
    </div>
  );
}
