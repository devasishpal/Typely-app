import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface RouteGuardProps {
  children: React.ReactNode;
}

// Please add the pages that can be accessed without logging in to PUBLIC_ROUTES.
const PUBLIC_ROUTES = [
  '/login',
  '/signup',
  '/reset-password',
  '/delete-account',
  '/403',
  '/404',
  '/',
  '/admin/login',
  '/admin_Dev',
  '/admin/setup',
  '/support',
  '/faq',
  '/contact',
  '/about',
  '/blog',
  '/careers',
  '/privacy',
  '/terms',
];
const ADMIN_ALLOWED_ROUTES = [
  '/',
  '/lessons',
  '/lesson/*',
  '/practice',
  '/typing-test',
  '/statistics',
  '/achievements',
  '/profile',
  '/dashboard',
  '/support',
  '/faq',
  '/contact',
  '/about',
  '/blog',
  '/careers',
  '/privacy',
  '/terms',
];

function matchPublicRoute(path: string, patterns: string[]) {
  return patterns.some(pattern => {
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
      return regex.test(path);
    }
    return path === pattern;
  });
}

export function RouteGuard({ children }: RouteGuardProps) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const hashParams = new URLSearchParams(
      location.hash.startsWith('#') ? location.hash.slice(1) : location.hash
    );
    const searchParams = new URLSearchParams(location.search);

    const hasRecoveryHash =
      hashParams.get('type') === 'recovery' &&
      (hashParams.has('access_token') || hashParams.has('token') || hashParams.has('token_hash'));
    const hasRecoverySearch = searchParams.get('type') === 'recovery';
    const hasMagicLinkHash =
      hashParams.get('type') === 'magiclink' &&
      (hashParams.has('access_token') || hashParams.has('token') || hashParams.has('token_hash'));
    const hasMagicLinkSearch = searchParams.get('type') === 'magiclink';

    if (location.pathname !== '/reset-password' && (hasRecoveryHash || hasRecoverySearch)) {
      navigate(
        {
          pathname: '/reset-password',
          search: location.search,
          hash: location.hash,
        },
        { replace: true }
      );
      return;
    }

    if (location.pathname !== '/delete-account' && (hasMagicLinkHash || hasMagicLinkSearch)) {
      navigate(
        {
          pathname: '/delete-account',
          search: location.search,
          hash: location.hash,
        },
        { replace: true }
      );
      return;
    }

    if (loading) return;

    const isPublic = matchPublicRoute(location.pathname, PUBLIC_ROUTES);
    const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';
    const isAdminRoute =
      location.pathname.startsWith('/admin') || location.pathname.startsWith('/admin_Dev');
    const isAdminAllowed = matchPublicRoute(location.pathname, ADMIN_ALLOWED_ROUTES);

    if (user?.role === 'admin' && !isAdminRoute && !isAdminAllowed) {
      navigate('/admin/dashboard', { replace: true });
      return;
    }

    if (user && isAuthPage) {
      navigate('/dashboard', { replace: true });
      return;
    }

    if (!user && !isPublic) {
      navigate('/login', { state: { from: location.pathname }, replace: true });
    }
  }, [user, loading, location.pathname, location.search, location.hash, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
}
