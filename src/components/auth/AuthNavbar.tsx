import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const AUTH_NAV_CLASS = 'auth-navbar-enhanced';
const AUTH_LINK_CLASS = 'auth-navbar-link';
const AUTH_THEME_CLASS = 'auth-navbar-theme-toggle';
const AUTH_THEME_SPIN_CLASS = 'auth-navbar-theme-rotate';

export default function AuthNavbar() {
  const location = useLocation();
  const isAuthRoute = location.pathname === '/login' || location.pathname === '/signup';

  useEffect(() => {
    if (!isAuthRoute) return;

    const header = document.querySelector('header');
    if (!header) return;

    header.classList.add(AUTH_NAV_CLASS);

    const links = Array.from(header.querySelectorAll('a[href="/login"], a[href="/signup"]'));
    links.forEach((link) => link.classList.add(AUTH_LINK_CLASS));

    const themeToggle = header.querySelector('button[aria-label="Toggle theme"]');
    themeToggle?.classList.add(AUTH_THEME_CLASS);

    const handleToggleClick = () => {
      if (!themeToggle) return;
      themeToggle.classList.remove(AUTH_THEME_SPIN_CLASS);
      void (themeToggle as HTMLElement).offsetWidth;
      themeToggle.classList.add(AUTH_THEME_SPIN_CLASS);
    };

    themeToggle?.addEventListener('click', handleToggleClick);

    return () => {
      header.classList.remove(AUTH_NAV_CLASS);
      links.forEach((link) => link.classList.remove(AUTH_LINK_CLASS));
      themeToggle?.classList.remove(AUTH_THEME_CLASS);
      themeToggle?.classList.remove(AUTH_THEME_SPIN_CLASS);
      themeToggle?.removeEventListener('click', handleToggleClick);
    };
  }, [isAuthRoute]);

  return null;
}
