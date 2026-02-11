import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, RotateCcw, Shuffle } from 'lucide-react';
import Keyboard from '@/components/Keyboard';
import { typingTestApi, statisticsApi, testParagraphApi } from '@/db/api';
import { useToast } from '@/hooks/use-toast';
import type { TypingTestData, TestParagraph } from '@/types';
import { cn } from '@/lib/utils';

export default function TypingTestPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const textContainerRef = useRef<HTMLDivElement>(null);
  const currentCharRef = useRef<HTMLSpanElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [testType, setTestType] = useState<'easy' | 'medium' | 'hard' | 'custom'>('easy');
  const [customText, setCustomText] = useState('');
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
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
        newParagraphs[difficulty] = paragraph;
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
      [difficulty]: paragraph,
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
    if (!user || !startTime) return;

    const end = Date.now();
    setEndTime(end);
    setFinished(true);

    const durationSeconds = Math.round((end - startTime) / 1000);
    const totalKeystrokes = correctKeystrokes + incorrectKeystrokes;
    const accuracy = totalKeystrokes > 0 ? (correctKeystrokes / totalKeystrokes) * 100 : 0;
    const cpm = Math.round((correctKeystrokes / durationSeconds) * 60);
    const wpm = Math.round(cpm / 5);

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
      title: 'Test Complete!',
      description: `You typed at ${wpm} WPM with ${accuracy.toFixed(1)}% accuracy.`,
    });
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
                  className="bg-muted/50 p-4 rounded-lg overflow-y-auto"
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
                  className="bg-muted/50 p-4 rounded-lg overflow-y-auto"
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
                  className="bg-muted/50 p-4 rounded-lg overflow-y-auto"
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
                  }}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  New Test
                </Button>
              </div>
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
              className="bg-muted/50 p-6 rounded-lg border border-border max-w-full overflow-hidden"
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

            <Keyboard activeKey={activeKey ?? undefined} nextKey={currentChar} />

            <div className="text-center text-sm text-muted-foreground">
              Click anywhere to focus and start typing
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
