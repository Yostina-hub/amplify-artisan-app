import { ReactNode } from 'react';
import { usePermissionCheck } from '@/hooks/usePermissionCheck';
import { Loader2, Lock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface PermissionGateProps {
  /** Single permission key to check */
  permission?: string;
  /** Multiple permission keys - user needs ANY of these */
  anyOf?: string[];
  /** Multiple permission keys - user needs ALL of these */
  allOf?: string[];
  /** Content to render if user has permission */
  children: ReactNode;
  /** Custom fallback content when access is denied (default: null) */
  fallback?: ReactNode;
  /** Show a loading spinner while checking permissions */
  showLoading?: boolean;
  /** Show access denied message (card) instead of hiding */
  showAccessDenied?: boolean;
  /** Custom access denied title */
  accessDeniedTitle?: string;
  /** Custom access denied description */
  accessDeniedDescription?: string;
}

export const PermissionGate = ({
  permission,
  anyOf,
  allOf,
  children,
  fallback = null,
  showLoading = false,
  showAccessDenied = false,
  accessDeniedTitle = 'Access Denied',
  accessDeniedDescription = "You don't have permission to access this feature.",
}: PermissionGateProps) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isLoading } = usePermissionCheck();

  // Show loading state if requested
  if (isLoading && showLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Check permissions based on provided props
  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (anyOf && anyOf.length > 0) {
    hasAccess = hasAnyPermission(anyOf);
  } else if (allOf && allOf.length > 0) {
    hasAccess = hasAllPermissions(allOf);
  } else {
    // No permission specified, allow access
    hasAccess = true;
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  // Show access denied card
  if (showAccessDenied) {
    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Lock className="h-5 w-5" />
            {accessDeniedTitle}
          </CardTitle>
          <CardDescription>
            {accessDeniedDescription}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Contact your administrator if you believe you should have access to this feature.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Return fallback or null
  return <>{fallback}</>;
};

// Inline permission check component for buttons, menu items, etc.
interface RequirePermissionProps {
  permission?: string;
  anyOf?: string[];
  allOf?: string[];
  children: ReactNode;
}

export const RequirePermission = ({
  permission,
  anyOf,
  allOf,
  children,
}: RequirePermissionProps) => {
  return (
    <PermissionGate
      permission={permission}
      anyOf={anyOf}
      allOf={allOf}
      fallback={null}
    >
      {children}
    </PermissionGate>
  );
};

// HOC for wrapping components with permission checks
export function withPermission<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  permissionKey: string
) {
  return function WithPermissionComponent(props: P) {
    return (
      <PermissionGate permission={permissionKey} showAccessDenied>
        <WrappedComponent {...props} />
      </PermissionGate>
    );
  };
}
