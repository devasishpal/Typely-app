import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RotateCcw, Play } from 'lucide-react';
import Keyboard from '@/components/Keyboard';
import { leaderboardApi, practiceTestApi, statisticsApi, typingTestApi } from '@/db/api';
import { useToast } from '@/hooks/use-toast';
import type { PracticeTest, TypingTestData } from '@/types';
import { cn } from '@/lib/utils';
import { addLocalLeaderboardEntry, getGuestNickname, saveGuestTypingResult } from '@/lib/guestProgress';
import { GuestSavePromptCard } from '@/components/common/GuestSavePromptCard';

type PracticeCategory = 'word' | 'sentence' | 'long';

const FALLBACK_PRACTICE_TESTS: PracticeTest[] = [
  {
    id: 'fallback-practice-1',
    title: 'Word Drill: Home Row',
    content:
      'as df jk kl sad lad ask flask dash flag glass fall ladle skill jaskal salsa',
    duration_minutes: 1,
    word_count: 16,
    created_at: '1970-01-01T00:00:00.000Z',
    updated_at: '1970-01-01T00:00:00.000Z',
  },
  {
    id: 'fallback-practice-2',
    title: 'Sentence Flow',
    content:
      'Good typing grows from steady rhythm and accurate keystrokes. Keep your eyes slightly ahead, relax your shoulders, and press each key with intention.',
    duration_minutes: 2,
    word_count: 23,
    created_at: '1970-01-01T00:00:00.000Z',
    updated_at: '1970-01-01T00:00:00.000Z',
  },
  {
    id: 'fallback-practice-3',
    title: 'Long Paragraph Focus',
    content:
      'Typing consistency develops when you maintain posture, keep your wrists neutral, and avoid rushing through difficult word combinations. Focus on finishing one line cleanly before increasing speed. If you make an error, recover quickly and continue your flow instead of stopping for long corrections. Small improvements in rhythm and accuracy, repeated daily, produce reliable gains over time.',
    duration_minutes: 3,
    word_count: 57,
    created_at: '1970-01-01T00:00:00.000Z',
    updated_at: '1970-01-01T00:00:00.000Z',
  },
];

const CATEGORY_ORDER: PracticeCategory[] = ['word', 'sentence', 'long'];
const CATEGORY_LABELS: Record<PracticeCategory, string> = {
  word: 'Word Practice',
  sentence: 'Sentence Practice',
  long: 'Long Paragraph Practice',
};

const getPracticeCategory = (practice: PracticeTest): PracticeCategory => {
  const haystack = `${practice.title} ${practice.content}`.toLowerCase();

  if (
    haystack.includes('word') ||
    haystack.includes('drill') ||
    haystack.includes('vocabulary') ||
    practice.word_count <= 20
  ) {
    return 'word';
  }

  if (
    haystack.includes('paragraph') ||
    haystack.includes('passage') ||
    haystack.includes('article') ||
    haystack.includes('essay') ||
    practice.word_count >= 50
  ) {
    return 'long';
  }

  return 'sentence';
};

