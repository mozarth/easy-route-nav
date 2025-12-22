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
  Building
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
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { AdminNav } from '@/components/admin/AdminNav';

type UserRole = 'admin' | 'portero' | 'usuario';

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

const userSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  full_name: z.string().min(2, 'Nombre requerido'),
  role: z.enum(['admin', 'portero', 'usuario']),
});

const AdminUsers = () => {
  const { logout, isAdmin, isLoading: authLoading, signup, profile } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
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

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return;

    // If the user is logged in but not admin, keep them on this page
    // and show an "access denied" message (instead of bouncing back to dashboard).
    if (profile && !isAdmin) {
      setLoading(false);
      return;
    }

    // Load users only for confirmed admins
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin, authLoading, profile]);

  const loadUsers = async () => {
    setLoading(true);
    try {
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

      // Map roles to profiles
      const usersWithRoles = (profilesData || []).map(profile => {
        const userRole = rolesData?.find(r => r.user_id === profile.user_id);
        return {
          ...profile,
          role: (userRole?.role || profile.role || 'usuario') as UserRole,
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
    setShowForm(true);
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

        toast({
          title: 'Usuario actualizado',
          description: `${formData.full_name} ha sido actualizado.`,
        });
      } else {
        // Create new user via signup
        const { error } = await signup(
          formData.email, 
          formData.password, 
          formData.full_name,
          formData.role
        );

        if (error) {
          toast({
            title: 'Error',
            description: error,
            variant: 'destructive',
          });
          setSubmitting(false);
          return;
        }

        // Wait a bit for the user to be created and then insert role
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Get the newly created user profile
        const { data: newProfile } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('email', formData.email)
          .maybeSingle();

        if (newProfile?.user_id) {
          await supabase
            .from('user_roles')
            .insert({
              user_id: newProfile.user_id,
              role: formData.role,
            });
        }

        toast({
          title: 'Usuario creado',
          description: `${formData.full_name} ha sido creado exitosamente.`,
        });
      }

      await loadUsers();
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

      await loadUsers();
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

      await loadUsers();
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
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${getRoleColor(user.role)}`}>
                          {getRoleIcon(user.role)}
                          {getRoleLabel(user.role)}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${user.is_active ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                          {user.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
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
