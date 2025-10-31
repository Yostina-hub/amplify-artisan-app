import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar, MessageSquare, TrendingUp, Zap, Shield, Instagram, Facebook, Linkedin, Twitter, Youtube, PieChart, BarChart3, Sparkles, CheckCircle2, Star, MessageCircle } from "lucide-react";
import { IndustriesDropdown } from "@/components/IndustriesDropdown";
import { FeaturesDropdown } from "@/components/FeaturesDropdown";
import { ResourcesDropdown } from "@/components/ResourcesDropdown";
import { MobileMenu } from "@/components/MobileMenu";
import { SubscriptionForm } from "@/components/SubscriptionForm";
import { Footer } from "@/components/Footer";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PredictiveInsights } from "@/components/crm/PredictiveInsights";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Index = () => {
  const navigate = useNavigate();
  const [subscriptionFormOpen, setSubscriptionFormOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>();
  const [isTrialMode, setIsTrialMode] = useState(false);

  // Check if user is logged in and fetch profile
  const { data: user } = useQuery({
    queryKey: ['auth-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: insights } = useQuery({
    queryKey: ['overview-insights', profile?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('generate-insights', {
        body: { 
          insightType: 'overview',
          userId: user?.id,
          companyId: profile?.company_id
        }
      });
      if (error) throw error;
      return data?.insights || [];
    },
    enabled: !!profile?.company_id && !!user?.id,
  });

  const { data: pricingPlans, isLoading: pricingLoading } = useQuery({
    queryKey: ['pricing-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pricing_plans')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  const handleGetStarted = (planId?: string, isTrial: boolean = false) => {
    setSelectedPlanId(planId);
    setIsTrialMode(isTrial);
    setSubscriptionFormOpen(true);
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

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
      <nav className="sticky top-0 z-50 border-b border-border bg-white/80 backdrop-blur-md shadow-sm">
        <div className="container mx-auto px-4 lg:px-6 py-3 lg:py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 lg:gap-3 group cursor-pointer" onClick={() => navigate("/")}>
            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg lg:rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <MessageSquare className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
            </div>
            <span className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              SocialHub
            </span>
          </div>
          <div className="hidden lg:flex items-center gap-8">
            <FeaturesDropdown />
            <button 
              onClick={() => scrollToSection('integrations')}
              className="text-sm font-semibold text-foreground hover:text-primary transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 hover:after:w-full after:bg-primary after:transition-all"
            >
              Integrations
            </button>
            <IndustriesDropdown />
            <ResourcesDropdown />
            <button 
              onClick={() => scrollToSection('pricing')}
              className="text-sm font-semibold text-foreground hover:text-primary transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 hover:after:w-full after:bg-primary after:transition-all"
            >
              Pricing
            </button>
            <button 
              onClick={() => scrollToSection('enterprise')}
              className="text-sm font-semibold text-foreground hover:text-primary transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 hover:after:w-full after:bg-primary after:transition-all"
            >
              Enterprise
            </button>
          </div>
          <div className="flex items-center gap-2 lg:gap-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/auth")} 
              className="text-xs lg:text-sm font-semibold hidden md:flex hover:text-primary hover:bg-primary/5 transition-all px-3 lg:px-4"
            >
              Log in
            </Button>
            <Button 
              onClick={() => handleGetStarted(undefined, true)} 
              className="text-xs lg:text-sm font-semibold hidden md:flex bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg hover:shadow-xl transition-all hover:scale-105 px-3 lg:px-4"
            >
              Start Free Trial
            </Button>
            <MobileMenu />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-white relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(184_91%_17%_/_0.08),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,hsl(6_78%_57%_/_0.06),transparent_50%)]" />
        
        <div className="container mx-auto px-4 lg:px-6 py-12 lg:py-20 xl:py-28 relative z-10">
          <div className="max-w-5xl mx-auto text-center space-y-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 animate-in fade-in-50 slide-in-from-top-4 duration-700">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Trusted by 10,000+ growing businesses
              </span>
            </div>
            
            <h1 className="text-3xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight tracking-tight animate-in fade-in-50 slide-in-from-bottom-6 duration-700 delay-100">
              <span className="text-foreground">Transform Your Social Media</span>
              <br className="hidden sm:block" />
              <span className="text-foreground">Into a</span>{" "}
              <span className="bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent animate-in fade-in-50 duration-1000 delay-300">
                Growth Engine
              </span>
            </h1>
            
            <p className="text-base md:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed animate-in fade-in-50 slide-in-from-bottom-4 duration-700 delay-200 px-4">
              Harness the power of AI-driven analytics, seamless scheduling, and unified management. 
              Grow your audience, boost engagement, and drive real results—all from one intelligent platform.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 lg:gap-4 justify-center items-center pt-4 lg:pt-6 animate-in fade-in-50 slide-in-from-bottom-4 duration-700 delay-300 px-4">
              <Button
                size="lg"
                onClick={() => handleGetStarted(undefined, true)}
                className="text-sm lg:text-base font-semibold px-6 lg:px-10 h-12 lg:h-14 rounded-xl shadow-lg hover:shadow-2xl transition-all hover:scale-105 bg-gradient-to-r from-primary to-accent w-full sm:w-auto"
              >
                <span className="hidden sm:inline">Start Free Trial - No Credit Card</span>
                <span className="sm:hidden">Start Free Trial</span>
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/auth")}
                className="text-sm lg:text-base font-semibold px-6 lg:px-10 h-12 lg:h-14 rounded-xl border-2 hover:bg-gradient-to-r hover:from-primary/5 hover:to-accent/5 transition-all hover:scale-105 w-full sm:w-auto"
              >
                Watch Demo
              </Button>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-4 lg:gap-6 pt-4 lg:pt-6 text-xs lg:text-sm text-muted-foreground animate-in fade-in-50 duration-700 delay-500 px-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 lg:h-5 lg:w-5 text-success" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 lg:h-5 lg:w-5 text-success" />
                <span className="hidden sm:inline">No credit card required</span>
                <span className="sm:hidden">No card needed</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 lg:h-5 lg:w-5 text-success" />
                <span>Cancel anytime</span>
              </div>
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
      <div id="features" className="bg-gradient-to-b from-white to-secondary/30 py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20 animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">Powerful Features</span>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              <span className="text-foreground">Everything You Need to</span>
              <br />
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Dominate Social Media
              </span>
            </h2>
            <p className="text-lg md:text-xl text-foreground/80 max-w-3xl mx-auto">
              Built for teams who demand excellence. Experience enterprise-grade tools 
              with an interface so intuitive, you'll wonder how you ever lived without it.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-8 rounded-2xl bg-white border-2 border-border hover:border-primary/30 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 animate-in fade-in-50 slide-in-from-bottom-4"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                  <feature.icon className="h-7 w-7 text-primary group-hover:text-accent transition-colors duration-500" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-foreground group-hover:text-primary transition-colors">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Insights Dashboard - Only for logged in users */}
      {user && profile?.company_id && (
        <div className="bg-white py-16">
          <div className="container mx-auto px-6">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    Your Business Insights
                  </span>
                </h2>
                <p className="text-muted-foreground">
                  AI-powered recommendations to grow your business
                </p>
              </div>
              <PredictiveInsights insights={insights || []} title="Strategic Overview" />
            </div>
          </div>
        </div>
      )}

      {/* Integrations Section */}
      <div id="integrations" className="relative overflow-hidden bg-white py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,hsl(184_91%_17%_/_0.03),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_50%,hsl(6_78%_57%_/_0.03),transparent_60%)]" />
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-20 animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-6">
              <MessageCircle className="h-4 w-4 text-accent" />
              <span className="text-sm font-semibold text-accent">Seamless Integrations</span>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              <span className="text-foreground">One Platform,</span>
              <br />
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                All Your Channels
              </span>
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              Manage Facebook, Instagram, Twitter, LinkedIn, YouTube, and more—all from one powerful dashboard
            </p>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-10 max-w-5xl mx-auto">
            {socialPlatforms.map((platform, index) => (
              <div 
                key={index} 
                className="group animate-in fade-in-50 zoom-in-50 duration-500"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-secondary to-secondary/50 flex items-center justify-center shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-125 hover:-rotate-6 border-2 border-border group-hover:border-primary/30">
                  <platform.icon className="h-10 w-10 transition-transform duration-500" style={{ color: platform.color }} />
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-16 text-center animate-in fade-in-50 duration-700 delay-500">
            <p className="text-sm font-semibold text-muted-foreground mb-6">
              Plus 20+ more integrations coming soon
            </p>
            <Button 
              variant="outline" 
              size="lg"
              className="border-2 hover:bg-primary/5 hover:border-primary font-semibold"
            >
              View All Integrations
            </Button>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div id="pricing" className="relative overflow-hidden py-24">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/30 via-background to-secondary/20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(184_91%_17%_/_0.05),transparent_70%)]" />
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-20 animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Star className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">Flexible Plans for Every Team</span>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              <span className="text-foreground">Pricing That</span>
              <br />
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Scales With You
              </span>
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Start free, upgrade when you're ready. No hidden fees, cancel anytime.
            </p>
          </div>
          {pricingLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {pricingPlans?.map((plan, index) => (
                <div
                  key={plan.id}
                  className={`group relative bg-white rounded-3xl p-8 border-2 transition-all duration-500 hover:-translate-y-2 animate-in fade-in-50 slide-in-from-bottom-6 ${
                    plan.is_popular
                      ? 'border-primary shadow-2xl md:scale-105 hover:shadow-3xl'
                      : 'border-border hover:border-primary/30 hover:shadow-xl'
                  }`}
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  {/* Gradient overlay */}
                  {plan.is_popular && (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 rounded-3xl" />
                      <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-accent text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                        ⭐ Most Popular
                      </div>
                    </>
                  )}
                  
                  <div className="relative z-10">
                    <div className="text-center mb-8">
                      <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">{plan.name}</h3>
                      <div className="flex items-baseline justify-center gap-2 mb-4">
                        <span className="text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">${plan.price}</span>
                        <span className="text-muted-foreground font-medium">/{plan.billing_period}</span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{plan.description}</p>
                    </div>
                    
                    <ul className="space-y-4 mb-8">
                      {Array.isArray(plan.features) && (plan.features as string[]).map((feature: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-3 group/item">
                          <div className="mt-0.5 h-5 w-5 rounded-full bg-gradient-to-br from-success/20 to-success/10 flex items-center justify-center flex-shrink-0 group-hover/item:scale-110 transition-transform">
                            <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                          </div>
                          <span className="text-sm leading-relaxed">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <Button
                      onClick={() => handleGetStarted(plan.id, false)}
                      variant={plan.is_popular ? "default" : "outline"}
                      size="lg"
                      className={`w-full font-semibold transition-all hover:scale-105 ${
                        plan.is_popular 
                          ? 'bg-gradient-to-r from-primary to-accent shadow-lg hover:shadow-xl' 
                          : 'hover:bg-primary/5 hover:border-primary'
                      }`}
                    >
                      {plan.cta_text}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Enterprise Section */}
      <div id="enterprise" className="relative overflow-hidden bg-gradient-to-br from-secondary/50 to-background py-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(184_91%_17%_/_0.08),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,hsl(6_78%_57%_/_0.06),transparent_70%)]" />
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-20 animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                <Star className="h-4 w-4 text-primary animate-pulse" />
                <span className="text-sm font-semibold text-primary">Enterprise Grade</span>
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                <span className="text-foreground">Built for</span>
                <br />
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Global Enterprises
                </span>
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
                Custom solutions, dedicated support, and enterprise-grade security 
                for organizations managing complex social media operations at scale
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 mb-16">
              {[
                { 
                  icon: Shield, 
                  title: "Advanced Security", 
                  description: "SSO, SAML, custom integrations, and enterprise-grade data protection with SOC 2 compliance",
                  gradient: "from-primary/10 to-primary/5"
                },
                { 
                  icon: Star, 
                  title: "Premium Support", 
                  description: "Dedicated account manager, 24/7 priority support, onboarding assistance, and training programs",
                  gradient: "from-accent/10 to-accent/5"
                },
                { 
                  icon: Zap, 
                  title: "Custom Solutions", 
                  description: "Tailored integrations, custom workflows, API access, and white-label options for your brand",
                  gradient: "from-primary/10 to-accent/5"
                }
              ].map((item, i) => (
                <div 
                  key={i}
                  className="group p-8 rounded-3xl bg-white border-2 border-border hover:border-primary/30 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 animate-in fade-in-50 slide-in-from-bottom-6"
                  style={{ animationDelay: `${i * 150}ms` }}
                >
                  <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                    <item.icon className="h-8 w-8 text-primary group-hover:text-accent transition-colors duration-500" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
            
            <div className="text-center animate-in fade-in-50 duration-700 delay-500">
              <Button
                size="lg"
                onClick={() => navigate("/auth")}
                className="text-lg font-semibold px-12 h-16 rounded-2xl bg-gradient-to-r from-primary to-accent shadow-2xl hover:shadow-3xl transition-all hover:scale-105"
              >
                Contact Enterprise Sales
              </Button>
              <p className="mt-6 text-sm text-muted-foreground">
                Join Fortune 500 companies already transforming their social media operations
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative overflow-hidden py-24">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-glow to-accent" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(0_0%_100%_/_0.1),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,hsl(0_0%_100%_/_0.08),transparent_70%)]" />
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-10">
            <div className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                Ready to Transform Your
                <br />
                Social Media Presence?
              </h2>
              <p className="text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
                Join thousands of successful businesses who are already growing faster 
                with SocialHub's intelligent automation and analytics.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-in fade-in-50 slide-in-from-bottom-4 duration-700 delay-200">
              <Button
                size="lg"
                onClick={() => navigate("/auth")}
                className="text-base font-semibold px-10 h-14 rounded-xl bg-white text-primary hover:bg-white/90 shadow-2xl hover:shadow-3xl transition-all hover:scale-105"
              >
                Start Your Free 14-Day Trial
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/auth")}
                className="text-base font-semibold px-10 h-14 rounded-xl border-2 border-white text-white hover:bg-white/10 transition-all hover:scale-105"
              >
                Schedule a Demo
              </Button>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-8 pt-8 animate-in fade-in-50 duration-700 delay-300">
              {[
                { icon: Shield, text: "Enterprise Security" },
                { icon: Zap, text: "Lightning Fast" },
                { icon: Star, text: "Award Winning" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-white/90">
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />

      {/* Subscription Form Modal */}
      <SubscriptionForm 
        open={subscriptionFormOpen} 
        onOpenChange={setSubscriptionFormOpen}
        selectedPlanId={selectedPlanId}
        isTrialMode={isTrialMode}
      />
    </div>
  );
};

export default Index;
