import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';
import { supabase } from '@/integrations/supabase/client';

type UserRole = 'admin' | 'agent' | 'user';

interface User {
  id: string;
  email: string;
  full_name?: string;
  company_id?: string;
  branch_id?: string;
}

interface AuthContextType {
  user: User | null;
  session: { access_token: string } | null;
  loading: boolean;
  roles: UserRole[];
  rolesDetailed: { role: UserRole; company_id: string | null }[];
  isSuperAdmin: boolean;
  isCompanyAdmin: boolean;
  hasRole: (role: UserRole) => boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_MODE = import.meta.env.VITE_AUTH_MODE || 'supabase';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<{ access_token: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [rolesDetailed, setRolesDetailed] = useState<{ role: UserRole; company_id: string | null }[]>([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isCompanyAdmin, setIsCompanyAdmin] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (AUTH_MODE === 'supabase') {
      initSupabaseAuth();
    } else {
      const token = apiClient.getToken();
      if (token) {
        loadCurrentUser();
      } else {
        setLoading(false);
      }
    }
  }, []);

  const initSupabaseAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      const userData = session.user;
      setUser({
        id: userData.id,
        email: userData.email!,
        full_name: userData.user_metadata?.full_name,
      });
      setSession({ access_token: session.access_token });
      await fetchUserRoles(userData.id);
    } else {
      setLoading(false);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        const userData = session.user;
        setUser({
          id: userData.id,
          email: userData.email!,
          full_name: userData.user_metadata?.full_name,
        });
        setSession({ access_token: session.access_token });
        fetchUserRoles(userData.id);
      } else {
        setUser(null);
        setSession(null);
        setRoles([]);
        setRolesDetailed([]);
        setIsSuperAdmin(false);
        setIsCompanyAdmin(false);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  };

  const loadCurrentUser = async () => {
    setLoading(true);
    const response = await apiClient.getCurrentUser();

    if (response.data) {
      setUser(response.data);
      setSession({ access_token: apiClient.getToken()! });
      await fetchUserRoles(response.data.id);
    } else {
      apiClient.setToken(null);
      setUser(null);
      setSession(null);
      setLoading(false);
    }
  };

  const fetchUserRoles = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role, company_id')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching roles:', error);
      setRoles([]);
      setRolesDetailed([]);
      setIsSuperAdmin(false);
      setIsCompanyAdmin(false);
      setLoading(false);
      return;
    }

    const detailed = (data || []).map(r => ({ role: r.role as UserRole, company_id: (r as any).company_id ?? null }));
    const userRoles = detailed.map(r => r.role);
    const superAdmin = detailed.some(r => r.role === 'admin' && (r.company_id === null || r.company_id === undefined));
    const companyAdmin = detailed.some(r => r.role === 'admin' && r.company_id);

    setRoles(userRoles);
    setRolesDetailed(detailed);
    setIsSuperAdmin(superAdmin);
    setIsCompanyAdmin(companyAdmin);
    setLoading(false);
  };

  const hasRole = (role: UserRole) => {
    if (role === 'admin') {
      return rolesDetailed.some(r => r.role === 'admin' && (r.company_id === null || r.company_id === undefined));
    }
    return roles.includes(role);
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    if (AUTH_MODE === 'supabase') {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: "Account created!",
        description: "You can now sign in with your credentials.",
      });
    } else {
      const response = await apiClient.register(email, password, fullName);

      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data) {
        apiClient.setToken(response.data.access_token);
        await loadCurrentUser();

        toast({
          title: "Account created!",
          description: "You can now use your credentials.",
        });
      }
    }
  };

  const signIn = async (email: string, password: string) => {
    if (AUTH_MODE === 'supabase') {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });
    } else {
      const response = await apiClient.login(email, password);

      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data) {
        apiClient.setToken(response.data.access_token);
        await loadCurrentUser();

        toast({
          title: "Welcome back!",
          description: "You have successfully signed in.",
        });
      }
    }
  };

  const signOut = async () => {
    if (AUTH_MODE === 'supabase') {
      await supabase.auth.signOut();
    } else {
      await apiClient.logout();
    }

    setUser(null);
    setSession(null);
    setRoles([]);
    setRolesDetailed([]);
    setIsSuperAdmin(false);
    setIsCompanyAdmin(false);

    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      roles,
      rolesDetailed,
      isSuperAdmin,
      isCompanyAdmin,
      hasRole,
      signUp,
      signIn,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
