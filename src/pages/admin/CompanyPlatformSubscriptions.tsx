import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Check, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import * as Icons from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Company {
  id: string;
  name: string;
}

interface Platform {
  id: string;
  name: string;
  display_name: string;
  icon_name: string | null;
}

interface Subscription {
  id: string;
  platform_id: string;
  is_active: boolean;
}

export default function CompanyPlatformSubscriptions() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedCompanyId) {
      fetchSubscriptions(selectedCompanyId);
    }
  }, [selectedCompanyId]);

  const fetchData = async () => {
    try {
      const [companiesRes, platformsRes] = await Promise.all([
        supabase.from("companies").select("id, name").eq("status", "approved").order("name"),
        supabase.from("social_platforms").select("*").eq("is_active", true).order("display_name"),
      ]);

      if (companiesRes.error) throw companiesRes.error;
      if (platformsRes.error) throw platformsRes.error;

      setCompanies(companiesRes.data || []);
      setPlatforms(platformsRes.data || []);
    } catch (error: any) {
      toast({
        title: "Error loading data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptions = async (companyId: string) => {
    try {
      const { data, error } = await supabase
        .from("company_platform_subscriptions")
        .select("id, platform_id, is_active")
        .eq("company_id", companyId);

      if (error) throw error;
      setSubscriptions(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading subscriptions",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const isSubscribed = (platformId: string) => {
    return subscriptions.find((s) => s.platform_id === platformId && s.is_active);
  };

  const handleToggleSubscription = async (platformId: string, subscribe: boolean) => {
    if (!selectedCompanyId) return;

    try {
      const existing = subscriptions.find((s) => s.platform_id === platformId);

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from("company_platform_subscriptions")
          .update({ is_active: subscribe })
          .eq("id", existing.id);

        if (error) throw error;
      } else if (subscribe) {
        // Insert new
        const { error } = await supabase
          .from("company_platform_subscriptions")
          .insert([{
            company_id: selectedCompanyId,
            platform_id: platformId,
            is_active: true,
          }]);

        if (error) throw error;
      }

      toast({
        title: subscribe ? "Platform activated" : "Platform deactivated",
        description: `Successfully ${subscribe ? "added" : "removed"} platform access`,
      });

      fetchSubscriptions(selectedCompanyId);
    } catch (error: any) {
      toast({
        title: "Error updating subscription",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getPlatformIcon = (iconName: string | null) => {
    if (!iconName) return Icons.Circle;
    const Icon = (Icons as any)[iconName];
    return Icon || Icons.Circle;
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Company Platform Subscriptions</h1>
        <p className="text-muted-foreground mt-2">
          Manage which social media platforms each company has access to
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Company</CardTitle>
          <CardDescription>Choose a company to manage their platform subscriptions</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a company" />
            </SelectTrigger>
            <SelectContent>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedCompanyId && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {platforms.map((platform) => {
            const subscribed = isSubscribed(platform.id);
            const Icon = getPlatformIcon(platform.icon_name);

            return (
              <Card key={platform.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className="h-6 w-6" />
                      <div>
                        <CardTitle className="text-lg">{platform.display_name}</CardTitle>
                        <CardDescription className="text-xs">
                          {subscribed ? "Active" : "Not subscribed"}
                        </CardDescription>
                      </div>
                    </div>
                    {subscribed ? (
                      <Check className="h-5 w-5 text-green-500" />
                    ) : (
                      <X className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {subscribed ? "Subscribed" : "Not subscribed"}
                    </span>
                    <Switch
                      checked={!!subscribed}
                      onCheckedChange={(checked) =>
                        handleToggleSubscription(platform.id, checked)
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {!selectedCompanyId && (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">
              Select a company above to manage their platform subscriptions
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
