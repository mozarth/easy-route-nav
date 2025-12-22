import { useEffect, useState } from 'react';
import { 
  MapPin, 
  Clock,
  Smartphone,
  Monitor,
  Tablet,
  Download,
  FileText,
  Trash2,
  LogOut,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { getAccessLogs, clearAccessLogs, getProperties } from '@/lib/storage';
import { AccessLog } from '@/types/property';
import { exportToCSV, exportToPDF } from '@/lib/export-utils';
import { useToast } from '@/hooks/use-toast';
import { AdminNav } from '@/components/admin/AdminNav';

const AdminHistory = () => {
  const { logout } = useAuth();
  const { toast } = useToast();
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AccessLog[]>([]);
  const [propertyFilter, setPropertyFilter] = useState<string>('all');
  const [deviceFilter, setDeviceFilter] = useState<string>('all');
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const accessLogs = getAccessLogs();
    const props = getProperties();
    setLogs(accessLogs);
    setFilteredLogs(accessLogs);
    setProperties(props.map(p => ({ id: p.id, name: p.name })));
  }, []);

  useEffect(() => {
    let filtered = [...logs];
    
    if (propertyFilter !== 'all') {
      filtered = filtered.filter(log => log.propertyId === propertyFilter);
    }
    
    if (deviceFilter !== 'all') {
      filtered = filtered.filter(log => log.deviceType === deviceFilter);
    }
    
    setFilteredLogs(filtered);
  }, [logs, propertyFilter, deviceFilter]);

  const handleClearLogs = () => {
    if (confirm('¿Estás seguro de eliminar todo el historial? Esta acción no se puede deshacer.')) {
      clearAccessLogs();
      setLogs([]);
      setFilteredLogs([]);
      toast({
        title: 'Historial eliminado',
        description: 'Todo el historial de accesos ha sido eliminado.',
      });
    }
  };

  const handleExportCSV = () => {
    exportToCSV(filteredLogs);
    toast({
      title: 'Exportación exitosa',
      description: 'El archivo CSV ha sido descargado.',
    });
  };

  const handleExportPDF = () => {
    exportToPDF(filteredLogs);
    toast({
      title: 'Exportación exitosa',
      description: 'El archivo PDF ha sido descargado.',
    });
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile':
        return <Smartphone className="w-4 h-4" />;
      case 'tablet':
        return <Tablet className="w-4 h-4" />;
      default:
        return <Monitor className="w-4 h-4" />;
    }
  };

  const getDeviceName = (type: string) => {
    switch (type) {
      case 'mobile':
        return 'Móvil';
      case 'tablet':
        return 'Tablet';
      default:
        return 'Escritorio';
    }
  };

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
            <h1 className="text-2xl font-bold">Historial de Accesos</h1>
            <p className="text-muted-foreground">{filteredLogs.length} registros encontrados</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleExportCSV} disabled={filteredLogs.length === 0}>
              <Download className="w-4 h-4" />
              CSV
            </Button>
            <Button variant="outline" onClick={handleExportPDF} disabled={filteredLogs.length === 0}>
              <FileText className="w-4 h-4" />
              PDF
            </Button>
            <Button variant="destructive" onClick={handleClearLogs} disabled={logs.length === 0}>
              <Trash2 className="w-4 h-4" />
              Limpiar
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="glass-card p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-primary" />
            <span className="font-medium">Filtros</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Propiedad</label>
              <select
                className="w-full bg-secondary rounded-lg px-3 py-2 text-sm"
                value={propertyFilter}
                onChange={(e) => setPropertyFilter(e.target.value)}
              >
                <option value="all">Todas las propiedades</option>
                {properties.map(prop => (
                  <option key={prop.id} value={prop.id}>{prop.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Dispositivo</label>
              <select
                className="w-full bg-secondary rounded-lg px-3 py-2 text-sm"
                value={deviceFilter}
                onChange={(e) => setDeviceFilter(e.target.value)}
              >
                <option value="all">Todos los dispositivos</option>
                <option value="mobile">Móvil</option>
                <option value="tablet">Tablet</option>
                <option value="desktop">Escritorio</option>
              </select>
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Fecha</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Hora</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Propiedad</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Dispositivo</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log, index) => (
                  <tr 
                    key={log.id} 
                    className="border-b border-border/50 hover:bg-secondary/30 transition-colors animate-fade-in"
                    style={{ animationDelay: `${index * 20}ms` }}
                  >
                    <td className="p-4 text-sm">
                      {new Date(log.accessedAt).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="p-4 text-sm font-mono">
                      {new Date(log.accessedAt).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span className="text-sm">{log.propertyName}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {getDeviceIcon(log.deviceType)}
                        <span>{getDeviceName(log.deviceType)}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredLogs.length === 0 && (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No hay registros de acceso.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminHistory;
