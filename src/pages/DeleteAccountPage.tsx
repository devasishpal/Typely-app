import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, Trash2 } from 'lucide-react';
import type { EmailOtpType } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

const DELETE_LINK_VERIFICATION_KEY = 'typely_delete_link_verification';
const DELETE_LINK_VERIFICATION_TTL_MS = 30 * 60 * 1000;
const SESSION_EXPIRED_MESSAGE = 'Session expired. Open your email link again and retry.';
const DELETE_ACCOUNT_API_PATH = '/api/account/delete';

interface PersistedDeleteLinkVerification {
  userId: string;
  verifiedAt: number;
}

interface DeleteUserFunctionResponse {
  success?: boolean;
  error?: string;
  message?: string;
}

export default function DeleteAccountPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const hasDeleteFlowParam = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    return searchParams.get('flow') === 'delete-account';
  }, [location.search]);

  const hasMagicLinkPayload = useMemo(() => {
    const hashParams = new URLSearchParams(
      location.hash.startsWith('#') ? location.hash.slice(1) : location.hash
    );
    const searchParams = new URLSearchParams(location.search);

    const hasMagicLinkType =
      hashParams.get('type') === 'magiclink' || searchParams.get('type') === 'magiclink';
    const hasOtpPayload =
      hashParams.has('access_token') ||
      hashParams.has('token') ||
      hashParams.has('token_hash') ||
      searchParams.has('token_hash') ||
      searchParams.has('code');

    return hasMagicLinkType && hasOtpPayload;
  }, [location.hash, location.search]);

  const hasPersistedDeleteVerification = useMemo(() => {
    if (!user?.id) return false;

    try {
      const rawValue = window.localStorage.getItem(DELETE_LINK_VERIFICATION_KEY);
      if (!rawValue) return false;

      const parsed = JSON.parse(rawValue) as Partial<PersistedDeleteLinkVerification>;
      if (
        typeof parsed.userId !== 'string' ||
        typeof parsed.verifiedAt !== 'number'
      ) {
        window.localStorage.removeItem(DELETE_LINK_VERIFICATION_KEY);
        return false;
      }

      const isSameUser = parsed.userId === user.id;
      const isFresh = Date.now() - parsed.verifiedAt <= DELETE_LINK_VERIFICATION_TTL_MS;
      if (!isSameUser || !isFresh) {
        window.localStorage.removeItem(DELETE_LINK_VERIFICATION_KEY);
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    if (!(hasDeleteFlowParam || hasMagicLinkPayload)) return;

    const payload: PersistedDeleteLinkVerification = {
      userId: user.id,
      verifiedAt: Date.now(),
    };

    try {
      window.localStorage.setItem(DELETE_LINK_VERIFICATION_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage access failures and continue with in-URL verification.
    }
  }, [user?.id, hasDeleteFlowParam, hasMagicLinkPayload]);

  const isVerifiedDeleteLink =
    hasDeleteFlowParam || hasMagicLinkPayload || hasPersistedDeleteVerification;
  const canDelete =
    Boolean(user?.id) && isVerifiedDeleteLink && confirmText.trim().toUpperCase() === 'DELETE';

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user?.id) {
      setError('Please sign in to continue.');
      return;
    }

    if (!isVerifiedDeleteLink) {
      setError('Open the secure account deletion link from your email to continue.');
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
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

      const parseDeleteResponse = async (response: Response) => {
        const responseText = await response.text();
        let payload: DeleteUserFunctionResponse | null = null;
        try {
          payload = responseText ? (JSON.parse(responseText) as DeleteUserFunctionResponse) : null;
        } catch {
          payload = null;
        }

        return { response, payload };
      };

      const callDeleteViaApi = async (token: string) => {
        const response = await fetch(DELETE_ACCOUNT_API_PATH, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ userId: user.id }),
        });

        return parseDeleteResponse(response);
      };

      const callDeleteViaSupabaseFunction = async (token: string) => {
        if (!supabaseUrl || !supabaseAnonKey) {
          throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY.');
        }

        const response = await fetch(`${supabaseUrl}/functions/v1/delete-user`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ userId: user.id }),
        });

        return parseDeleteResponse(response);
      };

      const callDeleteFunction = async (token: string) => {
        try {
          const apiResult = await callDeleteViaApi(token);
          if (![404, 405, 500, 502, 503].includes(apiResult.response.status)) {
            return apiResult;
          }
        } catch {
          // Fall back to Supabase Edge Function when API route is unavailable.
        }

        return callDeleteViaSupabaseFunction(token);
      };

      const getValidAccessToken = async () => {
        const readCurrentToken = async () => {
          const { data: sessionData } = await supabase.auth.getSession();
          return sessionData.session?.access_token ?? null;
        };

        let accessToken = await readCurrentToken();
        if (accessToken) return accessToken;

        const searchParams = new URLSearchParams(location.search);
        const hashParams = new URLSearchParams(
          location.hash.startsWith('#') ? location.hash.slice(1) : location.hash
        );

        const code = searchParams.get('code');
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (!exchangeError) {
            accessToken = await readCurrentToken();
            if (accessToken) return accessToken;
          }
        }

        const tokenHash = searchParams.get('token_hash') || hashParams.get('token_hash');
        const otpType = (searchParams.get('type') || hashParams.get('type')) as EmailOtpType | null;
        if (tokenHash && otpType) {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: otpType,
          });
          if (!verifyError) {
            accessToken = await readCurrentToken();
            if (accessToken) return accessToken;
          }
        }

        const hashAccessToken = hashParams.get('access_token');
        const hashRefreshToken = hashParams.get('refresh_token');
        if (hashAccessToken && hashRefreshToken) {
          const { data: setSessionData, error: setSessionError } = await supabase.auth.setSession({
            access_token: hashAccessToken,
            refresh_token: hashRefreshToken,
          });
          if (!setSessionError && setSessionData.session?.access_token) {
            return setSessionData.session.access_token;
          }
        }

        const { data: refreshedData, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError || !refreshedData.session?.access_token) {
          throw new Error(SESSION_EXPIRED_MESSAGE);
        }

        return refreshedData.session.access_token;
      };

      let accessToken = await getValidAccessToken();
      let { response, payload } = await callDeleteFunction(accessToken);

      if (response.status === 401) {
        const { data: refreshedData, error: refreshError } = await supabase.auth.refreshSession();
        accessToken = refreshedData.session?.access_token ?? '';
        if (refreshError || !accessToken) {
          throw new Error(SESSION_EXPIRED_MESSAGE);
        }
        ({ response, payload } = await callDeleteFunction(accessToken));
      }

      if (!response.ok) {
        const message =
          payload?.error || payload?.message || `delete-user failed with status ${response.status}.`;

        if (response.status === 401) {
          throw new Error(
            message.toLowerCase().includes('invalid jwt')
              ? SESSION_EXPIRED_MESSAGE
              : `Unauthorized: ${message}`
          );
        }

        if (response.status === 404) {
          throw new Error('Delete account backend endpoint is not deployed.');
        }

        throw new Error(message);
      }

      if (!payload?.success) {
        throw new Error(payload?.error || 'Failed to delete account.');
      }

      toast({
        title: 'Account deleted',
        description: payload?.message || 'Your account has been permanently deleted.',
      });

      try {
        window.localStorage.removeItem(DELETE_LINK_VERIFICATION_KEY);
      } catch {
        // Ignore storage cleanup failures.
      }
      await supabase.auth.signOut().catch(() => undefined);
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
          <CardTitle className="text-2xl font-bold text-destructive">Delete account</CardTitle>
          <CardDescription>
            This permanently deletes your account and all associated data.
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

            {!isVerifiedDeleteLink && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  For security, open the deletion link sent to your email from the profile page.
                </AlertDescription>
              </Alert>
            )}

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You are about to permanently delete{' '}
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
              {loading ? 'Deleting account...' : 'Delete account permanently'}
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
