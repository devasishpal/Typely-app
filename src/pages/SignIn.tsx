import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import AuthNavbar from '@/components/auth/AuthNavbar';
import AuthCard from '@/components/auth/AuthCard';
import AuthInput from '@/components/auth/AuthInput';
import AuthButton from '@/components/auth/AuthButton';
import BackgroundEffects from '@/components/auth/BackgroundEffects';
import FloatingParticles from '@/components/auth/FloatingParticles';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useAuthEffects } from '@/hooks/useAuthEffects';
import { authPageEntryVariants } from '@/utils/animations';
import { mapAuthErrorMessage, validateSignInIdentifier } from '@/utils/validators';
import '@/styles/authEffects.css';

export default function SignIn() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signInWithEmail, signInWithUsername, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const {
    fieldStatus,
    shakeTokens,
    successTokens,
    setStatus,
    markFieldError,
    markFieldSuccess,
    triggerRipple,
    ripples,
    cardTiltStyle,
    handleCardPointerMove,
    handleCardPointerLeave,
  } = useAuthEffects();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const identifierResult = validateSignInIdentifier(identifier);

    if (!identifierResult.valid) {
      setError(identifierResult.message ?? 'Please enter valid credentials');
      markFieldError('identifier');
      setLoading(false);
      return;
    }

    if (!password.trim()) {
      setError('Please enter your password');
      markFieldError('password');
      setLoading(false);
      return;
    }

    const normalizedIdentifier = identifier.trim();
    const { error: authError, user: signedInProfile } = identifierResult.isEmail
      ? await signInWithEmail(normalizedIdentifier, password)
      : await signInWithUsername(normalizedIdentifier, password);

    if (signedInProfile && signedInProfile.role === 'admin') {
      await signOut();
      setError('Admin accounts must sign in from /admin_Dev');
      markFieldError('identifier');
      setLoading(false);
      return;
    }

    if (authError) {
      setError(mapAuthErrorMessage(authError.message || 'Failed to sign in'));
      markFieldError('identifier');
      markFieldError('password');
      setLoading(false);
      return;
    }

    markFieldSuccess('identifier');
    markFieldSuccess('password');
    toast({
      title: 'Welcome back!',
      description: 'You have successfully signed in.',
    });
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-background p-4 relative auth-page-wrap">
      <AuthNavbar />
      <BackgroundEffects />
      <FloatingParticles />

      <motion.div
        className="w-full max-w-md relative z-10"
        variants={authPageEntryVariants}
        initial="hidden"
        animate="visible"
      >
        <AuthCard
          className="w-full max-w-md"
          tiltStyle={cardTiltStyle}
          onPointerMove={handleCardPointerMove}
          onPointerLeave={handleCardPointerLeave}
        >
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                <img src="/favicon.png" alt="Typely logo" className="h-full w-full object-cover" />
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

              <AuthInput
                id="identifier"
                label="Email or Username"
                type="text"
                autoComplete="username"
                placeholder="Email address or username"
                value={identifier}
                onChange={(e) => {
                  const nextValue = e.target.value;
                  setIdentifier(nextValue);
                  if (!nextValue.trim()) {
                    setStatus('identifier', 'idle');
                    return;
                  }

                  if (nextValue.includes('@')) {
                    setStatus(
                      'identifier',
                      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextValue.trim()) ? 'success' : 'idle'
                    );
                    return;
                  }

                  setStatus('identifier', 'success');
                }}
                required
                disabled={loading}
                status={fieldStatus.identifier}
                shakeToken={shakeTokens.identifier}
                successToken={successTokens.identifier}
              />

              <div className="space-y-2">
                <AuthInput
                  id="password"
                  label="Password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    const nextValue = e.target.value;
                    setPassword(nextValue);
                    setStatus('password', nextValue.length >= 6 ? 'success' : 'idle');
                  }}
                  required
                  disabled={loading}
                  status={fieldStatus.password}
                  shakeToken={shakeTokens.password}
                  successToken={successTokens.password}
                />
                <div className="flex justify-end">
                  <Link
                    to="/forgot-password"
                    className="auth-link-underline cursor-pointer text-xs font-medium text-primary transition-colors hover:underline"
                  >
                    Forgot Password?
                  </Link>
                </div>
              </div>

              <AuthButton
                type="submit"
                className="w-full"
                disabled={loading}
                loading={loading}
                loadingLabel="Signing in..."
                onMouseDown={triggerRipple}
                ripples={ripples}
              >
                Sign In
              </AuthButton>
            </CardContent>
          </form>

          <CardFooter className="flex flex-col space-y-2">
            <div className="text-sm text-center text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/signup" className="auth-link-underline text-primary hover:underline font-medium">
                Sign up
              </Link>
            </div>
          </CardFooter>
        </AuthCard>
      </motion.div>
    </div>
  );
}
