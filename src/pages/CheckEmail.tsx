import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';

export default function CheckEmail() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [showResendForm, setShowResendForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleResend = async (e: FormEvent) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: normalizedEmail,
    });

    if (resendError) {
      setError(resendError.message);
      setLoading(false);
      return;
    }

    setMessage('Confirmation email sent. Please check your inbox.');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-background flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-foreground">Check your email</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We sent a confirmation link to your email
        </p>

        {error ? (
          <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        {message ? (
          <p className="mt-4 rounded-md border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-300">
            {message}
          </p>
        ) : null}

        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            Go to Login
          </button>

          <button
            type="button"
            onClick={() => setShowResendForm((prev) => !prev)}
            className="w-full rounded-md border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
          >
            Resend Email
          </button>
        </div>

        {showResendForm ? (
          <form onSubmit={handleResend} className="mt-4 space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              disabled={loading}
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Sending...' : 'Send confirmation email'}
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
