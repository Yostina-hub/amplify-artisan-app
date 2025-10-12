import { Home, FileText, Calendar, BarChart3, Settings, Shield, Users, Flag, Cog, Briefcase, TrendingUp, Megaphone, MessageCircle, Radio, Building2, Mail, Link2, Globe, Key, Package, BarChart2, Layers, DollarSign, CreditCard, FileSearch, ChevronDown, Wallet, Layout, Database, Sparkles, Brain, Zap, LineChart, Box, Target, UserCircle, UserPlus, GitBranch, CheckSquare, ShoppingCart, FileSpreadsheet, Receipt, Banknote, Headphones, Phone, FolderKanban, FileCheck, Volume2, ChevronRight, ChevronsDown, ChevronsUp } from "lucide-react";
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

const mainItems = [
  { title: "Dashboard", url: "/admin", icon: Home },
  { title: "Composer", url: "/composer", icon: FileText },
  { title: "Calendar", url: "/calendar", icon: Calendar },
  { title: "Content Moderation", url: "/admin/moderation", icon: Flag },
];

// Analytics & Insights - Consolidated
const analyticsItems = [
  { title: "Overview Dashboard", url: "/reporting-dashboard", icon: BarChart3 },
  { title: "Analytics Hub", url: "/admin/reach-analytics", icon: TrendingUp },
  { title: "AI Insights", url: "/ai-analytics", icon: LineChart },
];

// AI & Automation - Consolidated
const aiAutomationItems = [
  { title: "AI Content Studio", url: "/ai-studio", icon: Sparkles },
  { title: "Automation Workflows", url: "/automation", icon: Zap },
  { title: "Workflow Builder", url: "/workflow-builder", icon: Zap },
];

// Social Media Management - Consolidated
const socialMediaItems = [
  { title: "Social Inbox", url: "/social-inbox", icon: MessageCircle },
  { title: "Connected Accounts", url: "/social-media-credentials", icon: Link2 },
  { title: "Social Intelligence", url: "/social-intelligence", icon: Brain },
  { title: "Social Listening", url: "/social-listening", icon: Radio },
  { title: "Brand Monitoring", url: "/brand-monitoring", icon: MessageCircle },
];

// Enterprise Builder
const builderItems = [
  { title: "Module Builder", url: "/module-builder", icon: Database },
  { title: "Form Builder", url: "/form-builder", icon: Box },
  { title: "ECC", url: "/crm-roadmap", icon: Target },
];

// CRM
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

// Marketing
const marketingItems = [
  { title: "Ad Campaigns", url: "/ad-campaigns", icon: Megaphone },
  { title: "Influencer Marketing", url: "/influencer-marketing", icon: Users },
];

// Agents
const agentItems = [
  { title: "Agents Dashboard", url: "/agents", icon: Briefcase },
];

// Company Settings - Consolidated
const companySettingsItems = [
  { title: "User Management", url: "/admin/users", icon: Users },
  { title: "Live Chat Dashboard", url: "/admin/live-chat", icon: MessageCircle },
  { title: "Platform Access", url: "/company/platform-subscriptions", icon: Package },
  { title: "Platform API Settings", url: "/company/platform-settings", icon: Key },
  { title: "Email Settings", url: "/company/email-settings", icon: Mail },
  { title: "API Integrations", url: "/company/api-management", icon: Database },
  { title: "Call Center Setup", url: "/company/call-center-integrations", icon: Phone },
  { title: "TTS/STT Settings", url: "/tts-settings", icon: Volume2 },
  { title: "Audit Log", url: "/company/audit-log", icon: FileSearch },
];

// Admin - Management
const adminManagementItems = [
  { title: "Company Management", url: "/admin/companies", icon: Building2 },
  { title: "User Management", url: "/admin/users", icon: Users },
  { title: "Branch Management", url: "/admin/branches", icon: GitBranch },
];

// Admin - Business Operations
const adminBusinessItems = [
  { title: "Billing Management", url: "/admin/billing", icon: CreditCard },
  { title: "Industry Management", url: "/admin/industries", icon: Layers },
  { title: "Landing Page Manager", url: "/admin/landing-page", icon: FileText },
];

// Admin - Platform Configuration
const adminPlatformItems = [
  { title: "Social Platforms", url: "/admin/social-platforms", icon: Globe },
  { title: "Permission Management", url: "/admin/permissions", icon: Shield },
];

