import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RotateCcw, Play, Clock } from 'lucide-react';
import Keyboard from '@/components/Keyboard';
import { practiceTestApi, statisticsApi, typingTestApi } from '@/db/api';
import { useToast } from '@/hooks/use-toast';
import type { PracticeTest, TypingTestData } from '@/types';
import { cn } from '@/lib/utils';
import { saveGuestTypingResult } from '@/lib/guestProgress';
import { GuestSavePromptCard } from '@/components/common/GuestSavePromptCard';

const FALLBACK_PRACTICE_TESTS: PracticeTest[] = [
  {
    id: 'fallback-practice-1',
    title: 'Focus Warmup',
    content:
      'Calm, precise typing starts with rhythm. Keep your hands relaxed, return to the home row, and aim for clean keystrokes before speed.',
    duration_minutes: 1,
    word_count: 24,
    created_at: '1970-01-01T00:00:00.000Z',
    updated_at: '1970-01-01T00:00:00.000Z',
  },
  {
    id: 'fallback-practice-2',
    title: 'Steady Flow',
    content:
      'Consistency wins over bursts. Watch the next word while finishing the current one, and let your breathing keep a stable pace.',
    duration_minutes: 2,
    word_count: 24,
    created_at: '1970-01-01T00:00:00.000Z',
    updated_at: '1970-01-01T00:00:00.000Z',
  },
];

const buildPracticeContent = (base: string, minutes: number) => {
  const clean = base.trim();
  if (!clean) return '';
  const targetLength = Math.max(clean.length, minutes * 600);
  let output = clean;
  while (output.length < targetLength) {
    output += `\n\n${clean}`;
  }
  return output;
};

