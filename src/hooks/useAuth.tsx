import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

type UserRole = 'admin' | 'agent' | 'user';

interface AuthContextType {
  user: User | null;
  session: Session | null;
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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [rolesDetailed, setRolesDetailed] = useState<{ role: UserRole; company_id: string | null }[]>([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isCompanyAdmin, setIsCompanyAdmin] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Fetch roles when user changes (defer to avoid deadlocks)
        if (session?.user) {
          setTimeout(() => {
            fetchUserRoles(session.user!.id);
          }, 0);
        } else {
          setRoles([]);
          setLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchUserRoles(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

const fetchUserRoles = async (userId: string) => {
  setLoading(true);
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

  console.log('User roles loaded:', userRoles);
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
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        }
      }
    });

    if (error) throw error;
    
    toast({
      title: "Account created!",
      description: "You can now sign in with your credentials.",
    });
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    
    toast({
      title: "Welcome back!",
      description: "You have successfully signed in.",
    });
  };

const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  
  // Ignore "session not found" errors - user is already logged out
  if (error && error.message !== 'Session not found') {
    console.error('Sign out error:', error);
  }
  
  // Clear state regardless of error
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
  <AuthContext.Provider value={{ user, session, loading, roles, rolesDetailed, isSuperAdmin, isCompanyAdmin, hasRole, signUp, signIn, signOut }}>
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
