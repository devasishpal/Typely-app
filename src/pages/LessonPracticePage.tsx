import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';
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
  const [showKeyboardMobile, setShowKeyboardMobile] = useState(false);

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
    <div className="mx-auto w-full max-w-[1320px] px-3 py-3 md:px-4">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_290px]">
        <div className="space-y-3">
          <Card className="rounded-xl border shadow-sm">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h1 className="truncate text-lg font-semibold leading-tight text-foreground">{lesson.title}</h1>
                  <p className="mt-1 text-xs text-muted-foreground">Lesson Practice</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="h-7 px-2.5 text-xs font-medium">
                    {difficultyLabel}
                  </Badge>
                  {lesson.description ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          aria-label="Lesson description"
                        >
                          <Info className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs text-sm">
                        {lesson.description}
                      </TooltipContent>
                    </Tooltip>
                  ) : null}
                </div>
              </div>

              <div
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (!started) handleStart();
                    inputRef.current?.focus();
                  }
                }}
                onClick={() => {
                  if (!started) handleStart();
                  inputRef.current?.focus();
                }}
                className="space-y-2 rounded-xl border border-border bg-muted/35 p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Typing content area"
              >
                <div
                  ref={contentContainerRef}
                  className="h-[96px] overflow-y-auto rounded-lg border border-border/70 bg-background/80 px-3 py-2"
                >
                  <div className="font-mono text-[20px] leading-10 whitespace-pre-wrap break-words text-foreground/80">
                    {lesson.content.split('').map((char, index) => {
                      const isNewLine = char === '\n';
                      return (
                        <span
                          key={index}
                          ref={index === currentIndex ? currentCharRef : null}
                          className={cn('rounded-sm px-[1px] transition-colors duration-150', getCharClassName(index), isNewLine && 'typing-enter')}
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

          <Card className="rounded-xl border shadow-sm">
            <CardContent className="p-3 md:p-4">
              <div className="mb-2 flex items-center justify-between md:hidden">
                <p className="text-sm font-medium text-foreground">Keyboard Guide</p>
                <button
                  type="button"
                  onClick={() => setShowKeyboardMobile((prev) => !prev)}
                  className="inline-flex h-8 min-w-8 items-center justify-center rounded-md border border-border px-2 text-xs text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-expanded={showKeyboardMobile}
                  aria-controls="lesson-keyboard-panel"
                >
                  {showKeyboardMobile ? (
                    <>
                      Hide <ChevronUp className="ml-1 h-3.5 w-3.5" />
                    </>
                  ) : (
                    <>
                      Show <ChevronDown className="ml-1 h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </div>

              <div
                id="lesson-keyboard-panel"
                className={cn(
                  'origin-top transition-all duration-150 md:block',
                  showKeyboardMobile ? 'block' : 'hidden'
                )}
              >
                <Keyboard activeKey={activeKey ?? undefined} nextKey={currentChar} showFingerGuide={true} />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit rounded-xl border shadow-sm">
          <CardContent className="p-4">
            <p className="mb-3 text-xs font-semibold tracking-[0.14em] text-muted-foreground">LIVE STATS</p>
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
              <div className="rounded-lg border border-border bg-muted/35 p-3">
                <p className="text-xs text-muted-foreground">WPM</p>
                <p className="mt-1 text-xl font-semibold leading-none text-foreground">{wpm}</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/35 p-3">
                <p className="text-xs text-muted-foreground">Accuracy</p>
                <p className="mt-1 text-xl font-semibold leading-none text-foreground">{accuracy.toFixed(1)}%</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/35 p-3">
                <p className="text-xs text-muted-foreground">Errors</p>
                <p className="mt-1 text-xl font-semibold leading-none text-foreground">{incorrectKeystrokes}</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/35 p-3">
                <p className="text-xs text-muted-foreground">Time</p>
                <p className="mt-1 text-xl font-semibold leading-none text-foreground">{formattedTimer}</p>
              </div>
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
