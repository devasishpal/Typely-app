import { useEffect, useState } from 'react';
import { adminApi } from '@/db/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Trash2, Edit, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { TestParagraph } from '@/types';

export default function AdminContentTab() {
  const [paragraphs, setParagraphs] = useState<TestParagraph[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadParagraphs();
  }, []);

  const loadParagraphs = async () => {
    setLoading(true);
    const data = await adminApi.getAllTestParagraphs();
    setParagraphs(data);
    setLoading(false);
  };

  const handleDeleteParagraph = async (paragraphId: string) => {
    if (!confirm('Are you sure you want to delete this paragraph?')) return;

    try {
      await adminApi.deleteTestParagraph(paragraphId);
      toast({
        title: 'Paragraph Deleted',
        description: 'Test paragraph has been deleted successfully.',
      });
      loadParagraphs();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete paragraph.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading content...</div>;
  }

  const easyCount = paragraphs.filter(p => p.difficulty === 'easy').length;
  const mediumCount = paragraphs.filter(p => p.difficulty === 'medium').length;
  const hardCount = paragraphs.filter(p => p.difficulty === 'hard').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Test Paragraph Management</h3>
        <div className="flex gap-2">
          <Badge variant="outline">Easy: {easyCount}</Badge>
          <Badge variant="outline">Medium: {mediumCount}</Badge>
          <Badge variant="outline">Hard: {hardCount}</Badge>
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Difficulty</TableHead>
              <TableHead>Word Count</TableHead>
              <TableHead>Preview</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paragraphs.map((paragraph) => (
              <TableRow key={paragraph.id}>
                <TableCell>
                  <Badge 
                    variant={
                      paragraph.difficulty === 'easy' ? 'default' :
                      paragraph.difficulty === 'medium' ? 'secondary' :
                      'destructive'
                    }
                  >
                    {paragraph.difficulty}
                  </Badge>
                </TableCell>
                <TableCell>{paragraph.word_count} words</TableCell>
                <TableCell className="max-w-md">
                  <p className="truncate text-sm text-muted-foreground">
                    {paragraph.content.substring(0, 100)}...
                  </p>
                </TableCell>
                <TableCell>
                  {new Date(paragraph.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDeleteParagraph(paragraph.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
