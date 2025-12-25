import { Home, FileText, Calendar, BarChart3, Settings, Shield, Users, Flag, Cog, Briefcase, Megaphone, MessageCircle, Building2, Mail, Link2, Globe, Package, Layers, CreditCard, FileSearch, ChevronDown, Database, Brain, Zap, Box, Target, UserCircle, UserPlus, GitBranch, CheckSquare, ShoppingCart, FileSpreadsheet, Receipt, Banknote, Headphones, Phone, FolderKanban, FileCheck, Volume2, LogOut } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const mainItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Composer", url: "/composer", icon: FileText },
  { title: "Calendar", url: "/calendar", icon: Calendar },
  { title: "Moderation", url: "/admin/moderation", icon: Flag },
];

const analyticsItems = [
  { title: "Analytics Hub", url: "/analytics", icon: BarChart3 },
];

const aiAutomationItems = [
  { title: "Automation", url: "/automation", icon: Zap },
];

const socialMediaItems = [
  { title: "Inbox", url: "/social-inbox", icon: MessageCircle },
  { title: "Connections", url: "/social-connections", icon: Link2 },
  { title: "Intelligence", url: "/social-intelligence", icon: Brain },
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
  { title: "Support", url: "/customer-support", icon: Headphones },
  { title: "Call Center", url: "/call-center", icon: Phone },
  { title: "Territory", url: "/territory-management", icon: Target },
  { title: "Projects", url: "/project-management", icon: FolderKanban },
  { title: "Contracts", url: "/contract-management", icon: FileCheck },
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "Email Marketing", url: "/email-marketing", icon: Mail },
  { title: "Documents", url: "/documents", icon: FileText },
];

const marketingItems = [
  { title: "Ad Campaigns", url: "/ad-campaigns", icon: Megaphone },
  { title: "Influencers", url: "/influencer-marketing", icon: Users },
];

const agentItems = [
  { title: "Agents", url: "/agents", icon: Briefcase },
];

const companySettingsItems = [
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "Live Chat", url: "/admin/live-chat", icon: MessageCircle },
  { title: "Platform Access", url: "/company/platform-subscriptions", icon: Package },
  { title: "Email Settings", url: "/company/email-settings", icon: Mail },
  { title: "API", url: "/company/api-management", icon: Database },
  { title: "Call Center", url: "/company/call-center-integrations", icon: Phone },
  { title: "TTS/STT", url: "/tts-settings", icon: Volume2 },
  { title: "Audit Log", url: "/company/audit-log", icon: FileSearch },
];

const adminManagementItems = [
  { title: "Companies", url: "/admin/companies", icon: Building2 },
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "Branches", url: "/admin/branches", icon: GitBranch },
];

const adminBusinessItems = [
  { title: "Billing", url: "/admin/billing", icon: CreditCard },
  { title: "Industries", url: "/admin/industries", icon: Layers },
  { title: "Landing Page", url: "/admin/landing-page", icon: FileText },
];

const adminPlatformItems = [
  { title: "Social Platforms", url: "/admin/social-platforms", icon: Globe },
  { title: "Permissions", url: "/admin/permissions", icon: Shield },
];

const adminSystemItems = [
  { title: "System Config", url: "/admin/system-config", icon: Cog },
];

interface NavItemProps {
  item: { title: string; url: string; icon: React.ElementType };
  isCollapsed: boolean;
  end?: boolean;
}

