import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export function DashboardRedirect() {
  const navigate = useNavigate();
  const { isSuperAdmin, isCompanyAdmin, roles, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (isSuperAdmin) {
        // Super admin goes to admin dashboard with all companies
        navigate("/admin", { replace: true });
      } else if (isCompanyAdmin || roles.length > 0) {
        // Company admin or regular users go to company dashboard
        navigate("/company-dashboard", { replace: true });
      } else {
        // Users without company/roles stay on regular dashboard
        navigate("/company-dashboard", { replace: true });
      }
    }
  }, [isSuperAdmin, isCompanyAdmin, roles, loading, navigate]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-muted-foreground">Loading...</div>
    </div>
  );
}
