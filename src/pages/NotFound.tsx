import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import PageMeta from '@/components/common/PageMeta';

export default function NotFound() {
  return (
    <>
      <PageMeta title="Page Not Found" description="" />
      <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8 text-foreground">
        <div
          className="w-full max-w-2xl rounded-2xl border border-border bg-card px-6 py-10 text-center shadow-sm sm:px-10 sm:py-14"
          style={{ animation: 'fadeIn 420ms ease-out' }}
        >
          <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <AlertTriangle className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="text-6xl font-extrabold tracking-tight sm:text-7xl md:text-8xl">404</h1>
          <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">Page Not Found</h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground sm:text-base">
            The page you are looking for does not exist.
          </p>
          <Link
            to="/"
            className="mt-8 inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-all duration-200 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Go Back Home
          </Link>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}
