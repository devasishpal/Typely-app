import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Mail } from 'lucide-react';
import { supabase } from '@/db/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

const RESET_PASSWORD_REDIRECT_URL = 'https://typelyapp.vercel.app/reset-password';
const SUCCESS_MESSAGE = 'If this email is registered, a reset link has been sent.';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      const message = 'Please enter a valid email address.';
      setError(message);
      toast({
        title: 'Invalid email',
        description: message,
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: RESET_PASSWORD_REDIRECT_URL,
    });
    setLoading(false);

    if (resetError) {
      const message = resetError.message || 'Unable to send reset link. Please try again.';
      setError(message);
      toast({
        title: 'Failed to send reset link',
        description: message,
        variant: 'destructive',
      });
      return;
    }

    setSuccessMessage(SUCCESS_MESSAGE);
    toast({
      title: 'Reset link sent',
      description: SUCCESS_MESSAGE,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Mail className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl font-bold">Forgot Password</CardTitle>
          <CardDescription>
            Enter your registered email address to receive a password reset link.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {successMessage && (
              <Alert>
                <AlertDescription>{successMessage}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                disabled={loading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </CardContent>
        </form>

        <CardFooter className="justify-center">
          <Link
            to="/login"
            className="text-sm font-medium text-primary transition-colors hover:underline"
          >
            Back to Sign In
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
