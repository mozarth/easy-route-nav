import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  MapPin, 
  Plus,
  Edit,
  Trash2,
  Power,
  PowerOff,
  BarChart3,
  Clock,
  QrCode,
  Home,
  LogOut,
  Save,
  X,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { getProperties, saveProperty, deleteProperty, togglePropertyActive } from '@/lib/storage';
import { Property } from '@/types/property';
import { useToast } from '@/hooks/use-toast';

const AdminProperties = () => {
  const { logout } = useAuth();
  const { toast } = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    latitude: '',
    longitude: '',
    address: '',
    description: '',
    etapa: '',
  });

  const loadProperties = () => {
    setProperties(getProperties());
  };

  useEffect(() => {
    loadProperties();
  }, []);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: editingProperty ? prev.slug : generateSlug(name),
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      latitude: '',
      longitude: '',
      address: '',
      description: '',
      etapa: '',
    });
    setEditingProperty(null);
    setShowForm(false);
  };

  const handleEdit = (property: Property) => {
    setEditingProperty(property);
    setFormData({
      name: property.name,
      slug: property.slug,
      latitude: property.latitude.toString(),
      longitude: property.longitude.toString(),
      address: property.address || '',
      description: property.description || '',
      etapa: (property as any).etapa || '',
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const propertyData: Property = {
      id: editingProperty?.id || crypto.randomUUID(),
      name: formData.name,
      slug: formData.slug,
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
      address: formData.address || undefined,
      description: formData.description || undefined,
      isActive: editingProperty?.isActive ?? true,
      createdAt: editingProperty?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    saveProperty(propertyData);
    loadProperties();
    resetForm();
    
    toast({
      title: editingProperty ? 'Propiedad actualizada' : 'Propiedad creada',
      description: `${propertyData.name} ha sido ${editingProperty ? 'actualizada' : 'creada'} exitosamente.`,
    });
  };

  const handleDelete = (property: Property) => {
    if (confirm(`¿Estás seguro de eliminar "${property.name}"?`)) {
      deleteProperty(property.id);
      loadProperties();
      toast({
        title: 'Propiedad eliminada',
        description: `${property.name} ha sido eliminada.`,
      });
    }
  };

  const handleToggleActive = (property: Property) => {
    togglePropertyActive(property.id);
    loadProperties();
    toast({
      title: property.isActive ? 'Propiedad desactivada' : 'Propiedad activada',
      description: `${property.name} ha sido ${property.isActive ? 'desactivada' : 'activada'}.`,
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border p-4 hidden lg:block">
        <div className="mb-8 px-2">
          <Logo size="md" showText />
        </div>

        <nav className="space-y-1">
          <Link 
            to="/admin/dashboard" 
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-secondary transition-colors"
          >
            <BarChart3 className="w-5 h-5" />
            Dashboard
          </Link>
          <Link 
            to="/admin/properties" 
            className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/10 text-primary"
          >
            <MapPin className="w-5 h-5" />
            Propiedades
          </Link>
          <Link 
            to="/admin/history" 
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-secondary transition-colors"
          >
            <Clock className="w-5 h-5" />
            Historial
          </Link>
          <Link 
            to="/admin/qr-codes" 
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-secondary transition-colors"
          >
            <QrCode className="w-5 h-5" />
            Códigos QR
          </Link>
          <Link 
            to="/admin/users" 
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-secondary transition-colors"
          >
            <Users className="w-5 h-5" />
            Usuarios
          </Link>
        </nav>

        <div className="absolute bottom-4 left-4 right-4 space-y-2">
          <Link to="/">
            <Button variant="outline" size="sm" className="w-full justify-start">
              <Home className="w-4 h-4" />
              Ver Sitio Público
            </Button>
          </Link>
          <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground" onClick={logout}>
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </Button>
        </div>
      </aside>

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
            <h1 className="text-2xl font-bold">Propiedades</h1>
            <p className="text-muted-foreground">Gestiona las propiedades del sistema</p>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4" />
            Nueva Propiedad
          </Button>
        </div>

        {/* Form Modal/Section */}
        {showForm && (
          <div className="glass-card p-6 mb-8 animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">
                {editingProperty ? 'Editar Propiedad' : 'Nueva Propiedad'}
              </h2>
              <Button variant="ghost" size="icon" onClick={resetForm}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Nombre *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Ej: Santa Clara"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Slug (URL)</label>
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="santa-clara"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Latitud *</label>
                  <Input
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
                    placeholder="4.7110"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Longitud *</label>
                  <Input
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
                    placeholder="-74.0721"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Dirección</label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Ej: Sector Santa Clara, Colombia"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Descripción</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descripción de la propiedad..."
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit">
                  <Save className="w-4 h-4" />
                  {editingProperty ? 'Actualizar' : 'Guardar'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Properties List */}
        <div className="grid gap-4">
          {properties.map((property, index) => (
            <div 
              key={property.id}
              className={`glass-card p-6 animate-fade-in ${!property.isActive ? 'opacity-60' : ''}`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${property.isActive ? 'gradient-primary' : 'bg-secondary'}`}>
                    <MapPin className={`w-6 h-6 ${property.isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{property.name}</h3>
                    <p className="text-muted-foreground text-sm">{property.address || 'Sin dirección'}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="font-mono bg-secondary px-2 py-1 rounded">
                        /{property.slug}
                      </span>
                      <span>
                        {property.latitude.toFixed(4)}, {property.longitude.toFixed(4)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleToggleActive(property)}
                    title={property.isActive ? 'Desactivar' : 'Activar'}
                  >
                    {property.isActive ? (
                      <Power className="w-4 h-4 text-success" />
                    ) : (
                      <PowerOff className="w-4 h-4 text-muted-foreground" />
                    )}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleEdit(property)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleDelete(property)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {properties.length === 0 && (
            <div className="text-center py-12 glass-card">
              <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No hay propiedades registradas.</p>
              <Button className="mt-4" onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4" />
                Agregar Primera Propiedad
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Navigation */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border p-2 flex justify-around">
          <Link to="/admin/dashboard" className="flex flex-col items-center gap-1 p-2 text-muted-foreground">
            <BarChart3 className="w-5 h-5" />
            <span className="text-xs">Dashboard</span>
          </Link>
          <Link to="/admin/properties" className="flex flex-col items-center gap-1 p-2 text-primary">
            <MapPin className="w-5 h-5" />
            <span className="text-xs">Propiedades</span>
          </Link>
          <Link to="/admin/history" className="flex flex-col items-center gap-1 p-2 text-muted-foreground">
            <Clock className="w-5 h-5" />
            <span className="text-xs">Historial</span>
          </Link>
          <Link to="/admin/qr-codes" className="flex flex-col items-center gap-1 p-2 text-muted-foreground">
            <QrCode className="w-5 h-5" />
            <span className="text-xs">QR</span>
          </Link>
          <Link to="/admin/users" className="flex flex-col items-center gap-1 p-2 text-muted-foreground">
            <Users className="w-5 h-5" />
            <span className="text-xs">Usuarios</span>
          </Link>
        </nav>
      </main>
    </div>
  );
};

export default AdminProperties;
