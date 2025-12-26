import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Target,
  ExternalLink,
  MapPin,
  Building2,
  User,
  Tag,
  Clock,
  Zap,
  Activity,
  RefreshCw,
  Sparkles,
  Globe,
  BarChart3,
  X,
  Settings2,
  Plus,
  Search,
  Loader2,
  CheckCircle2,
  Play,
  Database,
  Youtube,
  Facebook,
  Instagram,
  Twitter,
  Video,
  Users,
  Heart,
  MessageCircle,
  Share2,
  Eye
} from "lucide-react";

const SAMPLE_PROFILES = [
  {
    profile_name: 'Ethio Telecom Monitoring',
    business_type: 'Ethio Telecom',
    industry: 'Telecommunications',
    description: 'Monitor Ethio Telecom services, network quality, customer feedback, and competitor activities',
    keywords: 'ethio telecom, telebirr, mobile network, internet service, 4G, 5G, safaricom',
    competitor_names: 'Safaricom Ethiopia, Starlink',
    target_regions: 'Ethiopia, Addis Ababa, Oromia, Amhara'
  },
  {
    profile_name: 'Ethiopian Government Affairs',
    business_type: 'Government - Federal',
    industry: 'Public Administration',
    description: 'Track government policies, announcements, and public sector developments',
    keywords: 'ethiopian government, ministry, policy, regulation, parliament, prime minister',
    competitor_names: '',
    target_regions: 'Ethiopia, African Union'
  },
  {
    profile_name: 'Commercial Bank of Ethiopia',
    business_type: 'Bank',
    industry: 'Banking & Finance',
    description: 'Monitor banking sector, financial news, and CBE-related updates',
    keywords: 'CBE, commercial bank ethiopia, banking, loan, interest rate, forex',
    competitor_names: 'Awash Bank, Dashen Bank, Bank of Abyssinia, Zemen Bank',
    target_regions: 'Ethiopia'
  },
  {
    profile_name: 'Ethiopian Airlines Group',
    business_type: 'Public Enterprise',
    industry: 'Aviation',
    description: 'Track aviation industry, Ethiopian Airlines operations, and travel sector news',
    keywords: 'ethiopian airlines, aviation, flight, bole airport, cargo, star alliance',
    competitor_names: 'Kenya Airways, Emirates, Qatar Airways, Turkish Airlines',
    target_regions: 'Ethiopia, Africa, Global'
  },
  {
    profile_name: 'Tech Startup Ecosystem',
    business_type: 'Private - Startup',
    industry: 'Information Technology',
    description: 'Monitor Ethiopian tech ecosystem, startups, and innovation news',
    keywords: 'tech startup, fintech, innovation, venture capital, entrepreneur, digital ethiopia',
    competitor_names: '',
    target_regions: 'Ethiopia, East Africa'
  },
  {
    profile_name: 'Healthcare Sector Watch',
    business_type: 'Healthcare',
    industry: 'Healthcare & Pharmaceuticals',
    description: 'Track healthcare developments, public health news, and medical sector updates',
    keywords: 'healthcare, hospital, medicine, health ministry, WHO, vaccination, public health',
    competitor_names: '',
    target_regions: 'Ethiopia, Africa'
  },
  {
    profile_name: 'Real Estate & Construction',
    business_type: 'Real Estate',
    industry: 'Real Estate & Property',
    description: 'Monitor real estate market, construction projects, and property developments',
    keywords: 'real estate, construction, housing, condominium, commercial property, infrastructure',
    competitor_names: '',
    target_regions: 'Addis Ababa, Ethiopia'
  },
  {
    profile_name: 'Agriculture & Export',
    business_type: 'Agriculture',
    industry: 'Agriculture & Agribusiness',
    description: 'Track agricultural sector, coffee export, and farming developments',
    keywords: 'agriculture, coffee, export, farming, horticulture, livestock, food security',
    competitor_names: '',
    target_regions: 'Ethiopia, East Africa'
  },
  {
    profile_name: 'Addis Ababa City Government',
    business_type: 'Government - Municipal',
    industry: 'Public Administration',
    description: 'Monitor city administration, urban development, and municipal services',
    keywords: 'addis ababa, city government, urban, municipality, public service, infrastructure',
    competitor_names: '',
    target_regions: 'Addis Ababa'
  },
  {
    profile_name: 'Ethiopian Insurance Corporation',
    business_type: 'Insurance',
    industry: 'Insurance',
    description: 'Track insurance sector, EIC updates, and regulatory developments',
    keywords: 'insurance, EIC, risk, claims, premium, reinsurance',
    competitor_names: 'Awash Insurance, Nyala Insurance, Nile Insurance',
    target_regions: 'Ethiopia'
  }
];

