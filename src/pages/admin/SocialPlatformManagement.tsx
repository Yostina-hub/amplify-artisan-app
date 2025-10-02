import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Save } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Platform {
  id: string;
  name: string;
  display_name: string;
  icon_name: string | null;
  oauth_authorize_url: string | null;
  oauth_token_url: string | null;
  oauth_scopes: string | null;
  api_base_url: string | null;
  requires_oauth: boolean;
  requires_api_key: boolean;
  is_active: boolean;
}

export default function SocialPlatformManagement() {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlatform, setEditingPlatform] = useState<Partial<Platform>>({
    name: "",
    display_name: "",
    icon_name: "",
    oauth_authorize_url: "",
    oauth_token_url: "",
    oauth_scopes: "",
    api_base_url: "",
    requires_oauth: true,
    requires_api_key: false,
    is_active: true,
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPlatforms();
  }, []);

  const fetchPlatforms = async () => {
    try {
      const { data, error } = await supabase
        .from("social_platforms")
        .select("*")
        .order("display_name");

      if (error) throw error;
      setPlatforms(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!editingPlatform.name || !editingPlatform.display_name) {
        toast({
          title: "Validation Error",
          description: "Name and Display Name are required",
          variant: "destructive",
        });
        return;
      }

      if (editingPlatform.id) {
        const { error } = await supabase
          .from("social_platforms")
          .update(editingPlatform)
          .eq("id", editingPlatform.id);

        if (error) throw error;
        toast({ title: "Platform updated successfully" });
      } else {
        const { error } = await supabase
          .from("social_platforms")
          .insert([editingPlatform as any]);

        if (error) throw error;
        toast({ title: "Platform added successfully" });
      }

      setIsDialogOpen(false);
      fetchPlatforms();
      resetForm();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this platform?")) return;

    try {
      const { error } = await supabase
        .from("social_platforms")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Platform deleted successfully" });
      fetchPlatforms();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (platform: Platform) => {
    try {
      const { error } = await supabase
        .from("social_platforms")
        .update({ is_active: !platform.is_active })
        .eq("id", platform.id);

      if (error) throw error;
      fetchPlatforms();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setEditingPlatform({
      name: "",
      display_name: "",
      icon_name: "",
      oauth_authorize_url: "",
      oauth_token_url: "",
      oauth_scopes: "",
      api_base_url: "",
      requires_oauth: true,
      requires_api_key: false,
      is_active: true,
    });
  };

  const openEditDialog = (platform?: Platform) => {
    if (platform) {
      setEditingPlatform(platform);
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Social Media Platform Management</h1>
          <p className="text-muted-foreground mt-2">
            Configure available social media platforms for user connections
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openEditDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Platform
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPlatform.id ? "Edit Platform" : "Add New Platform"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Platform Name (slug)</Label>
                  <Input
                    id="name"
                    value={editingPlatform.name}
                    onChange={(e) =>
                      setEditingPlatform({ ...editingPlatform, name: e.target.value })
                    }
                    placeholder="e.g., facebook"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="display_name">Display Name</Label>
                  <Input
                    id="display_name"
                    value={editingPlatform.display_name}
                    onChange={(e) =>
                      setEditingPlatform({ ...editingPlatform, display_name: e.target.value })
                    }
                    placeholder="e.g., Facebook"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="icon_name">Icon Name (Lucide)</Label>
                <Input
                  id="icon_name"
                  value={editingPlatform.icon_name || ""}
                  onChange={(e) =>
                    setEditingPlatform({ ...editingPlatform, icon_name: e.target.value })
                  }
                  placeholder="e.g., Facebook"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="oauth_authorize_url">OAuth Authorize URL</Label>
                <Input
                  id="oauth_authorize_url"
                  value={editingPlatform.oauth_authorize_url || ""}
                  onChange={(e) =>
                    setEditingPlatform({ ...editingPlatform, oauth_authorize_url: e.target.value })
                  }
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="oauth_token_url">OAuth Token URL</Label>
                <Input
                  id="oauth_token_url"
                  value={editingPlatform.oauth_token_url || ""}
                  onChange={(e) =>
                    setEditingPlatform({ ...editingPlatform, oauth_token_url: e.target.value })
                  }
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="oauth_scopes">OAuth Scopes</Label>
                <Input
                  id="oauth_scopes"
                  value={editingPlatform.oauth_scopes || ""}
                  onChange={(e) =>
                    setEditingPlatform({ ...editingPlatform, oauth_scopes: e.target.value })
                  }
                  placeholder="e.g., read_profile,publish_posts"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="api_base_url">API Base URL</Label>
                <Input
                  id="api_base_url"
                  value={editingPlatform.api_base_url || ""}
                  onChange={(e) =>
                    setEditingPlatform({ ...editingPlatform, api_base_url: e.target.value })
                  }
                  placeholder="https://api..."
                />
              </div>

              <div className="flex items-center space-x-8">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="requires_oauth"
                    checked={editingPlatform.requires_oauth}
                    onCheckedChange={(checked) =>
                      setEditingPlatform({ ...editingPlatform, requires_oauth: checked })
                    }
                  />
                  <Label htmlFor="requires_oauth">Requires OAuth</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="requires_api_key"
                    checked={editingPlatform.requires_api_key}
                    onCheckedChange={(checked) =>
                      setEditingPlatform({ ...editingPlatform, requires_api_key: checked })
                    }
                  />
                  <Label htmlFor="requires_api_key">Requires API Key</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={editingPlatform.is_active}
                    onCheckedChange={(checked) =>
                      setEditingPlatform({ ...editingPlatform, is_active: checked })
                    }
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
              </div>

              <Button onClick={handleSave} className="w-full">
                <Save className="mr-2 h-4 w-4" />
                Save Platform
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {platforms.map((platform) => (
          <Card key={platform.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{platform.display_name}</CardTitle>
                  <CardDescription>
                    {platform.name} • {platform.requires_oauth && "OAuth"}{" "}
                    {platform.requires_api_key && "API Key"}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={platform.is_active}
                    onCheckedChange={() => handleToggleActive(platform)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(platform)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(platform.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {platform.oauth_authorize_url && (
                  <div>
                    <span className="font-medium">Auth URL:</span>{" "}
                    <span className="text-muted-foreground truncate block">
                      {platform.oauth_authorize_url}
                    </span>
                  </div>
                )}
                {platform.api_base_url && (
                  <div>
                    <span className="font-medium">API URL:</span>{" "}
                    <span className="text-muted-foreground truncate block">
                      {platform.api_base_url}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
