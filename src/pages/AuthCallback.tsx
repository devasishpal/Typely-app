import type { EmailOtpType } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { mergeGuestTypingResults } from '@/lib/guestProgress';

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');
  const [continueTo, setContinueTo] = useState('/dashboard');
  const [status, setStatus] = useState('Verifying your link...');

  useEffect(() => {
    const verify = async () => {
      const params = new URLSearchParams(location.search);
      const tokenHash = params.get('token_hash');
      const type = params.get('type') as EmailOtpType | null;
      const next = params.get('next');

      if (!tokenHash || !type) {
        setError('Invalid or expired link');
        return;
      }

      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type,
      });

      if (verifyError) {
        setError('Invalid or expired link');
        return;
      }

      setStatus('Finalizing your sign-in...');
      const { data } = await supabase.auth.getSession();
      const safeNext =
        next && next.startsWith('/') && !next.startsWith('/admin_Dev') ? next : null;
      const destination = safeNext || (data.session ? '/dashboard' : '/login');
      setContinueTo(destination);

      if (data.session?.user?.id) {
        setStatus('Saving your guest progress...');
        const mergeResult = await mergeGuestTypingResults(data.session.user.id);

        if (mergeResult.error) {
          setError(
            `${mergeResult.error} Your guest progress is still saved on this device.`
          );
          return;
        }
      }

      navigate(destination, { replace: true });
    };

    verify();
  }, [location.search, navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-sm text-center">
          <p className="text-sm text-destructive">{error}</p>
          <button
            type="button"
            onClick={() => navigate(continueTo, { replace: true })}
            className="mt-4 w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-background flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-sm text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="mt-4 text-sm text-muted-foreground">{status}</p>
      </div>
    </div>
  );
}
