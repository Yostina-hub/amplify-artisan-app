import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 border-b border-border flex items-center px-4 bg-card">
            <SidebarTrigger />
          </header>
          <main className="flex-1 p-6">
            {children}
          </main>
          <footer className="border-t border-border py-3 px-6 bg-card">
            <p className="text-xs text-muted-foreground text-center">
              Powered by <span className="font-semibold text-foreground">Lemat Technology</span>
            </p>
          </footer>
        </div>
      </div>
    </SidebarProvider>
  );
}
