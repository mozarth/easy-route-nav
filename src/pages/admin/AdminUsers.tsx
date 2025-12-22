import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Plus,
  Edit,
  Trash2,
  Power,
  PowerOff,
  LogOut,
  Save,
  X,
  Loader2,
  Shield,
  User,
  Building,
  MapPin,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/Logo';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { AdminNav } from '@/components/admin/AdminNav';
// Storage is now fully async and uses Supabase directly

type UserRole = 'admin' | 'portero' | 'usuario';

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  assignedProperties?: string[];
}

interface PropertyOption {
  id: string;
  name: string;
}

const userSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  full_name: z.string().min(2, 'Nombre requerido'),
  role: z.enum(['admin', 'portero', 'usuario']),
});

const AdminUsers = () => {
  const { logout, isAdmin, isLoading: authLoading, profile } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'usuario' as UserRole,
  });
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return;

    // If user session exists but profile isn't ready, stop the infinite spinner.
    // (AuthProvider will try to auto-create the missing profile.)
    if (!profile) {
      setLoading(false);
      return;
    }

    // If the user is logged in but not admin, keep them on this page
    // and show an "access denied" message (instead of bouncing back to dashboard).
    if (profile && !isAdmin) {
      setLoading(false);
      return;
    }

    // Load users and properties only for confirmed admins
    if (isAdmin) {
      loadUsersAndProperties();
    }
  }, [isAdmin, authLoading, profile]);

  const loadUsersAndProperties = async () => {
    setLoading(true);
    try {
      // Get properties (DB)
      const { data: propsData, error: propsError } = await supabase
        .from('properties')
        .select('id, name')
        .order('name');

      if (propsError) throw propsError;

      // Use properties directly from Supabase
      const finalProps = propsData || [];

      setProperties(finalProps);

      // Get profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Get all user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) {
        console.error('Error loading roles:', rolesError);
      }

      // Get property access for all users
      const { data: accessData, error: accessError } = await supabase
        .from('user_property_access')
        .select('profile_id, property_id');

      if (accessError) {
        console.error('Error loading property access:', accessError);
      }

      // Map roles and property access to profiles
      const usersWithRoles = (profilesData || []).map((profileData) => {
        const userRole = rolesData?.find((r) => r.user_id === profileData.user_id);
        const userProperties = (accessData || [])
          .filter((a) => a.profile_id === profileData.id)
          .map((a) => a.property_id);
        return {
          ...profileData,
          role: ((userRole?.role as UserRole) || 'usuario') as UserRole,
          assignedProperties: userProperties,
        };
      });

      setUsers(usersWithRoles as UserProfile[]);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los usuarios',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      full_name: '',
      role: 'usuario',
    });
    setSelectedProperties([]);
    setEditingUser(null);
    setShowForm(false);
    setFormErrors({});
  };

  const handleEdit = (user: UserProfile) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: '',
      full_name: user.full_name,
      role: user.role,
    });
    setSelectedProperties(user.assignedProperties || []);
    setShowForm(true);
  };

  const togglePropertySelection = (propertyId: string) => {
    setSelectedProperties((prev) =>
      prev.includes(propertyId)
        ? prev.filter((id) => id !== propertyId)
        : [...prev, propertyId]
    );
  };

  const savePropertyAccess = async (profileId: string) => {
    // Delete existing property access for this profile
    await supabase
      .from('user_property_access')
      .delete()
      .eq('profile_id', profileId);

    // Insert new property access entries
    if (selectedProperties.length > 0 && formData.role !== 'admin') {
      const accessEntries = selectedProperties.map((propertyId) => ({
        profile_id: profileId,
        property_id: propertyId,
      }));

      const { error } = await supabase
        .from('user_property_access')
        .insert(accessEntries);

      if (error) {
        console.error('Error saving property access:', error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    // Validate for new user
    if (!editingUser) {
      const result = userSchema.safeParse(formData);
      if (!result.success) {
        const errors: Record<string, string> = {};
        result.error.errors.forEach((err) => {
          errors[err.path[0] as string] = err.message;
        });
        setFormErrors(errors);
        return;
      }
    }

    setSubmitting(true);

    try {
      if (editingUser) {
        // Update existing user profile
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: formData.full_name,
          })
          .eq('id', editingUser.id);

        if (profileError) throw profileError;

        // Update role in user_roles table
        // First delete existing role, then insert new one
        await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', editingUser.user_id);

        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: editingUser.user_id,
            role: formData.role,
          });

        if (roleError) {
          console.error('Error updating role:', roleError);
        }

        // Update property access (for portero/usuario)
        await savePropertyAccess(editingUser.id);

        toast({
          title: 'Usuario actualizado',
          description: `${formData.full_name} ha sido actualizado.`,
        });
      } else {
        // Create new user via backend function (does NOT change current session)
        const { data, error } = await supabase.functions.invoke('create-user', {
          body: {
            email: formData.email,
            password: formData.password,
            full_name: formData.full_name,
            role: formData.role,
            property_ids: formData.role === 'admin' ? [] : selectedProperties,
          },
        });

        if (error) {
          const message = error.message || 'No se pudo crear el usuario';
          toast({
            title: 'Error',
            description: message,
            variant: 'destructive',
          });
          setSubmitting(false);
          return;
        }

        if (!data?.ok) {
          const message = data?.error || 'No se pudo crear el usuario';
          toast({
            title: 'Error',
            description: message,
            variant: 'destructive',
          });
          setSubmitting(false);
          return;
        }

        toast({
          title: 'Usuario creado',
          description: `${formData.full_name} ha sido creado exitosamente.`,
        });
      }

      await loadUsersAndProperties();
      resetForm();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo guardar el usuario',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (user: UserProfile) => {
    if (!confirm(`¿Estás seguro de eliminar a "${user.full_name}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Usuario eliminado',
        description: `${user.full_name} ha sido eliminado.`,
      });

      await loadUsersAndProperties();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar el usuario',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (user: UserProfile) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !user.is_active })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: user.is_active ? 'Usuario desactivado' : 'Usuario activado',
        description: `${user.full_name} ha sido ${user.is_active ? 'desactivado' : 'activado'}.`,
      });

      await loadUsersAndProperties();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo cambiar el estado',
        variant: 'destructive',
      });
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-4 h-4" />;
      case 'portero':
        return <Building className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'portero':
        return 'Portero';
      default:
        return 'Usuario';
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-primary/10 text-primary';
      case 'portero':
        return 'bg-amber-500/10 text-amber-600';
      default:
        return 'bg-secondary text-muted-foreground';
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
            <h1 className="text-2xl font-bold">Usuarios</h1>
            <p className="text-muted-foreground">Gestiona los usuarios del sistema</p>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4" />
            Nuevo Usuario
          </Button>
        </div>

        {/* Form Modal/Section */}
        {showForm && (
          <div className="glass-card p-6 mb-8 animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">
                {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h2>
              <Button variant="ghost" size="icon" onClick={resetForm}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Nombre Completo *</Label>
                  <Input
                    value={formData.full_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    placeholder="Juan Pérez"
                    className={formErrors.full_name ? 'border-destructive' : ''}
                  />
                  {formErrors.full_name && (
                    <p className="text-sm text-destructive mt-1">{formErrors.full_name}</p>
                  )}
                </div>
                <div>
                  <Label>Rol *</Label>
                  <Select 
                    value={formData.role} 
                    onValueChange={(value: UserRole) => setFormData(prev => ({ ...prev, role: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="usuario">Usuario</SelectItem>
                      <SelectItem value="portero">Portero</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {!editingUser && (
                  <>
                    <div>
                      <Label>Correo Electrónico *</Label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="correo@ejemplo.com"
                        className={formErrors.email ? 'border-destructive' : ''}
                      />
                      {formErrors.email && (
                        <p className="text-sm text-destructive mt-1">{formErrors.email}</p>
                      )}
                    </div>
                    <div>
                      <Label>Contraseña *</Label>
                      <Input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="••••••••"
                        className={formErrors.password ? 'border-destructive' : ''}
                      />
                      {formErrors.password && (
                        <p className="text-sm text-destructive mt-1">{formErrors.password}</p>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Property selector for portero/usuario */}
              {formData.role !== 'admin' && (
                <div className="mt-4">
                  <Label className="flex items-center gap-2 mb-3">
                    <MapPin className="w-4 h-4" />
                    Propiedades Asignadas
                  </Label>
                  {properties.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No hay propiedades disponibles.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {properties.map((prop) => (
                        <label
                          key={prop.id}
                          className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedProperties.includes(prop.id)
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:bg-secondary/50'
                          }`}
                        >
                          <Checkbox
                            checked={selectedProperties.includes(prop.id)}
                            onCheckedChange={() => togglePropertySelection(prop.id)}
                          />
                          <span className="text-sm">{prop.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    {selectedProperties.length} propiedad{selectedProperties.length !== 1 ? 'es' : ''} seleccionada{selectedProperties.length !== 1 ? 's' : ''}
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {editingUser ? 'Actualizar' : 'Guardar'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Users List */}
        {authLoading || loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Cargando usuarios...</p>
          </div>
        ) : !isAdmin ? (
          <div className="glass-card p-8 text-center">
            <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold">Acceso restringido</h2>
            <p className="text-muted-foreground mt-2">
              Tu cuenta no tiene permisos de administrador para ver Usuarios.
            </p>
            <div className="mt-6 flex justify-center">
              <Link to="/admin/panel">
                <Button variant="outline">Volver al Panel</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {users.map((user, index) => (
              <div 
                key={user.id}
                className={`glass-card p-6 animate-fade-in ${!user.is_active ? 'opacity-60' : ''}`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${user.is_active ? 'gradient-primary' : 'bg-secondary'}`}>
                      {getRoleIcon(user.role)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{user.full_name}</h3>
                      <p className="text-muted-foreground text-sm">{user.email}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${getRoleColor(user.role)}`}>
                          {getRoleIcon(user.role)}
                          {getRoleLabel(user.role)}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${user.is_active ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                          {user.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                      {/* Show assigned properties for portero/usuario */}
                      {user.role !== 'admin' && user.assignedProperties && user.assignedProperties.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 mt-2">
                          <MapPin className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {user.assignedProperties
                              .map((pid) => properties.find((p) => p.id === pid)?.name)
                              .filter(Boolean)
                              .join(', ') || `${user.assignedProperties.length} propiedad(es)`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleToggleActive(user)}
                      title={user.is_active ? 'Desactivar' : 'Activar'}
                    >
                      {user.is_active ? (
                        <Power className="w-4 h-4 text-green-600" />
                      ) : (
                        <PowerOff className="w-4 h-4 text-muted-foreground" />
                      )}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleEdit(user)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleDelete(user)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {users.length === 0 && (
              <div className="text-center py-12 glass-card">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No hay usuarios registrados.</p>
                <Button className="mt-4" onClick={() => setShowForm(true)}>
                  <Plus className="w-4 h-4" />
                  Agregar Primer Usuario
                </Button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminUsers;
