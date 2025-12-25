import { Home, FileText, Calendar, BarChart3, Settings, Shield, Users, Flag, Cog, Briefcase, TrendingUp, Megaphone, MessageCircle, Radio, Building2, Mail, Link2, Globe, Key, Package, BarChart2, Layers, DollarSign, CreditCard, FileSearch, ChevronDown, Wallet, Layout, Database, Sparkles, Brain, Zap, LineChart, Box, Target, UserCircle, UserPlus, GitBranch, CheckSquare, ShoppingCart, FileSpreadsheet, Receipt, Banknote, Headphones, Phone, FolderKanban, FileCheck, Volume2, ChevronRight } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

const mainItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Composer", url: "/composer", icon: FileText },
  { title: "Calendar", url: "/calendar", icon: Calendar },
  { title: "Content Moderation", url: "/admin/moderation", icon: Flag },
];

const analyticsItems = [
  { title: "Analytics Hub", url: "/analytics", icon: BarChart3 },
];

const aiAutomationItems = [
  { title: "Automation Workflows", url: "/automation", icon: Zap },
];

const socialMediaItems = [
  { title: "Social Inbox", url: "/social-inbox", icon: MessageCircle },
  { title: "Social Connections", url: "/social-connections", icon: Link2 },
  { title: "Social Intelligence", url: "/social-intelligence", icon: Brain },
];

const builderItems = [
  { title: "Module Builder", url: "/module-builder", icon: Database },
  { title: "Form Builder", url: "/form-builder", icon: Box },
  { title: "ECC", url: "/crm-roadmap", icon: Target },
];

const crmItems = [
  { title: "Contacts", url: "/contacts", icon: UserCircle },
  { title: "Accounts", url: "/accounts", icon: Building2 },
  { title: "Leads", url: "/leads", icon: UserPlus },
  { title: "Pipeline", url: "/pipeline", icon: GitBranch },
  { title: "Activities", url: "/activities", icon: CheckSquare },
  { title: "Products", url: "/products", icon: ShoppingCart },
  { title: "Quotes", url: "/quotes", icon: FileSpreadsheet },
  { title: "Invoices", url: "/invoices", icon: Receipt },
  { title: "Payments", url: "/payments", icon: Banknote },
  { title: "Customer Support", url: "/customer-support", icon: Headphones },
  { title: "Call Center", url: "/call-center", icon: Phone },
  { title: "Territory Management", url: "/territory-management", icon: Target },
  { title: "Project Management", url: "/project-management", icon: FolderKanban },
  { title: "Contract Management", url: "/contract-management", icon: FileCheck },
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "Call Reports", url: "/call-reports", icon: Phone },
  { title: "Email Marketing", url: "/email-marketing", icon: Mail },
  { title: "Documents", url: "/documents", icon: FileText },
];

const marketingItems = [
  { title: "Ad Campaigns", url: "/ad-campaigns", icon: Megaphone },
  { title: "Influencer Marketing", url: "/influencer-marketing", icon: Users },
];

const agentItems = [
  { title: "Agents Dashboard", url: "/agents", icon: Briefcase },
];

const companySettingsItems = [
  { title: "User Management", url: "/admin/users", icon: Users },
  { title: "Live Chat Dashboard", url: "/admin/live-chat", icon: MessageCircle },
  { title: "Platform Access", url: "/company/platform-subscriptions", icon: Package },
  { title: "Email Settings", url: "/company/email-settings", icon: Mail },
  { title: "API Integrations", url: "/company/api-management", icon: Database },
  { title: "Call Center Setup", url: "/company/call-center-integrations", icon: Phone },
  { title: "TTS/STT Settings", url: "/tts-settings", icon: Volume2 },
  { title: "Audit Log", url: "/company/audit-log", icon: FileSearch },
];

const adminManagementItems = [
  { title: "Company Management", url: "/admin/companies", icon: Building2 },
  { title: "User Management", url: "/admin/users", icon: Users },
  { title: "Branch Management", url: "/admin/branches", icon: GitBranch },
];

const adminBusinessItems = [
  { title: "Billing Management", url: "/admin/billing", icon: CreditCard },
  { title: "Industry Management", url: "/admin/industries", icon: Layers },
  { title: "Landing Page Manager", url: "/admin/landing-page", icon: FileText },
];

const adminPlatformItems = [
  { title: "Social Platforms", url: "/admin/social-platforms", icon: Globe },
  { title: "Permission Management", url: "/admin/permissions", icon: Shield },
];

const adminSystemItems = [
  { title: "System Configuration", url: "/admin/system-config", icon: Cog },
];

interface NavSectionProps {
  title: string;
  items: { title: string; url: string; icon: React.ElementType }[];
  isOpen: boolean;
  onToggle: (open: boolean) => void;
  isCollapsed: boolean;
}

function NavSection({ title, items, isOpen, onToggle, isCollapsed }: NavSectionProps) {
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <SidebarGroup className="py-0">
        <CollapsibleTrigger className="w-full" asChild>
          <button className="w-full group">
            <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-sidebar-accent/50 rounded-md mx-2 px-3 py-2 transition-colors text-[11px] font-medium text-sidebar-foreground/60 uppercase tracking-wider">
              <span>{title}</span>
              {!isCollapsed && (
                <ChevronRight className={cn(
                  "h-3.5 w-3.5 transition-transform duration-200 text-sidebar-foreground/40",
                  isOpen && "rotate-90"
                )} />
              )}
            </SidebarGroupLabel>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5 px-2">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-150 text-[13px]",
                          isActive
                            ? "bg-sidebar-primary/15 text-sidebar-primary font-medium"
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                        )
                      }
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}