interface NeuralAIEngineProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NeuralAIEngine({ isOpen, onClose }: NeuralAIEngineProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("predictions");
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [filterType, setFilterType] = useState("all");
  const [searchUrls, setSearchUrls] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  // Social media tracking state
  const [socialPlatform, setSocialPlatform] = useState<'tiktok' | 'facebook' | 'youtube' | 'instagram' | 'twitter'>('youtube');
  const [socialHandle, setSocialHandle] = useState("");
  const [newProfile, setNewProfile] = useState({
    profile_name: "",
    business_type: "",
    industry: "",
    description: "",
    keywords: "",
    competitor_names: "",
    target_regions: "",
  });

  // New requirement form state
  const [newRequirement, setNewRequirement] = useState({
    requirement_type: "keyword",
    requirement_value: "",
    priority: "medium",
  });

  // Generate animated waveform
  useEffect(() => {
    const generateWaveform = () => {
      const data = Array.from({ length: 60 }, () => Math.random() * 100);
      setWaveformData(data);
    };
    generateWaveform();
    const interval = setInterval(generateWaveform, 2000);
    return () => clearInterval(interval);
  }, []);

  // Fetch user's company ID
  const { data: profile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const companyId = profile?.company_id ?? null;

  // Fetch user roles (to detect super admin)
  const { data: userRoles } = useQuery({
    queryKey: ['user-roles', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('user_roles')
        .select('role, company_id')
        .eq('user_id', user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const isSuperAdmin = !!userRoles?.some((r) => r.role === 'admin' && !r.company_id);

  // If user is super admin and has no company, allow selecting a company to work with
  const { data: companies } = useQuery({
    queryKey: ['companies-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: isSuperAdmin && !companyId,
  });

  useEffect(() => {
    if (!companyId && !selectedCompanyId && companies && companies.length === 1) {
      setSelectedCompanyId(companies[0].id);
    }
  }, [companyId, selectedCompanyId, companies]);

  const effectiveCompanyId = companyId || selectedCompanyId;

  useEffect(() => {
    setSelectedProfileId(null);
  }, [effectiveCompanyId]);

  // Fetch monitoring profiles
  const { data: monitoringProfiles, isLoading: profilesLoading } = useQuery({
    queryKey: ['monitoring-profiles', effectiveCompanyId],
    queryFn: async () => {
      if (!effectiveCompanyId) return [];
      const { data, error } = await supabase
        .from('company_monitoring_profiles')
        .select('*')
        .eq('company_id', effectiveCompanyId)
        .eq('is_active', true);
      if (error) throw error;
      return data || [];
    },
    enabled: !!effectiveCompanyId,
  });

  // Fetch requirements for selected profile
  const { data: requirements } = useQuery({
    queryKey: ['monitoring-requirements', selectedProfileId],
    queryFn: async () => {
      if (!selectedProfileId) return [];
      const { data, error } = await supabase
        .from('monitoring_requirements')
        .select('*')
        .eq('profile_id', selectedProfileId)
        .eq('is_active', true);
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedProfileId,
  });

  // Fetch scraped intelligence
  const { data: intelligence, isLoading: intelligenceLoading, refetch: refetchIntelligence } = useQuery({
    queryKey: ['scraped-intelligence', effectiveCompanyId, selectedProfileId, filterType],
    queryFn: async () => {
      if (!effectiveCompanyId) return [];
      let query = supabase
        .from('scraped_intelligence')
        .select('*')
        .eq('company_id', effectiveCompanyId)
        .order('scraped_at', { ascending: false })
        .limit(50);

      if (selectedProfileId) {
        query = query.eq('profile_id', selectedProfileId);
      }
      if (filterType !== 'all') {
        query = query.eq('category', filterType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!effectiveCompanyId,
  });

  // Fetch AI predictions
  const { data: predictions, isLoading: predictionsLoading, refetch: refetchPredictions } = useQuery({
    queryKey: ['ai-predictions', effectiveCompanyId, selectedProfileId],
    queryFn: async () => {
      if (!effectiveCompanyId) return [];
      let query = supabase
        .from('ai_predictions')
        .select('*')
        .eq('company_id', effectiveCompanyId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (selectedProfileId) {
        query = query.eq('profile_id', selectedProfileId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!effectiveCompanyId,
  });

  // Fetch tracked social accounts
  const { data: trackedAccounts, isLoading: accountsLoading, refetch: refetchAccounts } = useQuery({
    queryKey: ['tracked-social-accounts', effectiveCompanyId],
    queryFn: async () => {
      if (!effectiveCompanyId) return [];
      const { data, error } = await supabase
        .from('tracked_social_accounts')
        .select('*')
        .eq('company_id', effectiveCompanyId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!effectiveCompanyId,
  });

  // Fetch scraped social posts
  const { data: socialPosts, isLoading: postsLoading, refetch: refetchPosts } = useQuery({
    queryKey: ['scraped-social-posts', effectiveCompanyId],
    queryFn: async () => {
      if (!effectiveCompanyId) return [];
      const { data, error } = await supabase
        .from('scraped_social_posts')
        .select('*, tracked_social_accounts!inner(account_handle, account_name, platform)')
        .eq('company_id', effectiveCompanyId)
        .order('scraped_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
    enabled: !!effectiveCompanyId,
  });
  const createProfileMutation = useMutation({
    mutationFn: async () => {
      if (!effectiveCompanyId || !user?.id) throw new Error('Select a company first');

      const { data, error } = await supabase
        .from('company_monitoring_profiles')
        .insert({
          company_id: effectiveCompanyId,
          profile_name: newProfile.profile_name,
          business_type: newProfile.business_type,
          industry: newProfile.industry,
          description: newProfile.description,
          keywords: newProfile.keywords.split(',').map(k => k.trim()).filter(Boolean),
          competitor_names: newProfile.competitor_names.split(',').map(k => k.trim()).filter(Boolean),
          target_regions: newProfile.target_regions.split(',').map(k => k.trim()).filter(Boolean),
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success('Monitoring profile created');
      queryClient.invalidateQueries({ queryKey: ['monitoring-profiles'] });
      setSelectedProfileId(data.id);
      setShowProfileDialog(false);
      setNewProfile({
        profile_name: "",
        business_type: "",
        industry: "",
        description: "",
        keywords: "",
        competitor_names: "",
        target_regions: "",
      });
    },
    onError: (error) => {
      toast.error('Failed to create profile: ' + error.message);
    },
  });

  // Add requirement
  const addRequirementMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProfileId) throw new Error('No profile selected');
      
      const { error } = await supabase
        .from('monitoring_requirements')
        .insert({
          profile_id: selectedProfileId,
          requirement_type: newRequirement.requirement_type,
          requirement_value: newRequirement.requirement_value,
          priority: newRequirement.priority,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Requirement added');
      queryClient.invalidateQueries({ queryKey: ['monitoring-requirements'] });
      setNewRequirement({ requirement_type: "keyword", requirement_value: "", priority: "medium" });
    },
    onError: (error) => {
      toast.error('Failed to add requirement: ' + error.message);
    },
  });

  // Scrape URLs mutation
  const scrapeMutation = useMutation({
    mutationFn: async ({ urls, query }: { urls?: string[], query?: string }) => {
      if (!effectiveCompanyId) throw new Error('Select a company first');
      const { data, error } = await supabase.functions.invoke('neural-engine-scrape', {
        body: {
          urls,
          searchQuery: query,
          profileId: selectedProfileId,
          companyId: effectiveCompanyId,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Scraped ${data.count} items`);
      refetchIntelligence();
    },
    onError: (error) => {
      toast.error('Scraping failed: ' + error.message);
    },
  });

  // Analyze mutation
  const analyzeMutation = useMutation({
    mutationFn: async () => {
      if (!effectiveCompanyId) throw new Error('Select a company first');
      const { data, error } = await supabase.functions.invoke('neural-engine-analyze', {
        body: {
          profileId: selectedProfileId,
          companyId: effectiveCompanyId,
          analysisType: 'predictions',
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Generated ${data.predictions?.length || 0} predictions`);
      refetchPredictions();
    },
    onError: (error) => {
      toast.error('Analysis failed: ' + error.message);
    },
  });

  // Social media scrape mutation
  const socialScrapeMutation = useMutation({
    mutationFn: async ({ platform, handle }: { platform: string, handle: string }) => {
      if (!effectiveCompanyId) throw new Error('Select a company first');
      const { data, error } = await supabase.functions.invoke('scrape-social-media', {
        body: {
          platform,
          accountHandle: handle,
          companyId: effectiveCompanyId,
          profileId: selectedProfileId,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || `Tracked ${data.account?.account_name}`);
      setSocialHandle("");
      refetchAccounts();
      refetchPosts();
    },
    onError: (error) => {
      toast.error('Social scraping failed: ' + error.message);
    },
  });

  const handleScrapeUrls = () => {
    const urls = searchUrls.split('\n').map(u => u.trim()).filter(Boolean);
    if (urls.length > 0) {
      scrapeMutation.mutate({ urls });
    }
  };

  const handleSearchScrape = () => {
    if (searchQuery.trim()) {
      scrapeMutation.mutate({ query: searchQuery });
    }
  };

  const handleTrackSocialAccount = () => {
    if (socialHandle.trim()) {
      socialScrapeMutation.mutate({ platform: socialPlatform, handle: socialHandle });
    }
  };

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, React.ReactNode> = {
      youtube: <Youtube className="h-4 w-4 text-red-500" />,
      facebook: <Facebook className="h-4 w-4 text-blue-600" />,
      instagram: <Instagram className="h-4 w-4 text-pink-500" />,
      twitter: <Twitter className="h-4 w-4 text-sky-500" />,
      tiktok: <Video className="h-4 w-4 text-black dark:text-white" />,
    };
    return icons[platform] || <Globe className="h-4 w-4" />;
  };

  const formatFollowers = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      competitor: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      industry: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      market: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      regulatory: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      opportunity: "bg-green-500/20 text-green-400 border-green-500/30",
      risk: "bg-red-500/20 text-red-400 border-red-500/30",
    };
    return colors[category] || "bg-muted text-muted-foreground";
  };

  const getSentimentColor = (sentiment: string) => {
    const colors: Record<string, string> = {
      positive: "text-emerald-400",
      negative: "text-red-400",
      neutral: "text-muted-foreground",
    };
    return colors[sentiment] || "text-muted-foreground";
  };

  const getImpactBadge = (impact: string) => {
    const styles: Record<string, string> = {
      high: "bg-red-500/20 text-red-400 border-red-500/30",
      medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      low: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    };
    return styles[impact] || "";
  };

  if (!isOpen) return null;

  const selectedProfile = monitoringProfiles?.find(p => p.id === selectedProfileId);

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-5xl max-h-[90vh] overflow-hidden bg-gradient-to-br from-background via-background to-purple-950/20 border-purple-500/30 shadow-2xl shadow-purple-500/10">
        {/* Header */}
        <CardHeader className="border-b border-purple-500/20 bg-gradient-to-r from-purple-950/50 to-background">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center animate-pulse">
                  <Brain className="h-7 w-7 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full animate-ping" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
                  Neural AI Engine
                </CardTitle>
                <p className="text-sm text-purple-400/80 flex items-center gap-2">
                  <Zap className="h-3 w-3" />
                  Quantum predictive analysis active
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Company selector for super admin */}
              {isSuperAdmin && !companyId && (
                <Select
                  value={selectedCompanyId || ""}
                  onValueChange={(v) => {
                    setSelectedCompanyId(v);
                    setSelectedProfileId(null);
                  }}
                >
                  <SelectTrigger className="w-[200px] bg-background">
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-[200] max-h-[350px] overflow-y-auto" position="popper" side="bottom" sideOffset={4}>
                    {companies && companies.length > 0 ? (
                      companies.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="__none" disabled>
                        No companies found
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              )}

              {/* Profile selector */}
              <Select
                value={selectedProfileId || ""}
                disabled={!effectiveCompanyId}
                onValueChange={(value) => {
                  if (!effectiveCompanyId) {
                    toast.error('Select a company first');
                    return;
                  }

                  // Check if it's a sample profile (starts with "sample_")
                  if (value.startsWith('sample_')) {
                    const sampleIndex = parseInt(value.replace('sample_', ''));
                    const sample = SAMPLE_PROFILES[sampleIndex];
                    if (sample && user?.id) {
                      // Create the profile from sample
                      supabase
                        .from('company_monitoring_profiles')
                        .insert({
                          company_id: effectiveCompanyId,
                          profile_name: sample.profile_name,
                          business_type: sample.business_type,
                          industry: sample.industry,
                          description: sample.description,
                          keywords: sample.keywords.split(',').map(k => k.trim()).filter(Boolean),
                          competitor_names: sample.competitor_names.split(',').map(k => k.trim()).filter(Boolean),
                          target_regions: sample.target_regions.split(',').map(k => k.trim()).filter(Boolean),
                          created_by: user.id,
                        })
                        .select()
                        .single()
                        .then(({ data, error }) => {
                          if (error) {
                            toast.error('Failed to create profile: ' + error.message);
                          } else if (data) {
                            toast.success('Profile created from template');
                            queryClient.invalidateQueries({ queryKey: ['monitoring-profiles'] });
                            setSelectedProfileId(data.id);
                          }
                        });
                    }
                  } else {
                    setSelectedProfileId(value);
                  }
                }}
              >
                <SelectTrigger className="w-[220px] bg-background">
                  <SelectValue placeholder={effectiveCompanyId ? "Select profile" : "Select company first"} />
                </SelectTrigger>
                <SelectContent className="bg-popover z-[200] max-h-[350px] overflow-y-auto" position="popper" side="bottom" sideOffset={4}>
                  {/* Existing profiles */}
                  {monitoringProfiles && monitoringProfiles.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Your Profiles</div>
                      {monitoringProfiles.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.profile_name}
                        </SelectItem>
                      ))}
                      <div className="my-1 border-t" />
                    </>
                  )}

                  {/* Sample profiles as quick-start */}
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    {monitoringProfiles && monitoringProfiles.length > 0 ? 'Quick Start Templates' : 'Create from Template'}
                  </div>
                  {SAMPLE_PROFILES.map((sample, index) => (
                    <SelectItem key={`sample_${index}`} value={`sample_${index}`} className="py-2">
                      <div className="flex flex-col items-start">
                        <span className="font-medium text-sm">{sample.profile_name}</span>
                        <span className="text-xs text-muted-foreground">{sample.business_type}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create Monitoring Profile</DialogTitle>
                  </DialogHeader>
                  
                  {/* Sample Profiles Dropdown */}
                  <div className="mb-4">
                    <Label className="text-sm font-medium mb-2 block">Quick Start - Select a Sample Profile</Label>
                    <Select
                      onValueChange={(value) => {
                        const sample = SAMPLE_PROFILES.find(p => p.profile_name === value);
                        if (sample) {
                          setNewProfile({
                            profile_name: sample.profile_name,
                            business_type: sample.business_type,
                            industry: sample.industry,
                            description: sample.description,
                            keywords: sample.keywords,
                            competitor_names: sample.competitor_names,
                            target_regions: sample.target_regions,
                          });
                        }
                      }}
                    >
                      <SelectTrigger className="w-full bg-background">
                        <SelectValue placeholder="Choose a sample profile to get started..." />
                      </SelectTrigger>
                      <SelectContent 
                        className="bg-popover z-[200] max-h-[300px] overflow-y-auto" 
                        position="popper" 
                        side="bottom" 
                        align="start"
                        sideOffset={4}
                      >
                        {SAMPLE_PROFILES.map((sample, index) => (
                          <SelectItem key={index} value={sample.profile_name} className="py-3">
                            <div className="flex flex-col items-start">
                              <span className="font-medium">{sample.profile_name}</span>
                              <span className="text-xs text-muted-foreground">{sample.business_type} • {sample.industry}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="border-t pt-4 space-y-4">
                    <div>
                      <Label>Profile Name</Label>
                      <Input
                        value={newProfile.profile_name}
                        onChange={(e) => setNewProfile({ ...newProfile, profile_name: e.target.value })}
                        placeholder="e.g., Main Business Monitoring"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Business Type</Label>
                        <Select 
                          value={newProfile.business_type} 
                          onValueChange={(v) => setNewProfile({ ...newProfile, business_type: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select business type" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover z-[200] max-h-[250px] overflow-y-auto" position="popper" side="bottom" sideOffset={4}>
                            <SelectItem value="Ethio Telecom">Ethio Telecom</SelectItem>
                            <SelectItem value="Government - Federal">Government - Federal</SelectItem>
                            <SelectItem value="Government - Regional">Government - Regional</SelectItem>
                            <SelectItem value="Government - Municipal">Government - Municipal</SelectItem>
                            <SelectItem value="Government - Agency">Government - Agency</SelectItem>
                            <SelectItem value="Public Enterprise">Public Enterprise</SelectItem>
                            <SelectItem value="Private - Corporation">Private - Corporation</SelectItem>
                            <SelectItem value="Private - SME">Private - SME</SelectItem>
                            <SelectItem value="Private - Startup">Private - Startup</SelectItem>
                            <SelectItem value="NGO / Non-Profit">NGO / Non-Profit</SelectItem>
                            <SelectItem value="Financial Institution">Financial Institution</SelectItem>
                            <SelectItem value="Bank">Bank</SelectItem>
                            <SelectItem value="Insurance">Insurance</SelectItem>
                            <SelectItem value="Educational Institution">Educational Institution</SelectItem>
                            <SelectItem value="Healthcare">Healthcare</SelectItem>
                            <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                            <SelectItem value="Retail & Trade">Retail & Trade</SelectItem>
                            <SelectItem value="Technology">Technology</SelectItem>
                            <SelectItem value="Telecommunications">Telecommunications</SelectItem>
                            <SelectItem value="Media & Entertainment">Media & Entertainment</SelectItem>
                            <SelectItem value="Agriculture">Agriculture</SelectItem>
                            <SelectItem value="Construction">Construction</SelectItem>
                            <SelectItem value="Transportation & Logistics">Transportation & Logistics</SelectItem>
                            <SelectItem value="Hospitality & Tourism">Hospitality & Tourism</SelectItem>
                            <SelectItem value="Energy & Utilities">Energy & Utilities</SelectItem>
                            <SelectItem value="Real Estate">Real Estate</SelectItem>
                            <SelectItem value="Consulting & Professional Services">Consulting & Professional Services</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Industry</Label>
                        <Select 
                          value={newProfile.industry} 
                          onValueChange={(v) => setNewProfile({ ...newProfile, industry: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select industry" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover z-[200] max-h-[250px] overflow-y-auto" position="popper" side="bottom" sideOffset={4}>
                            <SelectItem value="Telecommunications">Telecommunications</SelectItem>
                            <SelectItem value="Information Technology">Information Technology</SelectItem>
                            <SelectItem value="Public Administration">Public Administration</SelectItem>
                            <SelectItem value="Defense & Security">Defense & Security</SelectItem>
                            <SelectItem value="Banking & Finance">Banking & Finance</SelectItem>
                            <SelectItem value="Insurance">Insurance</SelectItem>
                            <SelectItem value="Healthcare & Pharmaceuticals">Healthcare & Pharmaceuticals</SelectItem>
                            <SelectItem value="Education">Education</SelectItem>
                            <SelectItem value="Agriculture & Agribusiness">Agriculture & Agribusiness</SelectItem>
                            <SelectItem value="Manufacturing & Industrial">Manufacturing & Industrial</SelectItem>
                            <SelectItem value="Retail & Consumer Goods">Retail & Consumer Goods</SelectItem>
                            <SelectItem value="E-commerce">E-commerce</SelectItem>
                            <SelectItem value="Media & Publishing">Media & Publishing</SelectItem>
                            <SelectItem value="Entertainment">Entertainment</SelectItem>
                            <SelectItem value="Construction & Engineering">Construction & Engineering</SelectItem>
                            <SelectItem value="Real Estate & Property">Real Estate & Property</SelectItem>
                            <SelectItem value="Transportation & Logistics">Transportation & Logistics</SelectItem>
                            <SelectItem value="Aviation">Aviation</SelectItem>
                            <SelectItem value="Hospitality & Tourism">Hospitality & Tourism</SelectItem>
                            <SelectItem value="Energy & Power">Energy & Power</SelectItem>
                            <SelectItem value="Mining & Extractives">Mining & Extractives</SelectItem>
                            <SelectItem value="Legal Services">Legal Services</SelectItem>
                            <SelectItem value="Consulting">Consulting</SelectItem>
                            <SelectItem value="NGO & Development">NGO & Development</SelectItem>
                            <SelectItem value="Sports & Recreation">Sports & Recreation</SelectItem>
                            <SelectItem value="Food & Beverage">Food & Beverage</SelectItem>
                            <SelectItem value="Textile & Apparel">Textile & Apparel</SelectItem>
                            <SelectItem value="Automotive">Automotive</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={newProfile.description}
                        onChange={(e) => setNewProfile({ ...newProfile, description: e.target.value })}
                        placeholder="Brief description of what to monitor"
                      />
                    </div>
                    <div>
                      <Label>Keywords (comma separated)</Label>
                      <Input
                        value={newProfile.keywords}
                        onChange={(e) => setNewProfile({ ...newProfile, keywords: e.target.value })}
                        placeholder="AI, machine learning, automation"
                      />
                    </div>
                    <div>
                      <Label>Competitor Names (comma separated)</Label>
                      <Input
                        value={newProfile.competitor_names}
                        onChange={(e) => setNewProfile({ ...newProfile, competitor_names: e.target.value })}
                        placeholder="Company A, Company B"
                      />
                    </div>
                    <div>
                      <Label>Target Regions (comma separated)</Label>
                      <Input
                        value={newProfile.target_regions}
                        onChange={(e) => setNewProfile({ ...newProfile, target_regions: e.target.value })}
                        placeholder="Ethiopia, East Africa, Global"
                      />
                    </div>
                    <Button 
                      onClick={() => createProfileMutation.mutate()} 
                      disabled={createProfileMutation.isPending || !newProfile.profile_name || !newProfile.business_type}
                      className="w-full"
                    >
                      {createProfileMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Create Profile
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Neural Waveform */}
          <div className="mt-4 p-4 rounded-xl bg-purple-950/30 border border-purple-500/20">
            <div className="flex items-end gap-0.5 h-12 justify-center">
              {waveformData.map((value, i) => (
                <div
                  key={i}
                  className="w-1.5 rounded-full transition-all duration-300"
                  style={{
                    height: `${value}%`,
                    background: `linear-gradient(to top, hsl(280, 80%, 60%), hsl(320, 80%, 60%))`,
                    opacity: 0.6 + (value / 250)
                  }}
                />
              ))}
            </div>
            {(scrapeMutation.isPending || analyzeMutation.isPending) && (
              <div className="text-center mt-2 text-xs text-purple-400 animate-pulse">
                Processing neural patterns...
              </div>
            )}
          </div>

          {/* Selected Profile Info */}
          {selectedProfile && (
            <div className="mt-3 p-3 rounded-lg bg-muted/30 border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{selectedProfile.profile_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedProfile.business_type} • {selectedProfile.industry}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{(selectedProfile.keywords as string[])?.length || 0} keywords</Badge>
                  <Badge variant="outline">{requirements?.length || 0} requirements</Badge>
                </div>
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b border-border/50 px-4">
              <TabsList className="bg-transparent h-12 gap-1 flex-wrap">
                <TabsTrigger value="social" className="data-[state=active]:bg-pink-500/20 data-[state=active]:text-pink-300 rounded-lg px-4">
                  <Users className="h-4 w-4 mr-2" />
                  Social Tracking
                </TabsTrigger>
                <TabsTrigger value="predictions" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 rounded-lg px-4">
                  <Activity className="h-4 w-4 mr-2" />
                  Predictions
                </TabsTrigger>
                <TabsTrigger value="intelligence" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-300 rounded-lg px-4">
                  <Database className="h-4 w-4 mr-2" />
                  Intelligence
                </TabsTrigger>
                <TabsTrigger value="scrape" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-300 rounded-lg px-4">
                  <Search className="h-4 w-4 mr-2" />
                  Web Scrape
                </TabsTrigger>
                <TabsTrigger value="settings" className="data-[state=active]:bg-muted rounded-lg px-4">
                  <Settings2 className="h-4 w-4" />
                </TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="h-[50vh]">
              {/* Social Tracking Tab */}
              <TabsContent value="social" className="p-4 space-y-4 mt-0">
                {/* Add New Social Account */}
                <div className="p-4 rounded-xl border bg-gradient-to-r from-pink-500/10 to-purple-500/10 border-pink-500/20">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Track Social Media Influencer / Channel
                  </h4>
                  <div className="flex gap-2 flex-wrap">
                    <Select value={socialPlatform} onValueChange={(v) => setSocialPlatform(v as typeof socialPlatform)}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="youtube">
                          <div className="flex items-center gap-2">
                            <Youtube className="h-4 w-4 text-red-500" />
                            YouTube
                          </div>
                        </SelectItem>
                        <SelectItem value="tiktok">
                          <div className="flex items-center gap-2">
                            <Video className="h-4 w-4" />
                            TikTok
                          </div>
                        </SelectItem>
                        <SelectItem value="facebook">
                          <div className="flex items-center gap-2">
                            <Facebook className="h-4 w-4 text-blue-600" />
                            Facebook
                          </div>
                        </SelectItem>
                        <SelectItem value="instagram">
                          <div className="flex items-center gap-2">
                            <Instagram className="h-4 w-4 text-pink-500" />
                            Instagram
                          </div>
                        </SelectItem>
                        <SelectItem value="twitter">
                          <div className="flex items-center gap-2">
                            <Twitter className="h-4 w-4 text-sky-500" />
                            Twitter/X
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder={`Enter ${socialPlatform} username or channel...`}
                      value={socialHandle}
                      onChange={(e) => setSocialHandle(e.target.value)}
                      className="flex-1 min-w-[200px]"
                    />
                    <Button 
                      onClick={handleTrackSocialAccount}
                      disabled={socialScrapeMutation.isPending || !socialHandle.trim() || !effectiveCompanyId}
                    >
                      {socialScrapeMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4 mr-2" />
                      )}
                      Track & Scrape
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Enter username without @ (e.g., "MrBeast" for YouTube, "charlidamelio" for TikTok)
                  </p>
                </div>

                {/* Tracked Accounts Grid */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Tracked Accounts ({trackedAccounts?.length || 0})
                    </h4>
                    <Button size="sm" variant="outline" onClick={() => refetchAccounts()}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {accountsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : trackedAccounts && trackedAccounts.length > 0 ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      {(trackedAccounts as any[]).map((account) => (
                        <div key={account.id} className="p-4 rounded-xl border bg-card hover:shadow-md transition-all">
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-full bg-muted">
                              {getPlatformIcon(account.platform)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h5 className="font-semibold truncate">{account.account_name || account.account_handle}</h5>
                                <Badge variant="outline" className="text-xs capitalize">{account.platform}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">@{account.account_handle}</p>
                              <div className="flex items-center gap-4 mt-2 text-sm">
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {formatFollowers(account.followers_count || 0)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Video className="h-3 w-3" />
                                  {account.posts_count || 0} posts
                                </span>
                              </div>
                              {account.last_scraped_at && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  <Clock className="h-3 w-3 inline mr-1" />
                                  Scraped {new Date(account.last_scraped_at).toLocaleString()}
                                </p>
                              )}
                            </div>
                            <a href={account.account_url} target="_blank" rel="noopener noreferrer" className="p-1 rounded hover:bg-muted">
                              <ExternalLink className="h-4 w-4 text-muted-foreground" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p>No accounts tracked yet. Add a TikToker, YouTuber, or Facebooker above!</p>
                    </div>
                  )}
                </div>

                {/* Recent Social Posts */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Recent Posts & Content
                    </h4>
                    <Button size="sm" variant="outline" onClick={() => refetchPosts()}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>

                  {postsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : socialPosts && socialPosts.length > 0 ? (
                    <div className="space-y-3">
                      {(socialPosts as any[]).slice(0, 10).map((post) => (
                        <div key={post.id} className="p-4 rounded-xl border bg-card hover:shadow-md transition-all">
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-full bg-muted shrink-0">
                              {getPlatformIcon(post.platform)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm">
                                  @{post.tracked_social_accounts?.account_handle}
                                </span>
                                <Badge variant="outline" className="text-xs capitalize">{post.platform}</Badge>
                                {post.sentiment_label && (
                                  <Badge className={`text-xs ${
                                    post.sentiment_label === 'positive' ? 'bg-emerald-500/20 text-emerald-400' :
                                    post.sentiment_label === 'negative' ? 'bg-red-500/20 text-red-400' :
                                    'bg-gray-500/20 text-gray-400'
                                  }`}>
                                    {post.sentiment_label}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-3">
                                {post.content?.substring(0, 300)}
                              </p>
                              
                              {/* Engagement metrics */}
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                {post.likes_count > 0 && (
                                  <span className="flex items-center gap-1">
                                    <Heart className="h-3 w-3" />
                                    {formatFollowers(post.likes_count)}
                                  </span>
                                )}
                                {post.comments_count > 0 && (
                                  <span className="flex items-center gap-1">
                                    <MessageCircle className="h-3 w-3" />
                                    {formatFollowers(post.comments_count)}
                                  </span>
                                )}
                                {post.shares_count > 0 && (
                                  <span className="flex items-center gap-1">
                                    <Share2 className="h-3 w-3" />
                                    {formatFollowers(post.shares_count)}
                                  </span>
                                )}
                                {post.views_count > 0 && (
                                  <span className="flex items-center gap-1">
                                    <Eye className="h-3 w-3" />
                                    {formatFollowers(post.views_count)}
                                  </span>
                                )}
                              </div>

                              {/* Hashtags */}
                              {post.hashtags?.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {post.hashtags.slice(0, 5).map((tag: string, i: number) => (
                                    <Badge key={i} variant="secondary" className="text-xs">#{tag}</Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            {post.post_url && (
                              <a href={post.post_url} target="_blank" rel="noopener noreferrer" className="p-1 rounded hover:bg-muted shrink-0">
                                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageCircle className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p>No posts scraped yet. Track an account to start collecting content!</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Predictions Tab */}
              <TabsContent value="predictions" className="p-4 space-y-4 mt-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-400" />
                    AI Predictions
                  </h3>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => analyzeMutation.mutate()}
                      disabled={analyzeMutation.isPending || !selectedProfileId}
                    >
                      {analyzeMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Brain className="h-4 w-4 mr-2" />}
                      Analyze
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => refetchPredictions()}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {predictionsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
                  </div>
                ) : predictions && predictions.length > 0 ? (
                  <div className="space-y-3">
                    {predictions.map((pred: any) => (
                      <div key={pred.id} className="p-4 rounded-xl border bg-card/50 hover:bg-card/80 transition-all duration-300">
                        <div className="flex items-start gap-4">
                          <div className={`p-2 rounded-lg ${
                            pred.prediction_type === "opportunity" 
                              ? "bg-emerald-500/20 text-emerald-400"
                              : pred.prediction_type === "risk"
                              ? "bg-red-500/20 text-red-400"
                              : "bg-purple-500/20 text-purple-400"
                          }`}>
                            {pred.trend === "up" ? <TrendingUp className="h-5 w-5" /> : 
                             pred.trend === "down" ? <TrendingDown className="h-5 w-5" /> : 
                             <Target className="h-5 w-5" />}
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between gap-4">
                              <h4 className="font-semibold">{pred.title}</h4>
                              <span className="text-2xl font-bold text-purple-400">{Math.round((pred.confidence || 0) * 100)}%</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{pred.description}</p>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                {pred.timeframe || 'Unknown'}
                              </Badge>
                              <Badge className={`text-xs ${getImpactBadge(pred.impact)}`}>
                                {(pred.impact || 'medium').toUpperCase()} IMPACT
                              </Badge>
                            </div>
                            <Progress value={(pred.confidence || 0) * 100} className="h-1.5 bg-purple-950/50" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No predictions yet. Select a profile and click Analyze.</p>
                  </div>
                )}
              </TabsContent>

              {/* Intelligence Tab */}
              <TabsContent value="intelligence" className="p-4 space-y-4 mt-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Intelligence Feed</h3>
                  <div className="flex items-center gap-2">
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="competitor">Competitor</SelectItem>
                        <SelectItem value="industry">Industry</SelectItem>
                        <SelectItem value="market">Market</SelectItem>
                        <SelectItem value="regulatory">Regulatory</SelectItem>
                        <SelectItem value="opportunity">Opportunity</SelectItem>
                        <SelectItem value="risk">Risk</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="sm" variant="outline" onClick={() => refetchIntelligence()}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {intelligenceLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : intelligence && intelligence.length > 0 ? (
                  <div className="space-y-4">
                    {intelligence.map((item: any) => (
                      <div key={item.id} className="p-4 rounded-xl border bg-card hover:shadow-lg transition-all duration-300">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex items-start gap-3 flex-1">
                            <div className={`p-2 rounded-lg ${getSentimentColor(item.sentiment_label)} bg-current/10`}>
                              <TrendingUp className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold line-clamp-2">{item.title}</h4>
                              <p className="text-sm text-muted-foreground mt-1">{item.summary || item.content?.substring(0, 200)}</p>
                            </div>
                          </div>
                          <a href={item.source_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-muted">
                            <ExternalLink className="h-5 w-5 text-muted-foreground" />
                          </a>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap mb-3">
                          <Badge variant="outline" className="text-xs">
                            <Globe className="h-3 w-3 mr-1" />
                            {item.source_domain}
                          </Badge>
                          <Badge className={`text-xs border ${getCategoryColor(item.category)}`}>
                            {item.category}
                          </Badge>
                          <Badge variant="outline" className={`text-xs ${getImpactBadge(item.relevance_score > 0.8 ? "high" : item.relevance_score > 0.5 ? "medium" : "low")}`}>
                            {Math.round((item.relevance_score || 0) * 100)}% Relevance
                          </Badge>
                          <span className="text-xs text-muted-foreground ml-auto">
                            {item.scraped_at && new Date(item.scraped_at).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Entities */}
                        {item.entities && Object.keys(item.entities).some(k => (item.entities[k] as string[])?.length > 0) && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 rounded-lg bg-muted/30">
                            {(item.entities.organizations as string[])?.length > 0 && (
                              <div className="space-y-1">
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Building2 className="h-3 w-3" />
                                  Organizations
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {(item.entities.organizations as string[]).slice(0, 2).map((org: string, i: number) => (
                                    <Badge key={i} variant="secondary" className="text-xs truncate max-w-[100px]">{org}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            {(item.entities.people as string[])?.length > 0 && (
                              <div className="space-y-1">
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <User className="h-3 w-3" />
                                  People
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {(item.entities.people as string[]).slice(0, 2).map((p: string, i: number) => (
                                    <Badge key={i} variant="secondary" className="text-xs truncate max-w-[100px]">{p}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            {(item.entities.locations as string[])?.length > 0 && (
                              <div className="space-y-1">
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <MapPin className="h-3 w-3" />
                                  Locations
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {(item.entities.locations as string[]).slice(0, 2).map((loc: string, i: number) => (
                                    <Badge key={i} variant="secondary" className="text-xs truncate max-w-[80px]">{loc}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            {(item.entities.topics as string[])?.length > 0 && (
                              <div className="space-y-1">
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Tag className="h-3 w-3" />
                                  Topics
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {(item.entities.topics as string[]).slice(0, 2).map((t: string, i: number) => (
                                    <Badge key={i} variant="secondary" className="text-xs truncate max-w-[80px]">{t}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Database className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No intelligence data yet. Use the Scrape tab to collect data.</p>
                  </div>
                )}
              </TabsContent>

              {/* Scrape Tab */}
              <TabsContent value="scrape" className="p-4 space-y-4 mt-0">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <h4 className="font-semibold">Search & Scrape</h4>
                    <Input
                      placeholder="Enter search query..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Button 
                      onClick={handleSearchScrape} 
                      disabled={scrapeMutation.isPending || !searchQuery.trim()}
                      className="w-full"
                    >
                      {scrapeMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                      Search Web
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-semibold">Scrape URLs</h4>
                    <Textarea
                      placeholder="Enter URLs (one per line)..."
                      value={searchUrls}
                      onChange={(e) => setSearchUrls(e.target.value)}
                      rows={3}
                    />
                    <Button 
                      onClick={handleScrapeUrls} 
                      disabled={scrapeMutation.isPending || !searchUrls.trim()}
                      className="w-full"
                    >
                      {scrapeMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                      Scrape URLs
                    </Button>
                  </div>
                </div>

                {!selectedProfileId && (
                  <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm">
                    <AlertTriangle className="h-4 w-4 inline mr-2" />
                    Select or create a monitoring profile first to save scraped data.
                  </div>
                )}
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="p-4 space-y-4 mt-0">
                <h3 className="font-semibold">Client Requirements</h3>
                {selectedProfileId ? (
                  <div className="space-y-4">
                    <div className="grid gap-3 md:grid-cols-3">
                      <Select value={newRequirement.requirement_type} onValueChange={(v) => setNewRequirement({ ...newRequirement, requirement_type: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="keyword">Keyword</SelectItem>
                          <SelectItem value="topic">Topic</SelectItem>
                          <SelectItem value="entity">Entity</SelectItem>
                          <SelectItem value="sentiment">Sentiment</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Requirement value..."
                        value={newRequirement.requirement_value}
                        onChange={(e) => setNewRequirement({ ...newRequirement, requirement_value: e.target.value })}
                      />
                      <div className="flex gap-2">
                        <Select value={newRequirement.priority} onValueChange={(v) => setNewRequirement({ ...newRequirement, priority: v })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button onClick={() => addRequirementMutation.mutate()} disabled={!newRequirement.requirement_value}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {requirements?.map((req: any) => (
                        <div key={req.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline">{req.requirement_type}</Badge>
                            <span>{req.requirement_value}</span>
                          </div>
                          <Badge className={getImpactBadge(req.priority)}>{req.priority}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Settings2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Select a monitoring profile to configure requirements</p>
                  </div>
                )}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
