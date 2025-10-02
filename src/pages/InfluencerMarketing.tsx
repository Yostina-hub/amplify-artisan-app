import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Users, TrendingUp, DollarSign, Instagram, Youtube, Facebook, Twitter } from "lucide-react";

const InfluencerMarketing = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [influencers, setInfluencers] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [isAddInfluencerOpen, setIsAddInfluencerOpen] = useState(false);
  const [isAddCampaignOpen, setIsAddCampaignOpen] = useState(false);

  useEffect(() => {
    document.title = "Influencer Marketing | Amplify Artisan";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Build and manage partnerships with influencers and content creators");
    
    fetchInfluencers();
    fetchCampaigns();
  }, []);

  const fetchInfluencers = async () => {
    const { data, error } = await supabase
      .from("influencers")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      toast({ title: "Error loading influencers", variant: "destructive" });
    } else {
      setInfluencers(data || []);
    }
  };

  const fetchCampaigns = async () => {
    const { data, error } = await supabase
      .from("influencer_campaigns")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      toast({ title: "Error loading campaigns", variant: "destructive" });
    } else {
      setCampaigns(data || []);
    }
  };

  const handleAddInfluencer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const { error } = await supabase.from("influencers").insert({
      user_id: user?.id,
      name: formData.get("name") as string,
      platform: formData.get("platform") as string,
      platform_handle: formData.get("platform_handle") as string,
      platform_url: formData.get("platform_url") as string,
      follower_count: parseInt(formData.get("follower_count") as string) || 0,
      engagement_rate: parseFloat(formData.get("engagement_rate") as string) || 0,
      category: formData.get("category") as string,
      bio: formData.get("bio") as string,
      email: formData.get("email") as string,
      avg_post_price: parseFloat(formData.get("avg_post_price") as string) || null,
    } as any);

    if (error) {
      toast({ title: "Error adding influencer", variant: "destructive" });
    } else {
      toast({ title: "Influencer added successfully" });
      setIsAddInfluencerOpen(false);
      fetchInfluencers();
    }
  };

  const handleAddCampaign = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const { error } = await supabase.from("influencer_campaigns").insert({
      user_id: user?.id,
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      budget: parseFloat(formData.get("budget") as string),
      start_date: formData.get("start_date") as string,
      end_date: formData.get("end_date") as string || null,
      status: "planning",
    } as any);

    if (error) {
      toast({ title: "Error creating campaign", variant: "destructive" });
    } else {
      toast({ title: "Campaign created successfully" });
      setIsAddCampaignOpen(false);
      fetchCampaigns();
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform?.toLowerCase()) {
      case "instagram": return <Instagram className="h-4 w-4" />;
      case "youtube": return <Youtube className="h-4 w-4" />;
      case "facebook": return <Facebook className="h-4 w-4" />;
      case "twitter": return <Twitter className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const filteredInfluencers = influencers.filter(inf => {
    const matchesSearch = inf.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inf.platform_handle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlatform = filterPlatform === "all" || inf.platform === filterPlatform;
    const matchesCategory = filterCategory === "all" || inf.category === filterCategory;
    return matchesSearch && matchesPlatform && matchesCategory;
  });

  const totalInfluencers = influencers.length;
  const activeCampaigns = campaigns.filter(c => c.status === "active").length;
  const totalReach = influencers.reduce((sum, inf) => sum + (inf.follower_count || 0), 0);

  return (
    <main className="container mx-auto p-6 space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Influencer Marketing</h1>
          <p className="text-muted-foreground">Build and manage partnerships with influencers</p>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Influencers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInfluencers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCampaigns}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reach</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(totalReach / 1000).toFixed(1)}K</div>
          </CardContent>
        </Card>
      </section>

      <Tabs defaultValue="influencers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="influencers">Influencers</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
        </TabsList>

        <TabsContent value="influencers" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search influencers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterPlatform} onValueChange={setFilterPlatform}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="youtube">YouTube</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="twitter">Twitter</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="fashion">Fashion</SelectItem>
                <SelectItem value="tech">Tech</SelectItem>
                <SelectItem value="fitness">Fitness</SelectItem>
                <SelectItem value="food">Food</SelectItem>
                <SelectItem value="travel">Travel</SelectItem>
                <SelectItem value="beauty">Beauty</SelectItem>
              </SelectContent>
            </Select>
            <Dialog open={isAddInfluencerOpen} onOpenChange={setIsAddInfluencerOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Influencer
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Influencer</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddInfluencer} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input id="name" name="name" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="platform">Platform *</Label>
                      <Select name="platform" required>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="instagram">Instagram</SelectItem>
                          <SelectItem value="youtube">YouTube</SelectItem>
                          <SelectItem value="facebook">Facebook</SelectItem>
                          <SelectItem value="twitter">Twitter</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="platform_handle">Handle *</Label>
                      <Input id="platform_handle" name="platform_handle" placeholder="@username" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="platform_url">Profile URL</Label>
                      <Input id="platform_url" name="platform_url" type="url" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="follower_count">Followers</Label>
                      <Input id="follower_count" name="follower_count" type="number" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="engagement_rate">Engagement Rate (%)</Label>
                      <Input id="engagement_rate" name="engagement_rate" type="number" step="0.01" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select name="category">
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fashion">Fashion</SelectItem>
                          <SelectItem value="tech">Tech</SelectItem>
                          <SelectItem value="fitness">Fitness</SelectItem>
                          <SelectItem value="food">Food</SelectItem>
                          <SelectItem value="travel">Travel</SelectItem>
                          <SelectItem value="beauty">Beauty</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="avg_post_price">Avg. Post Price ($)</Label>
                      <Input id="avg_post_price" name="avg_post_price" type="number" step="0.01" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea id="bio" name="bio" rows={3} />
                  </div>
                  <Button type="submit" className="w-full">Add Influencer</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredInfluencers.map((influencer) => (
              <Card key={influencer.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        {getPlatformIcon(influencer.platform)}
                      </div>
                      <div>
                        <CardTitle className="text-base">{influencer.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{influencer.platform_handle}</p>
                      </div>
                    </div>
                    <Badge variant="secondary">{influencer.platform}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {influencer.category && (
                    <Badge variant="outline">{influencer.category}</Badge>
                  )}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Followers</p>
                      <p className="font-semibold">{(influencer.follower_count / 1000).toFixed(1)}K</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Engagement</p>
                      <p className="font-semibold">{influencer.engagement_rate}%</p>
                    </div>
                  </div>
                  {influencer.avg_post_price && (
                    <div className="text-sm">
                      <p className="text-muted-foreground">Avg. Post Price</p>
                      <p className="font-semibold">${influencer.avg_post_price}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredInfluencers.length === 0 && (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No influencers found. Add your first influencer to get started.</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isAddCampaignOpen} onOpenChange={setIsAddCampaignOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Campaign
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Campaign</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddCampaign} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="campaign_name">Campaign Name *</Label>
                    <Input id="campaign_name" name="name" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" name="description" rows={3} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="budget">Budget ($) *</Label>
                      <Input id="budget" name="budget" type="number" step="0.01" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="start_date">Start Date *</Label>
                      <Input id="start_date" name="start_date" type="date" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date">End Date</Label>
                    <Input id="end_date" name="end_date" type="date" />
                  </div>
                  <Button type="submit" className="w-full">Create Campaign</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {campaigns.map((campaign) => (
              <Card key={campaign.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle>{campaign.name}</CardTitle>
                    <Badge variant={campaign.status === "active" ? "default" : "secondary"}>
                      {campaign.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {campaign.description && (
                    <p className="text-sm text-muted-foreground">{campaign.description}</p>
                  )}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Budget</p>
                      <p className="font-semibold">${campaign.budget}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Start Date</p>
                      <p className="font-semibold">
                        {new Date(campaign.start_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {campaigns.length === 0 && (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No campaigns yet. Create your first campaign to get started.</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </main>
  );
};

export default InfluencerMarketing;