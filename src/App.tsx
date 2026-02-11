import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import IntersectObserver from '@/components/common/IntersectObserver';
import MainLayout from '@/components/layouts/MainLayout';
import routes from './routes';
import NotFound from './pages/NotFound';

import { AuthProvider } from '@/contexts/AuthContext';
import { RouteGuard } from '@/components/common/RouteGuard';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';
import ProtectedAdminRoute from './components/admin/ProtectedAdminRoute';

const App: React.FC = () => {
  const isAdminPath = (path: string) => path.startsWith('/admin') || path.startsWith('/admin_Dev');

  return (
    <ThemeProvider defaultTheme="light" storageKey="typely-ui-theme">
      <Router>
        <AuthProvider>
          <RouteGuard>
            <IntersectObserver />
            <Routes>
              {/* Public routes wrapped with MainLayout */}
              <Route element={<MainLayout />}>
                {routes
                  .filter((r) => !isAdminPath(r.path))
                  .map((route, index) => (
                    <Route key={index} path={route.path} element={route.element} />
                  ))}
              </Route>

              {/* Admin routes - separate handling */}
              {routes
                .filter((r) => isAdminPath(r.path))
                .map((route, index) => {
                  // Keep login entry routes public, protect other admin routes
                  if (route.path === '/admin/login' || route.path === '/admin_Dev') {
                    return <Route key={index} path={route.path} element={route.element} />;
                  }

                  return (
                    <Route
                      key={index}
                      path={route.path}
                      element={<ProtectedAdminRoute>{route.element}</ProtectedAdminRoute>}
                    />
                  );
                })}

              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
          </RouteGuard>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
};

export default App;
