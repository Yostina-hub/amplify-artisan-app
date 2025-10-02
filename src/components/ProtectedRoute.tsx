import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'admin' | 'agent' | 'user';
  allowUnapproved?: boolean;
}

export const ProtectedRoute = ({ children, requiredRole, allowUnapproved }: ProtectedRouteProps) => {
  const { user, loading, hasRole, roles } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/auth');
      } else if (requiredRole && !hasRole(requiredRole)) {
        navigate('/');
      } else if (!requiredRole && !allowUnapproved && roles.length === 0) {
        navigate('/pending-approval');
      }
    }
  }, [user, loading, requiredRole, hasRole, roles, allowUnapproved, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || (requiredRole && !hasRole(requiredRole)) || (!requiredRole && !allowUnapproved && roles.length === 0)) {
    return null;
  }

  return <>{children}</>;
};
