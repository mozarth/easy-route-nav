import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  MapPin, 
  Clock, 
  Smartphone, 
  Monitor, 
  Tablet,
  LogOut,
  Plus,
  Download,
  QrCode,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { getProperties, getAccessLogs } from '@/lib/storage';
import { Property, AccessLog } from '@/types/property';
import { AdminNav } from '@/components/admin/AdminNav';

const AdminDashboard = () => {
  const { logout } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [recentLogs, setRecentLogs] = useState<AccessLog[]>([]);
  const [stats, setStats] = useState({
    totalProperties: 0,
    activeProperties: 0,
    totalAccesses: 0,
    mobileAccesses: 0,
    tabletAccesses: 0,
    desktopAccesses: 0,
  });

  useEffect(() => {
    const props = getProperties();
    const logs = getAccessLogs();
    
    setProperties(props);
    setRecentLogs(logs.slice(0, 10));
    
    setStats({
      totalProperties: props.length,
      activeProperties: props.filter(p => p.isActive).length,
      totalAccesses: logs.length,
      mobileAccesses: logs.filter(l => l.deviceType === 'mobile').length,
      tabletAccesses: logs.filter(l => l.deviceType === 'tablet').length,
      desktopAccesses: logs.filter(l => l.deviceType === 'desktop').length,
    });
  }, []);

  const statCards = [
    { label: 'Total Propiedades', value: stats.totalProperties, icon: MapPin, color: 'primary' },
    { label: 'Propiedades Activas', value: stats.activeProperties, icon: MapPin, color: 'success' },
    { label: 'Total Accesos', value: stats.totalAccesses, icon: Clock, color: 'accent' },
    { label: 'Accesos Móviles', value: stats.mobileAccesses, icon: Smartphone, color: 'info' },
  ];

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <AdminNav />

      {/* Main Content */}
      <main className="lg:ml-64 p-4 lg:p-8">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between mb-6">
          <Logo size="md" showText />
          <Button variant="ghost" size="icon" onClick={logout}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">Panel</h1>
            <p className="text-muted-foreground">Resumen del sistema de navegación</p>
          </div>
          <Link to="/admin/propiedades">
            <Button>
              <Plus className="w-4 h-4" />
              Nueva Propiedad
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat, index) => (
            <div 
              key={stat.label}
              className="glass-card p-6 animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-${stat.color}/10 flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 text-${stat.color}`} />
                </div>
              </div>
              <p className="text-3xl font-bold mb-1">{stat.value}</p>
              <p className="text-muted-foreground text-sm">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Device Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="glass-card p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-primary" />
              Accesos por Dispositivo
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-muted-foreground" />
                  <span>Móvil</span>
                </div>
                <span className="font-semibold">{stats.mobileAccesses}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Tablet className="w-5 h-5 text-muted-foreground" />
                  <span>Tablet</span>
                </div>
                <span className="font-semibold">{stats.tabletAccesses}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Monitor className="w-5 h-5 text-muted-foreground" />
                  <span>Escritorio</span>
                </div>
                <span className="font-semibold">{stats.desktopAccesses}</span>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Accesos Recientes
            </h2>
            {recentLogs.length === 0 ? (
              <p className="text-muted-foreground text-sm">No hay accesos registrados aún.</p>
            ) : (
              <div className="space-y-3 max-h-48 overflow-y-auto scrollbar-hide">
                {recentLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span>{log.propertyName}</span>
                    </div>
                    <span className="text-muted-foreground">
                      {new Date(log.accessedAt).toLocaleString('es-ES', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="glass-card p-6">
          <h2 className="font-semibold mb-4">Acciones Rápidas</h2>
          <div className="flex flex-wrap gap-3">
            <Link to="/admin/propiedades">
              <Button variant="outline">
                <MapPin className="w-4 h-4" />
                Gestionar Propiedades
              </Button>
            </Link>
            <Link to="/admin/codigos-qr">
              <Button variant="outline">
                <QrCode className="w-4 h-4" />
                Generar QR Codes
              </Button>
            </Link>
            <Link to="/admin/historial">
              <Button variant="outline">
                <Download className="w-4 h-4" />
                Exportar Reportes
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
