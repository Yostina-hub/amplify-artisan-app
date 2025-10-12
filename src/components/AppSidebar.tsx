import { Home, Settings } from "lucide-react";
import { NavLink } from "react-router-dom";
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

const mainItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="none" className="border-r bg-sidebar">
      <SidebarContent className="bg-sidebar text-sidebar-foreground">
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
                            : "bg-sidebar-accent text-sidebar-foreground shadow-sm ring-1 ring-sidebar-border/50 hover:bg-sidebar-accent/80"
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
      </SidebarContent>
    </Sidebar>
  );
}
