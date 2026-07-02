import { useEffect, useRef, useState } from 'react';
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
  Upload,
  Image as ImageIcon,
  ExternalLink,
  Route,
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
  uploadLoteImage,
  uploadPropertyMapImage,
  LoteCheckpoint,
} from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { AdminNav } from '@/components/admin/AdminNav';

interface CheckpointFormData {
  latitude: string;
  longitude: string;
  orden: number;
}

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
    mapImageUrl: '',
  });
  const [uploadingMapImage, setUploadingMapImage] = useState(false);
  const mapImageInputRef = useRef<HTMLInputElement | null>(null);

  // Lotes state
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [expandedProperty, setExpandedProperty] = useState<string | null>(null);
  const [propertyLotes, setPropertyLotes] = useState<Record<string, PropertyLote[]>>({});
  const [showLoteForm, setShowLoteForm] = useState<string | null>(null);
  const [editingLote, setEditingLote] = useState<PropertyLote | null>(null);
  const [loteFormData, setLoteFormData] = useState({
    numero: '',
    tipo: 'lote' as 'lote' | 'casa',
    latitude: '',
    longitude: '',
    imageUrl: '',
  });
  const [checkpointsFormData, setCheckpointsFormData] = useState<CheckpointFormData[]>([]);
  const [savingLote, setSavingLote] = useState(false);
  const [uploadingLoteImage, setUploadingLoteImage] = useState(false);

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
      mapImageUrl: '',
    });
    setEditingProperty(null);
    setShowForm(false);
    if (mapImageInputRef.current) mapImageInputRef.current.value = '';
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
      mapImageUrl: property.mapImageUrl || '',
    });
    setShowForm(true);
    if (mapImageInputRef.current) mapImageInputRef.current.value = '';
    // Ensure the form is visible when editing a property lower down the list
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
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
      hasCustomMap: !!formData.mapImageUrl,
      mapImageUrl: formData.mapImageUrl || undefined,
    };

    try {
      const result = await saveProperty(propertyData);

      if (result) {
        await loadProperties();
        resetForm();

        toast({
          title: editingProperty ? 'Propiedad actualizada' : 'Propiedad creada',
          description: `${propertyData.name} ha sido ${editingProperty ? 'actualizada' : 'creada'} exitosamente.`,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast({
        title: 'Error al guardar',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
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

  // Handle property map image upload
  const handleMapImageUpload = async (file?: File) => {
    if (!file) return;

    setUploadingMapImage(true);
    // Use a temp ID if creating new property
    const tempId = editingProperty?.id ?? crypto.randomUUID();
    const publicUrl = await uploadPropertyMapImage({
      propertyId: tempId,
      file,
    });
    setUploadingMapImage(false);

    if (!publicUrl) {
      toast({
        title: 'Error',
        description: 'No se pudo subir la imagen del mapa.',
        variant: 'destructive',
      });
      return;
    }

    setFormData(prev => ({ ...prev, mapImageUrl: publicUrl }));
    toast({
      title: 'Imagen cargada',
      description: 'La imagen del mapa se guardará al guardar la propiedad.',
    });
  };

  // Lotes handlers
  const togglePropertyExpand = async (propertyId: string) => {
    if (expandedProperty === propertyId) {
      setExpandedProperty(null);
      resetLoteForm();
      return;
    }

    setExpandedProperty(propertyId);

    // Load lotes if not already loaded
    if (!propertyLotes[propertyId]) {
      const lotes = await getLotesByPropertyId(propertyId);
      setPropertyLotes(prev => ({ ...prev, [propertyId]: lotes }));
    }
  };

  const resetLoteForm = () => {
    setEditingLote(null);
    setLoteFormData({
      numero: '',
      tipo: 'lote',
      latitude: '',
      longitude: '',
      imageUrl: '',
    });
    setCheckpointsFormData([]);
    setShowLoteForm(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openNewLoteForm = (propertyId: string) => {
    setEditingLote(null);
    setLoteFormData({
      numero: '',
      tipo: 'lote',
      latitude: '',
      longitude: '',
      imageUrl: '',
    });
    setCheckpointsFormData([]);
    setShowLoteForm(propertyId);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleEditLote = (lote: PropertyLote, propertyId: string) => {
    setEditingLote(lote);
    setShowLoteForm(propertyId);
    setLoteFormData({
      numero: lote.numero,
      tipo: lote.tipo,
      latitude: lote.latitude.toString(),
      longitude: lote.longitude.toString(),
      imageUrl: lote.imageUrl || '',
    });
    // Load existing checkpoints into form
    const existingCheckpoints: CheckpointFormData[] = [];
    // Include legacy single checkpoint if present
    if (lote.checkpointLatitude && lote.checkpointLongitude) {
      existingCheckpoints.push({
        latitude: lote.checkpointLatitude.toString(),
        longitude: lote.checkpointLongitude.toString(),
        orden: 1,
      });
    }
    // Include multiple checkpoints
    if (lote.checkpoints && lote.checkpoints.length > 0) {
      lote.checkpoints.forEach((cp) => {
        existingCheckpoints.push({
          latitude: cp.latitude.toString(),
          longitude: cp.longitude.toString(),
          orden: cp.orden,
        });
      });
    }
    // Deduplicate by coordinates (in case legacy and new overlap)
    const uniqueCheckpoints: CheckpointFormData[] = [];
    const seen = new Set<string>();
    existingCheckpoints.forEach((cp) => {
      const key = `${cp.latitude},${cp.longitude}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueCheckpoints.push(cp);
      }
    });
    // Re-order
    uniqueCheckpoints.sort((a, b) => a.orden - b.orden);
    uniqueCheckpoints.forEach((cp, idx) => (cp.orden = idx + 1));
    setCheckpointsFormData(uniqueCheckpoints);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const addCheckpoint = () => {
    setCheckpointsFormData((prev) => [
      ...prev,
      { latitude: '', longitude: '', orden: prev.length + 1 },
    ]);
  };

  const removeCheckpoint = (index: number) => {
    setCheckpointsFormData((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      // Re-order
      return updated.map((cp, idx) => ({ ...cp, orden: idx + 1 }));
    });
  };

  const updateCheckpoint = (index: number, field: 'latitude' | 'longitude', value: string) => {
    setCheckpointsFormData((prev) =>
      prev.map((cp, i) => (i === index ? { ...cp, [field]: value } : cp))
    );
  };

  const handleSaveLote = async (propertyId: string) => {
    setSavingLote(true);

    try {
      // Prepare checkpoints array
      const checkpointsToSave = checkpointsFormData
        .filter((cp) => cp.latitude && cp.longitude)
        .map((cp, idx) => ({
          latitude: parseFloat(cp.latitude),
          longitude: parseFloat(cp.longitude),
          orden: idx + 1,
        }));

      const result = await saveLote(
        {
          id: editingLote?.id,
          propertyId,
          numero: loteFormData.numero,
          tipo: loteFormData.tipo,
          latitude: parseFloat(loteFormData.latitude),
          longitude: parseFloat(loteFormData.longitude),
          imageUrl: loteFormData.imageUrl || null,
          // Legacy single checkpoint fields - use first checkpoint if available
          checkpointLatitude: checkpointsToSave.length > 0 ? checkpointsToSave[0].latitude : null,
          checkpointLongitude: checkpointsToSave.length > 0 ? checkpointsToSave[0].longitude : null,
        },
        checkpointsToSave
      );

      if (result) {
        const lotes = await getLotesByPropertyId(propertyId);
        setPropertyLotes(prev => ({ ...prev, [propertyId]: lotes }));
        resetLoteForm();
        toast({
          title: editingLote ? 'Lote actualizado' : 'Lote agregado',
          description: `${loteFormData.tipo === 'casa' ? 'Casa' : 'Lote'} #${loteFormData.numero} ${editingLote ? 'actualizado' : 'agregado'} exitosamente.`,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast({
        title: 'Error al guardar lote',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setSavingLote(false);
    }
  };

  const handleLoteImageUpload = async (propertyId: string, file?: File) => {
    if (!file) return;

    setUploadingLoteImage(true);
    const publicUrl = await uploadLoteImage({
      propertyId,
      loteId: editingLote?.id,
      file,
    });
    setUploadingLoteImage(false);

    if (!publicUrl) {
      toast({
        title: 'Error',
        description: 'No se pudo subir la imagen. Verifica tus permisos.',
        variant: 'destructive',
      });
      return;
    }

    setLoteFormData(prev => ({ ...prev, imageUrl: publicUrl }));
    toast({
      title: 'Imagen cargada',
      description: 'La imagen quedó lista; pulsa Guardar para aplicar el cambio.',
    });
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

  const getCheckpointCount = (lote: PropertyLote): number => {
    let count = 0;
    if (lote.checkpoints && lote.checkpoints.length > 0) {
      count = lote.checkpoints.length;
    } else if (lote.checkpointLatitude && lote.checkpointLongitude) {
      count = 1;
    }
    return count;
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

              {/* Map Image Upload */}
              <div>
                <label className="text-sm font-medium mb-2 block">Imagen del Mapa (opcional)</label>
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    ref={mapImageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleMapImageUpload(e.target.files?.[0])}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => mapImageInputRef.current?.click()}
                    disabled={uploadingMapImage}
                  >
                    {uploadingMapImage ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    Subir imagen de mapa
                  </Button>
                  {formData.mapImageUrl && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setFormData(prev => ({ ...prev, mapImageUrl: '' }))}
                    >
                      Quitar
                    </Button>
                  )}
                </div>
                {formData.mapImageUrl && (
                  <div className="mt-3 rounded-lg border border-border overflow-hidden max-w-sm">
                    <img
                      src={formData.mapImageUrl}
                      alt="Vista previa del mapa"
                      className="w-full h-40 object-cover"
                    />
                  </div>
                )}
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
                      title="Editar propiedad"
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
                        onClick={() => (showLoteForm === property.id ? resetLoteForm() : openNewLoteForm(property.id))}
                      >
                        <Plus className="w-4 h-4" />
                        {showLoteForm === property.id ? 'Cerrar' : 'Agregar Lote/Casa'}
                      </Button>
                    </div>

                    {/* Add/Edit Lote Form */}
                    {showLoteForm === property.id && (
                      <div className="bg-secondary/50 rounded-lg p-4 mb-4 animate-fade-in">
                        <div className="flex items-center justify-between gap-3 mb-3">
                          <p className="text-sm font-medium">
                            {editingLote
                              ? `${editingLote.tipo === 'casa' ? 'Editar Casa' : 'Editar Lote'} #${editingLote.numero}`
                              : 'Nuevo Lote/Casa'}
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          <div>
                            <label className="text-sm font-medium mb-1 block">Tipo</label>
                            <Select
                              value={loteFormData.tipo}
                              onValueChange={(v) =>
                                setLoteFormData(prev => ({ ...prev, tipo: v as 'lote' | 'casa' }))
                              }
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
                            <label className="text-sm font-medium mb-1 block">Latitud Destino *</label>
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
                            <label className="text-sm font-medium mb-1 block">Longitud Destino *</label>
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

                        {/* Verify coordinates link */}
                        {loteFormData.latitude && loteFormData.longitude && (
                          <div className="mt-3">
                            <a
                              href={`https://www.google.com/maps?q=${loteFormData.latitude},${loteFormData.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                            >
                              <ExternalLink className="w-4 h-4" />
                              Verificar coordenadas destino en Google Maps
                            </a>
                          </div>
                        )}

                        {/* Multiple Checkpoints Section */}
                        <div className="mt-4 p-3 border border-dashed border-border rounded-lg bg-muted/30">
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                              <Route className="w-4 h-4 text-orange-500" />
                              Puntos de Control ({checkpointsFormData.length})
                            </label>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={addCheckpoint}
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Agregar Punto
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground mb-3">
                            La ruta pasará por estos puntos en orden antes de llegar al destino final.
                          </p>

                          {checkpointsFormData.length === 0 ? (
                            <p className="text-xs text-muted-foreground text-center py-3">
                              No hay puntos de control. La ruta irá directamente al destino.
                            </p>
                          ) : (
                            <div className="space-y-3">
                              {checkpointsFormData.map((cp, index) => (
                                <div
                                  key={index}
                                  className="flex items-start gap-2 p-2 bg-background rounded-md border border-border"
                                >
                                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-bold mt-1">
                                    {index + 1}
                                  </div>
                                  <div className="flex-1 grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="text-xs font-medium mb-1 block">Latitud</label>
                                      <Input
                                        type="number"
                                        step="any"
                                        value={cp.latitude}
                                        onChange={(e) => updateCheckpoint(index, 'latitude', e.target.value)}
                                        placeholder="6.1082"
                                        className="h-8 text-sm"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-xs font-medium mb-1 block">Longitud</label>
                                      <Input
                                        type="number"
                                        step="any"
                                        value={cp.longitude}
                                        onChange={(e) => updateCheckpoint(index, 'longitude', e.target.value)}
                                        placeholder="-75.4873"
                                        className="h-8 text-sm"
                                      />
                                    </div>
                                  </div>
                                  <div className="flex flex-col gap-1 mt-1">
                                    {cp.latitude && cp.longitude && (
                                      <a
                                        href={`https://www.google.com/maps?q=${cp.latitude},${cp.longitude}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-orange-600 hover:text-orange-700"
                                        title="Ver en mapa"
                                      >
                                        <ExternalLink className="w-4 h-4" />
                                      </a>
                                    )}
                                    <Button
                                      type="button"
                                      size="icon"
                                      variant="ghost"
                                      className="h-6 w-6"
                                      onClick={() => removeCheckpoint(index)}
                                      title="Eliminar punto"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-start mt-3">
                          <div className="lg:col-span-2">
                            <label className="text-sm font-medium mb-1 block">Imagen (opcional)</label>
                            <div className="flex flex-wrap items-center gap-2">
                              <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleLoteImageUpload(property.id, e.target.files?.[0])}
                              />
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadingLoteImage}
                              >
                                {uploadingLoteImage ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Upload className="w-4 h-4" />
                                )}
                                Subir imagen
                              </Button>
                              {loteFormData.imageUrl ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setLoteFormData(prev => ({ ...prev, imageUrl: '' }))}
                                >
                                  Quitar
                                </Button>
                              ) : null}
                            </div>
                          </div>

                          <div className="lg:col-span-1">
                            {loteFormData.imageUrl ? (
                              <div className="rounded-md border border-border overflow-hidden bg-background">
                                <img
                                  src={loteFormData.imageUrl}
                                  alt={`Imagen de ${loteFormData.tipo} ${loteFormData.numero}`}
                                  className="w-full h-28 object-cover"
                                  loading="lazy"
                                />
                              </div>
                            ) : (
                              <div className="rounded-md border border-dashed border-border p-4 text-xs text-muted-foreground flex items-center gap-2">
                                <ImageIcon className="w-4 h-4" />
                                Sin imagen
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2 mt-4">
                          <Button
                            size="sm"
                            type="button"
                            onClick={() => handleSaveLote(property.id)}
                            disabled={
                              savingLote ||
                              !loteFormData.numero ||
                              !loteFormData.latitude ||
                              !loteFormData.longitude
                            }
                          >
                            {savingLote ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Save className="w-4 h-4" />
                            )}
                            {editingLote ? 'Actualizar' : 'Guardar'}
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
                            className="bg-secondary/30 rounded-lg p-3 flex items-center justify-between gap-3"
                          >
                            <div className="min-w-0">
                              <p className="font-medium truncate">
                                {lote.tipo === 'casa' ? 'Casa' : 'Lote'} #{lote.numero}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {lote.latitude.toFixed(4)}, {lote.longitude.toFixed(4)}
                              </p>
                              {getCheckpointCount(lote) > 0 && (
                                <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                                  <Route className="w-3.5 h-3.5" />
                                  {getCheckpointCount(lote)} punto{getCheckpointCount(lote) > 1 ? 's' : ''} de control
                                </p>
                              )}
                              {lote.imageUrl ? (
                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                  <ImageIcon className="w-3.5 h-3.5" />
                                  Con imagen
                                </p>
                              ) : null}
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditLote(lote, property.id)}
                                title="Editar"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteLote(lote, property.id)}
                                title="Eliminar"
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
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
