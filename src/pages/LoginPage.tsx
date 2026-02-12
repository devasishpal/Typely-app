import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signInWithEmail, signInWithUsername, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

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
      setError('Admin accounts must sign in from /admin/login');
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
      toast({
        title: 'Welcome back!',
        description: 'You have successfully signed in.',
      });
      navigate('/dashboard', { replace: true });
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
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
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
