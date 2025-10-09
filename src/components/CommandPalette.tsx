import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

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

  const commands: CommandItem[] = [
    // Navigation
    { id: "nav-dashboard", label: "Dashboard", icon: Home, action: () => navigate("/dashboard"), group: "Navigation" },
    { id: "nav-contacts", label: "Contacts", icon: Users, action: () => navigate("/contacts"), group: "Navigation" },
    { id: "nav-accounts", label: "Accounts", icon: Building2, action: () => navigate("/accounts"), group: "Navigation" },
    { id: "nav-leads", label: "Leads", icon: UserPlus, action: () => navigate("/leads"), group: "Navigation" },
    { id: "nav-analytics", label: "Analytics", icon: BarChart3, action: () => navigate("/admin/reach-analytics"), group: "Navigation" },
    { id: "nav-calendar", label: "Calendar", icon: Calendar, action: () => navigate("/calendar"), group: "Navigation" },
    
    // AI Features
    { id: "ai-studio", label: "AI Content Studio", icon: Sparkles, action: () => navigate("/ai-studio"), group: "AI Features" },
    { id: "ai-inbox", label: "Social Inbox", icon: MessageCircle, action: () => navigate("/social-inbox"), group: "AI Features" },
    { id: "ai-automation", label: "Automation", icon: Zap, action: () => navigate("/automation"), group: "AI Features" },
    { id: "ai-analytics", label: "AI Analytics", icon: BarChart3, action: () => navigate("/ai-analytics"), group: "AI Features" },
    
    // CRM
    { id: "crm-pipeline", label: "Sales Pipeline", icon: BarChart3, action: () => navigate("/pipeline"), group: "CRM" },
    { id: "crm-quotes", label: "Quotes", icon: FileText, action: () => navigate("/quotes"), group: "CRM" },
    { id: "crm-invoices", label: "Invoices", icon: FileCheck, action: () => navigate("/invoices"), group: "CRM" },
    { id: "crm-payments", label: "Payments", icon: CreditCard, action: () => navigate("/payments"), group: "CRM" },
    { id: "crm-support", label: "Customer Support", icon: Phone, action: () => navigate("/customer-support"), group: "CRM" },
    { id: "crm-callcenter", label: "Call Center", icon: Phone, action: () => navigate("/call-center"), group: "CRM" },
    
    // Admin
    { id: "admin-users", label: "User Management", icon: Users, action: () => navigate("/admin/users"), group: "Admin" },
    { id: "admin-companies", label: "Company Management", icon: Building2, action: () => navigate("/admin/companies"), group: "Admin" },
    { id: "admin-branches", label: "Branch Management", icon: Building2, action: () => navigate("/admin/branches"), group: "Admin" },
    { id: "admin-permissions", label: "Permissions", icon: Shield, action: () => navigate("/admin/permissions"), group: "Admin" },
    { id: "admin-api", label: "API Management", icon: Database, action: () => navigate("/admin/api-management"), group: "Admin" },
    { id: "admin-platforms", label: "Social Platforms", icon: Globe, action: () => navigate("/admin/social-platforms"), group: "Admin" },
    
    // Settings
    { id: "settings", label: "Settings", icon: Settings, action: () => navigate("/settings"), group: "Settings" },
    { id: "settings-email", label: "Email Settings", icon: Mail, action: () => navigate("/company/email-settings"), group: "Settings" },
  ];

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
          
          {["Navigation", "AI Features", "CRM", "Admin", "Settings"].map((group) => {
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