export default function PracticePage() {
  const { user } = useAuth();
  const location = useLocation();
  const { toast } = useToast();
  const textContainerRef = useRef<HTMLDivElement>(null);
  const currentCharRef = useRef<HTMLSpanElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [practiceTests, setPracticeTests] = useState<PracticeTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selectedId, setSelectedId] = useState<string>('');

  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [showGuestSavePrompt, setShowGuestSavePrompt] = useState(false);
  const [practiceContent, setPracticeContent] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [durationLimit, setDurationLimit] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [errors, setErrors] = useState<number[]>([]);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [correctKeystrokes, setCorrectKeystrokes] = useState(0);
  const [incorrectKeystrokes, setIncorrectKeystrokes] = useState(0);
  const [backspaceCount, setBackspaceCount] = useState(0);
  const [errorKeys, setErrorKeys] = useState<Record<string, number>>({});

  const selectedPractice = useMemo(
    () => practiceTests.find((p) => p.id === selectedId) || null,
    [practiceTests, selectedId]
  );

  useEffect(() => {
    const loadPracticeTests = async () => {
      setLoading(true);
      setLoadError('');
      try {
        const data = await practiceTestApi.getAllPracticeTests();
        if (data.length === 0) {
          throw new Error('No practice tests available');
        }
        setPracticeTests(data);
        setSelectedId(data[0]?.id || '');
      } catch (err: any) {
        console.error('Failed to load practice tests, using fallback sets:', err);
        setPracticeTests(FALLBACK_PRACTICE_TESTS);
        setSelectedId(FALLBACK_PRACTICE_TESTS[0]?.id || '');
        setLoadError('');
      }
      setLoading(false);
    };
    loadPracticeTests();
  }, []);

  useEffect(() => {
    if (started && !finished) {
      const interval = setInterval(() => {
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [started, finished]);

  useEffect(() => {
    if (started && !finished && timeLeft === 0 && durationLimit > 0) {
      handleFinish();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, started, finished, durationLimit]);

  useEffect(() => {
    if (started && !finished && currentCharRef.current && textContainerRef.current) {
      const container = textContainerRef.current;
      const currentChar = currentCharRef.current;

      const containerRect = container.getBoundingClientRect();
      const charRect = currentChar.getBoundingClientRect();

      const relativeTop = charRect.top - containerRect.top;
      const containerHeight = containerRect.height;

      if (relativeTop > containerHeight * 0.6 || charRect.bottom > containerRect.bottom) {
        currentChar.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [currentIndex, started, finished]);

  const handleStart = () => {
    if (!selectedPractice) {
      toast({
        title: 'No practice set',
        description: 'Please select a practice test first.',
        variant: 'destructive',
      });
      return;
    }

    const durationSeconds = Math.max(1, selectedPractice.duration_minutes * 60);
    const content = buildPracticeContent(selectedPractice.content, selectedPractice.duration_minutes);

    setStarted(true);
    setFinished(false);
    setStartTime(Date.now());
    setEndTime(null);
    setDurationLimit(durationSeconds);
    setTimeLeft(durationSeconds);
    setPracticeContent(content);
    setCurrentIndex(0);
    setTypedText('');
    setErrors([]);
    setCorrectKeystrokes(0);
    setIncorrectKeystrokes(0);
    setBackspaceCount(0);
    setErrorKeys({});
    setShowGuestSavePrompt(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!started || finished || timeLeft === 0) return;

    const key = e.key;
    setActiveKey(key);

    if (key === 'Backspace') {
      setBackspaceCount((prev) => prev + 1);
      if (currentIndex > 0) {
        setCurrentIndex((prev) => prev - 1);
        setTypedText((prev) => prev.slice(0, -1));
        setErrors((prev) => prev.filter((idx) => idx !== currentIndex - 1));
      }
      return;
    }

    if (key.length !== 1) return;

    const expectedChar = practiceContent[currentIndex];
    const isCorrect = key === expectedChar;

    if (isCorrect) {
      setCorrectKeystrokes((prev) => prev + 1);
    } else {
      setIncorrectKeystrokes((prev) => prev + 1);
      setErrors((prev) => [...prev, currentIndex]);
      setErrorKeys((prev) => ({
        ...prev,
        [expectedChar]: (prev[expectedChar] || 0) + 1,
      }));
    }

    setTypedText((prev) => prev + key);
    setCurrentIndex((prev) => prev + 1);
  };

  const handleKeyUp = () => {
    setActiveKey(null);
  };

  const handleBlur = () => {
    if (started && !finished) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const handleFinish = async () => {
    if (!startTime) return;

    const end = Date.now();
    setEndTime(end);
    setFinished(true);

    const durationSeconds = Math.max(1, Math.min(durationLimit, Math.round((end - startTime) / 1000)));
    const totalKeystrokes = correctKeystrokes + incorrectKeystrokes;
    const accuracy = totalKeystrokes > 0 ? (correctKeystrokes / totalKeystrokes) * 100 : 0;
    const cpm = Math.round((correctKeystrokes / durationSeconds) * 60);
    const wpm = Math.round(cpm / 5);

    if (!user) {
      saveGuestTypingResult({
        wpm,
        accuracy: Math.round(accuracy * 100) / 100,
        mistakes: incorrectKeystrokes,
        duration: durationSeconds,
      });
      setShowGuestSavePrompt(true);

      toast({
        title: 'Result saved locally',
        description: 'Sign in anytime to sync this progress to your account.',
      });
      return;
    }

    const testData: TypingTestData = {
      test_type: 'practice',
      test_content: selectedPractice?.content || practiceContent,
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

    try {
      await typingTestApi.createTest(user.id, testData);

      const today = new Date().toISOString().split('T')[0];
      await statisticsApi.upsertDailyStats(user.id, today, {
        total_sessions: 1,
        total_keystrokes: totalKeystrokes,
        total_duration_seconds: durationSeconds,
        average_wpm: wpm,
        average_accuracy: accuracy,
        lessons_completed: 0,
      });

      toast({
        title: 'Practice Complete!',
        description: `You typed at ${wpm} WPM with ${accuracy.toFixed(1)}% accuracy.`,
      });
    } catch (error) {
      console.error('Failed to save practice result:', error);
      toast({
        title: 'Result not synced',
        description: 'We could not save this result to your account right now. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getCharClassName = (index: number) => {
    if (index < currentIndex) {
      return errors.includes(index) ? 'text-destructive bg-destructive/20' : 'text-success';
    }
    if (index === currentIndex) {
      return 'bg-primary/20 border-b-2 border-primary';
    }
    return 'text-muted-foreground';
  };

  const elapsedSeconds =
    startTime && endTime ? Math.round((endTime - startTime) / 1000) : durationLimit - timeLeft;
  const totalKeystrokes = correctKeystrokes + incorrectKeystrokes;
  const accuracy = totalKeystrokes > 0 ? (correctKeystrokes / totalKeystrokes) * 100 : 0;
  const cpm = elapsedSeconds > 0 ? Math.round((correctKeystrokes / elapsedSeconds) * 60) : 0;
  const wpm = Math.round(cpm / 5);
  const currentChar = currentIndex < practiceContent.length ? practiceContent[currentIndex] : '';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2 gradient-text">Practice</h1>
        <p className="text-muted-foreground">Timed practice sessions for focused improvement.</p>
      </div>

      {!started ? (
        <Card>
          <CardHeader>
            <CardTitle>Select Practice</CardTitle>
            <CardDescription>Pick a timed practice and start typing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Practice Set</label>
                {selectedPractice && (
                  <Badge variant="outline">
                    <Clock className="w-3 h-3 mr-1" />
                    {selectedPractice.duration_minutes} min
                  </Badge>
                )}
              </div>
              <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger>
                  <SelectValue placeholder={loading ? 'Loading...' : 'Select practice'} />
                </SelectTrigger>
                <SelectContent>
                  {practiceTests.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title} ({p.duration_minutes} min)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {loadError && (
                <p className="text-xs text-destructive">
                  {loadError}
                </p>
              )}
              {selectedPractice && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {selectedPractice.content}
                </p>
              )}
            </div>

            <Button onClick={handleStart} size="lg" className="w-full" disabled={!selectedPractice}>
              <Play className="mr-2 h-4 w-4" />
              Start Practice
            </Button>
          </CardContent>
        </Card>
      ) : finished ? (
        <Card>
          <CardContent className="pt-12 pb-12">
            <div className="text-center space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2 gradient-text">Practice Complete!</h2>
                <p className="text-muted-foreground">Here are your results:</p>
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
                <Button
                  onClick={() => {
                    setStarted(false);
                    setFinished(false);
                    setShowGuestSavePrompt(false);
                  }}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  New Practice
                </Button>
              </div>

              {!user && showGuestSavePrompt && (
                <div className="mx-auto w-full max-w-2xl">
                  <GuestSavePromptCard
                    signInHref={`/login?next=${encodeURIComponent(location.pathname)}`}
                    onContinueAsGuest={() => setShowGuestSavePrompt(false)}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Keep typing</CardTitle>
              <div className="flex gap-4 text-sm items-center">
                <Badge variant="outline">Time Left: {Math.max(timeLeft, 0)}s</Badge>
                <Badge variant="outline">WPM: {wpm}</Badge>
                <Badge variant="outline">Accuracy: {accuracy.toFixed(1)}%</Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent
            className="space-y-6"
            onClick={() => inputRef.current?.focus()}
          >
            <div
              ref={textContainerRef}
              className="bg-muted/50 p-6 rounded-lg border border-border max-w-full overflow-hidden scrollbar-orbit"
              style={{
                maxHeight: '10rem',
                overflowY: 'auto',
                scrollBehavior: 'smooth',
              }}
            >
              <div className="text-xl font-mono leading-relaxed break-words whitespace-pre-wrap">
                {practiceContent.split('').map((char, index) => (
                  <span
                    key={index}
                    ref={index === currentIndex ? currentCharRef : null}
                    className={cn('transition-colors', getCharClassName(index))}
                  >
                    {char === ' ' ? '\u00A0' : char}
                  </span>
                ))}
              </div>
            </div>

            <input
              ref={inputRef}
              type="text"
              className="sr-only"
              value={typedText}
              onChange={() => {}}
              onKeyDown={handleKeyPress}
              onKeyUp={handleKeyUp}
              onBlur={handleBlur}
              autoFocus
            />

            <Keyboard
              activeKey={activeKey ?? undefined}
              nextKey={currentChar}
              showFingerGuide={true}
              layoutDensity="compact"
            />

            <div className="text-center text-sm text-muted-foreground">
              Click anywhere to focus and start typing
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
