import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, RotateCcw, Shuffle } from 'lucide-react';
import Keyboard from '@/components/Keyboard';
import { typingTestApi, statisticsApi, testParagraphApi, leaderboardApi } from '@/db/api';
import { useToast } from '@/hooks/use-toast';
import type { TypingTestData, TestParagraph } from '@/types';
import { cn } from '@/lib/utils';
import { addLocalLeaderboardEntry, getGuestNickname, saveGuestTypingResult } from '@/lib/guestProgress';
import { GuestSavePromptCard } from '@/components/common/GuestSavePromptCard';

const FALLBACK_PARAGRAPHS: Record<'easy' | 'medium' | 'hard', TestParagraph> = {
  easy: {
    id: 'fallback-easy',
    difficulty: 'easy',
    content:
      'Typing is easier when your fingers stay relaxed and your eyes look one or two words ahead. Keep a steady rhythm and focus on accuracy first.',
    word_count: 25,
    created_at: '1970-01-01T00:00:00.000Z',
    updated_at: '1970-01-01T00:00:00.000Z',
  },
  medium: {
    id: 'fallback-medium',
    difficulty: 'medium',
    content:
      'Professional typing improvement comes from consistency. Practice in short, focused sessions, maintain posture, and correct mistakes early so your speed can grow without losing precision.',
    word_count: 27,
    created_at: '1970-01-01T00:00:00.000Z',
    updated_at: '1970-01-01T00:00:00.000Z',
  },
  hard: {
    id: 'fallback-hard',
    difficulty: 'hard',
    content:
      'Complex passages with punctuation, mixed sentence lengths, and uncommon word patterns challenge control. Prioritize smooth transitions between keys, then gradually increase pace while preserving clean technique.',
    word_count: 28,
    created_at: '1970-01-01T00:00:00.000Z',
    updated_at: '1970-01-01T00:00:00.000Z',
  },
};

