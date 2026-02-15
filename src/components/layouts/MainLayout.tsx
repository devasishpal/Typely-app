import { Outlet } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import { cn } from '@/lib/utils';

export default function MainLayout() {
  const location = useLocation();
  const isLandingRoute = location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col bg-gradient-background overflow-x-hidden">
      {!isLandingRoute ? <Header /> : null}
      <main
        className={cn(
          'flex-1',
          isLandingRoute ? 'px-0 py-0' : 'container mx-auto px-4 py-6 md:px-6 md:py-8 lg:px-4'
        )}
      >
        <Outlet />
      </main>
    </div>
  );
}