const buildPracticeContent = (base: string) => {
  const clean = base.trim();
  if (!clean) return '';
  return clean;
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
  const [selectedCategory, setSelectedCategory] = useState<PracticeCategory>('word');
  const [selectedId, setSelectedId] = useState<string>('');

  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [showGuestSavePrompt, setShowGuestSavePrompt] = useState(false);
  const [practiceContent, setPracticeContent] = useState('');
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

  const practiceSetsByCategory = useMemo(() => {
    const grouped: Record<PracticeCategory, PracticeTest[]> = {
      word: [],
      sentence: [],
      long: [],
    };

    for (const practice of practiceTests) {
      grouped[getPracticeCategory(practice)].push(practice);
    }

    return grouped;
  }, [practiceTests]);

  const categoryPracticeTests = useMemo(
    () => practiceSetsByCategory[selectedCategory] ?? [],
    [practiceSetsByCategory, selectedCategory]
  );

  const selectedPractice = useMemo(
    () => categoryPracticeTests.find((p) => p.id === selectedId) || null,
    [categoryPracticeTests, selectedId]
  );

  const categoryCounts = useMemo(
    () => ({
      word: practiceSetsByCategory.word.length,
      sentence: practiceSetsByCategory.sentence.length,
      long: practiceSetsByCategory.long.length,
    }),
    [practiceSetsByCategory]
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
      } catch (err: any) {
        console.error('Failed to load practice tests, using fallback sets:', err);
        setPracticeTests(FALLBACK_PRACTICE_TESTS);
        setLoadError('');
      }
      setLoading(false);
    };
    loadPracticeTests();
  }, []);

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

  useEffect(() => {
    if (categoryPracticeTests.length > 0) {
      const hasSelected = categoryPracticeTests.some((practice) => practice.id === selectedId);
      if (!hasSelected) {
        setSelectedId(categoryPracticeTests[0].id);
      }
      return;
    }

    if (selectedId) {
      setSelectedId('');
    }
  }, [categoryPracticeTests, selectedId]);

  useEffect(() => {
    if (practiceTests.length === 0) return;
    if (categoryPracticeTests.length > 0) return;

    const firstAvailable = CATEGORY_ORDER.find((category) => practiceSetsByCategory[category].length > 0);
    if (firstAvailable && firstAvailable !== selectedCategory) {
      setSelectedCategory(firstAvailable);
    }
  }, [practiceTests, categoryPracticeTests, practiceSetsByCategory, selectedCategory]);

  const handleStart = () => {
    if (!selectedPractice) {
      toast({
        title: 'No practice set',
        description: 'Please select a practice set in the chosen category.',
        variant: 'destructive',
      });
      return;
    }

    const content = buildPracticeContent(selectedPractice.content);
    if (!content) {
      toast({
        title: 'Invalid practice set',
        description: 'Selected practice content is empty.',
        variant: 'destructive',
      });
      return;
    }

    setStarted(true);
    setFinished(false);
    setStartTime(Date.now());
    setEndTime(null);
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
    if (!started || finished) return;

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
    if (currentIndex >= practiceContent.length) return;

    const expectedChar = practiceContent[currentIndex] ?? '';
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

    if (currentIndex + 1 >= practiceContent.length) {
      handleFinish();
    }
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

    const durationSeconds = Math.max(1, Math.round((end - startTime) / 1000));
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
        source: 'practice',
      });
      addLocalLeaderboardEntry({
        nickname: getGuestNickname(),
        wpm,
        accuracy: Math.round(accuracy * 100) / 100,
        duration: durationSeconds,
      });
      setShowGuestSavePrompt(true);

      toast({
        title: 'Progress saved locally',
        description: 'Sign in only if you want cloud sync across devices.',
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

      await leaderboardApi.submitScore({
        user_id: user.id,
        nickname: user.username || 'Member',
        wpm,
        accuracy: Math.round(accuracy * 100) / 100,
        duration: durationSeconds,
        source: 'practice',
      });

      toast({
        title: 'Practice Complete!',
        description: `You typed at ${wpm} WPM with ${accuracy.toFixed(1)}% accuracy.`,
      });
    } catch (error) {
      console.error('Failed to save practice result:', error);
      addLocalLeaderboardEntry({
        nickname: user.username || 'Member',
        wpm,
        accuracy: Math.round(accuracy * 100) / 100,
        duration: durationSeconds,
        user_id: user.id,
      });
      toast({
        title: 'Saved locally',
        description: 'Cloud sync failed for this result. We kept a local backup.',
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

  const elapsedSeconds = startTime
    ? Math.max(0, Math.round(((endTime ?? Date.now()) - startTime) / 1000))
    : 0;
  const totalKeystrokes = correctKeystrokes + incorrectKeystrokes;
  const accuracy = totalKeystrokes > 0 ? (correctKeystrokes / totalKeystrokes) * 100 : 0;
  const cpm = elapsedSeconds > 0 ? Math.round((correctKeystrokes / elapsedSeconds) * 60) : 0;
  const wpm = Math.round(cpm / 5);
  const currentChar = currentIndex < practiceContent.length ? practiceContent[currentIndex] : '';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2 gradient-text">Practice</h1>
        <p className="text-muted-foreground">Practice without a time limit and focus on accuracy.</p>
      </div>

      {!started ? (
        <Card>
          <CardHeader>
            <CardTitle>Select Practice</CardTitle>
            <CardDescription>Choose a category, pick a set, and start typing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Tabs
                value={selectedCategory}
                onValueChange={(value) => setSelectedCategory(value as PracticeCategory)}
              >
                <TabsList className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3">
                  {CATEGORY_ORDER.map((category) => (
                    <TabsTrigger key={category} value={category}>
                      {CATEGORY_LABELS[category]} ({categoryCounts[category]})
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Practice Set</label>
                {selectedPractice && (
                  <Badge variant="outline">{selectedPractice.word_count} words</Badge>
                )}
              </div>
              <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      loading
                        ? 'Loading...'
                        : categoryPracticeTests.length === 0
                          ? 'No practice in this category'
                          : 'Select practice'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {categoryPracticeTests.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!loading && categoryPracticeTests.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No practice sets available in this category.
                </p>
              )}
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
                <Badge variant="outline">Time: {elapsedSeconds}s</Badge>
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
