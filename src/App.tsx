import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import IntersectObserver from '@/components/common/IntersectObserver';
import MainLayout from '@/components/layouts/MainLayout';
import routes from './routes';

import { AuthProvider } from '@/contexts/AuthContext';
import { RouteGuard } from '@/components/common/RouteGuard';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';
import ProtectedAdminRoute from './components/admin/ProtectedAdminRoute';

const App: React.FC = () => {
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
                  .filter((r) => !r.path.startsWith('/admin'))
                  .map((route, index) => (
                    <Route key={index} path={route.path} element={route.element} />
                  ))}
              </Route>

              {/* Admin routes - separate handling */}
              {routes
                .filter((r) => r.path.startsWith('/admin'))
                .map((route, index) => {
                  // Keep /admin/login public, protect other admin routes
                  if (route.path === '/admin/login') {
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

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <Toaster />
          </RouteGuard>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
};

export default App;
