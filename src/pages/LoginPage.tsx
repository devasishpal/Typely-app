import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { hasGuestTypingResults, mergeGuestTypingResults } from '@/lib/guestProgress';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [authPhase, setAuthPhase] = useState<'signin' | 'merge'>('signin');
  const [error, setError] = useState('');
  const { signInWithEmail, signInWithUsername, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

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
        setAuthPhase('merge');
        const mergeResult = await mergeGuestTypingResults(signedInProfile.id);

        if (mergeResult.error) {
          toast({
            title: 'Signed in, but sync failed',
            description: `${mergeResult.error} Your guest progress is still stored on this device.`,
            variant: 'destructive',
          });
        } else if (mergeResult.mergedCount > 0) {
          toast({
            title: 'Guest progress synced',
            description: `${mergeResult.mergedCount} result${mergeResult.mergedCount > 1 ? 's' : ''} saved to your account.`,
          });
        }
      }

      toast({
        title: 'Welcome back!',
        description: 'You have successfully signed in.',
      });
      navigate(safeNextRoute, { replace: true });
    }
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
          <CardDescription>Sign in to continue your typing journey</CardDescription>
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
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
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
                  {authPhase === 'merge' ? 'Saving progress...' : 'Signing in...'}
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
    </div>
  );
}

