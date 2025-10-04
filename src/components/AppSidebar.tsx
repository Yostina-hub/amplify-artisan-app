import { Home, FileText, Calendar, BarChart3, Settings, Shield, Users, Flag, Cog, Briefcase, TrendingUp, Megaphone, MessageCircle, Radio, Building2, Mail, Link2, Globe, Key, Package, BarChart2, Layers, DollarSign, CreditCard, FileSearch, ChevronDown, Wallet, Layout, Database, Sparkles, Brain, Zap, LineChart, Box, Target, UserCircle, UserPlus, GitBranch, CheckSquare, ShoppingCart, FileSpreadsheet, Receipt, Banknote, Headphones, Phone, FolderKanban, FileCheck } from "lucide-react";
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
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Composer", url: "/composer", icon: FileText },
  { title: "Calendar", url: "/calendar", icon: Calendar },
  { title: "Settings", url: "/settings", icon: Settings },
];

const analyticsItems = [
  { title: "Analytics Hub", url: "/admin/reach-analytics", icon: BarChart3 },
];

const aiItems = [
  { title: "AI Content Studio", url: "/ai-studio", icon: Sparkles },
  { title: "Social Inbox", url: "/social-inbox", icon: MessageCircle },
  { title: "Social Intelligence", url: "/social-intelligence", icon: Brain },
  { title: "Automation", url: "/automation", icon: Zap },
  { title: "AI Analytics", url: "/ai-analytics", icon: LineChart },
];

const builderItems = [
  { title: "Module Builder", url: "/module-builder", icon: Database },
  { title: "Form Builder", url: "/form-builder", icon: Box },
  { title: "Workflow Builder", url: "/workflow-builder", icon: Zap },
  { title: "Analytics Dashboard", url: "/reporting-dashboard", icon: BarChart3 },
  { title: "CRM Roadmap", url: "/crm-roadmap", icon: Target },
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
    { title: "Email Marketing", url: "/email-marketing", icon: Mail },
    { title: "Documents", url: "/documents", icon: FileText },
  ];

const marketingItems = [
  { title: "Ad Campaigns", url: "/ad-campaigns", icon: Megaphone },
  { title: "Influencer Marketing", url: "/influencer-marketing", icon: Users },
];

const monitoringItems = [
  { title: "Brand Monitoring", url: "/brand-monitoring", icon: MessageCircle },
  { title: "Social Listening", url: "/social-listening", icon: Radio },
  { title: "Social Accounts", url: "/social-media-credentials", icon: Link2 },
];

const agentItems = [
  { title: "Agents Dashboard", url: "/agents", icon: Briefcase },
];

const companyAdminItems = [
  { title: "User Management", url: "/admin/users", icon: Users },
  { title: "Content Moderation", url: "/admin/moderation", icon: Flag },
  { title: "Email Settings", url: "/company/email-settings", icon: Mail },
  { title: "Platform Subscriptions", url: "/company/platform-subscriptions", icon: Package },
  { title: "Platform API Settings", url: "/company/platform-settings", icon: Key },
  { title: "API Integrations", url: "/company/api-management", icon: Database },
  { title: "Audit Log", url: "/company/audit-log", icon: FileSearch },
];

const adminManagementItems = [
  { title: "Admin Dashboard", url: "/admin", icon: Shield },
  { title: "Company Management", url: "/admin/companies", icon: Building2 },
  { title: "User Management", url: "/admin/users", icon: Users },
  { title: "Content Moderation", url: "/admin/moderation", icon: Flag },
];

const adminPlatformItems = [
  { title: "Social Platforms", url: "/admin/social-platforms", icon: Globe },
  { title: "Platform Subscriptions", url: "/admin/platform-subscriptions", icon: Package },
];

const adminBusinessItems = [
  { title: "Subscription Management", url: "/admin/subscriptions", icon: CreditCard },
  { title: "Payment Management", url: "/admin/payments", icon: Wallet },
  { title: "Pricing Management", url: "/admin/pricing", icon: DollarSign },
  { title: "Industry Management", url: "/admin/industries", icon: Layers },
  { title: "Landing Page Manager", url: "/admin/landing-page", icon: FileText },
];

const adminConfigItems = [
  { title: "API Integrations", url: "/admin/api-management", icon: Database },
  { title: "Public Content", url: "/admin/public-content", icon: Layout },
  { title: "Email Settings", url: "/admin/email-settings", icon: Mail },
  { title: "Social Auth Settings", url: "/admin/social-auth", icon: Key },
  { title: "Trial Settings", url: "/admin/trial-settings", icon: Settings },
  { title: "System Settings", url: "/admin/settings", icon: Cog },
];