function NavItem({ item, isCollapsed, end = false }: NavItemProps) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <NavLink
          to={item.url}
          end={end}
          className={({ isActive }) =>
            cn(
              "group/item flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm",
              isActive
                ? "bg-sidebar-primary text-white shadow-lg shadow-sidebar-primary/25"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            )
          }
        >
          <div className={cn(
            "flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200",
            "bg-sidebar-accent/50 group-hover/item:bg-sidebar-accent"
          )}>
            <item.icon className="h-4 w-4" />
          </div>
          {!isCollapsed && <span className="font-medium">{item.title}</span>}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

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
      <SidebarGroup className="py-1">
        <CollapsibleTrigger className="w-full" asChild>
          <button className="w-full group/trigger">
            <div className="flex items-center justify-between cursor-pointer hover:bg-sidebar-accent/30 rounded-lg mx-2 px-3 py-2 transition-all duration-200">
              <span className="text-[11px] font-semibold text-sidebar-foreground/50 uppercase tracking-widest">{title}</span>
              {!isCollapsed && (
                <ChevronDown className={cn(
                  "h-3.5 w-3.5 transition-transform duration-300 text-sidebar-foreground/40 group-hover/trigger:text-sidebar-foreground/60",
                  isOpen && "rotate-180"
                )} />
              )}
            </div>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="animate-accordion-down data-[state=closed]:animate-accordion-up">
          <SidebarGroupContent>
            <SidebarMenu className="gap-1 px-2 mt-1">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        cn(
                          "group/item flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-[13px]",
                          isActive
                            ? "bg-sidebar-primary/20 text-sidebar-primary font-medium border-l-2 border-sidebar-primary ml-0.5"
                            : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground hover:translate-x-1"
                        )
                      }
                    >
                      <item.icon className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover/item:scale-110" />
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
  const { hasRole, isCompanyAdmin, isSuperAdmin, user, signOut } = useAuth();
  const navigate = useNavigate();
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

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const userInitials = user?.email?.slice(0, 2).toUpperCase() || 'U';

  return (
    <Sidebar collapsible="none" className="border-r border-sidebar-border/50 bg-sidebar h-screen sticky top-0">
      <SidebarContent className="bg-sidebar text-sidebar-foreground overflow-y-auto h-full scrollbar-thin flex flex-col">
        {/* Logo */}
        <div className="px-4 py-5 border-b border-sidebar-border/30">
          {!isCollapsed ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sidebar-primary to-sidebar-primary/80 flex items-center justify-center shadow-lg shadow-sidebar-primary/20">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <div>
                <span className="text-base font-bold text-sidebar-foreground">SocialHub</span>
                <p className="text-[10px] text-sidebar-foreground/50 uppercase tracking-wider">Enterprise</p>
              </div>
            </div>
          ) : (
            <div className="w-10 h-10 mx-auto rounded-xl bg-gradient-to-br from-sidebar-primary to-sidebar-primary/80 flex items-center justify-center shadow-lg shadow-sidebar-primary/20">
              <span className="text-white font-bold text-lg">S</span>
            </div>
          )}
        </div>
        
        {/* Main Navigation */}
        <SidebarGroup className="py-3">
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5 px-2">
              {mainItems.map((item) => (
                <NavItem key={item.title} item={item} isCollapsed={isCollapsed} end={item.url === "/dashboard"} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="h-px bg-gradient-to-r from-transparent via-sidebar-border/50 to-transparent mx-4" />

        {/* Collapsible Sections */}
        <div className="py-2 space-y-0.5 flex-1 overflow-y-auto">
          <NavSection 
            title="Social" 
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
            title="Automation" 
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
          
          {hasRole && hasRole('agent') && (
            <NavSection 
              title="Agents" 
              items={agentItems} 
              isOpen={true} 
              onToggle={() => {}} 
              isCollapsed={isCollapsed} 
            />
          )}

          {isCompanyAdmin && (
            <NavSection 
              title="Company" 
              items={companySettingsItems} 
              isOpen={sections.companySettings} 
              onToggle={toggleSection('companySettings')} 
              isCollapsed={isCollapsed} 
            />
          )}

          {isSuperAdmin && (
            <>
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
            </>
          )}
        </div>

        {/* Bottom Section */}
        <div className="mt-auto border-t border-sidebar-border/30">
          {/* Settings */}
          <SidebarGroup className="py-2">
            <SidebarGroupContent>
              <SidebarMenu className="gap-1 px-2">
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to="/settings"
                      className={({ isActive }) =>
                        cn(
                          "group/item flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-[13px]",
                          isActive
                            ? "bg-sidebar-primary/20 text-sidebar-primary font-medium"
                            : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
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

          {/* User Profile */}
          <div className="p-3 border-t border-sidebar-border/30">
            {!isCollapsed ? (
              <div className="flex items-center gap-3 p-2 rounded-lg bg-sidebar-accent/30 hover:bg-sidebar-accent/50 transition-all duration-200 cursor-pointer group">
                <Avatar className="h-9 w-9 ring-2 ring-sidebar-primary/20">
                  <AvatarFallback className="bg-sidebar-primary text-white text-xs font-medium">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">
                    {user?.email?.split('@')[0] || 'User'}
                  </p>
                  <p className="text-[10px] text-sidebar-foreground/50 truncate">
                    {user?.email || 'user@example.com'}
                  </p>
                </div>
                <button 
                  onClick={handleSignOut}
                  className="p-1.5 rounded-md hover:bg-destructive/20 text-sidebar-foreground/50 hover:text-destructive transition-colors"
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex justify-center">
                <Avatar className="h-9 w-9 ring-2 ring-sidebar-primary/20 cursor-pointer hover:ring-sidebar-primary/40 transition-all">
                  <AvatarFallback className="bg-sidebar-primary text-white text-xs font-medium">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </div>
            )}
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
