import { useNavigate, useLocation } from "react-router-dom";
import { Home, Calendar, BarChart3, MessageSquare, User } from "lucide-react";
import { cn } from "@/lib/utils";

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Home, label: "Home", path: "/dashboard" },
    { icon: Calendar, label: "Calendar", path: "/calendar" },
    { icon: BarChart3, label: "Analytics", path: "/analytics" },
    { icon: MessageSquare, label: "Inbox", path: "/social-inbox" },
    { icon: User, label: "Profile", path: "/settings" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-card/95 backdrop-blur-xl border-t border-border shadow-xl">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all duration-300 min-w-[64px]",
                active
                  ? "text-primary bg-primary/10 scale-110"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <item.icon className={cn("h-5 w-5", active && "animate-in zoom-in-50 duration-300")} />
              <span className={cn("text-xs font-medium", active && "font-semibold")}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