const adminMonitoringItems = [
  { title: "Analytics Hub", url: "/admin/reach-analytics", icon: BarChart3 },
  { title: "Audit Log", url: "/admin/audit-log", icon: FileSearch },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { hasRole, roles, isCompanyAdmin, isSuperAdmin } = useAuth();
  const isCollapsed = state === "collapsed";
  const [analyticsOpen, setAnalyticsOpen] = useState(true);
  const [marketingOpen, setMarketingOpen] = useState(false);
  const [monitoringOpen, setMonitoringOpen] = useState(false);
  const [adminManagementOpen, setAdminManagementOpen] = useState(true);
  const [adminPlatformOpen, setAdminPlatformOpen] = useState(false);
  const [adminBusinessOpen, setAdminBusinessOpen] = useState(false);
  const [adminConfigOpen, setAdminConfigOpen] = useState(false);
  const [adminMonitoringOpen, setAdminMonitoringOpen] = useState(false);

  console.log('AppSidebar - User roles:', roles);
  console.log('AppSidebar - Is super admin:', isSuperAdmin);
  console.log('AppSidebar - Is company admin:', isCompanyAdmin);

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="px-6 py-4">
          {!isCollapsed && (
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              SocialHub
            </h1>
          )}
          {isCollapsed && (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-white font-bold text-sm">SH</span>
            </div>
          )}
        </div>
        
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className={({ isActive }) =>
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "hover:bg-sidebar-accent/50"
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              
              {/* Help & Documentation */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/help"
                    className={({ isActive }) =>
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "hover:bg-sidebar-accent/50"
                    }
                  >
                    <FileText className="h-4 w-4" />
                    <span>Help</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Analytics Section - Collapsible */}
        <Collapsible open={analyticsOpen} onOpenChange={setAnalyticsOpen}>
          <SidebarGroup>
            {!isCollapsed && (
              <CollapsibleTrigger className="w-full" asChild>
                <button className="w-full">
                  <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-sidebar-accent/50 rounded px-3 py-2 transition-colors bg-sidebar/50">
                    <span className="font-medium">Analytics</span>
                    <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${analyticsOpen ? 'rotate-180' : ''}`} />
                  </SidebarGroupLabel>
                </button>
              </CollapsibleTrigger>
            )}
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {analyticsItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          className={({ isActive }) =>
                            isActive
                              ? "bg-sidebar-accent text-sidebar-accent-foreground"
                              : "hover:bg-sidebar-accent/50"
                          }
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        {/* AI Features Section - Collapsible */}
        <Collapsible open={true} onOpenChange={() => {}}>
          <SidebarGroup>
            {!isCollapsed && (
              <CollapsibleTrigger className="w-full" asChild>
                <button className="w-full">
                  <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-sidebar-accent/50 rounded px-3 py-2 transition-colors bg-sidebar/50">
                    <span className="font-medium">AI Features</span>
                    <ChevronDown className="h-4 w-4 transition-transform duration-200 rotate-180" />
                  </SidebarGroupLabel>
                </button>
              </CollapsibleTrigger>
            )}
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {aiItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          className={({ isActive }) =>
                            isActive
                              ? "bg-sidebar-accent text-sidebar-accent-foreground"
                              : "hover:bg-sidebar-accent/50"
                          }
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
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
        <Collapsible open={true} onOpenChange={() => {}}>
          <SidebarGroup>
            {!isCollapsed && (
              <CollapsibleTrigger className="w-full" asChild>
                <button className="w-full">
                  <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-sidebar-accent/50 rounded px-3 py-2 transition-colors bg-sidebar/50">
                    <span className="font-medium">Enterprise Builder</span>
                    <ChevronDown className="h-4 w-4 transition-transform duration-200 rotate-180" />
                  </SidebarGroupLabel>
                </button>
              </CollapsibleTrigger>
            )}
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {builderItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          className={({ isActive }) =>
                            isActive
                              ? "bg-sidebar-accent text-sidebar-accent-foreground"
                              : "hover:bg-sidebar-accent/50"
                          }
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
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
        <Collapsible open={true} onOpenChange={() => {}}>
          <SidebarGroup>
            {!isCollapsed && (
              <CollapsibleTrigger className="w-full" asChild>
                <button className="w-full">
                  <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-sidebar-accent/50 rounded px-3 py-2 transition-colors bg-sidebar/50">
                    <span className="font-medium">CRM</span>
                    <ChevronDown className="h-4 w-4 transition-transform duration-200 rotate-180" />
                  </SidebarGroupLabel>
                </button>
              </CollapsibleTrigger>
            )}
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {crmItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          className={({ isActive }) =>
                            isActive
                              ? "bg-sidebar-accent text-sidebar-accent-foreground"
                              : "hover:bg-sidebar-accent/50"
                          }
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
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
            {!isCollapsed && (
              <CollapsibleTrigger className="w-full" asChild>
                <button className="w-full">
                  <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-sidebar-accent/50 rounded px-3 py-2 transition-colors bg-sidebar/50">
                    <span className="font-medium">Marketing</span>
                    <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${marketingOpen ? 'rotate-180' : ''}`} />
                  </SidebarGroupLabel>
                </button>
              </CollapsibleTrigger>
            )}
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {marketingItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          className={({ isActive }) =>
                            isActive
                              ? "bg-sidebar-accent text-sidebar-accent-foreground"
                              : "hover:bg-sidebar-accent/50"
                          }
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        {/* Monitoring Section - Collapsible */}
        <Collapsible open={monitoringOpen} onOpenChange={setMonitoringOpen}>
          <SidebarGroup>
            {!isCollapsed && (
              <CollapsibleTrigger className="w-full" asChild>
                <button className="w-full">
                  <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-sidebar-accent/50 rounded px-3 py-2 transition-colors bg-sidebar/50">
                    <span className="font-medium">Monitoring</span>
                    <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${monitoringOpen ? 'rotate-180' : ''}`} />
                  </SidebarGroupLabel>
                </button>
              </CollapsibleTrigger>
            )}
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {monitoringItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          className={({ isActive }) =>
                            isActive
                              ? "bg-sidebar-accent text-sidebar-accent-foreground"
                              : "hover:bg-sidebar-accent/50"
                          }
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
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
            <SidebarGroupLabel>Agents</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {agentItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end
                        className={({ isActive }) =>
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                            : "hover:bg-sidebar-accent/50"
                        }
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Company Admin Section */}
        {isCompanyAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Company Settings</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {companyAdminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end
                        className={({ isActive }) =>
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                            : "hover:bg-sidebar-accent/50"
                        }
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Super Admin Section - Management */}
        {isSuperAdmin && (
          <Collapsible open={adminManagementOpen} onOpenChange={setAdminManagementOpen}>
            <SidebarGroup>
              {!isCollapsed && (
                <CollapsibleTrigger className="w-full" asChild>
                  <button className="w-full">
                    <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-sidebar-accent/50 rounded px-3 py-2 transition-colors bg-sidebar/50">
                      <span className="font-medium">Management</span>
                      <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${adminManagementOpen ? 'rotate-180' : ''}`} />
                    </SidebarGroupLabel>
                  </button>
                </CollapsibleTrigger>
              )}
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {adminManagementItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <NavLink
                            to={item.url}
                            end
                            className={({ isActive }) =>
                              isActive
                                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                : "hover:bg-sidebar-accent/50"
                            }
                          >
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
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

        {/* Super Admin Section - Platforms */}
        {isSuperAdmin && (
          <Collapsible open={adminPlatformOpen} onOpenChange={setAdminPlatformOpen}>
            <SidebarGroup>
              {!isCollapsed && (
                <CollapsibleTrigger className="w-full" asChild>
                  <button className="w-full">
                    <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-sidebar-accent/50 rounded px-3 py-2 transition-colors bg-sidebar/50">
                      <span className="font-medium">Platforms</span>
                      <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${adminPlatformOpen ? 'rotate-180' : ''}`} />
                    </SidebarGroupLabel>
                  </button>
                </CollapsibleTrigger>
              )}
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {adminPlatformItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <NavLink
                            to={item.url}
                            end
                            className={({ isActive }) =>
                              isActive
                                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                : "hover:bg-sidebar-accent/50"
                            }
                          >
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
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
              {!isCollapsed && (
                <CollapsibleTrigger className="w-full" asChild>
                  <button className="w-full">
                    <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-sidebar-accent/50 rounded px-3 py-2 transition-colors bg-sidebar/50">
                      <span className="font-medium">Business</span>
                      <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${adminBusinessOpen ? 'rotate-180' : ''}`} />
                    </SidebarGroupLabel>
                  </button>
                </CollapsibleTrigger>
              )}
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {adminBusinessItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <NavLink
                            to={item.url}
                            end
                            className={({ isActive }) =>
                              isActive
                                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                : "hover:bg-sidebar-accent/50"
                            }
                          >
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
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

        {/* Super Admin Section - Configuration */}
        {isSuperAdmin && (
          <Collapsible open={adminConfigOpen} onOpenChange={setAdminConfigOpen}>
            <SidebarGroup>
              {!isCollapsed && (
                <CollapsibleTrigger className="w-full" asChild>
                  <button className="w-full">
                    <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-sidebar-accent/50 rounded px-3 py-2 transition-colors bg-sidebar/50">
                      <span className="font-medium">Configuration</span>
                      <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${adminConfigOpen ? 'rotate-180' : ''}`} />
                    </SidebarGroupLabel>
                  </button>
                </CollapsibleTrigger>
              )}
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {adminConfigItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <NavLink
                            to={item.url}
                            end
                            className={({ isActive }) =>
                              isActive
                                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                : "hover:bg-sidebar-accent/50"
                            }
                          >
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
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

        {/* Super Admin Section - Monitoring */}
        {isSuperAdmin && (
          <Collapsible open={adminMonitoringOpen} onOpenChange={setAdminMonitoringOpen}>
            <SidebarGroup>
              {!isCollapsed && (
                <CollapsibleTrigger className="w-full" asChild>
                  <button className="w-full">
                    <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-sidebar-accent/50 rounded px-3 py-2 transition-colors bg-sidebar/50">
                      <span className="font-medium">Monitoring</span>
                      <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${adminMonitoringOpen ? 'rotate-180' : ''}`} />
                    </SidebarGroupLabel>
                  </button>
                </CollapsibleTrigger>
              )}
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {adminMonitoringItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <NavLink
                            to={item.url}
                            end
                            className={({ isActive }) =>
                              isActive
                                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                : "hover:bg-sidebar-accent/50"
                            }
                          >
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
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
      </SidebarContent>
    </Sidebar>
  );
}