import { useEffect, useState } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Pencil, Trash2, FileText, Timer, X } from 'lucide-react';
import { adminApi } from '@/db/api';
import { supabase } from '@/db/supabase';
import { useToast } from '@/hooks/use-toast';
import type { TestParagraph } from '@/types';

type Difficulty = 'easy' | 'medium' | 'hard';
const DEFAULT_TEST_TIME_LIMITS = [30, 60, 120];

export default function AdminTestsPage() {
  const { toast } = useToast();
  const [paragraphs, setParagraphs] = useState<TestParagraph[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TestParagraph | null>(null);

  const [search, setSearch] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<'all' | Difficulty>('all');

  // Form state
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [content, setContent] = useState('');
  const [bulkContent, setBulkContent] = useState('');
  const [tabMode, setTabMode] = useState<'single' | 'bulk'>('single');
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [timeLimits, setTimeLimits] = useState<number[]>(DEFAULT_TEST_TIME_LIMITS);
  const [timeLimitsInput, setTimeLimitsInput] = useState(DEFAULT_TEST_TIME_LIMITS.join(', '));
  const [savingTimeLimits, setSavingTimeLimits] = useState(false);

  useEffect(() => {
    loadParagraphs();
    loadTimeLimits();
  }, []);

  const loadParagraphs = async () => {
    setLoading(true);
    const data = await adminApi.getAllTestParagraphs();
    setParagraphs(data);
    setLoading(false);
  };

  const loadTimeLimits = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('id, typing_test_times')
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data?.id) {
        setSettingsId(data.id as string);
      }

      const parsed = Array.isArray(data?.typing_test_times)
        ? data.typing_test_times
            .map((value) => Math.round(Number(value)))
            .filter((value) => Number.isFinite(value) && value > 0)
            .sort((a, b) => a - b)
        : [];

      if (parsed.length > 0) {
        setTimeLimits(parsed);
        setTimeLimitsInput(parsed.join(', '));
      }
    } catch (error) {
      console.error('Failed to load typing test time limits:', error);
    }
  };

  const handleSaveTimeLimits = async () => {
    const parsed = timeLimitsInput
      .split(',')
      .map((value) => Math.round(Number(value.trim())))
      .filter((value) => Number.isFinite(value) && value > 0)
      .sort((a, b) => a - b);

    const uniqueParsed = Array.from(new Set(parsed));
    if (uniqueParsed.length === 0) {
      toast({
        title: 'Error',
        description: 'Please enter at least one valid time limit in seconds.',
        variant: 'destructive',
      });
      return;
    }

    setSavingTimeLimits(true);
    try {
      if (settingsId) {
        const { error } = await supabase
          .from('site_settings')
          .update({
            typing_test_times: uniqueParsed,
            updated_at: new Date().toISOString(),
          })
          .eq('id', settingsId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('site_settings')
          .insert({
            typing_test_times: uniqueParsed,
            updated_at: new Date().toISOString(),
          })
          .select('id')
          .maybeSingle();
        if (error) throw error;
        if (data?.id) {
          setSettingsId(data.id as string);
        }
      }

      setTimeLimits(uniqueParsed);
      setTimeLimitsInput(uniqueParsed.join(', '));
      toast({
        title: 'Success',
        description: 'Typing test time limits updated.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to update time limits.',
        variant: 'destructive',
      });
    } finally {
      setSavingTimeLimits(false);
    }
  };

  const handleOpenDialog = (paragraph?: TestParagraph) => {
    if (paragraph) {
      setEditing(paragraph);
      setDifficulty(paragraph.difficulty);
      setContent(paragraph.content);
      setTabMode('single');
    } else {
      setEditing(null);
      setDifficulty('easy');
      setContent('');
      setBulkContent('');
      setTabMode('single');
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (tabMode === 'bulk') {
      const blocks = bulkContent
        .split(/\n\s*\n/g)
        .map((b) => b.trim())
        .filter(Boolean);

      if (blocks.length === 0) {
        toast({
          title: 'Error',
          description: 'Add at least one paragraph. Separate with blank lines.',
          variant: 'destructive',
        });
        return;
      }

      try {
        await Promise.all(
          blocks.map((text) =>
            adminApi.createTestParagraph({
              difficulty,
              content: text,
              word_count: text.split(/\s+/).filter(Boolean).length,
            })
          )
        );
        toast({ title: 'Success', description: `Added ${blocks.length} paragraphs.` });
        setDialogOpen(false);
        loadParagraphs();
        return;
      } catch (err: any) {
        toast({
          title: 'Error',
          description: err?.message || 'Failed to add paragraphs.',
          variant: 'destructive',
        });
        return;
      }
    }

    if (!content.trim()) {
      toast({
        title: 'Error',
        description: 'Paragraph content is required.',
        variant: 'destructive',
      });
      return;
    }

    const payload = {
      difficulty,
      content: content.trim(),
      word_count: content.trim().split(/\s+/).filter(Boolean).length,
    };

    try {
      if (editing) {
        await adminApi.updateTestParagraph(editing.id, payload);
        toast({ title: 'Success', description: 'Test paragraph updated.' });
      } else {
        await adminApi.createTestParagraph(payload);
        toast({ title: 'Success', description: 'Test paragraph created.' });
      }
      setDialogOpen(false);
      loadParagraphs();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.message || 'Failed to save paragraph.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this paragraph?')) return;
    try {
      await adminApi.deleteTestParagraph(id);
      toast({ title: 'Deleted', description: 'Paragraph removed.' });
      loadParagraphs();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.message || 'Failed to delete paragraph.',
        variant: 'destructive',
      });
    }
  };

  const filtered = paragraphs.filter((p) => {
    const matchesSearch = !search || p.content.toLowerCase().includes(search.toLowerCase());
    const matchesDifficulty = filterDifficulty === 'all' || p.difficulty === filterDifficulty;
    return matchesSearch && matchesDifficulty;
  });

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Test Management</h1>
            <p className="text-muted-foreground">
              Create and manage timed typing tests and paragraph pools
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Paragraph
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden p-0 flex flex-col">
              <div className="sticky top-0 z-10 border-b border-border/60 bg-background/95 backdrop-blur px-6 py-3">
                <DialogHeader className="gap-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <DialogTitle className="text-base">
                        {editing ? 'Edit Paragraph' : 'Create Paragraph'}
                      </DialogTitle>
                      <DialogDescription className="text-xs">
                        {editing ? 'Update the paragraph text' : 'Add a new test paragraph'}
                      </DialogDescription>
                    </div>
                    <DialogClose asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <X className="h-4 w-4" />
                      </Button>
                    </DialogClose>
                  </div>
                </DialogHeader>
              </div>

              <div className="px-6 py-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="testDifficulty">Difficulty</Label>
                    <Select value={difficulty} onValueChange={(v) => setDifficulty(v as Difficulty)}>
                      <SelectTrigger id="testDifficulty" aria-label="Test difficulty">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {!editing && (
                    <Tabs value={tabMode} onValueChange={(v) => setTabMode(v as typeof tabMode)}>
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="single">Single</TabsTrigger>
                        <TabsTrigger value="bulk">Bulk</TabsTrigger>
                      </TabsList>
                      <TabsContent value="single" className="space-y-2">
                        <Label htmlFor="testParagraphSingle">Paragraph</Label>
                        <Textarea
                          id="testParagraphSingle"
                          name="testParagraphSingle"
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          placeholder="Type paragraph text..."
                          rows={6}
                        />
                      </TabsContent>
                      <TabsContent value="bulk" className="space-y-2">
                        <Label htmlFor="testParagraphBulk">Bulk Paragraphs</Label>
                        <Textarea
                          id="testParagraphBulk"
                          name="testParagraphBulk"
                          value={bulkContent}
                          onChange={(e) => setBulkContent(e.target.value)}
                          placeholder="Paste paragraphs here. Separate each paragraph with a blank line."
                          rows={10}
                        />
                        <p className="text-xs text-muted-foreground">
                          Tip: Each blank line creates a new paragraph.
                        </p>
                      </TabsContent>
                    </Tabs>
                  )}

                  {editing && (
                    <div className="space-y-2">
                      <Label htmlFor="testParagraphEdit">Paragraph</Label>
                      <Textarea
                        id="testParagraphEdit"
                        name="testParagraphEdit"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Type paragraph text..."
                        rows={6}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-border/60 bg-background/95 backdrop-blur px-6 py-3">
                <DialogFooter className="sm:justify-end">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>
                    {editing ? 'Update' : tabMode === 'bulk' ? 'Add All' : 'Create'}
                  </Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="bg-gradient-card shadow-card card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Paragraphs</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{paragraphs.length}</div>
              <p className="text-xs text-muted-foreground mt-1">All test paragraphs</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-card card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Easy</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {paragraphs.filter((p) => p.difficulty === 'easy').length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Beginner friendly</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-card card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hard</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {paragraphs.filter((p) => p.difficulty === 'hard').length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Advanced practice</p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Test Time Limits</CardTitle>
            <CardDescription>These limits are used on the user typing test page.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="testTimeLimits">Time Limits (seconds)</Label>
              <Input
                id="testTimeLimits"
                name="testTimeLimits"
                value={timeLimitsInput}
                onChange={(e) => setTimeLimitsInput(e.target.value)}
                placeholder="30, 60, 120"
              />
              <p className="text-xs text-muted-foreground">
                Enter comma-separated values. Example: 30, 60, 120
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {timeLimits.map((limit) => (
                <Badge key={limit} variant="outline" className="inline-flex items-center gap-1">
                  <Timer className="h-3 w-3" />
                  {limit}s
                </Badge>
              ))}
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSaveTimeLimits} disabled={savingTimeLimits}>
                {savingTimeLimits ? 'Saving...' : 'Save Time Limits'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="bg-gradient-card shadow-card">
          <CardContent className="pt-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="testSearch">Search</Label>
                <Input
                  id="testSearch"
                  name="testSearch"
                  placeholder="Search by paragraph content"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="testDifficultyFilter">Difficulty</Label>
                <Select value={filterDifficulty} onValueChange={(v) => setFilterDifficulty(v as typeof filterDifficulty)}>
                  <SelectTrigger
                    id="testDifficultyFilter"
                    aria-label="Filter by difficulty"
                    className="bg-background/80"
                  >
                    <SelectValue placeholder="All difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle>All Test Paragraphs</CardTitle>
            <CardDescription>Manage typing test content</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full bg-muted" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-muted-foreground">No paragraphs match your filters.</p>
                <Button className="mt-4" onClick={() => handleOpenDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Paragraph
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Difficulty</TableHead>
                      <TableHead className="min-w-[320px]">Content</TableHead>
                      <TableHead>Words</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <Badge
                            variant={
                              p.difficulty === 'easy'
                                ? 'default'
                                : p.difficulty === 'medium'
                                  ? 'secondary'
                                  : 'destructive'
                            }
                          >
                            {p.difficulty}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="line-clamp-2">{p.content}</div>
                        </TableCell>
                        <TableCell>{p.word_count}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(p)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
