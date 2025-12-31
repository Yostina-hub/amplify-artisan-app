import { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Home,
  Users,
  Building2,
  UserPlus,
  Phone,
  FileText,
  Target,
  Calendar,
  Mail,
  Megaphone,
  MessageCircle,
  Share2,
  BarChart2,
  BarChart3,
  Settings,
  HelpCircle,
  Shield,
  Search,
  Star,
  LogOut,
  Zap,
  TrendingUp,
  Headphones,
  Globe,
  FileCheck,
  Map,
  Package,
  Receipt,
  CreditCard,
  Workflow,
  Database,
  Box,
  GitBranch,
  FolderKanban,
  Brain,
  Link2,
  Flag,
  Layers,
  Cog,
  FileSearch,
  Volume2,
  Briefcase,
  Radio,
  type LucideIcon,
} from "lucide-react";

// ============= Navigation Data =============
interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  badge?: number;
}

interface NavGroup {
  id: string;
  label: string;
  icon: LucideIcon;
  items: NavItem[];
}

const pinnedItems: NavItem[] = [
  { title: "Home", url: "/dashboard", icon: Home },
];

const navigationGroups: NavGroup[] = [
  {
    id: "marketing",
    label: "Marketing",
    icon: Megaphone,
    items: [
      { title: "Composer", url: "/composer", icon: Share2 },
      { title: "Email", url: "/email-marketing", icon: Mail },
      { title: "Campaigns", url: "/ad-campaigns", icon: Target },
      { title: "Influencers", url: "/influencer-marketing", icon: TrendingUp },
      { title: "Calendar", url: "/calendar", icon: Calendar },
    ],
  },
  {
    id: "social",
    label: "Social",
    icon: Globe,
    items: [
      { title: "Inbox", url: "/social-inbox", icon: MessageCircle },
      { title: "Analytics", url: "/social-analytics", icon: BarChart2 },
      { title: "Connections", url: "/social-connections", icon: Link2 },
      { title: "Intelligence", url: "/social-intelligence", icon: Brain },
      { title: "Media Monitoring", url: "/media-monitoring", icon: Radio },
      { title: "Content Moderation", url: "/admin/moderation", icon: Flag },
    ],
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: BarChart3,
    items: [
      { title: "Platform", url: "/analytics-platform", icon: BarChart3 },
      { title: "Reports", url: "/reports", icon: FileText },
      { title: "Segments", url: "/analytics/segments", icon: Users },
      { title: "Alerts", url: "/analytics/alerts", icon: Zap },
    ],
  },
  {
    id: "crm",
    label: "CRM",
    icon: Users,
    items: [
      { title: "Contacts", url: "/contacts", icon: Users },
      { title: "Accounts", url: "/accounts", icon: Building2 },
      { title: "Leads", url: "/leads", icon: UserPlus },
      { title: "Pipeline", url: "/pipeline", icon: GitBranch },
      { title: "Activities", url: "/activities", icon: Calendar },
    ],
  },
  {
    id: "sales",
    label: "Sales",
    icon: TrendingUp,
    items: [
      { title: "Products", url: "/products", icon: Package },
      { title: "Quotes", url: "/quotes", icon: FileText },
      { title: "Invoices", url: "/invoices", icon: Receipt },
      { title: "Payments", url: "/payments", icon: CreditCard },
      { title: "Contracts", url: "/contract-management", icon: FileCheck },
      { title: "Territory", url: "/territory-management", icon: Map },
    ],
  },
  {
    id: "service",
    label: "Service",
    icon: Headphones,
    items: [
      { title: "Support", url: "/customer-support", icon: Headphones },
      { title: "Live Chat", url: "/admin/live-chat", icon: MessageCircle },
      { title: "Call Center", url: "/call-center", icon: Phone },
    ],
  },
  {
    id: "tools",
    label: "Tools",
    icon: Box,
    items: [
      { title: "Documents", url: "/documents", icon: FileText },
      { title: "Projects", url: "/project-management", icon: FolderKanban },
      { title: "Workflows", url: "/automation", icon: Workflow },
      { title: "Module Builder", url: "/module-builder", icon: Database },
      { title: "Form Builder", url: "/form-builder", icon: Layers },
    ],
  },
];

