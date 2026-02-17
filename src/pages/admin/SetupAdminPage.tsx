import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function SetupAdminPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [setupSecret, setSetupSecret] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSetupAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    setSuccess(false);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('setup-admin', {
        method: 'POST',
        headers: {
          'x-setup-secret': setupSecret.trim(),
        },
        body: {
          setupSecret: setupSecret.trim(),
          username: username.trim(),
          email: email.trim().toLowerCase(),
          password,
        },
      });

      if (functionError) {
        throw functionError;
      }

      if (data?.success) {
        setSuccess(true);
        setMessage(data.message || 'Admin account created successfully.');
        setTimeout(() => {
          navigate('/admin_Dev');
        }, 2000);
      } else {
        setError(data?.error || data?.message || 'Failed to create admin user');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred while setting up admin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Setup Admin Account</CardTitle>
          <CardDescription>
            Use the setup secret and provide secure admin credentials.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {success && (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-600">
                {message}
                <br />
                <span className="text-sm">Redirecting to admin login...</span>
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!success && (
            <form className="space-y-4" onSubmit={handleSetupAdmin}>
              <div className="space-y-2">
                <Label htmlFor="setup-secret">Setup Secret</Label>
                <Input
                  id="setup-secret"
                  type="password"
                  autoComplete="off"
                  placeholder="Enter setup secret"
                  value={setupSecret}
                  onChange={(e) => setSetupSecret(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-username">Admin Username</Label>
                <Input
                  id="admin-username"
                  type="text"
                  autoComplete="off"
                  placeholder="e.g. typely_admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-email">Admin Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  autoComplete="off"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-password">Admin Password</Label>
                <Input
                  id="admin-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Strong password (12+ chars)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="text-sm text-muted-foreground">
                Keep this endpoint enabled only during one-time setup.
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Admin Account...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Create Admin Account
                  </>
                )}
              </Button>

              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => navigate('/admin_Dev')}
                  className="text-sm"
                >
                  Already have an account? Sign in
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

