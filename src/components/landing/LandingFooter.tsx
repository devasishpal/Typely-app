import { Link } from 'react-router-dom';
import { footerGroups } from '@/components/landing/data';

export function LandingFooter() {
  return (
    <footer className="border-t border-border/60 bg-background/85 py-12 backdrop-blur-sm">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
          <div className="space-y-4">
            <Link to="/" className="inline-flex items-center gap-2">
              <span className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-primary/20 bg-primary/10">
                <img src="/favicon.png" alt="Typely logo" className="h-full w-full object-cover" loading="lazy" />
              </span>
              <span className="text-lg font-bold gradient-text">TYPELY</span>
            </Link>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              Typely helps learners improve speed, increase accuracy, and build confidence through structured,
              modern typing practice.
            </p>
          </div>

          {footerGroups.map((group) => (
            <div key={group.id} className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-foreground">{group.title}</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="inline-flex items-center transition-colors duration-200 hover:text-foreground hover:underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-border/50 pt-6 text-center text-sm text-muted-foreground">
          © 2026 TYPELY. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
