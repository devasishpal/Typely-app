import { Link } from 'react-router-dom';
import PageMeta from '@/components/common/PageMeta';

export default function NotFound() {
  return (
    <>
      <PageMeta title="Page Not Found" description="" />
      <div className="relative min-h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-8%] top-[38%] h-24 w-24 rounded-[45%] bg-cyan-400/90 blur-[1px] md:h-40 md:w-40" />
          <div className="absolute right-[-6%] top-[42%] h-24 w-24 rounded-[45%] bg-teal-400/90 blur-[1px] md:h-44 md:w-44" />
          <div className="absolute left-[8%] top-[20%] h-16 w-32 -rotate-12 rounded-[50%] bg-cyan-500/90 md:h-24 md:w-44" />
        </div>

        <div className="relative mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-6 py-12">
          <div className="relative w-full max-w-4xl rounded-[4rem] bg-gradient-to-r from-cyan-500 to-teal-400 p-8 text-center shadow-xl md:p-16">
            <h1 className="text-3xl font-black tracking-wide text-slate-950 md:text-5xl">ERROR</h1>
            <p className="mt-4 text-7xl font-black leading-none text-slate-950 md:text-9xl">404</p>
            <p className="mt-5 text-3xl font-extrabold text-slate-950 md:text-5xl">Page Not Found</p>

            <div className="mt-8 flex items-center justify-center gap-3">
              <Link
                to="/"
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition-colors duration-150 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950/50 focus-visible:ring-offset-2"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
