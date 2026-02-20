import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { clearLocalUserData, hasGuestTypingResults, mergeGuestTypingResults } from '@/lib/guestProgress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authPhase, setAuthPhase] = useState<'signin' | 'merge' | 'choice'>('signin');
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [pendingRoute, setPendingRoute] = useState('/dashboard');
  const [error, setError] = useState('');
  const { signInWithEmail, signInWithUsername, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const finalizeLogin = (route: string) => {
    toast({
      title: 'Welcome back!',
      description: 'You have successfully signed in.',
    });
    navigate(route, { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setAuthPhase('signin');

    const normalizedIdentifier = identifier.trim();
    const isEmail = normalizedIdentifier.includes('@');
    if (isEmail && !normalizedIdentifier.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    const { error, user: signedInProfile } = isEmail
      ? await signInWithEmail(normalizedIdentifier, password)
      : await signInWithUsername(normalizedIdentifier, password);

    // Prevent admins logging in from the public login page
    if (signedInProfile && signedInProfile.role === 'admin') {
      await signOut();
      setError('Admin accounts must sign in from /admin_Dev');
      setLoading(false);
      return;
    }

    if (error) {
      // Provide more helpful error messages
      let errorMessage = error.message || 'Failed to sign in';
      
      if (errorMessage.includes('Invalid') || errorMessage.includes('credentials')) {
        errorMessage = 'Invalid username or password. Please check your credentials and try again.';
      } else if (errorMessage.includes('not found') || errorMessage.includes('exist')) {
        errorMessage = 'Account not found. Please check your username or sign up for a new account.';
      } else if (errorMessage.includes('Email not confirmed')) {
        errorMessage = 'Please confirm your email address before signing in.';
      }
      
      setError(errorMessage);
      setLoading(false);
    } else {
      const searchParams = new URLSearchParams(location.search);
      const nextFromQuery = searchParams.get('next');
      const nextFromState =
        typeof (location.state as { from?: unknown } | null)?.from === 'string'
          ? ((location.state as { from: string }).from || null)
          : null;
      const nextRoute = (nextFromQuery || nextFromState || '/dashboard').trim();
      const safeNextRoute =
        nextRoute.startsWith('/') && !nextRoute.startsWith('/admin_Dev')
          ? nextRoute
          : '/dashboard';

      if (signedInProfile && hasGuestTypingResults()) {
        setPendingUserId(signedInProfile.id);
        setPendingRoute(safeNextRoute);
        setAuthPhase('choice');
        setSyncDialogOpen(true);
        setLoading(false);
        return;
      }

      setLoading(false);
      finalizeLogin(safeNextRoute);
    }
  };

  const handleSyncChoice = async (syncNow: boolean) => {
    const userId = pendingUserId;
    if (!userId) {
      setSyncDialogOpen(false);
      setAuthPhase('signin');
      setLoading(false);
      finalizeLogin(pendingRoute);
      return;
    }

    setLoading(true);
    setAuthPhase('merge');

    if (syncNow) {
      const mergeResult = await mergeGuestTypingResults(userId, { clearLocalOnSuccess: true });

      if (mergeResult.error) {
        toast({
          title: 'Signed in, but sync failed',
          description: `${mergeResult.error} Your local progress is still on this device.`,
          variant: 'destructive',
        });
      } else if (mergeResult.mergedCount > 0) {
        toast({
          title: 'Progress synced',
          description: `${mergeResult.mergedCount} result${mergeResult.mergedCount === 1 ? '' : 's'} moved to your account.`,
        });
      }
    } else {
      clearLocalUserData();
      toast({
        title: 'Started fresh',
        description: 'Local guest data was cleared for this account session.',
      });
    }

    setSyncDialogOpen(false);
    setPendingUserId(null);
    setAuthPhase('signin');
    setLoading(false);
    finalizeLogin(pendingRoute);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
              <img
                src="/favicon.png"
                alt="Typely logo"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Welcome to TYPELY</CardTitle>
          <CardDescription>Sign in is optional and only needed for cloud sync.</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="identifier">Email or Username</Label>
              <Input
                id="identifier"
                type="text"
                autoComplete="username"
                placeholder="Email address or username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="flex justify-end">
                <Link
                  to="/forgot-password"
                  className="cursor-pointer text-xs font-medium text-primary transition-colors hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {authPhase === 'merge' ? 'Syncing progress...' : 'Signing in...'}
                </span>
              ) : (
                'Sign In'
              )}
            </Button>
          </CardContent>
        </form>

        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-center text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary hover:underline font-medium">
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>

      <Dialog
        open={syncDialogOpen}
        onOpenChange={(open) => {
          if (!open) return;
          if (!loading) setSyncDialogOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sync local progress?</DialogTitle>
            <DialogDescription>
              We found local guest progress on this device. Choose whether to sync it to your account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSyncChoice(false)}
              disabled={loading}
            >
              Start Fresh
            </Button>
            <Button
              type="button"
              onClick={() => handleSyncChoice(true)}
              disabled={loading}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Syncing...
                </span>
              ) : (
                'Yes, Sync Now'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

