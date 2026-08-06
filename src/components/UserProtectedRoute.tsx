import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export const UserProtectedRoute = () => {
  const { isAuthenticated, isLoading, profile, isManager } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const pathname = window.location.pathname;
  const lang = pathname.match(/^\/([a-z]{2})(\/|$)/i)?.[1];

  if (!isAuthenticated) {
    const loginPath = lang ? `/${lang}/admin` : '/admin';
    return <Navigate to={loginPath} replace />;
  }

  // Admins go to the admin panel
  if (profile?.role === 'admin') {
    const adminPath = lang ? `/${lang}/admin/panel` : '/admin/panel';
    return <Navigate to={adminPath} replace />;
  }

  // Unit managers go to the properties admin section
  if (isManager) {
    const propertiesPath = lang ? `/${lang}/admin/propiedades` : '/admin/propiedades';
    return <Navigate to={propertiesPath} replace />;
  }

  return <Outlet />;
};
