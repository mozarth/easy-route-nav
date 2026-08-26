import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type UserRole = 'admin' | 'portero' | 'usuario';

interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isManager: boolean;
  managedPropertyIds: string[];
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  signup: (email: string, password: string, fullName: string, role?: UserRole) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [managedPropertyIds, setManagedPropertyIds] = useState<string[]>([]);
  const [accessLoading, setAccessLoading] = useState(false);

  useEffect(() => {
    if (!profile?.id) {
      setManagedPropertyIds([]);
      setAccessLoading(false);
      return;
    }
    setAccessLoading(true);
    supabase
      .from('user_property_access')
      .select('property_id')
      .eq('profile_id', profile.id)
      .then(({ data }) => {
        setManagedPropertyIds((data ?? []).map((r) => r.property_id));
        setAccessLoading(false);
      });
  }, [profile?.id]);


  const fetchProfile = async (userId: string) => {
    try {
      // 1) Fetch profile (if missing, create it once via backend function)
      const { data: profileData1, error: profileError1 } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileError1) {
        console.error('Error fetching profile:', profileError1);
        return null;
      }

      let profileData = profileData1;

      if (!profileData) {
        const { error: ensureError } = await supabase.functions.invoke('ensure-profile', {
          body: {},
        });

        if (ensureError) {
          console.error('Error ensuring profile:', ensureError);
          return null;
        }

        const { data: profileData2, error: profileError2 } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (profileError2) {
          console.error('Error fetching profile (after ensure):', profileError2);
          return null;
        }

        profileData = profileData2;
      }

      if (!profileData) return null;

      // 2) Fetch role from user_roles (authoritative)
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (roleError) {
        console.error('Error fetching role:', roleError);
      }

      return {
        ...profileData,
        role: ((roleData?.role as UserRole) ?? 'usuario') as UserRole,
      } as Profile;
    } catch (err) {
      console.error('Error in fetchProfile:', err);
      return null;
    }
  };

  useEffect(() => {
    let active = true;
    let currentUserId: string | null = null;
    let inFlight = false;

    const loadProfile = async (userId: string) => {
      if (inFlight && currentUserId === userId) return;
      currentUserId = userId;
      inFlight = true;
      setIsLoading(true);
      try {
        const p = await fetchProfile(userId);
        if (!active) return;
        setProfile(p);
      } finally {
        if (active) {
          inFlight = false;
          setIsLoading(false);
        }
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Avoid refetching on token refresh for the same user
          if (currentUserId === session.user.id) return;
          setTimeout(() => loadProfile(session.user.id), 0);
        } else {
          currentUserId = null;
          setProfile(null);
          setIsLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return;
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);


  const login = async (email: string, password: string): Promise<{ error: string | null }> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message === 'Invalid login credentials') {
          return { error: 'Credenciales inválidas. Verifica tu correo y contraseña.' };
        }
        return { error: error.message };
      }

      return { error: null };
    } catch (err) {
      return { error: 'Error de conexión. Intenta nuevamente.' };
    }
  };

  const signup = async (
    email: string, 
    password: string, 
    fullName: string, 
    role: UserRole = 'usuario'
  ): Promise<{ error: string | null }> => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
            role: role,
          },
        },
      });

      if (error) {
        if (error.message.includes('already registered')) {
          return { error: 'Este correo ya está registrado.' };
        }
        return { error: error.message };
      }

      return { error: null };
    } catch (err) {
      return { error: 'Error de conexión. Intenta nuevamente.' };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const isAuthenticated = !!session && !!user;
  const isAdmin = profile?.role === 'admin' && profile?.is_active === true;
  const isManager =
    profile?.role === 'portero' && profile?.is_active === true && managedPropertyIds.length > 0;
  // Consider the app still loading while the session exists but the profile/access
  // data has not been resolved yet (prevents redirect flickering).
  const loading = isLoading || accessLoading || (isAuthenticated && profile === null && isLoading);


  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        session, 
        profile, 
        isAuthenticated, 
        isAdmin,
        isManager,
        managedPropertyIds,
        isLoading: loading, 
        login, 
        signup, 
        logout 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