export default function TypingTestPage() {
  const { user } = useAuth();
  const location = useLocation();
  const { toast } = useToast();
  const textContainerRef = useRef<HTMLDivElement>(null);
  const currentCharRef = useRef<HTMLSpanElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [testType, setTestType] = useState<'easy' | 'medium' | 'hard' | 'custom'>('easy');
  const [customText, setCustomText] = useState('');
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [showGuestSavePrompt, setShowGuestSavePrompt] = useState(false);
  const [loading, setLoading] = useState(false);

  const [testParagraphs, setTestParagraphs] = useState<Record<string, TestParagraph | null>>({
    easy: null,
    medium: null,
    hard: null,
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [errors, setErrors] = useState<number[]>([]);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const [correctKeystrokes, setCorrectKeystrokes] = useState(0);
  const [incorrectKeystrokes, setIncorrectKeystrokes] = useState(0);
  const [backspaceCount, setBackspaceCount] = useState(0);
  const [errorKeys, setErrorKeys] = useState<Record<string, number>>({});

  // Load random paragraphs when component mounts
  useEffect(() => {
    const loadParagraphs = async () => {
      setLoading(true);
      const difficulties: Array<'easy' | 'medium' | 'hard'> = ['easy', 'medium', 'hard'];
      const newParagraphs: Record<string, TestParagraph | null> = {};

      for (const difficulty of difficulties) {
        const paragraph = await testParagraphApi.getRandomParagraph(difficulty);
        newParagraphs[difficulty] = paragraph ?? FALLBACK_PARAGRAPHS[difficulty];
      }

      setTestParagraphs(newParagraphs);
      setLoading(false);
    };

    loadParagraphs();
  }, []);

  // Refresh paragraph when difficulty changes
  useEffect(() => {
    if (testType !== 'custom') {
      loadNewParagraph(testType);
    }
  }, [testType]);

  // Auto-scroll to keep current character visible
  useEffect(() => {
    if (started && !finished && currentCharRef.current && textContainerRef.current) {
      const container = textContainerRef.current;
      const currentChar = currentCharRef.current;
      
      const containerRect = container.getBoundingClientRect();
      const charRect = currentChar.getBoundingClientRect();
      
      // Calculate relative position
      const relativeTop = charRect.top - containerRect.top;
      const containerHeight = containerRect.height;
      
      // Scroll if current character is in the bottom third or below visible area
      if (relativeTop > containerHeight * 0.6 || charRect.bottom > containerRect.bottom) {
        currentChar.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [currentIndex, started, finished]);

  const testContent = testType === 'custom' 
    ? customText 
    : testParagraphs[testType]?.content || 'Loading...';

  const loadNewParagraph = async (difficulty: 'easy' | 'medium' | 'hard') => {
    const paragraph = await testParagraphApi.getRandomParagraph(difficulty);
    setTestParagraphs(prev => ({
      ...prev,
      [difficulty]: paragraph ?? FALLBACK_PARAGRAPHS[difficulty],
    }));
  };

  const handleStart = () => {
    if (testType === 'custom' && !customText.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter custom text first',
        variant: 'destructive',
      });
      return;
    }

    if (testType !== 'custom' && !testParagraphs[testType]) {
      toast({
        title: 'Error',
        description: 'Please wait for content to load',
        variant: 'destructive',
      });
      return;
    }

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

    const expectedChar = testContent[currentIndex];
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

    if (currentIndex + 1 >= testContent.length) {
      handleFinish();
    }
  };

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
        source: 'typing-test',
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
      test_type: testType,
      test_content: testContent,
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
        source: testType,
      });

      toast({
        title: 'Test Complete!',
        description: `You typed at ${wpm} WPM with ${accuracy.toFixed(1)}% accuracy.`,
      });
    } catch (error) {
      console.error('Failed to save typing test:', error);
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

  const durationSeconds = startTime && endTime ? Math.round((endTime - startTime) / 1000) : 0;
  const totalKeystrokes = correctKeystrokes + incorrectKeystrokes;
  const accuracy = totalKeystrokes > 0 ? (correctKeystrokes / totalKeystrokes) * 100 : 0;
  const cpm = durationSeconds > 0 ? Math.round((correctKeystrokes / durationSeconds) * 60) : 0;
  const wpm = Math.round(cpm / 5);
  const currentChar = currentIndex < testContent.length ? testContent[currentIndex] : '';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Typing Test</h1>
        <p className="text-muted-foreground">Test your typing speed and accuracy</p>
      </div>

      {!started ? (
        <Card>
          <CardHeader>
            <CardTitle>Choose Test Type</CardTitle>
            <CardDescription>Select a difficulty level or create your own custom test</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs value={testType} onValueChange={(v) => setTestType(v as any)}>
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
                <TabsTrigger value="easy">Easy</TabsTrigger>
                <TabsTrigger value="medium">Medium</TabsTrigger>
                <TabsTrigger value="hard">Hard</TabsTrigger>
                <TabsTrigger value="custom">Custom</TabsTrigger>
              </TabsList>

              <TabsContent value="easy" className="space-y-4">
                <div 
                  className="bg-muted/50 p-4 rounded-lg overflow-y-auto scrollbar-orbit"
                  style={{ maxHeight: '10rem' }}
                >
                  <p className="text-sm break-words whitespace-pre-wrap">
                    {loading ? 'Loading...' : testParagraphs.easy?.content.substring(0, 500) + '...'}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadNewParagraph('easy')}
                  className="w-fit"
                >
                  <Shuffle className="mr-2 h-4 w-4" />
                  Refresh Paragraph
                </Button>
              </TabsContent>

              <TabsContent value="medium" className="space-y-4">
                <div 
                  className="bg-muted/50 p-4 rounded-lg overflow-y-auto scrollbar-orbit"
                  style={{ maxHeight: '10rem' }}
                >
                  <p className="text-sm break-words whitespace-pre-wrap">
                    {loading ? 'Loading...' : testParagraphs.medium?.content.substring(0, 500) + '...'}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadNewParagraph('medium')}
                  className="w-fit"
                >
                  <Shuffle className="mr-2 h-4 w-4" />
                  Refresh Paragraph
                </Button>
              </TabsContent>

              <TabsContent value="hard" className="space-y-4">
                <div 
                  className="bg-muted/50 p-4 rounded-lg overflow-y-auto scrollbar-orbit"
                  style={{ maxHeight: '10rem' }}
                >
                  <p className="text-sm break-words whitespace-pre-wrap">
                    {loading ? 'Loading...' : testParagraphs.hard?.content.substring(0, 500) + '...'}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadNewParagraph('hard')}
                  className="w-fit"
                >
                  <Shuffle className="mr-2 h-4 w-4" />
                  Refresh Paragraph
                </Button>
              </TabsContent>

              <TabsContent value="custom" className="space-y-4">
                <Textarea
                  placeholder="Enter your custom text here..."
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  rows={6}
                />
              </TabsContent>
            </Tabs>

            <Button onClick={handleStart} size="lg" className="w-full">
              Start Test
            </Button>
          </CardContent>
        </Card>
      ) : finished ? (
        <Card>
          <CardContent className="pt-12 pb-12">
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-success" />
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-2">Test Complete!</h2>
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
                    <div className="text-3xl font-bold">{durationSeconds}s</div>
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
                    if (testType !== 'custom') {
                      loadNewParagraph(testType);
                    }
                    setStarted(false);
                    setFinished(false);
                    setShowGuestSavePrompt(false);
                  }}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  New Test
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
              <CardTitle>Type the text below</CardTitle>
              <div className="flex gap-4 text-sm">
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
                maxHeight: '10rem', // Approximately 5 lines
                overflowY: 'auto',
                scrollBehavior: 'smooth'
              }}
            >
              <div className="text-xl font-mono leading-relaxed break-words whitespace-pre-wrap">
                {testContent.split('').map((char, index) => (
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
