import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Zap,
  Search,
  Bell,
  Plus,
  Command,
  Keyboard,
  Layout,
  Moon,
  Sun,
  Wifi,
  Activity,
  ChevronRight,
  Shield,
  TrendingUp,
  Users,
  Target,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";

export default function LayoutShowcase() {
  const { sendNotification } = useNotifications();

  const testNotification = async (type: "info" | "success" | "warning" | "error") => {
    const messages = {
      info: { title: "Information", message: "This is an informational notification" },
      success: { title: "Success!", message: "Operation completed successfully" },
      warning: { title: "Warning", message: "Please review this important notice" },
      error: { title: "Error", message: "Something went wrong, please try again" },
    };

    await sendNotification({
      ...messages[type],
      type,
      actionUrl: "/layout-showcase",
      actionLabel: "View Details",
    });
  };

  const features = [
    {
      title: "Command Palette",
      icon: Command,
      description: "Press ⌘K or Ctrl+K to instantly access any page or feature",
      color: "from-blue-500 to-cyan-500",
    },
    {
      title: "Smart Notifications",
      icon: Bell,
      description: "Real-time updates with intelligent categorization and actions",
      color: "from-purple-500 to-pink-500",
    },
    {
      title: "Quick Actions",
      icon: Plus,
      description: "Create contacts, events, and content with one click",
      color: "from-green-500 to-emerald-500",
    },
    {
      title: "Global Search",
      icon: Search,
      description: "Lightning-fast search across all your data",
      color: "from-orange-500 to-red-500",
    },
    {
      title: "Breadcrumb Navigation",
      icon: ChevronRight,
      description: "Always know where you are with contextual navigation",
      color: "from-indigo-500 to-purple-500",
    },
    {
      title: "Theme Switcher",
      icon: Moon,
      description: "Toggle between light and dark modes instantly",
      color: "from-slate-500 to-zinc-500",
    },
    {
      title: "Status Indicators",
      icon: Activity,
      description: "Monitor connection status and sync state in real-time",
      color: "from-teal-500 to-cyan-500",
    },
    {
      title: "Keyboard Shortcuts",
      icon: Keyboard,
      description: "Navigate faster with intuitive keyboard commands",
      color: "from-violet-500 to-purple-500",
    },
  ];

  const stats = [
    {
      label: "Total Users",
      value: "2,847",
      change: "+12.5%",
      icon: Users,
      trend: "up",
    },
    {
      label: "Active Sessions",
      value: "834",
      change: "+8.2%",
      icon: Activity,
      trend: "up",
    },
    {
      label: "Conversion Rate",
      value: "3.24%",
      change: "+2.1%",
      icon: Target,
      trend: "up",
    },
    {
      label: "Security Score",
      value: "98.5%",
      change: "+0.3%",
      icon: Shield,
      trend: "up",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-500">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-purple-600 to-accent p-12 text-white">
        <div className="relative z-10 space-y-4">
          <Badge variant="secondary" className="mb-2">
            <Sparkles className="mr-1 h-3 w-3" />
            Premium Experience
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
            Cutting-Edge Layout
          </h1>
          <p className="text-xl text-white/90 max-w-2xl">
            Experience the future of enterprise applications with our comprehensive,
            feature-rich layout designed for maximum productivity.
          </p>
          <div className="flex flex-wrap gap-3 pt-4">
            <Button size="lg" variant="secondary" className="gap-2">
              <Zap className="h-4 w-4" />
              Quick Start
            </Button>
            <Button size="lg" variant="outline" className="gap-2 bg-white/10 hover:bg-white/20 text-white border-white/20">
              <Layout className="h-4 w-4" />
              View Documentation
            </Button>
          </div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <TrendingUp className="h-3 w-3" />
                <span>{stat.change} from last month</span>
              </div>
            </CardContent>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent" />
          </Card>
        ))}
      </div>

      {/* Features Grid */}
      <div>
        <div className="mb-6">
          <h2 className="text-3xl font-bold tracking-tight">Key Features</h2>
          <p className="text-muted-foreground mt-2">
            Explore the powerful features that make this layout exceptional
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="group relative overflow-hidden border-2 transition-all hover:border-primary hover:shadow-lg hover:shadow-primary/20"
            >
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${feature.color}`} />
              <CardHeader>
                <div className={`mb-2 h-12 w-12 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center text-white shadow-lg`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
                <CardDescription className="text-sm">
                  {feature.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      {/* Keyboard Shortcuts Guide */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-primary" />
            <CardTitle>Keyboard Shortcuts</CardTitle>
          </div>
          <CardDescription>Master these shortcuts to supercharge your workflow</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              { keys: ["⌘", "K"], action: "Open command palette" },
              { keys: ["⌘", "B"], action: "Toggle sidebar" },
              { keys: ["⌘", "/"], action: "Show keyboard shortcuts" },
              { keys: ["⌘", "N"], action: "Create new item" },
              { keys: ["⌘", "F"], action: "Search" },
              { keys: ["Esc"], action: "Close dialogs" },
            ].map((shortcut, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-accent/50">
                <span className="text-sm text-muted-foreground">{shortcut.action}</span>
                <div className="flex gap-1">
                  {shortcut.keys.map((key, keyIdx) => (
                    <kbd
                      key={keyIdx}
                      className="px-2 py-1 text-xs font-semibold bg-background border border-border rounded shadow-sm"
                    >
                      {key}
                    </kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Technology Stack */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Built with Modern Technologies
          </CardTitle>
          <CardDescription>
            Leveraging cutting-edge tools for maximum performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {[
              "React 18",
              "TypeScript",
              "Tailwind CSS",
              "Radix UI",
              "Framer Motion",
              "Tanstack Query",
              "Vite",
              "shadcn/ui",
              "Lovable Cloud",
              "Supabase",
            ].map((tech) => (
              <Badge key={tech} variant="secondary" className="px-3 py-1">
                {tech}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Call to Action */}
      <Card className="bg-gradient-to-br from-primary/10 via-purple-500/10 to-accent/10 border-2 border-primary/20">
        <CardContent className="flex flex-col items-center justify-center text-center p-12">
          <Sparkles className="h-12 w-12 text-primary mb-4" />
          <h3 className="text-2xl font-bold mb-2">Test Notification System</h3>
          <p className="text-muted-foreground mb-6 max-w-lg">
            Click any button below to test the real-time notification system. Notifications
            will appear in the bell icon at the top right corner.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button onClick={() => testNotification("info")} variant="outline" className="gap-2">
              <Bell className="h-4 w-4" />
              Test Info
            </Button>
            <Button onClick={() => testNotification("success")} variant="outline" className="gap-2">
              <Bell className="h-4 w-4" />
              Test Success
            </Button>
            <Button onClick={() => testNotification("warning")} variant="outline" className="gap-2">
              <Bell className="h-4 w-4" />
              Test Warning
            </Button>
            <Button onClick={() => testNotification("error")} variant="outline" className="gap-2">
              <Bell className="h-4 w-4" />
              Test Error
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Original Call to Action */}
      <Card className="bg-gradient-to-br from-primary/10 via-purple-500/10 to-accent/10 border-2 border-primary/20">
        <CardContent className="flex flex-col items-center justify-center text-center p-12">
          <Sparkles className="h-12 w-12 text-primary mb-4" />
          <h3 className="text-2xl font-bold mb-2">Ready to Experience More?</h3>
          <p className="text-muted-foreground mb-6 max-w-lg">
            This is just the beginning. Navigate to any page to see the enhanced layout
            in action with all features seamlessly integrated.
          </p>
          <Button size="lg" className="gap-2">
            <Command className="h-4 w-4" />
            Press ⌘K to Get Started
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
