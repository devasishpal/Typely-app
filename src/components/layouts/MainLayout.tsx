import { Outlet } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import { cn } from '@/lib/utils';

export default function MainLayout() {
  const location = useLocation();
  const isLandingRoute = location.pathname === '/';
  const isLessonRoute = location.pathname.startsWith('/lesson/');
  const hideDefaultHeader = isLandingRoute || isLessonRoute;

  return (
    <div className={cn('min-h-screen flex flex-col overflow-x-hidden', isLessonRoute ? 'bg-transparent' : 'bg-gradient-background')}>
      {!hideDefaultHeader ? <Header /> : null}
      <main
        className={cn(
          'flex-1',
          hideDefaultHeader ? 'px-0 py-0' : 'container mx-auto px-4 py-6 md:px-6 md:py-8 lg:px-4'
        )}
      >
        <Outlet />
      </main>
    </div>
  );
}
