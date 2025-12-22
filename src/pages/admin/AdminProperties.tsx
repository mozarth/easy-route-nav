import { useEffect, useState } from 'react';
import { 
  MapPin, 
  Plus,
  Edit,
  Trash2,
  Power,
  PowerOff,
  LogOut,
  Save,
  X,
  Loader2,
  Home,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getProperties, 
  saveProperty, 
  deleteProperty, 
  togglePropertyActive, 
  Property,
  getLotesByPropertyId,
  saveLote,
  deleteLote,
  PropertyLote,
} from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { AdminNav } from '@/components/admin/AdminNav';

const AdminProperties = () => {
  const { logout } = useAuth();
  const { toast } = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    latitude: '',
    longitude: '',
    address: '',
    description: '',
    etapa: '',
  });

  // Lotes state
  const [expandedProperty, setExpandedProperty] = useState<string | null>(null);
  const [propertyLotes, setPropertyLotes] = useState<Record<string, PropertyLote[]>>({});
  const [showLoteForm, setShowLoteForm] = useState<string | null>(null);
  const [loteFormData, setLoteFormData] = useState({
    numero: '',
    tipo: 'lote' as 'lote' | 'casa',
    latitude: '',
    longitude: '',
  });
  const [savingLote, setSavingLote] = useState(false);

  const loadProperties = async () => {
    setLoading(true);
    const props = await getProperties();
    setProperties(props);
    setLoading(false);
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
      etapa: property.etapa || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    const propertyData = {
      id: editingProperty?.id,
      name: formData.name,
      slug: formData.slug,
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
      address: formData.address || undefined,
      description: formData.description || undefined,
      etapa: formData.etapa || undefined,
      isActive: editingProperty?.isActive ?? true,
    };

    const result = await saveProperty(propertyData);
    setSaving(false);
    
    if (result) {
      await loadProperties();
      resetForm();
      
      toast({
        title: editingProperty ? 'Propiedad actualizada' : 'Propiedad creada',
        description: `${propertyData.name} ha sido ${editingProperty ? 'actualizada' : 'creada'} exitosamente.`,
      });
    } else {
      toast({
        title: 'Error',
        description: 'No se pudo guardar la propiedad. Verifica tus permisos.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (property: Property) => {
    if (confirm(`¿Estás seguro de eliminar "${property.name}"?`)) {
      const success = await deleteProperty(property.id);
      if (success) {
        await loadProperties();
        toast({
          title: 'Propiedad eliminada',
          description: `${property.name} ha sido eliminada.`,
        });
      } else {
        toast({
          title: 'Error',
          description: 'No se pudo eliminar la propiedad.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleToggleActive = async (property: Property) => {
    const success = await togglePropertyActive(property.id);
    if (success) {
      await loadProperties();
      toast({
        title: property.isActive ? 'Propiedad desactivada' : 'Propiedad activada',
        description: `${property.name} ha sido ${property.isActive ? 'desactivada' : 'activada'}.`,
      });
    } else {
      toast({
        title: 'Error',
        description: 'No se pudo cambiar el estado de la propiedad.',
        variant: 'destructive',
      });
    }
  };

  // Lotes handlers
  const togglePropertyExpand = async (propertyId: string) => {
    if (expandedProperty === propertyId) {
      setExpandedProperty(null);
      setShowLoteForm(null);
    } else {
      setExpandedProperty(propertyId);
      // Load lotes if not already loaded
      if (!propertyLotes[propertyId]) {
        const lotes = await getLotesByPropertyId(propertyId);
        setPropertyLotes(prev => ({ ...prev, [propertyId]: lotes }));
      }
    }
  };

  const resetLoteForm = () => {
    setLoteFormData({
      numero: '',
      tipo: 'lote',
      latitude: '',
      longitude: '',
    });
    setShowLoteForm(null);
  };

  const handleAddLote = async (propertyId: string) => {
    setSavingLote(true);
    
    const result = await saveLote({
      propertyId,
      numero: loteFormData.numero,
      tipo: loteFormData.tipo,
      latitude: parseFloat(loteFormData.latitude),
      longitude: parseFloat(loteFormData.longitude),
    });

    setSavingLote(false);

    if (result) {
      const lotes = await getLotesByPropertyId(propertyId);
      setPropertyLotes(prev => ({ ...prev, [propertyId]: lotes }));
      resetLoteForm();
      toast({
        title: 'Lote agregado',
        description: `${loteFormData.tipo === 'casa' ? 'Casa' : 'Lote'} #${loteFormData.numero} agregado exitosamente.`,
      });
    } else {
      toast({
        title: 'Error',
        description: 'No se pudo agregar el lote. Verifica que no exista ya.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteLote = async (lote: PropertyLote, propertyId: string) => {
    if (confirm(`¿Eliminar ${lote.tipo === 'casa' ? 'Casa' : 'Lote'} #${lote.numero}?`)) {
      const success = await deleteLote(lote.id);
      if (success) {
        const lotes = await getLotesByPropertyId(propertyId);
        setPropertyLotes(prev => ({ ...prev, [propertyId]: lotes }));
        toast({
          title: 'Lote eliminado',
          description: `${lote.tipo === 'casa' ? 'Casa' : 'Lote'} #${lote.numero} eliminado.`,
        });
      }
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
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {editingProperty ? 'Actualizar' : 'Guardar'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-20">
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Cargando propiedades...</p>
          </div>
        )}

        {/* Properties List */}
        {!loading && (
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
                      variant="outline" 
                      size="sm"
                      onClick={() => togglePropertyExpand(property.id)}
                      title="Ver lotes/casas"
                    >
                      <Home className="w-4 h-4" />
                      Lotes
                      {expandedProperty === property.id ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>
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

                {/* Expanded Lotes Section */}
                {expandedProperty === property.id && (
                  <div className="mt-6 pt-6 border-t border-border animate-fade-in">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Home className="w-4 h-4" />
                        Lotes y Casas
                      </h4>
                      <Button 
                        size="sm"
                        onClick={() => setShowLoteForm(showLoteForm === property.id ? null : property.id)}
                      >
                        <Plus className="w-4 h-4" />
                        Agregar Lote/Casa
                      </Button>
                    </div>

                    {/* Add Lote Form */}
                    {showLoteForm === property.id && (
                      <div className="bg-secondary/50 rounded-lg p-4 mb-4 animate-fade-in">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          <div>
                            <label className="text-sm font-medium mb-1 block">Tipo</label>
                            <Select 
                              value={loteFormData.tipo} 
                              onValueChange={(v) => setLoteFormData(prev => ({ ...prev, tipo: v as 'lote' | 'casa' }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="lote">Lote</SelectItem>
                                <SelectItem value="casa">Casa</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-1 block">Número *</label>
                            <Input
                              value={loteFormData.numero}
                              onChange={(e) => setLoteFormData(prev => ({ ...prev, numero: e.target.value }))}
                              placeholder="Ej: 1, 2, 3..."
                              required
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-1 block">Latitud *</label>
                            <Input
                              type="number"
                              step="any"
                              value={loteFormData.latitude}
                              onChange={(e) => setLoteFormData(prev => ({ ...prev, latitude: e.target.value }))}
                              placeholder="6.1059"
                              required
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-1 block">Longitud *</label>
                            <Input
                              type="number"
                              step="any"
                              value={loteFormData.longitude}
                              onChange={(e) => setLoteFormData(prev => ({ ...prev, longitude: e.target.value }))}
                              placeholder="-75.4885"
                              required
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button 
                            size="sm"
                            onClick={() => handleAddLote(property.id)}
                            disabled={savingLote || !loteFormData.numero || !loteFormData.latitude || !loteFormData.longitude}
                          >
                            {savingLote ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Guardar
                          </Button>
                          <Button size="sm" variant="outline" onClick={resetLoteForm}>
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Lotes List */}
                    {propertyLotes[property.id]?.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {propertyLotes[property.id].map((lote) => (
                          <div 
                            key={lote.id}
                            className="bg-secondary/30 rounded-lg p-3 flex items-center justify-between"
                          >
                            <div>
                              <p className="font-medium">
                                {lote.tipo === 'casa' ? 'Casa' : 'Lote'} #{lote.numero}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {lote.latitude.toFixed(4)}, {lote.longitude.toFixed(4)}
                              </p>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleDeleteLote(lote, property.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No hay lotes o casas registradas en esta propiedad.
                      </p>
                    )}
                  </div>
                )}
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
        )}
      </main>
    </div>
  );
};

export default AdminProperties;