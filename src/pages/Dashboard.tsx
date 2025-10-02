import { useState } from "react";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, Calendar, MessageSquare, Twitter, Instagram, Linkedin, Facebook, Youtube, MessageCircle, Pin, Camera, Send, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ServiceSection } from "@/features/dashboard/ServiceSection";
import { AIDrawer } from "@/features/dashboard/AIDrawer";
import { SERVICE_CATEGORIES } from "@/features/dashboard/data";
import { Service } from "@/features/dashboard/types";
import { PersonalizedAds } from "@/components/PersonalizedAds";

export default function Dashboard() {
  const navigate = useNavigate();
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const handleAIClick = (service: Service) => {
    setSelectedService(service);
    setAiDrawerOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary-glow to-accent p-8 shadow-elegant">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,hsl(6_78%_57%_/_0.3),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_100%,hsl(184_91%_30%_/_0.2),transparent_50%)]" />
        
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-white animate-in fade-in-50 duration-500">
              Welcome Back! 👋
            </h1>
            <p className="text-white/90 text-lg animate-in fade-in-50 duration-500 delay-100">
              Your social media empire awaits. Let's create something amazing today.
            </p>
          </div>
          <Button 
            onClick={() => navigate('/composer')}
            size="lg"
            className="bg-white text-primary hover:bg-white/90 font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105 animate-in zoom-in-50 duration-500 delay-200"
          >
            <MessageSquare className="mr-2 h-5 w-5" />
            Create Post
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="animate-in fade-in-50 slide-in-from-bottom-4 duration-500 delay-100">
          <StatCard
            title="Total Followers"
            value="45,231"
            change="+20.1%"
            icon={Users}
            trend="up"
          />
        </div>
        <div className="animate-in fade-in-50 slide-in-from-bottom-4 duration-500 delay-200">
          <StatCard
            title="Engagement Rate"
            value="12.5%"
            change="+4.3%"
            icon={TrendingUp}
            trend="up"
          />
        </div>
        <div className="animate-in fade-in-50 slide-in-from-bottom-4 duration-500 delay-300">
          <StatCard
            title="Scheduled Posts"
            value="24"
            change="-2"
            icon={Calendar}
            trend="down"
          />
        </div>
        <div className="animate-in fade-in-50 slide-in-from-bottom-4 duration-500 delay-[400ms]">
          <StatCard
            title="Total Posts"
            value="1,234"
            change="+12%"
            icon={MessageSquare}
            trend="up"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 animate-in fade-in-50 duration-700 delay-500">
        <Card className="col-span-4 border-2 hover:shadow-xl transition-all duration-300 hover:border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { platform: "Twitter", action: "New follower", time: "2 hours ago", icon: Twitter, color: "text-[#1DA1F2]" },
                { platform: "Instagram", action: "Post published", time: "5 hours ago", icon: Instagram, color: "text-[#E4405F]" },
                { platform: "LinkedIn", action: "Comment received", time: "1 day ago", icon: Linkedin, color: "text-[#0A66C2]" },
                { platform: "Facebook", action: "Post scheduled", time: "2 days ago", icon: Facebook, color: "text-[#1877F2]" },
                { platform: "YouTube", action: "Video uploaded", time: "3 days ago", icon: Youtube, color: "text-[#FF0000]" },
                { platform: "TikTok", action: "Trending post", time: "4 days ago", icon: MessageCircle, color: "text-foreground" },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gradient-to-r hover:from-primary/5 hover:to-accent/5 transition-all duration-300 hover:shadow-md group cursor-pointer">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`w-5 h-5 ${item.color}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.platform}</p>
                      <p className="text-xs text-muted-foreground">{item.action}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{item.time}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="col-span-3 space-y-4">
          <Card className="border-2 hover:shadow-xl transition-all duration-300 hover:border-accent/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Camera className="h-4 w-4 text-white" />
                </div>
                Connected Platforms
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: "Twitter", status: "Connected", icon: Twitter, color: "text-[#1DA1F2]" },
                  { name: "Instagram", status: "Connected", icon: Instagram, color: "text-[#E4405F]" },
                  { name: "LinkedIn", status: "Connected", icon: Linkedin, color: "text-[#0A66C2]" },
                  { name: "Facebook", status: "Connected", icon: Facebook, color: "text-[#1877F2]" },
                  { name: "YouTube", status: "Connected", icon: Youtube, color: "text-[#FF0000]" },
                  { name: "Pinterest", status: "Not Connected", icon: Pin, color: "text-[#E60023]" },
                  { name: "Telegram", status: "Connected", icon: Send, color: "text-[#0088cc]" },
                  { name: "WhatsApp", status: "Not Connected", icon: Phone, color: "text-[#25D366]" },
                ].map((platform, i) => {
                  const Icon = platform.icon;
                  const isConnected = platform.status === "Connected";
                  return (
                    <div key={i} className="flex items-center justify-between p-3 border rounded-lg hover:border-primary/30 hover:shadow-md transition-all duration-300 group cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                          <Icon className={`w-4 h-4 ${platform.color}`} />
                        </div>
                        <span className="text-sm font-medium group-hover:text-primary transition-colors">{platform.name}</span>
                      </div>
                      <span className={`text-xs px-3 py-1 rounded-full font-medium transition-all duration-300 ${isConnected ? 'bg-gradient-to-r from-success/20 to-success/10 text-success border border-success/30' : 'bg-muted text-muted-foreground border border-border'}`}>
                        {platform.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* AI-Powered Personalized Ads */}
          <PersonalizedAds maxAds={2} />
        </div>
      </div>

      {/* Service Grid */}
      <div className="space-y-8 mt-8">
        {SERVICE_CATEGORIES.map(category => (
          <ServiceSection
            key={category.id}
            title={category.title}
            services={category.services}
            onAIClick={handleAIClick}
          />
        ))}
      </div>

      {/* AI Drawer */}
      <AIDrawer
        open={aiDrawerOpen}
        onClose={() => setAiDrawerOpen(false)}
        service={selectedService}
      />
    </div>
  );
}
