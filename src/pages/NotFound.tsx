import { Link } from 'react-router-dom';
import PageMeta from '@/components/common/PageMeta';

const typingLetters = [
  { value: 'A', className: 'left-[8%] top-[18%]' },
  { value: 'S', className: 'left-[16%] top-[40%]' },
  { value: 'D', className: 'left-[24%] top-[12%]' },
  { value: 'F', className: 'left-[30%] top-[42%]' },
  { value: 'J', className: 'right-[28%] top-[16%]' },
  { value: 'K', className: 'right-[20%] top-[38%]' },
  { value: 'L', className: 'right-[12%] top-[10%]' },
  { value: ';', className: 'right-[6%] top-[28%]' },
];

const keyboardKeys = Array.from({ length: 20 });

export default function NotFound() {
  return (
    <>
      <PageMeta title="404 Error | Typely" description="Page not found." />
      <main
        className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-10 text-slate-900"
        style={{ fontFamily: "'Manrope', 'Nunito Sans', 'Segoe UI', sans-serif" }}
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-indigo-100/70 blur-3xl" />
          <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-blue-100/70 blur-3xl" />
        </div>

        <section className="relative w-full max-w-5xl text-center typely-404-fade">
          <div className="relative mx-auto mb-8 h-[300px] w-full max-w-[620px]">
            {typingLetters.map((letter) => (
              <span
                key={letter.value + letter.className}
                className={`absolute ${letter.className} rounded-md bg-white/95 px-2 py-1 text-xs font-bold text-indigo-400 shadow-sm`}
              >
                {letter.value}
              </span>
            ))}

            <div className="absolute left-1/2 top-8 h-24 w-44 -translate-x-1/2 rounded-[1.4rem] border border-indigo-200 bg-white shadow-[0_16px_34px_-22px_rgba(79,70,229,0.7)] typely-float">
              <span className="pointer-events-none absolute right-8 top-9 h-8 w-[1.5px] origin-top rotate-12 rounded-full bg-indigo-300" />
              <span className="mt-8 block text-4xl font-black tracking-[0.18em] text-indigo-600">404</span>
            </div>

            <div className="absolute left-[17%] top-20 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-500 shadow-sm">
              <span className="inline-block h-2 w-2 rounded-full bg-indigo-400" /> <span className="ml-1">cursor</span>
            </div>

            <div className="absolute right-[13%] top-16 h-20 w-20">
              <div className="absolute right-0 top-4 h-0 w-0 border-l-[26px] border-r-[6px] border-t-[14px] border-b-[14px] border-l-indigo-300 border-r-transparent border-t-transparent border-b-transparent" />
              <span className="absolute left-0 top-0 text-[11px] font-bold text-indigo-300">A</span>
              <span className="absolute left-3 top-6 text-[11px] font-bold text-indigo-300">S</span>
              <span className="absolute left-8 top-11 text-[11px] font-bold text-indigo-300">D</span>
            </div>

            <div className="absolute bottom-3 left-1/2 h-28 w-[420px] max-w-[86vw] -translate-x-1/2 rounded-[2rem] border border-indigo-100 bg-white shadow-[0_22px_42px_-28px_rgba(30,64,175,0.55)]">
              <div className="absolute left-1/2 top-4 grid -translate-x-1/2 grid-cols-10 gap-1.5">
                {keyboardKeys.map((_, index) => (
                  <span key={index} className="h-3.5 w-6 rounded-md bg-indigo-50" />
                ))}
              </div>
            </div>

            <div className="absolute bottom-[78px] left-1/2 h-24 w-44 -translate-x-1/2">
              <div className="absolute left-0 top-6 h-8 w-12 rounded-t-3xl bg-indigo-500" />
              <div className="absolute left-3 top-0 h-8 w-8 rounded-full border-2 border-indigo-100 bg-indigo-300" />
              <div className="absolute left-10 top-7 h-10 w-20 rounded-xl border border-indigo-200 bg-indigo-50" />
              <div className="absolute left-8 top-[3.75rem] h-2.5 w-24 rounded-full bg-indigo-300" />
              <div className="absolute right-0 top-2 rounded-xl border border-indigo-100 bg-white px-2 py-1 text-[10px] text-indigo-400">
                typing...
              </div>
            </div>
          </div>

          <h1
            className="text-5xl font-black tracking-tight text-slate-900 sm:text-6xl"
            style={{ fontFamily: "'Poppins', 'Manrope', 'Segoe UI', sans-serif" }}
          >
            404 Error
          </h1>
          <p className="mt-3 text-lg font-semibold text-indigo-600 sm:text-xl">
            You seem to have mistyped the address…
            <span aria-hidden="true" className="ml-1 inline-block typely-cursor">
              |
            </span>
          </p>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
            It looks like the page you&apos;re trying to reach doesn&apos;t exist or was moved. Let&apos;s get you
            back to practicing your typing skills!
          </p>

          <p className="mt-4 text-sm font-semibold text-indigo-500">Even the best typists make mistakes 😉</p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
              Back to Homepage »
            </Link>
            <Link
              to="/practice"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-indigo-200 bg-white px-6 py-3 text-sm font-semibold text-indigo-700 transition-colors duration-200 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2"
            >
              Start Typing Practice
            </Link>
          </div>
        </section>
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@500;700;800&family=Poppins:wght@700;800&display=swap');

        .typely-404-fade {
          animation: typely404Fade 560ms ease-out both;
        }

        .typely-float {
          animation: typely404Float 3.2s ease-in-out infinite;
        }

        .typely-cursor {
          animation: typelyCursorBlink 900ms steps(1, end) infinite;
          color: hsl(226 70% 54%);
          font-weight: 700;
        }

        @keyframes typely404Fade {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes typely404Float {
          0%,
          100% {
            transform: translateX(-50%) translateY(0);
          }
          50% {
            transform: translateX(-50%) translateY(-6px);
          }
        }

        @keyframes typelyCursorBlink {
          0%,
          49% {
            opacity: 1;
          }
          50%,
          100% {
            opacity: 0;
          }
        }
      `}</style>
    </>
  );
}
