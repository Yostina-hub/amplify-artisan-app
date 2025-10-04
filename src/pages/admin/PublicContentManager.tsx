import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Layout, Plus, Edit, Trash2, Eye, Calendar } from "lucide-react";
import { format } from "date-fns";

interface PublicContent {
  id: string;
  section_key: string;
  content: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  scheduled_publish?: string;
}

export default function PublicContentManager() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<PublicContent | null>(null);
  const [sectionKey, setSectionKey] = useState("");
  const [contentData, setContentData] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [scheduledPublish, setScheduledPublish] = useState("");

  const { data: contentItems, isLoading } = useQuery({
    queryKey: ['public-content-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('landing_page_content')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as PublicContent[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('landing_page_content')
        .insert(data);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['public-content-all'] });
      toast.success("Content created successfully");
      resetForm();
    },
    onError: (error) => {
      toast.error("Failed to create content");
      console.error(error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase
        .from('landing_page_content')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['public-content-all'] });
      toast.success("Content updated successfully");
      resetForm();
    },
    onError: (error) => {
      toast.error("Failed to update content");
      console.error(error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('landing_page_content')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['public-content-all'] });
      toast.success("Content deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete content");
      console.error(error);
    },
  });

  const resetForm = () => {
    setDialogOpen(false);
    setEditingContent(null);
    setSectionKey("");
    setContentData("");
    setIsActive(true);
    setScheduledPublish("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let parsedContent;
    try {
      parsedContent = JSON.parse(contentData);
    } catch (error) {
      toast.error("Invalid JSON format");
      return;
    }

    const data = {
      section_key: sectionKey,
      content: parsedContent,
      is_active: isActive,
      scheduled_publish: scheduledPublish || null,
    };

    if (editingContent) {
      updateMutation.mutate({ id: editingContent.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (item: PublicContent) => {
    setEditingContent(item);
    setSectionKey(item.section_key);
    setContentData(JSON.stringify(item.content, null, 2));
    setIsActive(item.is_active);
    setScheduledPublish(item.scheduled_publish || "");
    setDialogOpen(true);
  };

  const sectionTypes = [
    "hero",
    "features",
    "testimonials",
    "pricing",
    "faq",
    "cta",
    "blog-post",
    "announcement",
    "custom"
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Layout className="h-8 w-8" />
            Public Content Manager
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage all public-facing content across your platform
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Content
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {contentItems?.map((item) => (
          <Card key={item.id} className={!item.is_active ? 'opacity-60' : ''}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{item.section_key}</CardTitle>
                  <CardDescription className="mt-1">
                    {item.is_active ? (
                      <span className="text-green-600 font-medium">Active</span>
                    ) : (
                      <span className="text-gray-500">Inactive</span>
                    )}
                    {item.scheduled_publish && (
                      <span className="ml-2 text-sm flex items-center gap-1 mt-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(item.scheduled_publish), 'MMM dd, yyyy')}
                      </span>
                    )}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(item)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this content?')) {
                      deleteMutation.mutate(item.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingContent ? 'Edit Content' : 'Create New Content'}
            </DialogTitle>
            <DialogDescription>
              Manage public-facing content for your platform
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="section">Section Type *</Label>
              <Select value={sectionKey} onValueChange={setSectionKey} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select section type" />
                </SelectTrigger>
                <SelectContent>
                  {sectionTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content (JSON) *</Label>
              <Textarea
                id="content"
                value={contentData}
                onChange={(e) => setContentData(e.target.value)}
                placeholder='{"title": "Welcome", "description": "..."}'
                rows={10}
                className="font-mono text-sm"
                required
              />
              <p className="text-xs text-muted-foreground">
                Enter valid JSON format
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduled">Schedule Publishing (Optional)</Label>
              <Input
                id="scheduled"
                type="datetime-local"
                value={scheduledPublish}
                onChange={(e) => setScheduledPublish(e.target.value)}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <Label htmlFor="active">Active</Label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button type="submit">
                {editingContent ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
