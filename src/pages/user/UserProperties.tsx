import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Home, Loader2, Eye, QrCode, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { PropertyLote, getLotesByPropertyId } from '@/lib/storage';

interface Property {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  description: string | null;
  latitude: number;
  longitude: number;
  etapa: string | null;
}

const UserProperties = () => {
  const { profile, logout } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [expandedProperty, setExpandedProperty] = useState<string | null>(null);
  const [lotes, setLotes] = useState<Record<string, PropertyLote[]>>({});
  const [loading, setLoading] = useState(true);
  const [loadingLotes, setLoadingLotes] = useState<string | null>(null);

  useEffect(() => {
    loadAssignedProperties();
  }, [profile]);

  const loadAssignedProperties = async () => {
    if (!profile?.id) return;
    
    setLoading(true);
    try {
      // Get property IDs assigned to this user
      const { data: accessData, error: accessError } = await supabase
        .from('user_property_access')
        .select('property_id')
        .eq('profile_id', profile.id);

      if (accessError) {
        console.error('Error loading property access:', accessError);
        setLoading(false);
        return;
      }

      if (!accessData || accessData.length === 0) {
        setProperties([]);
        setLoading(false);
        return;
      }

      const propertyIds = accessData.map(a => a.property_id);

      // Fetch the actual properties
      const { data: propsData, error: propsError } = await supabase
        .from('properties')
        .select('*')
        .in('id', propertyIds)
        .eq('is_active', true)
        .order('name');

      if (propsError) {
        console.error('Error loading properties:', propsError);
      } else {
        setProperties(propsData || []);
      }
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  };

  const toggleExpand = async (propertyId: string) => {
    if (expandedProperty === propertyId) {
      setExpandedProperty(null);
      return;
    }

    setExpandedProperty(propertyId);
    
    if (!lotes[propertyId]) {
      setLoadingLotes(propertyId);
      try {
        const propertyLotes = await getLotesByPropertyId(propertyId);
        setLotes(prev => ({ ...prev, [propertyId]: propertyLotes }));
      } catch (error) {
        console.error('Error loading lotes:', error);
      }
      setLoadingLotes(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Logo size="md" showText />
          <div className="flex items-center gap-4">
            <Link to="/user/qr-codes">
              <Button variant="outline" size="sm">
                <QrCode className="w-4 h-4" />
                Ver Códigos QR
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Mis Propiedades</h1>
          <p className="text-muted-foreground">
            Bienvenido, {profile?.full_name}. Aquí puedes ver las propiedades asignadas a tu cuenta.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-lg border border-border">
            <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Sin propiedades asignadas</h3>
            <p className="text-muted-foreground">
              No tienes propiedades asignadas. Contacta al administrador para obtener acceso.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {properties.map((property) => (
              <div key={property.id} className="bg-card rounded-lg border border-border overflow-hidden">
                {/* Property Header */}
                <div 
                  className="p-4 cursor-pointer hover:bg-secondary/50 transition-colors"
                  onClick={() => toggleExpand(property.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{property.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {property.address || 'Sin dirección'}
                          {property.etapa && ` • Etapa ${property.etapa}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link to={`/property/${property.slug}`} onClick={(e) => e.stopPropagation()}>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4" />
                          Ver Mapa
                        </Button>
                      </Link>
                      <Button variant="ghost" size="sm">
                        {expandedProperty === property.id ? 'Ocultar' : 'Ver Lotes'}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Expanded Lotes */}
                {expandedProperty === property.id && (
                  <div className="border-t border-border p-4 bg-secondary/30">
                    {loadingLotes === property.id ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      </div>
                    ) : lotes[property.id]?.length === 0 ? (
                      <p className="text-center text-muted-foreground py-4">
                        No hay lotes o casas registrados en esta propiedad.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {lotes[property.id]?.map((lote) => (
                          <div 
                            key={lote.id} 
                            className="bg-card rounded-lg border border-border p-3 flex items-center gap-3"
                          >
                            {lote.imageUrl ? (
                              <img 
                                src={lote.imageUrl} 
                                alt={`${lote.tipo} ${lote.numero}`}
                                className="w-12 h-12 rounded object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded bg-secondary flex items-center justify-center">
                                <Home className="w-6 h-6 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium capitalize">
                                {lote.tipo} {lote.numero}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {lote.latitude.toFixed(6)}, {lote.longitude.toFixed(6)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default UserProperties;
