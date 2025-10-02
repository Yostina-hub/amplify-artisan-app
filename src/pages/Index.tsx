import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar, MessageSquare, TrendingUp, Zap, Shield, Instagram, Facebook, Linkedin, Twitter, Youtube, PieChart, BarChart3, Sparkles } from "lucide-react";
import { IndustriesDropdown } from "@/components/IndustriesDropdown";
import { FeaturesDropdown } from "@/components/FeaturesDropdown";
import { ResourcesDropdown } from "@/components/ResourcesDropdown";

const Index = () => {
  const navigate = useNavigate();

  const socialPlatforms = [
    { icon: Instagram, color: "#E4405F" },
    { icon: Facebook, color: "#1877F2" },
    { icon: Linkedin, color: "#0A66C2" },
    { icon: Twitter, color: "#000000" },
    { icon: Youtube, color: "#FF0000" },
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
      <nav className="border-b border-border bg-white">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-accent">SocialHub</span>
          </div>
          <div className="hidden lg:flex items-center gap-8">
            <FeaturesDropdown />
            <a href="#integrations" className="text-sm font-medium text-foreground hover:text-accent transition-colors">Integrations</a>
            <IndustriesDropdown />
            <ResourcesDropdown />
            <a href="#pricing" className="text-sm font-medium text-foreground hover:text-accent transition-colors">Pricing</a>
            <a href="#enterprise" className="text-sm font-medium text-foreground hover:text-accent transition-colors">Enterprise</a>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/auth")} className="text-sm font-medium">
              Log in
            </Button>
            <Button onClick={() => navigate("/auth")} className="text-sm font-semibold">
              Start your free trial
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-white">
        <div className="container mx-auto px-6 py-16 lg:py-20">
          <div className="max-w-5xl mx-auto text-center space-y-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
              <span className="text-foreground">Drive real business impact</span>
              <br />
              <span className="text-foreground">with real-time social insights.</span>
              <br />
              <span className="text-accent">SocialHub makes it easy.</span>
            </h1>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Button
                size="lg"
                onClick={() => navigate("/auth")}
                className="text-base font-semibold px-8 h-12 rounded-md"
              >
                Start your free trial
              </Button>
              <Button
                size="lg"
                variant="link"
                onClick={() => navigate("/auth")}
                className="text-base font-semibold underline text-foreground hover:text-accent"
              >
                Request a demo
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Image Section */}
      <div className="bg-gradient-to-b from-pink-50 to-white">
        <div className="container mx-auto px-6 py-12">
          <div className="relative mx-auto max-w-7xl">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              {/* Left side - Illustration placeholder */}
              <div className="relative">
                <div className="absolute -left-8 top-20 bg-white rounded-xl shadow-lg p-4 w-48">
                  <div className="flex items-center gap-2 mb-2">
                    <PieChart className="h-5 w-5 text-accent" />
                    <span className="text-xs font-semibold">Share of sentiment</span>
                  </div>
                  <div className="w-32 h-32 mx-auto">
                    <div className="w-full h-full rounded-full border-8 border-accent"></div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-orange-100 to-pink-100 rounded-2xl p-8 aspect-square flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="h-24 w-24 mx-auto text-accent mb-4" />
                    <p className="text-sm text-muted-foreground">Dashboard Preview</p>
                  </div>
                </div>

                <div className="absolute -right-4 top-8 bg-white rounded-xl shadow-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    <span className="text-sm font-semibold">6,783</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Impressions</p>
                </div>
              </div>

              {/* Right side - Feature cards */}
              <div className="space-y-4">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-semibold">Publish to</span>
                  </div>
                  <div className="flex gap-3">
                    {socialPlatforms.map((platform, index) => (
                      <div key={index} className="w-10 h-10 rounded-full flex items-center justify-center bg-secondary">
                        <platform.icon className="h-5 w-5" style={{ color: platform.color }} />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                      <Sparkles className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Start from scratch</h3>
                      <p className="text-sm text-muted-foreground">Generate new captions to engage, delight, or sell</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center gap-4 border-b pb-3 mb-3">
                    <button className="px-4 py-2 text-sm font-semibold border-b-2 border-foreground">Calendar</button>
                    <button className="px-4 py-2 text-sm text-muted-foreground">Drafts</button>
                    <button className="px-4 py-2 text-sm text-muted-foreground">Content</button>
                    <button className="px-4 py-2 text-sm text-muted-foreground">Approvals</button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map((day) => (
                      <div key={day} className="aspect-square bg-gradient-to-br from-pink-100 to-purple-100 rounded-lg"></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="bg-white py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-foreground">
              Everything you need to succeed on social
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to help you grow your brand and engage your audience
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-8 rounded-xl bg-white border border-border hover:shadow-xl transition-all hover:-translate-y-1"
              >
                <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center mb-6">
                  <feature.icon className="h-6 w-6 text-accent" />
                </div>
                <h3 className="text-lg font-bold mb-3 text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-b from-pink-50 to-white py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
              Ready to transform your social media?
            </h2>
            <p className="text-lg text-muted-foreground">
              Join thousands of businesses already growing with SocialHub
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Button
                size="lg"
                onClick={() => navigate("/auth")}
                className="text-base font-semibold px-8 h-12"
              >
                Get started for free
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-border py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-accent">SocialHub</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-accent transition-colors">Privacy</a>
              <a href="#" className="hover:text-accent transition-colors">Terms</a>
              <a href="#" className="hover:text-accent transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
