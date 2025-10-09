import { useState, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, User, Settings, Sun, Moon, Zap, Activity, Wifi, PanelLeftClose, PanelLeft } from "lucide-react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CommandPalette } from "./CommandPalette";
import { NotificationsCenter } from "./NotificationsCenter";
import { QuickActions } from "./QuickActions";
import { useTheme } from "next-themes";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export function EnhancedLayout() {
  const { user, signOut, roles } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSync, setLastSync] = useState(new Date());

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Simulate periodic sync
    const syncInterval = setInterval(() => {
      if (navigator.onLine) {
        setLastSync(new Date());
      }
    }, 30000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(syncInterval);
    };
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const getBreadcrumbs = () => {
    const paths = location.pathname.split("/").filter(Boolean);
    const breadcrumbs = [{ label: "Home", path: "/dashboard" }];

    let currentPath = "";
    paths.forEach((segment) => {
      currentPath += `/${segment}`;
      const label = segment
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      breadcrumbs.push({ label, path: currentPath });
    });

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-background to-muted/20">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          {/* Enhanced Header */}
          <header className="h-16 border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
            <div className="flex items-center justify-between h-full px-6">
              {/* Left Section */}
              <div className="flex items-center gap-4">
                <SidebarTrigger className="hover:bg-primary/10 transition-colors">
                  <PanelLeft className="h-5 w-5" />
                  <span className="sr-only">Toggle Sidebar</span>
                </SidebarTrigger>
                
                {/* Breadcrumb Navigation */}
                <Separator orientation="vertical" className="h-6" />
                <Breadcrumb className="hidden md:block">
                  <BreadcrumbList>
                    {breadcrumbs.map((crumb, index) => (
                      <div key={crumb.path} className="flex items-center">
                        {index > 0 && <BreadcrumbSeparator />}
                        <BreadcrumbItem>
                          {index === breadcrumbs.length - 1 ? (
                            <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                          ) : (
                            <BreadcrumbLink
                              onClick={() => navigate(crumb.path)}
                              className="cursor-pointer"
                            >
                              {crumb.label}
                            </BreadcrumbLink>
                          )}
                        </BreadcrumbItem>
                      </div>
                    ))}
                  </BreadcrumbList>
                </Breadcrumb>
              </div>

              {/* Center Section - Search */}
              <div className="hidden lg:flex flex-1 max-w-md mx-8">
                <CommandPalette />
              </div>

              {/* Right Section */}
              <div className="flex items-center gap-3">
                {/* Status Indicators */}
                <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-md bg-accent/50">
                  <Wifi
                    className={`h-3 w-3 ${
                      isOnline ? "text-green-500" : "text-red-500"
                    }`}
                  />
                  <span className="text-xs text-muted-foreground">
                    {isOnline ? "Online" : "Offline"}
                  </span>
                  <Separator orientation="vertical" className="h-4" />
                  <Activity className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    Synced {lastSync.toLocaleTimeString()}
                  </span>
                </div>

                {/* Theme Toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="hidden md:flex"
                >
                  {theme === "dark" ? (
                    <Sun className="h-5 w-5" />
                  ) : (
                    <Moon className="h-5 w-5" />
                  )}
                </Button>

                {/* Quick Actions */}
                <QuickActions />

                {/* Notifications */}
                <NotificationsCenter />

                <Separator orientation="vertical" className="h-8" />

                {/* User Profile */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2 hover:bg-primary/10 transition-all"
                    >
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary via-purple-500 to-accent flex items-center justify-center shadow-lg">
                        <User className="h-4 w-4 text-white" />
                      </div>
                      <div className="hidden lg:flex flex-col items-start">
                        <span className="text-sm font-medium max-w-[150px] truncate">
                          {user?.email?.split("@")[0]}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {roles[0] || "User"}
                        </span>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-2">
                        <p className="text-sm font-medium truncate">{user?.email}</p>
                        <div className="flex gap-1 flex-wrap">
                          {roles.map((role) => (
                            <Badge key={role} variant="secondary" className="text-xs">
                              {role}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/settings")}>
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/help")}>
                      <Zap className="mr-2 h-4 w-4" />
                      Help & Support
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 p-6 overflow-auto">
            <div className="max-w-[1600px] mx-auto">
              <Outlet />
            </div>
          </main>

          {/* Enhanced Footer */}
          <footer className="border-t border-border bg-card/50 backdrop-blur-sm">
            <div className="px-6 py-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span>Powered by</span>
                    <span className="font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      Lemat Technology
                    </span>
                  </div>
                  <Separator orientation="vertical" className="h-4" />
                  <span>v2.0.0</span>
                </div>
                <div className="hidden md:flex items-center gap-4">
                  <button
                    onClick={() => navigate("/privacy-policy")}
                    className="hover:text-foreground transition-colors"
                  >
                    Privacy Policy
                  </button>
                  <Separator orientation="vertical" className="h-4" />
                  <button
                    onClick={() => navigate("/terms-of-service")}
                    className="hover:text-foreground transition-colors"
                  >
                    Terms of Service
                  </button>
                  <Separator orientation="vertical" className="h-4" />
                  <button
                    onClick={() => navigate("/help")}
                    className="hover:text-foreground transition-colors"
                  >
                    Help Center
                  </button>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </SidebarProvider>
  );
}
