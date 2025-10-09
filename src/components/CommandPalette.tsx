import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Home,
  Users,
  Building2,
  BarChart3,
  Settings,
  MessageCircle,
  Zap,
  FileText,
  Calendar,
  Mail,
  Phone,
  Shield,
  Database,
  Globe,
  Sparkles,
  UserPlus,
  FileCheck,
  CreditCard,
  Search,
} from "lucide-react";

interface CommandItem {
  id: string;
  label: string;
  icon: any;
  action: () => void;
  group: string;
  keywords?: string[];
  requiresRole?: "admin" | "superadmin";
  requiresPermission?: string;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { isSuperAdmin, isCompanyAdmin, hasRole } = useAuth();
  const { hasPermission } = usePermissions();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const allCommands: CommandItem[] = [
    // Navigation
    { id: "nav-dashboard", label: "Dashboard", icon: Home, action: () => navigate("/dashboard"), group: "Navigation" },
    { id: "nav-calendar", label: "Calendar", icon: Calendar, action: () => navigate("/calendar"), group: "Navigation" },
    
    // Social Media
    { id: "social-composer", label: "Composer", icon: MessageCircle, action: () => navigate("/composer"), group: "Social Media" },
    { id: "social-inbox", label: "Social Inbox", icon: MessageCircle, action: () => navigate("/social-inbox"), group: "Social Media" },
    { id: "social-listening", label: "Social Listening", icon: Globe, action: () => navigate("/social-listening"), group: "Social Media" },
    { id: "social-monitoring", label: "Brand Monitoring", icon: Globe, action: () => navigate("/brand-monitoring"), group: "Social Media" },
    { id: "social-intelligence", label: "Social Intelligence", icon: Sparkles, action: () => navigate("/social-intelligence"), group: "Social Media" },
    { id: "social-metrics", label: "Social Metrics", icon: BarChart3, action: () => navigate("/social-media-metrics"), group: "Social Media" },
    
    // Marketing
    { id: "marketing-ads", label: "Ad Campaigns", icon: Globe, action: () => navigate("/ad-campaigns"), group: "Marketing" },
    { id: "marketing-influencer", label: "Influencer Marketing", icon: Users, action: () => navigate("/influencer-marketing"), group: "Marketing" },
    { id: "marketing-email", label: "Email Marketing", icon: Mail, action: () => navigate("/email-marketing"), group: "Marketing" },
    { id: "marketing-analytics", label: "Analytics", icon: BarChart3, action: () => navigate("/analytics"), group: "Marketing" },
    
    // AI Features
    { id: "ai-studio", label: "AI Content Studio", icon: Sparkles, action: () => navigate("/ai-studio"), group: "AI Features" },
    { id: "ai-automation", label: "Automation", icon: Zap, action: () => navigate("/automation"), group: "AI Features" },
    { id: "ai-analytics", label: "AI Analytics", icon: BarChart3, action: () => navigate("/ai-analytics"), group: "AI Features" },
    
    // CRM
    { id: "crm-contacts", label: "Contacts", icon: Users, action: () => navigate("/contacts"), group: "CRM" },
    { id: "crm-accounts", label: "Accounts", icon: Building2, action: () => navigate("/accounts"), group: "CRM" },
    { id: "crm-leads", label: "Leads", icon: UserPlus, action: () => navigate("/leads"), group: "CRM" },
    { id: "crm-pipeline", label: "Sales Pipeline", icon: BarChart3, action: () => navigate("/pipeline"), group: "CRM" },
    { id: "crm-activities", label: "Activities", icon: Calendar, action: () => navigate("/activities"), group: "CRM" },
    { id: "crm-products", label: "Products", icon: Database, action: () => navigate("/products"), group: "CRM" },
    { id: "crm-quotes", label: "Quotes", icon: FileText, action: () => navigate("/quotes"), group: "CRM" },
    { id: "crm-invoices", label: "Invoices", icon: FileCheck, action: () => navigate("/invoices"), group: "CRM" },
    { id: "crm-payments", label: "Payments", icon: CreditCard, action: () => navigate("/payments"), group: "CRM" },
    { id: "crm-reports", label: "Reports", icon: FileText, action: () => navigate("/reports"), group: "CRM" },
    { id: "crm-documents", label: "Documents", icon: FileText, action: () => navigate("/documents"), group: "CRM" },
    { id: "crm-territory", label: "Territory Management", icon: Globe, action: () => navigate("/territory-management"), group: "CRM" },
    { id: "crm-contracts", label: "Contract Management", icon: FileCheck, action: () => navigate("/contract-management"), group: "CRM" },
    
    // Service & Support
    { id: "service-support", label: "Customer Support", icon: Phone, action: () => navigate("/customer-support"), group: "Service" },
    { id: "service-callcenter", label: "Call Center", icon: Phone, action: () => navigate("/call-center"), group: "Service" },
    { id: "service-reports", label: "Call Reports", icon: BarChart3, action: () => navigate("/call-reports"), group: "Service" },
    
    // Projects
    { id: "projects", label: "Project Management", icon: Database, action: () => navigate("/project-management"), group: "Projects" },
    
    // Admin - Company
    { id: "company-email", label: "Email Settings", icon: Mail, action: () => navigate("/company/email-settings"), group: "Company Admin", requiresRole: "admin" },
    { id: "company-audit", label: "Audit Log", icon: Shield, action: () => navigate("/company/audit-log"), group: "Company Admin", requiresRole: "admin" },
    { id: "company-platforms", label: "Platform Subscriptions", icon: Globe, action: () => navigate("/company/platform-subscriptions"), group: "Company Admin", requiresRole: "admin" },
    { id: "company-api", label: "API Management", icon: Database, action: () => navigate("/company/api-management"), group: "Company Admin", requiresRole: "admin" },
    
    // Admin - Super
    { id: "admin-users", label: "User Management", icon: Users, action: () => navigate("/admin/users"), group: "Super Admin", requiresRole: "superadmin" },
    { id: "admin-companies", label: "Company Management", icon: Building2, action: () => navigate("/admin/companies"), group: "Super Admin", requiresRole: "superadmin" },
    { id: "admin-branches", label: "Branch Management", icon: Building2, action: () => navigate("/admin/branches"), group: "Super Admin", requiresRole: "superadmin" },
    { id: "admin-permissions", label: "Permissions", icon: Shield, action: () => navigate("/admin/permissions"), group: "Super Admin", requiresRole: "superadmin" },
    { id: "admin-moderation", label: "Content Moderation", icon: Shield, action: () => navigate("/admin/moderation"), group: "Super Admin", requiresRole: "superadmin" },
    { id: "admin-platforms", label: "Social Platforms", icon: Globe, action: () => navigate("/admin/social-platforms"), group: "Super Admin", requiresRole: "superadmin" },
    { id: "admin-api", label: "API Management", icon: Database, action: () => navigate("/admin/api-management"), group: "Super Admin", requiresRole: "superadmin" },
    
    // Settings
    { id: "settings", label: "Settings", icon: Settings, action: () => navigate("/settings"), group: "Settings" },
    { id: "help", label: "Help", icon: Phone, action: () => navigate("/help"), group: "Settings" },
  ];

  // Filter commands based on user permissions
  const commands = allCommands.filter(cmd => {
    if (cmd.requiresRole === "superadmin") return isSuperAdmin;
    if (cmd.requiresRole === "admin") return isSuperAdmin || isCompanyAdmin;
    return true;
  });

  const handleSelect = (action: () => void) => {
    setOpen(false);
    action();
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
      >
        <Search className="h-4 w-4" />
        <span className="hidden md:inline">Search...</span>
        <kbd className="hidden md:inline pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 ml-auto">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          
          {["Navigation", "Social Media", "Marketing", "AI Features", "CRM", "Service", "Projects", "Company Admin", "Super Admin", "Settings"].map((group) => {
            const groupCommands = commands.filter((cmd) => cmd.group === group);
            if (groupCommands.length === 0) return null;
            
            return (
              <div key={group}>
                <CommandGroup heading={group}>
                  {groupCommands.map((cmd) => (
                    <CommandItem
                      key={cmd.id}
                      onSelect={() => handleSelect(cmd.action)}
                    >
                      <cmd.icon className="mr-2 h-4 w-4" />
                      <span>{cmd.label}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandSeparator />
              </div>
            );
          })}
        </CommandList>
      </CommandDialog>
    </>
  );
}
