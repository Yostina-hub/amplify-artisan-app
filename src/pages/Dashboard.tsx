import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, Calendar, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

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
                { platform: "Twitter", action: "New follower", time: "2 hours ago", color: "bg-blue-500" },
                { platform: "Instagram", action: "Post published", time: "5 hours ago", color: "bg-pink-500" },
                { platform: "LinkedIn", action: "Comment received", time: "1 day ago", color: "bg-blue-700" },
                { platform: "Facebook", action: "Post scheduled", time: "2 days ago", color: "bg-blue-600" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full ${item.color}`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.platform}</p>
                    <p className="text-xs text-muted-foreground">{item.action}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{item.time}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Connected Platforms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: "Twitter", status: "Connected", color: "bg-blue-500" },
                { name: "Instagram", status: "Connected", color: "bg-pink-500" },
                { name: "LinkedIn", status: "Connected", color: "bg-blue-700" },
                { name: "Facebook", status: "Connected", color: "bg-blue-600" },
              ].map((platform, i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${platform.color}`} />
                    <span className="text-sm font-medium">{platform.name}</span>
                  </div>
                  <span className="text-xs text-success">{platform.status}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
