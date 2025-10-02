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
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's your social media overview
          </p>
        </div>
        <Button 
          onClick={() => navigate('/composer')}
          className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
        >
          Create Post
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Followers"
          value="45,231"
          change="+20.1%"
          icon={Users}
          trend="up"
        />
        <StatCard
          title="Engagement Rate"
          value="12.5%"
          change="+4.3%"
          icon={TrendingUp}
          trend="up"
        />
        <StatCard
          title="Scheduled Posts"
          value="24"
          change="-2"
          icon={Calendar}
          trend="down"
        />
        <StatCard
          title="Total Posts"
          value="1,234"
          change="+12%"
          icon={MessageSquare}
          trend="up"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
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
                  <div key={i} className="flex items-center gap-4 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className={`w-10 h-10 rounded-full bg-muted flex items-center justify-center`}>
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
          <Card>
            <CardHeader>
              <CardTitle>Connected Platforms</CardTitle>
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
                    <div key={i} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full bg-muted flex items-center justify-center`}>
                          <Icon className={`w-4 h-4 ${platform.color}`} />
                        </div>
                        <span className="text-sm font-medium">{platform.name}</span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${isConnected ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
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
