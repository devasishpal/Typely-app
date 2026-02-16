import { useEffect } from 'react';
import { useNavigate, useLocation, matchPath } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface RouteGuardProps {
  children: React.ReactNode;
}

const ADMIN_ALLOWED_ROUTES = [
  '/',
  '/lessons',
  '/lesson/*',
  '/practice',
  '/typing-test',
  '/statistics',
  '/leaderboard',
  '/achievements',
  '/profile',
  '/dashboard',
  '/guide',
  '/support',
  '/faq',
  '/contact',
  '/about',
  '/blog',
  '/careers',
  '/privacy',
  '/terms',
];

function normalizePath(path: string) {
  if (path.length > 1 && path.endsWith('/')) {
    return path.slice(0, -1);
  }
  return path;
}

function matchRoutePattern(path: string, pattern: string) {
  return Boolean(matchPath({ path: pattern, end: true }, path));
}

function matchPublicRoute(path: string, patterns: string[]) {
  return patterns.some((pattern) => matchRoutePattern(path, pattern));
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

    const pathname = normalizePath(location.pathname);
    const isAuthPage = pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password';
    const isAdminRoute = pathname.startsWith('/admin_Dev');
    const isAdminAllowed = matchPublicRoute(pathname, ADMIN_ALLOWED_ROUTES);

    if (!user && isAdminRoute && pathname !== '/admin_Dev' && pathname !== '/admin_Dev/setup') {
      navigate('/admin_Dev', { replace: true });
      return;
    }

    if (user?.role === 'admin' && !isAdminRoute && !isAdminAllowed) {
      navigate('/admin_Dev/dashboard', { replace: true });
      return;
    }

    if (user && isAuthPage) {
      navigate('/dashboard', { replace: true });
      return;
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

