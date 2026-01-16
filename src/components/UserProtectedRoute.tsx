import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export const UserProtectedRoute = () => {
  const { isAuthenticated, isLoading, profile } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    const pathname = window.location.pathname;
    const lang = pathname.match(/^\/([a-z]{2})(\/|$)/i)?.[1];
    const loginPath = lang ? `/${lang}/admin` : '/admin';
    return <Navigate to={loginPath} replace />;
  }

  // If user is admin, redirect them to admin panel
  if (profile?.role === 'admin') {
    const pathname = window.location.pathname;
    const lang = pathname.match(/^\/([a-z]{2})(\/|$)/i)?.[1];
    const adminPath = lang ? `/${lang}/admin/panel` : '/admin/panel';
    return <Navigate to={adminPath} replace />;
  }

  return <Outlet />;
};