const companyItems: NavItem[] = [
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "Platform Access", url: "/company/platform-subscriptions", icon: Package },
  { title: "Email Settings", url: "/company/email-settings", icon: Mail },
  { title: "API", url: "/company/api-management", icon: Database },
  { title: "Integrations", url: "/company/call-center-integrations", icon: Link2 },
  { title: "TTS/STT", url: "/tts-settings", icon: Volume2 },
  { title: "Audit Log", url: "/company/audit-log", icon: FileSearch },
];

const adminItems: NavItem[] = [
  { title: "Companies", url: "/admin/companies", icon: Building2 },
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "Branches", url: "/admin/branches", icon: GitBranch },
  { title: "Billing", url: "/admin/billing", icon: CreditCard },
  { title: "Industries", url: "/admin/industries", icon: Layers },
  { title: "Platforms", url: "/admin/social-platforms", icon: Globe },
  { title: "Permissions", url: "/admin/permissions", icon: Shield },
  { title: "Security", url: "/admin/security", icon: Shield },
  { title: "Moderation", url: "/admin/moderation", icon: Flag },
  { title: "System", url: "/admin/system-config", icon: Cog },
];

// ============= Components =============

export function AppSidebar() {
  const { state } = useSidebar();
  const { hasRole, isCompanyAdmin, isSuperAdmin, user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isCollapsed = state === "collapsed";
  const [searchQuery, setSearchQuery] = useState("");

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const isActive = (url: string) => {
    if (url === "/dashboard") return location.pathname === "/dashboard" || location.pathname === "/";
    return location.pathname.startsWith(url);
  };

  const userInitials = user?.email?.slice(0, 2).toUpperCase() || 'U';

  // Filter items based on search
  const filteredGroups = searchQuery
    ? navigationGroups.map(group => ({
        ...group,
        items: group.items.filter(item =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      })).filter(group => group.items.length > 0)
    : navigationGroups;

  return (
    <TooltipProvider delayDuration={0}>
      <Sidebar 
        collapsible="icon" 
        className="border-r border-sidebar-border bg-sidebar"
      >
        {/* Header - Logo */}
        <SidebarHeader className={cn(
          "border-b border-sidebar-border transition-all duration-200",
          isCollapsed ? "p-3" : "p-4"
        )}>
          <div className={cn(
            "flex items-center transition-all duration-200",
            isCollapsed ? "justify-center" : "gap-3"
          )}>
            <div className="w-9 h-9 rounded-lg bg-sidebar-primary flex items-center justify-center flex-shrink-0 shadow-sm">
              <span className="text-sidebar-primary-foreground font-bold text-sm">S</span>
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-semibold text-sidebar-foreground text-sm">SocialHub</span>
                <span className="text-[10px] text-sidebar-muted uppercase tracking-wider">Enterprise CRM</span>
              </div>
            )}
          </div>
        </SidebarHeader>

        <SidebarContent className="px-2">
          <ScrollArea className="h-full">
            {/* Search Bar */}
            {!isCollapsed && (
              <div className="p-2 pt-3">
              <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-sidebar-muted" />
                  <Input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 pl-8 text-xs bg-sidebar-accent border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-muted focus-visible:ring-1 focus-visible:ring-sidebar-ring"
                  />
                </div>
              </div>
            )}

            {/* Pinned / Favorites */}
            {!searchQuery && (
              <SidebarGroup className="py-2">
                {!isCollapsed && (
                  <div className="flex items-center gap-1.5 px-3 py-1 mb-1">
                    <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                    <span className="text-[10px] font-medium text-sidebar-muted uppercase tracking-wider">Pinned</span>
                  </div>
                )}
                <SidebarMenu className="gap-0.5">
                  {pinnedItems.map((item) => (
                    <NavItemRow
                      key={item.url + "-pinned"}
                      item={item}
                      isActive={isActive(item.url)}
                      isCollapsed={isCollapsed}
                    />
                  ))}
                </SidebarMenu>
              </SidebarGroup>
            )}

            {/* Main Navigation Groups */}
            {filteredGroups.map((group) => (
              <NavGroupRow
                key={group.id}
                group={group}
                isCollapsed={isCollapsed}
                isActive={isActive}
              />
            ))}

            {/* Company Settings (for company admins) */}
            {isCompanyAdmin && !searchQuery && (
              <NavGroupRow
                group={{
                  id: "company",
                  label: "Company",
                  icon: Building2,
                  items: companyItems,
                }}
                isCollapsed={isCollapsed}
                isActive={isActive}
              />
            )}

            {/* Agent Section */}
            {hasRole && hasRole('agent') && !searchQuery && (
              <SidebarGroup className="py-2">
                {!isCollapsed && (
                  <div className="px-3 py-1 mb-1">
                    <span className="text-[10px] font-medium text-sidebar-muted uppercase tracking-wider">Agents</span>
                  </div>
                )}
                <SidebarMenu className="gap-0.5">
                  <NavItemRow
                    item={{ title: "Agents", url: "/agents", icon: Briefcase }}
                    isActive={isActive("/agents")}
                    isCollapsed={isCollapsed}
                  />
                </SidebarMenu>
              </SidebarGroup>
            )}

            {/* Admin Section (for super admins) */}
            {isSuperAdmin && !searchQuery && (
              <NavGroupRow
                group={{
                  id: "admin",
                  label: "Administration",
                  icon: Shield,
                  items: adminItems,
                }}
                isCollapsed={isCollapsed}
                isActive={isActive}
              />
            )}
          </ScrollArea>
        </SidebarContent>

        {/* Footer */}
        <SidebarFooter className="border-t border-sidebar-border p-2">
          <SidebarMenu className="gap-0.5">
            <NavItemRow
              item={{ title: "Settings", url: "/settings", icon: Settings }}
              isActive={isActive("/settings")}
              isCollapsed={isCollapsed}
            />
            <NavItemRow
              item={{ title: "Help", url: "/help", icon: HelpCircle }}
              isActive={isActive("/help")}
              isCollapsed={isCollapsed}
            />
          </SidebarMenu>

          {/* User Profile */}
          <div className={cn(
            "flex items-center mt-2 p-2 rounded-lg transition-colors",
            "hover:bg-sidebar-accent cursor-pointer group",
            isCollapsed && "justify-center p-1.5"
          )}>
            {isCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={handleSignOut} className="focus:outline-none">
                    <Avatar className="h-8 w-8 ring-2 ring-transparent hover:ring-sidebar-primary/20 transition-all">
                      <AvatarFallback className="bg-sidebar-primary/10 text-sidebar-primary text-xs font-medium">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="flex flex-col gap-0.5">
                  <span className="font-medium">{user?.email?.split('@')[0]}</span>
                  <span className="text-muted-foreground text-xs">Click to sign out</span>
                </TooltipContent>
              </Tooltip>
            ) : (
              <>
                <Avatar className="h-8 w-8 ring-2 ring-transparent group-hover:ring-sidebar-primary/20 transition-all flex-shrink-0">
                  <AvatarFallback className="bg-sidebar-primary/10 text-sidebar-primary text-xs font-medium">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 ml-2.5">
                  <p className="text-sm font-medium text-sidebar-foreground truncate leading-tight">
                    {user?.email?.split('@')[0] || 'User'}
                  </p>
                  <p className="text-[10px] text-sidebar-muted truncate">
                    {user?.email}
                  </p>
                </div>
                <button 
                  onClick={handleSignOut}
                  className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-sidebar-muted hover:text-destructive transition-all"
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </SidebarFooter>
      </Sidebar>
    </TooltipProvider>
  );
}

// ============= Nav Group with Popover for Collapsed State =============
function NavGroupRow({
  group,
  isCollapsed,
  isActive,
}: {
  group: NavGroup;
  isCollapsed: boolean;
  isActive: (url: string) => boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const hasActiveItem = group.items.some(item => isActive(item.url));
  const navigate = useNavigate();

  if (isCollapsed) {
    return (
      <SidebarGroup className="py-1">
        <SidebarMenu>
          <SidebarMenuItem>
            <Popover open={isOpen} onOpenChange={setIsOpen}>
              <PopoverTrigger asChild>
                <SidebarMenuButton
                  className={cn(
                    "w-full justify-center relative h-9",
                    hasActiveItem 
                      ? "text-sidebar-primary bg-sidebar-primary/10" 
                      : "text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent"
                  )}
                >
                  {hasActiveItem && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-sidebar-primary rounded-r-full" />
                  )}
                  <group.icon className="h-[18px] w-[18px]" />
                </SidebarMenuButton>
              </PopoverTrigger>
              <PopoverContent 
                side="right" 
                align="start" 
                className="w-52 p-1.5"
                sideOffset={8}
              >
                <div className="px-2 py-1.5 mb-1">
                  <span className="text-xs font-semibold text-foreground">{group.label}</span>
                </div>
                {group.items.map((item) => (
                  <button
                    key={item.url}
                    onClick={() => {
                      navigate(item.url);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors",
                      isActive(item.url)
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-foreground/80 hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    <span>{item.title}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="ml-auto h-5 px-1.5 text-[10px]">
                        {item.badge}
                      </Badge>
                    )}
                  </button>
                ))}
              </PopoverContent>
            </Popover>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    );
  }

  return (
    <SidebarGroup className="py-2">
      <div className="px-3 py-1 mb-1">
        <span className="text-[10px] font-medium text-sidebar-muted uppercase tracking-wider">
          {group.label}
        </span>
      </div>
      <SidebarMenu className="gap-0.5">
        {group.items.map((item) => (
          <NavItemRow
            key={item.url}
            item={item}
            isActive={isActive(item.url)}
            isCollapsed={false}
          />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}

// ============= Individual Nav Item =============
function NavItemRow({
  item,
  isActive,
  isCollapsed,
}: {
  item: NavItem;
  isActive: boolean;
  isCollapsed: boolean;
}) {
  const content = (
    <SidebarMenuButton asChild>
      <NavLink
        to={item.url}
        className={cn(
          "relative flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-all duration-150",
          isCollapsed && "justify-center px-0",
          isActive
            ? "bg-sidebar-primary/10 text-sidebar-primary font-medium"
            : "text-sidebar-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent"
        )}
      >
        {isActive && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-sidebar-primary rounded-r-full" />
        )}
        <item.icon className={cn(
          "h-[18px] w-[18px] flex-shrink-0 transition-transform",
          !isCollapsed && "group-hover:scale-105"
        )} />
        {!isCollapsed && (
          <>
            <span className="truncate">{item.title}</span>
            {item.badge && (
              <Badge variant="secondary" className="ml-auto h-5 px-1.5 text-[10px]">
                {item.badge}
              </Badge>
            )}
          </>
        )}
      </NavLink>
    </SidebarMenuButton>
  );

  if (isCollapsed) {
    return (
      <SidebarMenuItem>
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" sideOffset={8} className="flex items-center gap-2">
            <span>{item.title}</span>
            {item.badge && (
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                {item.badge}
              </Badge>
            )}
          </TooltipContent>
        </Tooltip>
      </SidebarMenuItem>
    );
  }

  return <SidebarMenuItem className="group">{content}</SidebarMenuItem>;
}
