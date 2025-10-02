import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3, Calendar, MessageSquare, TrendingUp, Zap, Shield } from "lucide-react";
import { useEffect } from "react";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const trustedCompanies = [
    "Adobe", "Microsoft", "Salesforce", "Amazon", "Google"
  ];

  const features = [
    {
      icon: Calendar,
      title: "Smart Scheduling",
      description: "Plan and publish content across all your social platforms from one unified calendar"
    },
    {
      icon: BarChart3,
      title: "Real-Time Analytics",
      description: "Track performance metrics and gain actionable insights with comprehensive analytics"
    },
    {
      icon: MessageSquare,
      title: "Unified Inbox",
      description: "Manage all your social conversations and comments from a single dashboard"
    },
    {
      icon: TrendingUp,
      title: "Growth Insights",
      description: "Monitor audience growth and optimize your social media strategy with AI-powered recommendations"
    },
    {
      icon: Zap,
      title: "AI-Powered Content",
      description: "Generate engaging content ideas and captions with built-in AI assistance"
    },
    {
      icon: Shield,
      title: "Team Collaboration",
      description: "Collaborate seamlessly with approval workflows and role-based permissions"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">SocialHub</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">Features</a>
            <a href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">Pricing</a>
            <a href="#resources" className="text-sm font-medium hover:text-primary transition-colors">Resources</a>
            <Button variant="ghost" onClick={() => navigate("/auth")}>Log in</Button>
            <Button onClick={() => navigate("/auth")}>Start your free trial</Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20 lg:py-32">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
            Drive real business impact with{" "}
            <span className="text-primary">real-time social insights.</span>
            <br />
            <span className="text-foreground">SocialHub makes it easy.</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Manage all your social media channels, schedule content, analyze performance, 
            and engage with your audience—all from one powerful platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="text-lg px-8 py-6"
            >
              Start your free trial
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/auth")}
              className="text-lg px-8 py-6"
            >
              Request a demo
            </Button>
          </div>

          {/* Trust Badges */}
          <div className="pt-16 space-y-4">
            <p className="text-sm text-muted-foreground uppercase tracking-wider">
              Trusted by leading brands worldwide
            </p>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
              {trustedCompanies.map((company, index) => (
                <div key={index} className="text-2xl font-semibold">
                  {company}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Hero Image Section */}
      <div className="container mx-auto px-4 pb-20">
        <div className="relative mx-auto max-w-6xl">
          <div className="aspect-video rounded-2xl bg-gradient-to-br from-primary/10 via-secondary/20 to-accent/10 border-2 border-border shadow-2xl overflow-hidden">
            <div className="w-full h-full flex items-center justify-center p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                <div className="bg-card/80 backdrop-blur rounded-lg p-6 border border-border">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="h-6 w-6 text-primary" />
                    <h3 className="font-semibold">Analytics Dashboard</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="h-2 bg-primary/20 rounded w-full"></div>
                    <div className="h-2 bg-primary/20 rounded w-4/5"></div>
                    <div className="h-2 bg-primary/20 rounded w-3/5"></div>
                  </div>
                </div>
                <div className="bg-card/80 backdrop-blur rounded-lg p-6 border border-border">
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar className="h-6 w-6 text-primary" />
                    <h3 className="font-semibold">Content Calendar</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="h-2 bg-primary/20 rounded w-full"></div>
                    <div className="h-2 bg-primary/20 rounded w-4/5"></div>
                    <div className="h-2 bg-primary/20 rounded w-3/5"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="bg-secondary/30 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Everything you need to succeed on social
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to help you grow your brand and engage your audience
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-8 rounded-xl bg-card border border-border hover:shadow-lg transition-all hover:-translate-y-1"
              >
                <div className="h-14 w-14 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                  <feature.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8 bg-primary/5 rounded-2xl p-12 border border-primary/20">
            <h2 className="text-4xl md:text-5xl font-bold">
              Ready to transform your social media?
            </h2>
            <p className="text-xl text-muted-foreground">
              Join thousands of businesses already growing with SocialHub
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Button
                size="lg"
                onClick={() => navigate("/auth")}
                className="text-lg px-8 py-6"
              >
                Get started for free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">SocialHub</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
