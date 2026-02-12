import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Trash2 } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function DeleteAccountPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canDelete = Boolean(user?.id) && confirmText.trim().toUpperCase() === 'DELETE';

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user?.id) {
      setError('Please sign in to continue.');
      return;
    }

    if (!canDelete) {
      setError('Type DELETE to confirm account deletion.');
      return;
    }

    if (!isSupabaseConfigured) {
      setError(
        'Supabase is not configured. Set VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (or VITE_PUBLIC_SUPABASE_URL / VITE_PUBLIC_SUPABASE_ANON_KEY).'
      );
      return;
    }

    setLoading(true);
    try {
      const { error: requestError } = await supabase.from('account_deletion_requests').insert({
        user_id: user.id,
        status: 'pending',
        source: 'app',
      });

      if (requestError) {
        if ((requestError as { code?: string }).code === '23505') {
          throw new Error('A deletion request is already pending for this account.');
        }
        throw new Error(requestError.message || 'Failed to submit deletion request.');
      }

      toast({
        title: 'Deletion request submitted',
        description: 'Your request was submitted. Our system will process account deletion shortly.',
      });
      await supabase.auth.signOut();
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-background p-4">
      <Card className="w-full max-w-md border-destructive/30">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <Trash2 className="w-8 h-8 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-destructive">Request account deletion</CardTitle>
          <CardDescription>
            This submits a deletion request for secure processing. Your account will be removed permanently.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleDelete}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You are about to submit deletion for{' '}
                <span className="font-medium">{profile?.username || 'your account'}</span>. All data
                will be removed.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="confirmDelete">Type DELETE to confirm</Label>
              <Input
                id="confirmDelete"
                type="text"
                autoComplete="off"
                placeholder="DELETE"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                disabled={loading}
              />
            </div>

            <Button type="submit" className="w-full" variant="destructive" disabled={loading || !canDelete}>
              {loading ? 'Submitting request...' : 'Submit deletion request'}
            </Button>
          </CardContent>
        </form>

        <div className="pb-6 text-center text-sm text-muted-foreground">
          Changed your mind?{' '}
          <Link to="/profile" className="text-primary hover:underline font-medium">
            Back to profile
          </Link>
        </div>
      </Card>
    </div>
  );
}