// Admin - System Configuration
const adminSystemItems = [
  { title: "Live Chat Dashboard", url: "/admin/live-chat", icon: MessageCircle },
  { title: "Firewall Management", url: "/admin/firewall", icon: Shield },
  { title: "API Integrations", url: "/admin/api-management", icon: Database },
  { title: "Call Center Setup", url: "/admin/call-center-integrations", icon: Phone },
  { title: "Public Content", url: "/admin/public-content", icon: Layout },
  { title: "Email Settings", url: "/admin/email-settings", icon: Mail },
  { title: "Social Auth Settings", url: "/admin/social-auth", icon: Key },
  { title: "TTS/STT Settings", url: "/tts-settings", icon: Volume2 },
  { title: "Trial Settings", url: "/admin/trial-settings", icon: Settings },
  { title: "System Settings", url: "/admin/settings", icon: Cog },
  { title: "Audit Log", url: "/admin/audit-log", icon: FileSearch },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { hasRole, roles, isCompanyAdmin, isSuperAdmin } = useAuth();
  const isCollapsed = state === "collapsed";
  const [showAll, setShowAll] = useState(true);
  const [analyticsOpen, setAnalyticsOpen] = useState(true);
  const [aiAutomationOpen, setAiAutomationOpen] = useState(true);
  const [socialMediaOpen, setSocialMediaOpen] = useState(false);
  const [builderOpen, setBuilderOpen] = useState(true);
  const [crmOpen, setCrmOpen] = useState(true);
  const [marketingOpen, setMarketingOpen] = useState(false);
  const [companySettingsOpen, setCompanySettingsOpen] = useState(false);
  const [adminManagementOpen, setAdminManagementOpen] = useState(true);
  const [adminPlatformOpen, setAdminPlatformOpen] = useState(false);
  const [adminBusinessOpen, setAdminBusinessOpen] = useState(false);
  const [adminSystemOpen, setAdminSystemOpen] = useState(false);

  const toggleAll = () => {
    const newState = !showAll;
    setShowAll(newState);
    setAnalyticsOpen(newState);
    setAiAutomationOpen(newState);
    setSocialMediaOpen(newState);
    setBuilderOpen(newState);
    setCrmOpen(newState);
    setMarketingOpen(newState);
    setCompanySettingsOpen(newState);
    setAdminManagementOpen(newState);
    setAdminPlatformOpen(newState);
    setAdminBusinessOpen(newState);
    setAdminSystemOpen(newState);
  };

  console.log('AppSidebar - User roles:', roles);
  console.log('AppSidebar - Is super admin:', isSuperAdmin);
  console.log('AppSidebar - Is company admin:', isCompanyAdmin);

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarContent className="bg-gradient-to-b from-sidebar/95 to-sidebar">
        <div className="px-4 py-6 flex items-center justify-between">
          {!isCollapsed ? (
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              SocialHub
            </h1>
          ) : (
            <div className="w-10 h-10 mx-auto rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm">SH</span>
            </div>
          )}
        </div>
        
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1 px-3">
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                          isActive
                            ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-md font-medium"
                            : "hover:bg-sidebar-accent text-sidebar-foreground"
                        }`
                      }
                    >
                      <item.icon className="h-5 w-5" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Social Media Management Section - Collapsible */}
        <Collapsible open={socialMediaOpen} onOpenChange={setSocialMediaOpen}>
          <SidebarGroup>
            <CollapsibleTrigger className="w-full" asChild>
              <button className="w-full">
                <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-sidebar-accent/50 rounded-lg mx-3 px-4 py-2 transition-colors text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <span>Social Media</span>
                  {!isCollapsed && (
                    <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${socialMediaOpen ? 'rotate-180' : ''}`} />
                  )}
                </SidebarGroupLabel>
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu className="gap-1 px-3">
                  {socialMediaItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                              isActive
                                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                : "hover:bg-sidebar-accent/50 text-sidebar-foreground"
                            }`
                          }
                        >
                          <item.icon className="h-4 w-4" />
                          {!isCollapsed && <span className="text-sm">{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        {/* Analytics & Insights Section - Collapsible */}
        <Collapsible open={analyticsOpen} onOpenChange={setAnalyticsOpen}>
          <SidebarGroup>
            <CollapsibleTrigger className="w-full" asChild>
              <button className="w-full">
                <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-sidebar-accent/50 rounded-lg mx-3 px-4 py-2 transition-colors text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <span>Analytics & Insights</span>
                  {!isCollapsed && (
                    <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${analyticsOpen ? 'rotate-180' : ''}`} />
                  )}
                </SidebarGroupLabel>
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu className="gap-1 px-3">
                  {analyticsItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                              isActive
                                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                : "hover:bg-sidebar-accent/50 text-sidebar-foreground"
                            }`
                          }
                        >
                          <item.icon className="h-4 w-4" />
                          {!isCollapsed && <span className="text-sm">{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        {/* AI & Automation Section - Collapsible */}
        <Collapsible open={aiAutomationOpen} onOpenChange={setAiAutomationOpen}>
          <SidebarGroup>
            <CollapsibleTrigger className="w-full" asChild>
              <button className="w-full">
                <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-sidebar-accent/50 rounded-lg mx-3 px-4 py-2 transition-colors text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <span>AI & Automation</span>
                  {!isCollapsed && (
                    <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${aiAutomationOpen ? 'rotate-180' : ''}`} />
                  )}
                </SidebarGroupLabel>
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu className="gap-1 px-3">
                  {aiAutomationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                              isActive
                                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                : "hover:bg-sidebar-accent/50 text-sidebar-foreground"
                            }`
                          }
                        >
                          <item.icon className="h-4 w-4" />
                          {!isCollapsed && <span className="text-sm">{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        {/* Enterprise Builder Section - Collapsible */}
        <Collapsible open={builderOpen} onOpenChange={setBuilderOpen}>
          <SidebarGroup>
            <CollapsibleTrigger className="w-full" asChild>
              <button className="w-full">
                <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-sidebar-accent/50 rounded-lg mx-3 px-4 py-2 transition-colors text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <span>Enterprise Builder</span>
                  {!isCollapsed && (
                    <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${builderOpen ? 'rotate-180' : ''}`} />
                  )}
                </SidebarGroupLabel>
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu className="gap-1 px-3">
                  {builderItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                              isActive
                                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                : "hover:bg-sidebar-accent/50 text-sidebar-foreground"
                            }`
                          }
                        >
                          <item.icon className="h-4 w-4" />
                          {!isCollapsed && <span className="text-sm">{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        {/* CRM Section - Collapsible */}
        <Collapsible open={crmOpen} onOpenChange={setCrmOpen}>
          <SidebarGroup>
            <CollapsibleTrigger className="w-full" asChild>
              <button className="w-full">
                <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-sidebar-accent/50 rounded-lg mx-3 px-4 py-2 transition-colors text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <span>CRM</span>
                  {!isCollapsed && (
                    <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${crmOpen ? 'rotate-180' : ''}`} />
                  )}
                </SidebarGroupLabel>
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu className="gap-1 px-3">
                  {crmItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                              isActive
                                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                : "hover:bg-sidebar-accent/50 text-sidebar-foreground"
                            }`
                          }
                        >
                          <item.icon className="h-4 w-4" />
                          {!isCollapsed && <span className="text-sm">{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        {/* Marketing Section - Collapsible */}
        <Collapsible open={marketingOpen} onOpenChange={setMarketingOpen}>
          <SidebarGroup>
            <CollapsibleTrigger className="w-full" asChild>
              <button className="w-full">
                <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-sidebar-accent/50 rounded-lg mx-3 px-4 py-2 transition-colors text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <span>Marketing</span>
                  {!isCollapsed && (
                    <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${marketingOpen ? 'rotate-180' : ''}`} />
                  )}
                </SidebarGroupLabel>
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu className="gap-1 px-3">
                  {marketingItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                              isActive
                                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                : "hover:bg-sidebar-accent/50 text-sidebar-foreground"
                            }`
                          }
                        >
                          <item.icon className="h-4 w-4" />
                          {!isCollapsed && <span className="text-sm">{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>


        {/* Agents Section */}
        {hasRole('agent') && (
          <SidebarGroup>
            <SidebarGroupLabel className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Agents</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1 px-3">
                {agentItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                            isActive
                              ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                              : "hover:bg-sidebar-accent/50 text-sidebar-foreground"
                          }`
                        }
                      >
                        <item.icon className="h-4 w-4" />
                        {!isCollapsed && <span className="text-sm">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Company Settings Section - Collapsible */}
        {isCompanyAdmin && (
          <Collapsible open={companySettingsOpen} onOpenChange={setCompanySettingsOpen}>
            <SidebarGroup>
              <CollapsibleTrigger className="w-full" asChild>
                <button className="w-full">
                  <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-sidebar-accent/50 rounded-lg mx-3 px-4 py-2 transition-colors text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <span>Company Settings</span>
                    {!isCollapsed && (
                      <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${companySettingsOpen ? 'rotate-180' : ''}`} />
                    )}
                  </SidebarGroupLabel>
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu className="gap-1 px-3">
                    {companySettingsItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <NavLink
                            to={item.url}
                            end
                            className={({ isActive }) =>
                              `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                                isActive
                                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                  : "hover:bg-sidebar-accent/50 text-sidebar-foreground"
                              }`
                            }
                          >
                            <item.icon className="h-4 w-4" />
                            {!isCollapsed && <span className="text-sm">{item.title}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        )}

        {/* Super Admin Section - Management */}
        {isSuperAdmin && (
          <Collapsible open={adminManagementOpen} onOpenChange={setAdminManagementOpen}>
            <SidebarGroup>
                <CollapsibleTrigger className="w-full" asChild>
                  <button className="w-full">
                    <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-sidebar-accent/50 rounded-lg mx-3 px-4 py-2 transition-colors text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      <span>Management</span>
                      {!isCollapsed && (
                        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${adminManagementOpen ? 'rotate-180' : ''}`} />
                      )}
                    </SidebarGroupLabel>
                  </button>
                </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu className="gap-1 px-3">
                    {adminManagementItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <NavLink
                            to={item.url}
                            end
                            className={({ isActive }) =>
                              `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                                isActive
                                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                  : "hover:bg-sidebar-accent/50 text-sidebar-foreground"
                              }`
                            }
                          >
                            <item.icon className="h-4 w-4" />
                            {!isCollapsed && <span className="text-sm">{item.title}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        )}

        {/* Super Admin Section - Platform */}
        {isSuperAdmin && (
          <Collapsible open={adminPlatformOpen} onOpenChange={setAdminPlatformOpen}>
            <SidebarGroup>
                <CollapsibleTrigger className="w-full" asChild>
                  <button className="w-full">
                    <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-sidebar-accent/50 rounded-lg mx-3 px-4 py-2 transition-colors text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      <span>Platform</span>
                      {!isCollapsed && (
                        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${adminPlatformOpen ? 'rotate-180' : ''}`} />
                      )}
                    </SidebarGroupLabel>
                  </button>
                </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu className="gap-1 px-3">
                    {adminPlatformItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <NavLink
                            to={item.url}
                            end
                            className={({ isActive }) =>
                              `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                                isActive
                                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                  : "hover:bg-sidebar-accent/50 text-sidebar-foreground"
                              }`
                            }
                          >
                            <item.icon className="h-4 w-4" />
                            {!isCollapsed && <span className="text-sm">{item.title}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        )}

        {/* Super Admin Section - Business */}
        {isSuperAdmin && (
          <Collapsible open={adminBusinessOpen} onOpenChange={setAdminBusinessOpen}>
            <SidebarGroup>
                <CollapsibleTrigger className="w-full" asChild>
                  <button className="w-full">
                    <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-sidebar-accent/50 rounded-lg mx-3 px-4 py-2 transition-colors text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      <span>Business</span>
                      {!isCollapsed && (
                        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${adminBusinessOpen ? 'rotate-180' : ''}`} />
                      )}
                    </SidebarGroupLabel>
                  </button>
                </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu className="gap-1 px-3">
                    {adminBusinessItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <NavLink
                            to={item.url}
                            end
                            className={({ isActive }) =>
                              `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                                isActive
                                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                  : "hover:bg-sidebar-accent/50 text-sidebar-foreground"
                              }`
                            }
                          >
                            <item.icon className="h-4 w-4" />
                            {!isCollapsed && <span className="text-sm">{item.title}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        )}

        {/* Super Admin Section - System Configuration */}
        {isSuperAdmin && (
          <Collapsible open={adminSystemOpen} onOpenChange={setAdminSystemOpen}>
            <SidebarGroup>
                <CollapsibleTrigger className="w-full" asChild>
                  <button className="w-full">
                    <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-sidebar-accent/50 rounded-lg mx-3 px-4 py-2 transition-colors text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      <span>System Configuration</span>
                      {!isCollapsed && (
                        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${adminSystemOpen ? 'rotate-180' : ''}`} />
                      )}
                    </SidebarGroupLabel>
                  </button>
                </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu className="gap-1 px-3">
                    {adminSystemItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <NavLink
                            to={item.url}
                            end
                            className={({ isActive }) =>
                              `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                                isActive
                                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                  : "hover:bg-sidebar-accent/50 text-sidebar-foreground"
                              }`
                            }
                          >
                            <item.icon className="h-4 w-4" />
                            {!isCollapsed && <span className="text-sm">{item.title}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        )}
        
        {/* Toggle All Button at Bottom */}
        <div className="mt-auto p-4 border-t border-sidebar-border/50">
          <button
            onClick={toggleAll}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-sidebar-accent hover:bg-sidebar-accent/80 transition-all duration-200 text-sm font-medium shadow-sm"
            title={showAll ? "Collapse all sections" : "Expand all sections"}
          >
            {showAll ? (
              <>
                <ChevronsUp className="h-4 w-4" />
                {!isCollapsed && <span>Show Less</span>}
              </>
            ) : (
              <>
                <ChevronsDown className="h-4 w-4" />
                {!isCollapsed && <span>Show More</span>}
              </>
            )}
          </button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}