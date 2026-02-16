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
        className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-background px-4 py-10 text-foreground"
        style={{ fontFamily: "'Manrope', 'Nunito Sans', 'Segoe UI', sans-serif" }}
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-secondary/20 blur-3xl" />
        </div>

        <section className="relative w-full max-w-5xl text-center typely-404-fade">
          <div className="relative mx-auto mb-8 h-[300px] w-full max-w-[620px]">
            {typingLetters.map((letter) => (
              <span
                key={letter.value + letter.className}
                className={`absolute ${letter.className} rounded-md bg-background/95 px-2 py-1 text-xs font-bold text-primary/75 shadow-card`}
              >
                {letter.value}
              </span>
            ))}

            <div className="absolute left-1/2 top-8 h-24 w-44 -translate-x-1/2 rounded-[1.4rem] border border-primary/25 bg-card shadow-[0_16px_34px_-22px_hsl(var(--primary)/0.55)] typely-float">
              <span className="pointer-events-none absolute right-8 top-9 h-8 w-[1.5px] origin-top rotate-12 rounded-full bg-primary/55" />
              <span className="mt-8 block text-4xl font-black tracking-[0.18em] text-primary">404</span>
            </div>

            <div className="absolute left-[17%] top-20 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary shadow-card">
              <span className="inline-block h-2 w-2 rounded-full bg-primary/70" /> <span className="ml-1">cursor</span>
            </div>

            <div className="absolute right-[13%] top-16 h-20 w-20">
              <div className="absolute right-0 top-4 h-0 w-0 border-l-[26px] border-r-[6px] border-t-[14px] border-b-[14px] border-l-secondary/70 border-r-transparent border-t-transparent border-b-transparent" />
              <span className="absolute left-0 top-0 text-[11px] font-bold text-secondary/70">A</span>
              <span className="absolute left-3 top-6 text-[11px] font-bold text-secondary/70">S</span>
              <span className="absolute left-8 top-11 text-[11px] font-bold text-secondary/70">D</span>
            </div>

            <div className="absolute bottom-3 left-1/2 h-28 w-[420px] max-w-[86vw] -translate-x-1/2 rounded-[2rem] border border-border bg-card shadow-[0_22px_42px_-28px_hsl(var(--primary)/0.45)]">
              <div className="absolute left-1/2 top-4 grid -translate-x-1/2 grid-cols-10 gap-1.5">
                {keyboardKeys.map((_, index) => (
                  <span key={index} className="h-3.5 w-6 rounded-md bg-muted" />
                ))}
              </div>
            </div>

            <div className="absolute bottom-[78px] left-1/2 h-24 w-44 -translate-x-1/2">
              <div className="absolute left-0 top-6 h-8 w-12 rounded-t-3xl bg-primary" />
              <div className="absolute left-3 top-0 h-8 w-8 rounded-full border-2 border-border bg-secondary/65" />
              <div className="absolute left-10 top-7 h-10 w-20 rounded-xl border border-primary/20 bg-primary/10" />
              <div className="absolute left-8 top-[3.75rem] h-2.5 w-24 rounded-full bg-secondary/70" />
              <div className="absolute right-0 top-2 rounded-xl border border-border bg-background px-2 py-1 text-[10px] text-primary/75">
                typing...
              </div>
            </div>
          </div>

          <h1
            className="text-5xl font-black tracking-tight text-foreground sm:text-6xl"
            style={{ fontFamily: "'Poppins', 'Manrope', 'Segoe UI', sans-serif" }}
          >
            404 Error
          </h1>
          <p className="mt-3 text-lg font-semibold text-primary sm:text-xl">
            You seem to have mistyped the address…
            <span aria-hidden="true" className="ml-1 inline-block typely-cursor">
              |
            </span>
          </p>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            It looks like the page you&apos;re trying to reach doesn&apos;t exist or was moved. Let&apos;s get you
            back to practicing your typing skills!
          </p>

          <p className="mt-4 text-sm font-semibold text-secondary">Even the best typists make mistakes 😉</p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-primary/70 bg-gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Back to Homepage »
            </Link>
            <Link
              to="/practice"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-border bg-background/80 px-6 py-3 text-sm font-semibold text-foreground shadow-sm transition-colors duration-200 hover:border-primary/35 hover:bg-background/95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
          color: hsl(var(--primary));
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
