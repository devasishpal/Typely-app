import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function SetupAdminPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSetupAdmin = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    setSuccess(false);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('setup-admin', {
        method: 'POST',
      });

      if (functionError) {
        throw functionError;
      }

      if (data.success) {
        setSuccess(true);
        setMessage(data.message);
        setTimeout(() => {
          navigate('/admin_Dev');
        }, 3000);
      } else {
        setError(data.message || 'Failed to create admin user');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while setting up admin');
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
          <CardDescription>Create the default admin account for TYPELY</CardDescription>
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
            <>
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <h3 className="font-semibold text-sm">Admin Credentials:</h3>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Username:</span> Dev_admin_Typely</p>
                  <p><span className="font-medium">Password:</span> A251103a@#$%</p>
                </div>
              </div>

              <div className="text-sm text-muted-foreground space-y-2">
                <p>This will create an admin account with the credentials shown above.</p>
                <p>After creation, you can sign in at the admin login page.</p>
              </div>

              <Button 
                onClick={handleSetupAdmin} 
                disabled={loading}
                className="w-full"
              >
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
                  variant="link" 
                  onClick={() => navigate('/admin_Dev')}
                  className="text-sm"
                >
                  Already have an account? Sign in
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

