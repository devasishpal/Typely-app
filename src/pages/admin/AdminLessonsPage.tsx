import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Pencil, Trash2, BookOpen, Info, X } from 'lucide-react';
import { lessonApi } from '@/db/api';
import { useToast } from '@/hooks/use-toast';
import type { Lesson, LessonCategory, LessonDifficulty } from '@/types';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export default function AdminLessonsPage() {
  const { toast } = useToast();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | LessonCategory>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<'all' | LessonDifficulty>('all');

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<LessonCategory>('home_row');
  const [difficulty, setDifficulty] = useState<LessonDifficulty>('beginner');
  const [orderIndex, setOrderIndex] = useState(1);
  const [content, setContent] = useState('');
  const [targetKeys, setTargetKeys] = useState('');

  useEffect(() => {
    loadLessons();
  }, []);

  const ENTER_SYMBOL = '\u23CE';
  const contentToDisplay = (value: string) => value.replace(/\n/g, `${ENTER_SYMBOL}\n`);
  const contentToStorage = (value: string) =>
    value
      .replace(new RegExp(`${ENTER_SYMBOL}\\n`, 'g'), '\n')
      .replace(new RegExp(ENTER_SYMBOL, 'g'), '\n');
  const formatCategoryLabel = (value: LessonCategory) =>
    value
      .split('_')
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' ');

  const loadLessons = async () => {
    setLoading(true);
    const data = await lessonApi.getAllLessons();
    setLessons(data);
    setLoading(false);
  };

  const handleOpenDialog = (lesson?: Lesson) => {
    if (lesson) {
      setEditingLesson(lesson);
      setTitle(lesson.title);
      setDescription(lesson.description || '');
      setCategory(lesson.category);
      setDifficulty(lesson.difficulty);
      setOrderIndex(lesson.order_index);
      setContent(contentToDisplay(lesson.content));
      setTargetKeys(lesson.target_keys.join(', '));
    } else {
      setEditingLesson(null);
      setTitle('');
      setDescription('');
      setCategory('home_row');
      setDifficulty('beginner');
      setOrderIndex(lessons.length + 1);
      setContent('');
      setTargetKeys('');
    }
    setDialogOpen(true);
  };

  const handleSaveLesson = async () => {
    if (!title || !content) {
      toast({
        title: 'Error',
        description: 'Title and content are required.',
        variant: 'destructive',
      });
      return;
    }

    const lessonData = {
      title,
      description: description || null,
      category,
      difficulty,
      order_index: orderIndex,
      content: contentToStorage(content),
      target_keys: targetKeys.split(',').map((k) => k.trim()).filter(Boolean),
      finger_guidance: {},
      is_locked: false,
    };

    try {
      if (editingLesson) {
        await lessonApi.updateLesson(editingLesson.id, lessonData);
      } else {
        await lessonApi.createLesson(lessonData);
      }
      toast({
        title: 'Success',
        description: `Lesson ${editingLesson ? 'updated' : 'created'} successfully.`,
      });
      setDialogOpen(false);
      loadLessons();
    } catch (err: any) {
      const message = err?.message || `Failed to ${editingLesson ? 'update' : 'create'} lesson.`;
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('Are you sure you want to delete this lesson?')) return;

    const success = await lessonApi.deleteLesson(lessonId);

    if (success) {
      toast({
        title: 'Success',
        description: 'Lesson deleted successfully.',
      });
      loadLessons();
    } else {
      toast({
        title: 'Error',
        description: 'Failed to delete lesson.',
        variant: 'destructive',
      });
    }
  };

  const filteredLessons = lessons.filter((lesson) => {
    const matchesSearch =
      !search ||
      lesson.title.toLowerCase().includes(search.toLowerCase()) ||
      (lesson.description || '').toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filterCategory === 'all' || lesson.category === filterCategory;
    const matchesDifficulty = filterDifficulty === 'all' || lesson.difficulty === filterDifficulty;
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  return (
    <AdminLayout>
      <div className="space-y-8">
      <Card className="bg-gradient-card shadow-card">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold gradient-text">Lesson Management</h1>
              <p className="text-muted-foreground">Create, edit, and manage typing lessons</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => handleOpenDialog()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Lesson
                  </Button>
                </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden p-0 grid grid-rows-[auto,1fr,auto]">
              <div className="sticky top-0 z-10 border-b border-border/60 bg-background/95 backdrop-blur px-5 py-2">
                <DialogHeader className="gap-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <DialogTitle className="text-base">
                        {editingLesson ? 'Edit Lesson' : 'Create New Lesson'}
                      </DialogTitle>
                      <DialogDescription className="text-xs">
                        {editingLesson ? 'Update the lesson details' : 'Add a new typing lesson'}
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

              <ScrollArea className="h-full min-h-0 px-5 py-3">
                <div className="space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Lesson title"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lessonCategory">Category</Label>
                  <Select value={category} onValueChange={(v) => setCategory(v as LessonCategory)}>
                    <SelectTrigger id="lessonCategory" aria-label="Lesson category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="home_row">Home Row</SelectItem>
                      <SelectItem value="top_row">Top Row</SelectItem>
                      <SelectItem value="bottom_row">Bottom Row</SelectItem>
                      <SelectItem value="numbers">Numbers</SelectItem>
                      <SelectItem value="special_chars">Special Chars</SelectItem>
                      <SelectItem value="punctuation">Punctuation</SelectItem>
                      <SelectItem value="combination">Combination</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lessonDifficulty">Difficulty</Label>
                  <Select value={difficulty} onValueChange={(v) => setDifficulty(v as LessonDifficulty)}>
                    <SelectTrigger id="lessonDifficulty" aria-label="Lesson difficulty">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orderIndex">Order</Label>
                  <Input
                    id="orderIndex"
                    type="number"
                    value={orderIndex}
                    onChange={(e) => setOrderIndex(parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>

                <div className="space-y-2 min-w-0 max-w-full">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key !== 'Enter') return;
                      e.preventDefault();
                      const target = e.currentTarget;
                      const start = target.selectionStart ?? content.length;
                      const end = target.selectionEnd ?? content.length;
                      const next = `${content.slice(0, start)}${ENTER_SYMBOL}\n${content.slice(end)}`;
                      setContent(next);
                      requestAnimationFrame(() => {
                        const cursor = start + ENTER_SYMBOL.length + 1;
                        target.setSelectionRange(cursor, cursor);
                      });
                    }}
                    onPaste={(e) => {
                      e.preventDefault();
                      const target = e.currentTarget;
                      const paste = e.clipboardData.getData('text').replace(/\n/g, `${ENTER_SYMBOL}\n`);
                      const start = target.selectionStart ?? content.length;
                      const end = target.selectionEnd ?? content.length;
                      const next = `${content.slice(0, start)}${paste}${content.slice(end)}`;
                      setContent(next);
                      requestAnimationFrame(() => {
                        const cursor = start + paste.length;
                        target.setSelectionRange(cursor, cursor);
                      });
                    }}
                    placeholder="Typing content for this lesson"
                    wrap="soft"
                    rows={8}
                    className="field-sizing-fixed h-[240px] min-h-[240px] max-h-[240px] w-full min-w-0 max-w-full resize-none overflow-y-auto overflow-x-hidden whitespace-pre-wrap break-all [overflow-wrap:anywhere] [word-break:break-all]"
                  />
                <div className="max-h-40 min-w-0 max-w-full overflow-y-auto overflow-x-hidden rounded-md border border-border bg-muted/30 p-3 text-sm font-mono text-foreground whitespace-pre-wrap break-all [overflow-wrap:anywhere] [word-break:break-all]">
                  {content ? (
                    contentToStorage(content).split('\n').map((segment, index, arr) => (
                      <span key={`${segment}-${index}`}>
                        {segment}
                        {index < arr.length - 1 ? (
                          <>
                            <span className="typing-enter">{ENTER_SYMBOL}</span>
                            <br />
                          </>
                        ) : null}
                      </span>
                    ))
                  ) : (
                    <span className="text-muted-foreground">Lesson preview will appear here.</span>
                  )}
                </div>
              </div>

                <div className="space-y-2">
                  <Label htmlFor="targetKeys">Target Keys (comma-separated)</Label>
                  <Input
                    id="targetKeys"
                    value={targetKeys}
                    onChange={(e) => setTargetKeys(e.target.value)}
                    placeholder="a, s, d, f"
                  />
                </div>
                </div>
              </ScrollArea>

              <div className="border-t border-border/60 bg-background/95 backdrop-blur px-5 py-2">
                <DialogFooter className="sm:justify-end">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveLesson}>
                    {editingLesson ? 'Update' : 'Create'} Lesson
                  </Button>
                </DialogFooter>
              </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge className="bg-primary/10 text-primary border border-primary/20">
              {lessons.length} Total
            </Badge>
            <Badge className="bg-info/10 text-info border border-info/20">
              {lessons.filter((l) => l.difficulty === 'beginner').length} Beginner
            </Badge>
            <Badge className="bg-success/10 text-success border border-success/20">
              {lessons.filter((l) => l.difficulty === 'intermediate').length} Intermediate
            </Badge>
            <Badge className="bg-warning/10 text-warning border border-warning/20">
              {lessons.filter((l) => l.difficulty === 'advanced').length} Advanced
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-card shadow-card card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Lessons</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{lessons.length}</div>
              <p className="text-xs text-muted-foreground mt-1">All lessons in your library</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-card card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Beginner Lessons</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {lessons.filter((l) => l.difficulty === 'beginner').length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Easy starters</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-card card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Intermediate Lessons</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {lessons.filter((l) => l.difficulty === 'intermediate').length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Skill builders</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-card card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Advanced Lessons</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {lessons.filter((l) => l.difficulty === 'advanced').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Advanced practice</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-gradient-card shadow-card">
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="lessonSearch">Search</Label>
              <Input
                id="lessonSearch"
                placeholder="Search by title or description"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="filterCategory">Category</Label>
              <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v as typeof filterCategory)}>
                <SelectTrigger id="filterCategory" aria-label="Filter by category" className="bg-background/80">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="home_row">Home Row</SelectItem>
                  <SelectItem value="top_row">Top Row</SelectItem>
                  <SelectItem value="bottom_row">Bottom Row</SelectItem>
                  <SelectItem value="numbers">Numbers</SelectItem>
                  <SelectItem value="special_chars">Special Chars</SelectItem>
                  <SelectItem value="punctuation">Punctuation</SelectItem>
                  <SelectItem value="combination">Combination</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="filterDifficulty">Difficulty</Label>
              <Select value={filterDifficulty} onValueChange={(v) => setFilterDifficulty(v as typeof filterDifficulty)}>
                <SelectTrigger id="filterDifficulty" aria-label="Filter by difficulty" className="bg-background/80">
                  <SelectValue placeholder="All difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lessons Table */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle>All Lessons</CardTitle>
          <CardDescription>Manage typing lessons</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full bg-muted" />
              ))}
            </div>
          ) : filteredLessons.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No lessons match your filters.</p>
              <Button className="mt-4" onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Lesson
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Order</TableHead>
                    <TableHead className="min-w-[220px]">Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Difficulty</TableHead>
                    <TableHead className="min-w-[180px]">Target Keys</TableHead>
                    <TableHead className="whitespace-nowrap">Target WPM</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLessons.map((lesson) => (
                    <TableRow key={lesson.id}>
                      <TableCell>{lesson.order_index}</TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-start gap-2">
                          <span>{lesson.title}</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="inline-flex items-center justify-center rounded-full border border-border bg-background/80 text-muted-foreground hover:text-foreground hover:border-primary/60 hover:bg-primary/10 h-6 w-6 transition"
                                aria-label="Lesson description"
                              >
                                <Info className="h-3 w-3" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs text-sm">
                              {lesson.description ? lesson.description : 'No description yet.'}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{formatCategoryLabel(lesson.category)}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            lesson.difficulty === 'beginner'
                              ? 'default'
                              : lesson.difficulty === 'intermediate'
                                ? 'secondary'
                                : 'destructive'
                          }
                        >
                          {lesson.difficulty === 'beginner'
                            ? 'Beginner'
                            : lesson.difficulty === 'intermediate'
                              ? 'Intermediate'
                              : 'Advanced'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {lesson.target_keys?.length ? lesson.target_keys.join(', ') : '-'}
                      </TableCell>
                      <TableCell className="text-sm">{lesson.target_wpm ?? '-'}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(lesson)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteLesson(lesson.id)}
                          >
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
