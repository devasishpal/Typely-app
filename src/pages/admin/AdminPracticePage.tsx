import { useEffect, useMemo, useState } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Pencil, Trash2, Timer, X } from 'lucide-react';
import { adminApi } from '@/db/api';
import { useToast } from '@/hooks/use-toast';
import type { PracticeTest } from '@/types';
import {
  inferPracticeCategory,
  PRACTICE_CATEGORY_LABELS,
  PRACTICE_CATEGORY_ORDER,
  practiceCategoryToDuration,
  type PracticeCategory,
} from '@/lib/practiceCategories';

const CONTENT_PREVIEW_MAX_LENGTH = 120;

const toContentPreview = (value: string) => {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= CONTENT_PREVIEW_MAX_LENGTH) return normalized;
  return `${normalized.slice(0, CONTENT_PREVIEW_MAX_LENGTH)}...`;
};

export default function AdminPracticePage() {
  const { toast } = useToast();
  const [practiceTests, setPracticeTests] = useState<PracticeTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PracticeTest | null>(null);

  const [activeCategory, setActiveCategory] = useState<PracticeCategory>('word');
  const [search, setSearch] = useState('');

  // Form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<PracticeCategory>('word');
  const [content, setContent] = useState('');

  useEffect(() => {
    loadPracticeTests();
  }, []);

  const loadPracticeTests = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const data = await adminApi.getAllPracticeTests();
      setPracticeTests(data);
    } catch (err: any) {
      const msg =
        err?.message ||
        'Failed to load practice tests. Ensure the practice_tests table exists.';
      setLoadError(msg);
      toast({
        title: 'Error',
        description: msg,
        variant: 'destructive',
      });
    }
    setLoading(false);
  };

  const handleOpenDialog = (practice?: PracticeTest) => {
    if (practice) {
      setEditing(practice);
      setTitle(practice.title);
      setCategory(inferPracticeCategory(practice));
      setContent(practice.content);
    } else {
      setEditing(null);
      setTitle('');
      setCategory(activeCategory);
      setContent('');
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      toast({
        title: 'Error',
        description: 'Title and content are required.',
        variant: 'destructive',
      });
      return;
    }

    const payload = {
      title: title.trim(),
      content: content.trim(),
      duration_minutes: practiceCategoryToDuration(category),
      word_count: content.trim().split(/\s+/).filter(Boolean).length,
    };

    try {
      if (editing) {
        await adminApi.updatePracticeTest(editing.id, payload);
        toast({ title: 'Success', description: 'Practice test updated.' });
      } else {
        await adminApi.createPracticeTest(payload);
        toast({ title: 'Success', description: 'Practice test created.' });
      }
      setDialogOpen(false);
      loadPracticeTests();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.message || 'Failed to save practice test.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this practice test?')) return;
    try {
      await adminApi.deletePracticeTest(id);
      toast({ title: 'Deleted', description: 'Practice test removed.' });
      loadPracticeTests();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.message || 'Failed to delete practice test.',
        variant: 'destructive',
      });
    }
  };

  const practiceByCategory = useMemo(() => {
    const grouped: Record<PracticeCategory, PracticeTest[]> = {
      word: [],
      sentence: [],
      long: [],
    };

    for (const practice of practiceTests) {
      grouped[inferPracticeCategory(practice)].push(practice);
    }

    return grouped;
  }, [practiceTests]);

  const categoryCounts = useMemo(
    () => ({
      word: practiceByCategory.word.length,
      sentence: practiceByCategory.sentence.length,
      long: practiceByCategory.long.length,
    }),
    [practiceByCategory]
  );

  const categoryList = useMemo(
    () => practiceByCategory[activeCategory],
    [practiceByCategory, activeCategory]
  );

  const filtered = useMemo(() => {
    return categoryList.filter((practice) => {
      return (
        !search ||
        practice.title.toLowerCase().includes(search.toLowerCase()) ||
        practice.content.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [categoryList, search]);

  const totalWords = practiceTests.reduce((sum, practice) => sum + practice.word_count, 0);
  const averageWords = practiceTests.length > 0 ? Math.round(totalWords / practiceTests.length) : 0;

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Practice Management</h1>
            <p className="text-muted-foreground">Create and manage untimed practice sets</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Practice
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden p-0 flex flex-col">
              <div className="sticky top-0 z-10 border-b border-border/60 bg-background/95 backdrop-blur px-6 py-3">
                <DialogHeader className="gap-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <DialogTitle className="text-base">
                        {editing ? 'Edit Practice' : 'Create Practice'}
                      </DialogTitle>
                      <DialogDescription className="text-xs">
                        {editing ? 'Update the practice content' : 'Add a new practice set'}
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

              <div className="flex-1 overflow-y-auto px-6 py-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="practiceCategory">Category</Label>
                    <Select
                      value={category}
                      onValueChange={(value) => setCategory(value as PracticeCategory)}
                    >
                      <SelectTrigger id="practiceCategory" aria-label="Select practice category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRACTICE_CATEGORY_ORDER.map((option) => (
                          <SelectItem key={option} value={option}>
                            {PRACTICE_CATEGORY_LABELS[option]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="practiceTitle">Title</Label>
                    <Input
                      id="practiceTitle"
                      name="practiceTitle"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Practice title"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="practiceContent">Content</Label>
                    <Textarea
                      id="practiceContent"
                      name="practiceContent"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Type practice content..."
                      rows={10}
                      className="min-h-[220px] max-h-[55vh] resize-y overflow-y-auto"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-border/60 bg-background/95 backdrop-blur px-6 py-3">
                <DialogFooter className="sm:justify-end">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>{editing ? 'Update' : 'Create'}</Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="bg-gradient-card shadow-card card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Practices</CardTitle>
              <Timer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{practiceTests.length}</div>
              <p className="text-xs text-muted-foreground mt-1">All available practice sets</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-card card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Words</CardTitle>
              <Timer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageWords}</div>
              <p className="text-xs text-muted-foreground mt-1">Words per practice set</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-card card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Words</CardTitle>
              <Timer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalWords}</div>
              <p className="text-xs text-muted-foreground mt-1">Words across all practice sets</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-gradient-card shadow-card">
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Tabs
                value={activeCategory}
                onValueChange={(value) => setActiveCategory(value as PracticeCategory)}
              >
                <TabsList className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3">
                  {PRACTICE_CATEGORY_ORDER.map((practiceCategory) => (
                    <TabsTrigger key={practiceCategory} value={practiceCategory}>
                      {PRACTICE_CATEGORY_LABELS[practiceCategory]} ({categoryCounts[practiceCategory]})
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            <div className="max-w-xl space-y-2">
              <Label htmlFor="practiceSearch">Search</Label>
              <Input
                id="practiceSearch"
                name="practiceSearch"
                placeholder="Search by title or content"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle>{PRACTICE_CATEGORY_LABELS[activeCategory]}</CardTitle>
            <CardDescription>Manage untimed practice content</CardDescription>
          </CardHeader>
          <CardContent>
            {loadError && (
              <p className="text-sm text-destructive mb-4">
                {loadError}
              </p>
            )}
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full bg-muted" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-muted-foreground">No practice sets match this category and search.</p>
                <Button className="mt-4" onClick={() => handleOpenDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Practice In This Category
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead className="min-w-[200px]">Title</TableHead>
                      <TableHead className="min-w-[320px]">Content</TableHead>
                      <TableHead>Words</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((practice) => {
                      const practiceCategory = inferPracticeCategory(practice);
                      return (
                        <TableRow key={practice.id}>
                          <TableCell>
                            <Badge variant="outline">{PRACTICE_CATEGORY_LABELS[practiceCategory]}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">{practice.title}</TableCell>
                          <TableCell className="text-sm">
                            <div
                              className="max-w-[28rem] break-words whitespace-normal"
                              title={practice.content}
                            >
                              {toContentPreview(practice.content)}
                            </div>
                          </TableCell>
                          <TableCell>{practice.word_count}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenDialog(practice)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(practice.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
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
