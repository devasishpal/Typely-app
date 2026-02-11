import { Outlet } from 'react-router-dom';
import Header from './Header';

export default function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-background overflow-x-hidden">
      <Header />
      <main className="flex-1 container mx-auto px-4 md:px-6 lg:px-4 py-6 md:py-8">
        <Outlet />
      </main>
    </div>
  );
}
