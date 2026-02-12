import type { EmailOtpType } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');

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

      const { data } = await supabase.auth.getSession();
      const safeNext = next && next.startsWith('/') ? next : null;
      const destination = safeNext || (data.session ? '/dashboard' : '/login');
      navigate(destination, { replace: true });
    };

    verify();
  }, [location.search, navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-sm text-center">
          <p className="text-sm text-destructive">Invalid or expired link</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-background flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-sm text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="mt-4 text-sm text-muted-foreground">Verifying your link...</p>
      </div>
    </div>
  );
}