export function AppSidebar() {
  const { state } = useSidebar();
  const { hasRole, roles, isCompanyAdmin, isSuperAdmin } = useAuth();
  const isCollapsed = state === "collapsed";
  
  const [sections, setSections] = useState({
    analytics: false,
    aiAutomation: false,
    socialMedia: false,
    builder: false,
    crm: true,
    marketing: false,
    companySettings: false,
    adminManagement: false,
    adminPlatform: false,
    adminBusiness: false,
    adminSystem: false,
  });

  const toggleSection = (key: keyof typeof sections) => (open: boolean) => {
    setSections(prev => ({ ...prev, [key]: open }));
  };

  return (
    <Sidebar collapsible="none" className="border-r border-sidebar-border bg-sidebar h-screen sticky top-0">
      <SidebarContent className="bg-sidebar text-sidebar-foreground overflow-y-auto h-full scrollbar-thin">
        {/* Logo */}
        <div className="px-4 py-5 border-b border-sidebar-border/50">
          {!isCollapsed ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="text-base font-semibold text-sidebar-foreground">SocialHub</span>
            </div>
          ) : (
            <div className="w-8 h-8 mx-auto rounded-lg bg-sidebar-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
          )}
        </div>
        
        {/* Main Navigation */}
        <SidebarGroup className="py-2">
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5 px-2">
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-150 text-[13px]",
                          isActive
                            ? "bg-sidebar-primary/15 text-sidebar-primary font-medium"
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                        )
                      }
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="h-px bg-sidebar-border/50 mx-4" />

        {/* Collapsible Sections */}
        <div className="py-2 space-y-1">
          <NavSection 
            title="Social Media" 
            items={socialMediaItems} 
            isOpen={sections.socialMedia} 
            onToggle={toggleSection('socialMedia')} 
            isCollapsed={isCollapsed} 
          />
          
          <NavSection 
            title="Analytics" 
            items={analyticsItems} 
            isOpen={sections.analytics} 
            onToggle={toggleSection('analytics')} 
            isCollapsed={isCollapsed} 
          />
          
          <NavSection 
            title="AI & Automation" 
            items={aiAutomationItems} 
            isOpen={sections.aiAutomation} 
            onToggle={toggleSection('aiAutomation')} 
            isCollapsed={isCollapsed} 
          />
          
          <NavSection 
            title="Builder" 
            items={builderItems} 
            isOpen={sections.builder} 
            onToggle={toggleSection('builder')} 
            isCollapsed={isCollapsed} 
          />
          
          <NavSection 
            title="CRM" 
            items={crmItems} 
            isOpen={sections.crm} 
            onToggle={toggleSection('crm')} 
            isCollapsed={isCollapsed} 
          />
          
          <NavSection 
            title="Marketing" 
            items={marketingItems} 
            isOpen={sections.marketing} 
            onToggle={toggleSection('marketing')} 
            isCollapsed={isCollapsed} 
          />
          
          {/* Agents */}
          {hasRole && hasRole('agent') && (
            <NavSection 
              title="Agents" 
              items={agentItems} 
              isOpen={true} 
              onToggle={() => {}} 
              isCollapsed={isCollapsed} 
            />
          )}
        </div>

        {/* Company Settings */}
        {isCompanyAdmin && (
          <>
            <div className="h-px bg-sidebar-border/50 mx-4" />
            <div className="py-2">
              <NavSection 
                title="Company Settings" 
                items={companySettingsItems} 
                isOpen={sections.companySettings} 
                onToggle={toggleSection('companySettings')} 
                isCollapsed={isCollapsed} 
              />
            </div>
          </>
        )}

        {/* Super Admin */}
        {isSuperAdmin && (
          <>
            <div className="h-px bg-sidebar-border/50 mx-4" />
            <div className="py-2 space-y-1">
              <NavSection 
                title="Management" 
                items={adminManagementItems} 
                isOpen={sections.adminManagement} 
                onToggle={toggleSection('adminManagement')} 
                isCollapsed={isCollapsed} 
              />
              
              <NavSection 
                title="Business" 
                items={adminBusinessItems} 
                isOpen={sections.adminBusiness} 
                onToggle={toggleSection('adminBusiness')} 
                isCollapsed={isCollapsed} 
              />
              
              <NavSection 
                title="Platform" 
                items={adminPlatformItems} 
                isOpen={sections.adminPlatform} 
                onToggle={toggleSection('adminPlatform')} 
                isCollapsed={isCollapsed} 
              />
              
              <NavSection 
                title="System" 
                items={adminSystemItems} 
                isOpen={sections.adminSystem} 
                onToggle={toggleSection('adminSystem')} 
                isCollapsed={isCollapsed} 
              />
            </div>
          </>
        )}

        {/* Settings at bottom */}
        <div className="mt-auto border-t border-sidebar-border/50">
          <SidebarGroup className="py-2">
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5 px-2">
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to="/settings"
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-150 text-[13px]",
                          isActive
                            ? "bg-sidebar-primary/15 text-sidebar-primary font-medium"
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                        )
                      }
                    >
                      <Settings className="h-4 w-4 shrink-0" />
                      {!isCollapsed && <span>Settings</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
