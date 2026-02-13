import { useEffect } from 'react';
import { useNavigate, useLocation, matchPath } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import routes from '@/routes';

interface RouteGuardProps {
  children: React.ReactNode;
}

// Please add the pages that can be accessed without logging in to PUBLIC_ROUTES.
const PUBLIC_ROUTES = [
  '/login',
  '/signup',
  '/reset-password',
  '/check-email',
  '/auth/callback',
  '/delete-account',
  '/403',
  '/404',
  '/',
  '/admin_Dev',
  '/admin_Dev/setup',
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

const KNOWN_ROUTE_PATTERNS = Array.from(
  new Set([...routes.map((route) => route.path), ...PUBLIC_ROUTES, ...ADMIN_ALLOWED_ROUTES])
);

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

function isKnownRoute(path: string) {
  return KNOWN_ROUTE_PATTERNS.some((pattern) => matchRoutePattern(path, pattern));
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
    const isKnown = isKnownRoute(pathname);

    // Let unknown paths continue so the router catch-all (`*`) can render the custom 404 page.
    if (!isKnown) return;

    const isPublic = matchPublicRoute(pathname, PUBLIC_ROUTES);
    const isAuthPage = pathname === '/login' || pathname === '/signup';
    const isAdminRoute = pathname.startsWith('/admin_Dev');
    const isAdminAllowed = matchPublicRoute(pathname, ADMIN_ALLOWED_ROUTES);

    if (user?.role === 'admin' && !isAdminRoute && !isAdminAllowed) {
      navigate('/admin_Dev/dashboard', { replace: true });
      return;
    }

    if (user && isAuthPage) {
      navigate('/dashboard', { replace: true });
      return;
    }

    if (!user && !isPublic) {
      navigate('/login', { state: { from: pathname }, replace: true });
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

