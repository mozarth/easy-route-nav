import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute = () => {
  const { isAuthenticated, isLoading, profile, isManager } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const pathname = location.pathname;
  const lang = pathname.match(/^\/([a-z]{2})(\/|$)/i)?.[1];

  if (!isAuthenticated) {
    const loginPath = lang ? `/${lang}/admin` : '/admin';
    return <Navigate to={loginPath} replace />;
  }

  if (profile?.role === 'admin') {
    return <Outlet />;
  }

  // Unit managers can only use the properties section
  if (isManager) {
    const propertiesPath = lang ? `/${lang}/admin/propiedades` : '/admin/propiedades';
    const isPropertiesRoute = /\/admin\/(propiedades|properties)$/.test(pathname);
    return isPropertiesRoute ? <Outlet /> : <Navigate to={propertiesPath} replace />;
  }

  const userPath = lang ? `/${lang}/user/propiedades` : '/user/propiedades';
  return <Navigate to={userPath} replace />;
};
