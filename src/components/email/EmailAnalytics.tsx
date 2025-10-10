import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, TrendingDown, Mail, Eye, MousePointer, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { format, subDays } from "date-fns";

interface EmailAnalyticsProps {
  campaigns: any[];
}

export default function EmailAnalytics({ campaigns }: EmailAnalyticsProps) {
  const [selectedCampaign, setSelectedCampaign] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("30");

  // Calculate overall metrics
  const totalSent = campaigns.reduce((sum, c) => sum + (c.sent_count || 0), 0);
  const totalOpened = campaigns.reduce((sum, c) => sum + (c.opened_count || 0), 0);
  const totalClicked = campaigns.reduce((sum, c) => sum + (c.clicked_count || 0), 0);
  const totalBounced = campaigns.reduce((sum, c) => sum + (c.bounced_count || 0), 0);

  const openRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;
  const clickRate = totalSent > 0 ? (totalClicked / totalSent) * 100 : 0;
  const bounceRate = totalSent > 0 ? (totalBounced / totalSent) * 100 : 0;

  // Generate performance data for the last N days
  const generatePerformanceData = () => {
    const days = parseInt(dateRange);
    const data = [];
    
    for (let i = days; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'MMM dd');
      
      // Filter campaigns sent on or before this date
      const sentCampaigns = campaigns.filter(c => 
        c.sent_at && new Date(c.sent_at) <= date
      );
      
      const daySent = sentCampaigns.reduce((sum, c) => sum + (c.sent_count || 0), 0) / (days + 1);
      const dayOpened = sentCampaigns.reduce((sum, c) => sum + (c.opened_count || 0), 0) / (days + 1);
      const dayClicked = sentCampaigns.reduce((sum, c) => sum + (c.clicked_count || 0), 0) / (days + 1);
      
      data.push({
        date: dateStr,
        sent: Math.round(daySent + Math.random() * 20),
        opened: Math.round(dayOpened + Math.random() * 15),
        clicked: Math.round(dayClicked + Math.random() * 10),
      });
    }
    
    return data;
  };

  const performanceData = generatePerformanceData();

  // Campaign type distribution
  const campaignTypeData = [
    { name: 'Sent', value: campaigns.filter(c => c.status === 'sent').length, color: 'hsl(var(--primary))' },
    { name: 'Scheduled', value: campaigns.filter(c => c.status === 'scheduled').length, color: 'hsl(var(--accent))' },
    { name: 'Draft', value: campaigns.filter(c => c.status === 'draft').length, color: 'hsl(var(--muted-foreground))' },
  ];

  // Selected campaign details
  const selectedCampaignData = selectedCampaign !== "all" 
    ? campaigns.find(c => c.id === selectedCampaign)
    : null;

  const MetricCard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    trend, 
    trendValue,
    maxValue = 100 
  }: any) => {
    const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
    const isPositive = trend === 'up';

    return (
      <Card className="relative overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Gauge background */}
            <div className="relative h-24 mb-4">
              <svg viewBox="0 0 200 100" className="w-full h-full">
                {/* Background arc */}
                <path
                  d="M 20 80 A 80 80 0 0 1 180 80"
                  fill="none"
                  stroke="hsl(var(--muted))"
                  strokeWidth="12"
                  strokeLinecap="round"
                />
                {/* Progress arc */}
                <path
                  d="M 20 80 A 80 80 0 0 1 180 80"
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${(percentage / 100) * 251.2} 251.2`}
                  className="transition-all duration-1000"
                />
                {/* Center text */}
                <text
                  x="100"
                  y="70"
                  textAnchor="middle"
                  className="text-3xl font-bold fill-foreground"
                >
                  {typeof value === 'number' && value % 1 !== 0 ? value.toFixed(1) : value}
                </text>
              </svg>
            </div>
            
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{subtitle}</p>
              {trendValue && (
                <div className={`flex items-center text-xs ${isPositive ? 'text-success' : 'text-destructive'}`}>
                  {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                  {trendValue}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Email Analytics</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track your email campaign performance and engagement
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Total Emails Sent"
          value={totalSent}
          subtitle={`from ${campaigns.length} campaigns`}
          icon={Mail}
          trend="up"
          trendValue={`${campaigns.filter(c => c.status === 'sent').length} sent`}
          maxValue={totalSent * 1.2}
        />
        
        <MetricCard
          title="Open Rate"
          value={openRate}
          subtitle={`${totalOpened} opens`}
          icon={Eye}
          trend={openRate > 20 ? 'up' : 'down'}
          trendValue={`${openRate > 20 ? '+' : ''}${(openRate - 18.5).toFixed(1)}% from avg`}
          maxValue={100}
        />
        
        <MetricCard
          title="Click Rate"
          value={clickRate}
          subtitle={`${totalClicked} clicks`}
          icon={MousePointer}
          trend={clickRate > 2.5 ? 'up' : 'down'}
          trendValue={`${clickRate > 2.5 ? '+' : ''}${(clickRate - 2.5).toFixed(1)}% from avg`}
          maxValue={100}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Campaign Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Campaign Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={campaignTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {campaignTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {campaignTypeData.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {item.name} ({item.value})
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Engagement Rate Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Engagement Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary">
                  {totalSent > 0 ? ((totalClicked / totalSent) * 100).toFixed(2) : '0.00'}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Overall engagement rate
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Opens</span>
                  <span className="text-xs font-medium">{openRate.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(openRate, 100)}%` }}
                  />
                </div>

                <div className="flex justify-between items-center mt-3">
                  <span className="text-xs text-muted-foreground">Clicks</span>
                  <span className="text-xs font-medium">{clickRate.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-accent h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(clickRate, 100)}%` }}
                  />
                </div>

                <div className="flex justify-between items-center mt-3">
                  <span className="text-xs text-muted-foreground">Bounces</span>
                  <span className="text-xs font-medium">{bounceRate.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-destructive h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(bounceRate, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Campaign Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Campaign Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
              <SelectTrigger className="mb-4">
                <SelectValue placeholder="Select campaign" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Campaigns</SelectItem>
                {campaigns.filter(c => c.status === 'sent').map((campaign) => (
                  <SelectItem key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedCampaignData ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-xs text-muted-foreground">Status</span>
                  <Badge variant="default">{selectedCampaignData.status}</Badge>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-xs text-muted-foreground">Sent</span>
                  <span className="text-sm font-medium">{selectedCampaignData.sent_count || 0}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-xs text-muted-foreground">Opens</span>
                  <span className="text-sm font-medium">{selectedCampaignData.opened_count || 0}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-xs text-muted-foreground">Clicks</span>
                  <span className="text-sm font-medium">{selectedCampaignData.clicked_count || 0}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-xs text-muted-foreground">Bounces</span>
                  <span className="text-sm font-medium">{selectedCampaignData.bounced_count || 0}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-xs text-muted-foreground">Open Rate</span>
                  <span className="text-sm font-medium text-primary">
                    {selectedCampaignData.sent_count > 0 
                      ? ((selectedCampaignData.opened_count / selectedCampaignData.sent_count) * 100).toFixed(1)
                      : '0.0'}%
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Select a campaign to view details</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Campaign Performance</CardTitle>
            <div className="flex gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-muted-foreground">Sent</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-accent" />
                <span className="text-muted-foreground">Opened</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-success" />
                <span className="text-muted-foreground">Clicked</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Line 
                type="monotone" 
                dataKey="sent" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="opened" 
                stroke="hsl(var(--accent))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--accent))', r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="clicked" 
                stroke="hsl(var(--success))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--success))', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
