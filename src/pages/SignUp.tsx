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
import { profileApi } from '@/db/api';
import { useToast } from '@/hooks/use-toast';
import { useAuthEffects } from '@/hooks/useAuthEffects';
import { authPageEntryVariants } from '@/utils/animations';
import { mapAuthErrorMessage, validateSignupForm } from '@/utils/validators';
import '@/styles/authEffects.css';

export default function SignUp() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signUpWithUsername } = useAuth();
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

    const validation = validateSignupForm({ username, email, password, confirmPassword });

    if (!validation.valid) {
      setError(validation.message || 'Please check your details');
      if (validation.field) {
        markFieldError(validation.field);
      }
      return;
    }

    setLoading(true);

    const normalizedEmail = email.trim().toLowerCase();
    const { error: signUpError, user: createdUser } = await signUpWithUsername(
      username,
      password,
      normalizedEmail
    );

    if (signUpError) {
      setError(mapAuthErrorMessage(signUpError.message || 'Failed to sign up'));
      markFieldError('username');
      markFieldError('email');
      markFieldError('password');
      setLoading(false);
      return;
    }

    if (createdUser) {
      try {
        await profileApi.updateProfile(createdUser.id, {
          email: email || createdUser.email || null,
          username,
          full_name: fullName || null,
          date_of_birth: dateOfBirth || null,
          phone: phone || null,
          country: country || null,
        });
      } catch (updateError) {
        console.error('Failed to update profile:', updateError);
      }

      markFieldSuccess('username');
      markFieldSuccess('email');
      markFieldSuccess('password');
      markFieldSuccess('confirmPassword');

      toast({
        title: 'Check your email',
        description: 'Check your email to confirm your account',
      });
      navigate('/check-email', { replace: true });
      return;
    }

    setError('Failed to create account. Please try again.');
    setLoading(false);
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
            <CardTitle className="text-2xl font-bold">Join TYPELY</CardTitle>
            <CardDescription>Create an account to start your typing journey</CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AuthInput
                  id="username"
                  label="Username *"
                  type="text"
                  autoComplete="username"
                  placeholder="Choose a username"
                  value={username}
                  onChange={(e) => {
                    const next = e.target.value;
                    setUsername(next);
                    setStatus('username', /^[a-zA-Z0-9_]+$/.test(next) && next.length >= 3 ? 'success' : 'idle');
                  }}
                  required
                  disabled={loading}
                  wrapperClassName="col-span-2"
                  helperText="Only letters, numbers, and underscores allowed"
                  status={fieldStatus.username}
                  shakeToken={shakeTokens.username}
                  successToken={successTokens.username}
                />

                <AuthInput
                  id="email"
                  label="Email *"
                  type="email"
                  autoComplete="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => {
                    const next = e.target.value;
                    setEmail(next);
                    setStatus('email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next.trim()) ? 'success' : 'idle');
                  }}
                  required
                  disabled={loading}
                  wrapperClassName="col-span-2"
                  status={fieldStatus.email}
                  shakeToken={shakeTokens.email}
                  successToken={successTokens.email}
                />

                <AuthInput
                  id="fullName"
                  label="Full Name"
                  type="text"
                  autoComplete="name"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={loading}
                  wrapperClassName="col-span-2"
                  status={fieldStatus.fullName}
                  shakeToken={shakeTokens.fullName}
                  successToken={successTokens.fullName}
                />

                <AuthInput
                  id="dateOfBirth"
                  label="Date of Birth"
                  type="date"
                  autoComplete="bday"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  disabled={loading}
                  status={fieldStatus.dateOfBirth}
                  shakeToken={shakeTokens.dateOfBirth}
                  successToken={successTokens.dateOfBirth}
                />

                <AuthInput
                  id="phone"
                  label="Phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+1234567890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={loading}
                  status={fieldStatus.phone}
                  shakeToken={shakeTokens.phone}
                  successToken={successTokens.phone}
                />

                <AuthInput
                  id="country"
                  label="Country"
                  type="text"
                  autoComplete="country-name"
                  placeholder="United States"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  disabled={loading}
                  wrapperClassName="col-span-2"
                  status={fieldStatus.country}
                  shakeToken={shakeTokens.country}
                  successToken={successTokens.country}
                />

                <AuthInput
                  id="password"
                  label="Password *"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => {
                    const next = e.target.value;
                    setPassword(next);
                    setStatus('password', next.length >= 6 ? 'success' : 'idle');
                  }}
                  required
                  disabled={loading}
                  wrapperClassName="col-span-2"
                  status={fieldStatus.password}
                  shakeToken={shakeTokens.password}
                  successToken={successTokens.password}
                />

                <AuthInput
                  id="confirmPassword"
                  label="Confirm Password *"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => {
                    const next = e.target.value;
                    setConfirmPassword(next);
                    setStatus(
                      'confirmPassword',
                      next.length > 0 && next === password ? 'success' : 'idle'
                    );
                  }}
                  required
                  disabled={loading}
                  wrapperClassName="col-span-2"
                  status={fieldStatus.confirmPassword}
                  shakeToken={shakeTokens.confirmPassword}
                  successToken={successTokens.confirmPassword}
                />
              </div>

              <AuthButton
                type="submit"
                className="w-full"
                disabled={loading}
                loading={loading}
                loadingLabel="Creating account..."
                onMouseDown={triggerRipple}
                ripples={ripples}
              >
                Sign Up
              </AuthButton>
            </CardContent>
          </form>

          <CardFooter className="flex flex-col space-y-2">
            <div className="text-sm text-center text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="auth-link-underline text-primary hover:underline font-medium">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </AuthCard>
      </motion.div>
    </div>
  );
}
