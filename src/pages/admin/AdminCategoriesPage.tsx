import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Edit2, AlertCircle, Tag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { LessonCategory } from '@/types';

const lessonCategoryLabels: { value: LessonCategory; label: string }[] = [
  { value: 'home_row', label: 'Home Row' },
  { value: 'top_row', label: 'Top Row' },
  { value: 'bottom_row', label: 'Bottom Row' },
  { value: 'numbers', label: 'Numbers' },
  { value: 'special_chars', label: 'Special Chars' },
  { value: 'punctuation', label: 'Punctuation' },
  { value: 'combination', label: 'Combination' },
];

const testCategoryLabels = ['Easy', 'Medium', 'Hard', 'Custom'];

interface Category {
  id: string;
  name: string;
  created_at: string;
}

export default function AdminCategoriesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/', { replace: true });
      return;
    }
    loadCategories();
  }, [user, navigate]);

  const loadCategories = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error: err } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (err) throw err;
      setCategories(data || []);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Failed to load categories';
      setError(errMsg);
      toast({
        title: 'Error',
        description: errMsg,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setCategoryName(category.name);
    } else {
      setEditingCategory(null);
      setCategoryName('');
    }
    setOpenDialog(true);
  };

  const handleSaveCategory = async () => {
    if (!categoryName.trim()) {
      toast({
        title: 'Error',
        description: 'Category name is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingCategory) {
        // Update existing category
        const { error: err } = await supabase
          .from('categories')
          .update({ name: categoryName })
          .eq('id', editingCategory.id);

        if (err) throw err;

        toast({
          title: 'Success',
          description: 'Category updated successfully',
        });
      } else {
        // Create new category
        const { error: err } = await supabase
          .from('categories')
          .insert({ name: categoryName });

        if (err) throw err;

        toast({
          title: 'Success',
          description: 'Category created successfully',
        });
      }

      setOpenDialog(false);
      loadCategories();
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Failed to save category';
      toast({
        title: 'Error',
        description: errMsg,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      const { error: err } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (err) throw err;

      toast({
        title: 'Success',
        description: 'Category deleted successfully',
      });

      loadCategories();
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Failed to delete category';
      toast({
        title: 'Error',
        description: errMsg,
        variant: 'destructive',
      });
    }
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight gradient-text">Manage Categories</h1>
            <p className="text-muted-foreground">Create and manage lesson categories</p>
          </div>
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
                <DialogDescription>
                  {editingCategory ? 'Update the category name' : 'Enter the name for the new category'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="categoryName">Category Name *</Label>
                  <Input
                    id="categoryName"
                    name="categoryName"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    placeholder="Enter category name"
                  />
                </div>
                <div className="flex gap-2 justify-end pt-4">
                  <Button variant="outline" onClick={() => setOpenDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveCategory}>
                    {editingCategory ? 'Update' : 'Create'} Category
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats */}
        <Card className="bg-gradient-card shadow-card card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Total Categories</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
          </CardContent>
        </Card>

        {/* App Categories */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle>Lesson Categories (App)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {lessonCategoryLabels.map((category) => (
                  <span
                    key={category.value}
                    className="text-xs px-3 py-1 rounded-full border border-border bg-background/60"
                  >
                    {category.label}
                  </span>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                These are used in the user lessons tab.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle>Test Categories (App)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {testCategoryLabels.map((label) => (
                  <span
                    key={label}
                    className="text-xs px-3 py-1 rounded-full border border-border bg-background/60"
                  >
                    {label}
                  </span>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                These are used in the user typing test tab.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Categories Table */}
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle>Categories ({categories.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : categories.length === 0 ? (
              <p className="text-muted-foreground">No categories found. Create one to get started.</p>
            ) : (
              <div className="space-y-3">
                {/* Mobile cards */}
                <div className="space-y-3 md:hidden">
                  {categories.map((category) => (
                    <Card key={category.id} className="bg-background/60 border border-border">
                      <CardContent className="pt-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{category.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(category.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleOpenDialog(category)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleDeleteCategory(category.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categories.map((category) => (
                        <TableRow key={category.id}>
                          <TableCell className="font-medium">{category.name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(category.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenDialog(category)}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteCategory(category.id)}
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
