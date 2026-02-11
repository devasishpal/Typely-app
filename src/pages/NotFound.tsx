import { Link } from 'react-router-dom';
import PageMeta from '@/components/common/PageMeta';

export default function NotFound() {
  return (
    <>
      <PageMeta title="Page Not Found" description="" />
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8 dark:bg-slate-950">
        <div className="w-full max-w-5xl text-center">
          <img
            src="/images/error/404.svg"
            alt="404 Page Not Found"
            className="mx-auto w-full max-w-4xl dark:hidden"
          />
          <img
            src="/images/error/404-dark.svg"
            alt="404 Page Not Found"
            className="mx-auto hidden w-full max-w-4xl dark:block"
          />
          <Link
            to="/"
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-background px-5 py-3 text-sm font-medium text-foreground transition-colors duration-150 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </>
  );
}
