import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, Activity, AlertCircle } from "lucide-react";
import { StatCard } from "@/components/StatCard";

export default function AdminDashboard() {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          System overview and management
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value="2,847"
          change="+12.5%"
          icon={Users}
          trend="up"
        />
        <StatCard
          title="Active Posts"
          value="12,234"
          change="+18.2%"
          icon={FileText}
          trend="up"
        />
        <StatCard
          title="System Load"
          value="67%"
          change="-5%"
          icon={Activity}
          trend="down"
        />
        <StatCard
          title="Pending Reviews"
          value="23"
          change="+8"
          icon={AlertCircle}
          trend="up"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent User Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { user: "john@example.com", action: "Created account", time: "5 min ago" },
                { user: "sarah@example.com", action: "Published post", time: "12 min ago" },
                { user: "mike@example.com", action: "Connected Twitter", time: "1 hour ago" },
                { user: "emma@example.com", action: "Scheduled 5 posts", time: "2 hours ago" },
                { user: "david@example.com", action: "Updated profile", time: "3 hours ago" },
              ].map((activity, i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{activity.user}</p>
                    <p className="text-xs text-muted-foreground">{activity.action}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platform Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { platform: "Twitter", users: 1247, posts: 5623 },
                { platform: "Instagram", users: 2134, posts: 8901 },
                { platform: "LinkedIn", users: 892, posts: 3456 },
                { platform: "Facebook", users: 1563, posts: 6789 },
              ].map((stat, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{stat.platform}</span>
                    <div className="text-xs text-muted-foreground">
                      {stat.users} users • {stat.posts.toLocaleString()} posts
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-primary to-accent h-2 rounded-full transition-all"
                      style={{ width: `${(stat.users / 2500) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">API Response Time</span>
                <span className="text-sm text-success">45ms</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-success h-2 rounded-full" style={{ width: "85%" }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Database Load</span>
                <span className="text-sm text-success">32%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-success h-2 rounded-full" style={{ width: "32%" }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Storage Used</span>
                <span className="text-sm text-muted-foreground">67%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: "67%" }} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
