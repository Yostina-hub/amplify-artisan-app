import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Play, Pause, TrendingUp, Eye, Calendar, DollarSign, MousePointer, Target } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";

type Campaign = {
  id: string;
  name: string;
  platform: string;
  budget: number;
  start_date: string;
  end_date: string | null;
  status: string;
  impressions: number;
  clicks: number;
  conversions: number;
};

export default function AdCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    platform: "",
    budget: "",
    start_date: "",
    end_date: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('ad_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching campaigns",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase.from('ad_campaigns').insert({
        name: newCampaign.name,
        platform: newCampaign.platform,
        budget: parseFloat(newCampaign.budget),
        start_date: new Date(newCampaign.start_date).toISOString(),
        end_date: newCampaign.end_date ? new Date(newCampaign.end_date).toISOString() : null,
        status: 'draft',
        user_id: user.id,
      });

      if (error) throw error;

      toast({
        title: "Campaign created",
        description: "Your ad campaign has been created successfully",
      });

      setNewCampaign({ name: "", platform: "", budget: "", start_date: "", end_date: "" });
      fetchCampaigns();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleToggleCampaign = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    
    try {
      const { error } = await supabase
        .from('ad_campaigns')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: `Campaign ${newStatus}`,
        description: `Campaign has been ${newStatus} successfully`,
      });

      fetchCampaigns();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
      draft: "secondary",
      active: "default",
      paused: "outline",
      completed: "secondary",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  const calculateROI = (campaign: Campaign) => {
    if (campaign.budget === 0) return "0.0";
    const revenue = campaign.conversions * 50; // Assume $50 per conversion
    return (((revenue - campaign.budget) / campaign.budget) * 100).toFixed(1);
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ad Campaigns</h1>
          <p className="text-muted-foreground mt-1">
            Manage your advertising campaigns across platforms
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              New Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Campaign</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Campaign Name</Label>
                <Input
                  placeholder="Spring Sale 2025"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Platform</Label>
                <Select
                  value={newCampaign.platform}
                  onValueChange={(value) => setNewCampaign({ ...newCampaign, platform: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="twitter">Twitter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Budget ($)</Label>
                <Input
                  type="number"
                  placeholder="1000"
                  value={newCampaign.budget}
                  onChange={(e) => setNewCampaign({ ...newCampaign, budget: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={newCampaign.start_date}
                    onChange={(e) => setNewCampaign({ ...newCampaign, start_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date (Optional)</Label>
                  <Input
                    type="date"
                    value={newCampaign.end_date}
                    onChange={(e) => setNewCampaign({ ...newCampaign, end_date: e.target.value })}
                  />
                </div>
              </div>
              <Button 
                className="w-full" 
                onClick={handleCreateCampaign}
                disabled={!newCampaign.name || !newCampaign.platform || !newCampaign.budget || !newCampaign.start_date}
              >
                Create Campaign
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Loading campaigns...
            </CardContent>
          </Card>
        ) : campaigns.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No campaigns yet. Create your first campaign to get started!
            </CardContent>
          </Card>
        ) : (
          campaigns.map((campaign) => (
            <Card key={campaign.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{campaign.name}</CardTitle>
                    <CardDescription className="mt-1 capitalize">
                      {campaign.platform} • Budget: ${campaign.budget.toFixed(2)}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                     {getStatusBadge(campaign.status)}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedCampaign(campaign)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh]">
                        <DialogHeader>
                          <DialogTitle>{campaign.name}</DialogTitle>
                          <DialogDescription className="capitalize">
                            {campaign.platform} Campaign
                          </DialogDescription>
                        </DialogHeader>
                        <ScrollArea className="max-h-[70vh]">
                          <div className="space-y-6 pr-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="space-y-1">
                                <Label className="text-muted-foreground flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Status
                                </Label>
                                <div>{getStatusBadge(campaign.status)}</div>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-muted-foreground flex items-center gap-1">
                                  <DollarSign className="h-3 w-3" />
                                  Budget
                                </Label>
                                <p className="font-semibold">${campaign.budget.toLocaleString()}</p>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-muted-foreground">Start Date</Label>
                                <p className="font-semibold">
                                  {format(new Date(campaign.start_date), "MMM d, yyyy")}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-muted-foreground">End Date</Label>
                                <p className="font-semibold">
                                  {campaign.end_date 
                                    ? format(new Date(campaign.end_date), "MMM d, yyyy")
                                    : "Ongoing"}
                                </p>
                              </div>
                            </div>

                            <Separator />

                            <div>
                              <h3 className="font-semibold mb-4 flex items-center gap-2">
                                <Target className="h-4 w-4" />
                                Performance Metrics
                              </h3>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <Card>
                                  <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">
                                      Impressions
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <p className="text-3xl font-bold">
                                      {campaign.impressions.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Total views
                                    </p>
                                  </CardContent>
                                </Card>
                                <Card>
                                  <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">
                                      Clicks
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <p className="text-3xl font-bold">
                                      {campaign.clicks.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Click-through rate: {campaign.impressions > 0 
                                        ? ((campaign.clicks / campaign.impressions) * 100).toFixed(2)
                                        : 0}%
                                    </p>
                                  </CardContent>
                                </Card>
                                <Card>
                                  <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">
                                      Conversions
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <p className="text-3xl font-bold">{campaign.conversions}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Conversion rate: {campaign.clicks > 0
                                        ? ((campaign.conversions / campaign.clicks) * 100).toFixed(2)
                                        : 0}%
                                    </p>
                                  </CardContent>
                                </Card>
                                <Card>
                                  <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                      <TrendingUp className="h-4 w-4" />
                                      ROI
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <p className={`text-3xl font-bold ${
                                      parseFloat(calculateROI(campaign)) > 0 
                                        ? "text-green-600" 
                                        : "text-red-600"
                                    }`}>
                                      {calculateROI(campaign)}%
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Return on investment
                                    </p>
                                  </CardContent>
                                </Card>
                              </div>
                            </div>

                            <Separator />

                            <div>
                              <h3 className="font-semibold mb-4">Cost Analysis</h3>
                              <div className="grid grid-cols-3 gap-4">
                                <div className="p-4 bg-muted rounded-lg">
                                  <p className="text-sm text-muted-foreground">Cost per Click</p>
                                  <p className="text-2xl font-bold">
                                    ${campaign.clicks > 0 
                                      ? (campaign.budget / campaign.clicks).toFixed(2)
                                      : "0.00"}
                                  </p>
                                </div>
                                <div className="p-4 bg-muted rounded-lg">
                                  <p className="text-sm text-muted-foreground">Cost per Conversion</p>
                                  <p className="text-2xl font-bold">
                                    ${campaign.conversions > 0
                                      ? (campaign.budget / campaign.conversions).toFixed(2)
                                      : "0.00"}
                                  </p>
                                </div>
                                <div className="p-4 bg-muted rounded-lg">
                                  <p className="text-sm text-muted-foreground">Spent</p>
                                  <p className="text-2xl font-bold">
                                    ${campaign.budget.toFixed(2)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </ScrollArea>
                        <div className="flex justify-end gap-2 mt-4">
                          {(campaign.status === 'draft' || campaign.status === 'active' || campaign.status === 'paused') && (
                            <Button
                              variant="outline"
                              onClick={() => handleToggleCampaign(campaign.id, campaign.status)}
                            >
                              {campaign.status === 'active' ? (
                                <>
                                  <Pause className="h-4 w-4 mr-1" />
                                  Pause Campaign
                                </>
                              ) : (
                                <>
                                  <Play className="h-4 w-4 mr-1" />
                                  Start Campaign
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Impressions</p>
                    <p className="text-2xl font-bold">{campaign.impressions.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Clicks</p>
                    <p className="text-2xl font-bold">{campaign.clicks.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Conversions</p>
                    <p className="text-2xl font-bold">{campaign.conversions}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      ROI
                    </p>
                    <p className="text-2xl font-bold">{calculateROI(campaign)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}