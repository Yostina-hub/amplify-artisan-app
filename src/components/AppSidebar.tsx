import { Home, FileText, Calendar, BarChart3, Settings, Shield, Users, Flag, Cog, Briefcase, TrendingUp, Megaphone, MessageCircle, Radio, Building2, Mail, Link2, Globe, Key, Package, BarChart2, Layers, DollarSign, CreditCard, FileSearch, ChevronDown } from "lucide-react";
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

const marketingItems = [
  { title: "Ad Campaigns", url: "/ad-campaigns", icon: Megaphone },
  { title: "Influencer Marketing", url: "/influencer-marketing", icon: Users },
];

const monitoringItems = [
  { title: "Brand Monitoring", url: "/brand-monitoring", icon: MessageCircle },
  { title: "Social Listening", url: "/social-listening", icon: Radio },
  { title: "Social Accounts", url: "/social-accounts", icon: Link2 },
];

const agentItems = [
  { title: "Agents Dashboard", url: "/agents", icon: Briefcase },
];

const companyAdminItems = [
  { title: "User Management", url: "/admin/users", icon: Users },
  { title: "Content Moderation", url: "/admin/moderation", icon: Flag },
  { title: "Company Email Settings", url: "/company/email-settings", icon: Mail },
  { title: "Platform Subscriptions", url: "/company/platform-subscriptions", icon: Package },
  { title: "Platform API Settings", url: "/company/platform-settings", icon: Key },
  { title: "Audit Log", url: "/company/audit-log", icon: FileSearch },
];

const adminItems = [
  { title: "Admin Dashboard", url: "/admin", icon: Shield },
  { title: "Company Management", url: "/admin/companies", icon: Building2 },
  { title: "User Management", url: "/admin/users", icon: Users },
  { title: "Content Moderation", url: "/admin/moderation", icon: Flag },
  { title: "Social Platforms", url: "/admin/social-platforms", icon: Globe },
  { title: "Platform Subscriptions", url: "/admin/platform-subscriptions", icon: Package },
  { title: "Subscription Management", url: "/admin/subscriptions", icon: CreditCard },
  { title: "Trial Settings", url: "/admin/trial-settings", icon: Settings },
  { title: "Industry Management", url: "/admin/industries", icon: Layers },
  { title: "Pricing Management", url: "/admin/pricing", icon: DollarSign },
  { title: "Landing Page Manager", url: "/admin/landing-page", icon: FileText },
  { title: "Email Settings", url: "/admin/email-settings", icon: Mail },
  { title: "System Settings", url: "/admin/settings", icon: Cog },
  { title: "Audit Log", url: "/admin/audit-log", icon: FileSearch },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { hasRole, roles, isCompanyAdmin, isSuperAdmin } = useAuth();
  const isCollapsed = state === "collapsed";
  const [analyticsOpen, setAnalyticsOpen] = useState(true);
  const [marketingOpen, setMarketingOpen] = useState(false);
  const [monitoringOpen, setMonitoringOpen] = useState(false);

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
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Analytics Section - Collapsible */}
        {!isCollapsed && (
          <Collapsible open={analyticsOpen} onOpenChange={setAnalyticsOpen}>
            <SidebarGroup>
              <CollapsibleTrigger className="w-full">
                <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-sidebar-accent/50 rounded px-2 py-1 transition-colors">
                  <span>Analytics</span>
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${analyticsOpen ? 'rotate-180' : ''}`} />
                </SidebarGroupLabel>
              </CollapsibleTrigger>
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
        )}

        {/* Marketing Section - Collapsible */}
        {!isCollapsed && (
          <Collapsible open={marketingOpen} onOpenChange={setMarketingOpen}>
            <SidebarGroup>
              <CollapsibleTrigger className="w-full">
                <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-sidebar-accent/50 rounded px-2 py-1 transition-colors">
                  <span>Marketing</span>
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${marketingOpen ? 'rotate-180' : ''}`} />
                </SidebarGroupLabel>
              </CollapsibleTrigger>
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
        )}

        {/* Monitoring Section - Collapsible */}
        {!isCollapsed && (
          <Collapsible open={monitoringOpen} onOpenChange={setMonitoringOpen}>
            <SidebarGroup>
              <CollapsibleTrigger className="w-full">
                <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-sidebar-accent/50 rounded px-2 py-1 transition-colors">
                  <span>Monitoring</span>
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${monitoringOpen ? 'rotate-180' : ''}`} />
                </SidebarGroupLabel>
              </CollapsibleTrigger>
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
        )}

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

        {/* Super Admin Section */}
        {isSuperAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
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
      </SidebarContent>
    </Sidebar>
  );
}