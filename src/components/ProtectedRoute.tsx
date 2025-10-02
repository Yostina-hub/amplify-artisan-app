import { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'admin' | 'agent' | 'user';
  allowUnapproved?: boolean;
}

export const ProtectedRoute = ({ children, requiredRole, allowUnapproved }: ProtectedRouteProps) => {
  const { user, loading, hasRole, roles, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const forcingPasswordChange = !!user?.user_metadata?.requires_password_change;

  useEffect(() => {
    if (!loading) {
      const isAllowedRole = requiredRole
        ? (requiredRole === 'admin' ? isSuperAdmin : hasRole(requiredRole))
        : true;

      if (!user) {
        navigate('/auth');
      } else if (forcingPasswordChange && location.pathname !== '/force-password') {
        navigate('/force-password');
      } else if (requiredRole && !isAllowedRole) {
        navigate('/');
      } else if (!requiredRole && !allowUnapproved && roles.length === 0) {
        navigate('/pending-approval');
      }
    }
  }, [user, loading, requiredRole, hasRole, roles, allowUnapproved, navigate, forcingPasswordChange, location.pathname, isSuperAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || (forcingPasswordChange && location.pathname !== '/force-password') || (requiredRole && !(requiredRole === 'admin' ? isSuperAdmin : hasRole(requiredRole))) || (!requiredRole && !allowUnapproved && roles.length === 0)) {
    return null;
  }

  return <>{children}</>;
};
