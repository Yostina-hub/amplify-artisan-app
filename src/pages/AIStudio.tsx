import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Image as ImageIcon, Copy, Check, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AIStudio() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [prompt, setPrompt] = useState('');
  const [platform, setPlatform] = useState('instagram');
  const [tone, setTone] = useState('professional');
  const [generateImages, setGenerateImages] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch generated content
  const { data: generatedContent, isLoading } = useQuery({
    queryKey: ['ai-generated-content'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_generated_content')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data;
    },
  });

  // Generate content mutation
  const generateMutation = useMutation({
    mutationFn: async (params: any) => {
      const { data, error } = await supabase.functions.invoke('generate-social-content', {
        body: params
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-generated-content'] });
      setPrompt('');
      toast({
        title: 'Content Generated!',
        description: 'Your AI-generated content is ready.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate content',
        variant: 'destructive',
      });
    },
  });

  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast({
        title: 'Prompt Required',
        description: 'Please enter a prompt for content generation',
        variant: 'destructive',
      });
      return;
    }

    generateMutation.mutate({
      platform,
      prompt,
      tone,
      generateImages,
    });
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({
      title: 'Copied!',
      description: 'Content copied to clipboard',
    });
  };

  const publishMutation = useMutation({
    mutationFn: async ({ contentId, platforms }: { contentId: string; platforms: string[] }) => {
      const { data, error } = await supabase.functions.invoke('publish-to-platform', {
        body: { contentId, platforms }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ai-generated-content'] });
      const successCount = data.results.filter((r: any) => r.success).length;
      toast({
        title: "Published!",
        description: `Successfully published to ${successCount} platform(s)`,
      });
    },
    onError: (error) => {
      toast({
        title: "Publishing failed",
        description: error instanceof Error ? error.message : "Failed to publish content",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-primary" />
              AI Content Studio
            </h1>
            <p className="text-muted-foreground mt-2">
              Generate engaging social media content powered by AI
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Generation Panel */}
          <Card>
            <CardHeader>
              <CardTitle>Generate Content</CardTitle>
              <CardDescription>
                Describe what you want to post, and AI will create it
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Platform</label>
                <Select value={platform} onValueChange={setPlatform}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="twitter">Twitter/X</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Tone</label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="funny">Funny</SelectItem>
                    <SelectItem value="inspirational">Inspirational</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  What do you want to post?
                </label>
                <Textarea
                  placeholder="E.g., A post about our new product launch with exciting features..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={6}
                  className="resize-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="generate-images"
                  checked={generateImages}
                  onChange={(e) => setGenerateImages(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="generate-images" className="text-sm flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Generate AI images too
                </label>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={generateMutation.isPending || !prompt.trim()}
                className="w-full"
                size="lg"
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Content
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Preview/History Panel */}
          <Card>
            <CardHeader>
              <CardTitle>Generated Content</CardTitle>
              <CardDescription>Your AI-generated posts</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="recent">
                <TabsList className="w-full">
                  <TabsTrigger value="recent" className="flex-1">Recent</TabsTrigger>
                  <TabsTrigger value="drafts" className="flex-1">Drafts</TabsTrigger>
                </TabsList>
                
                <TabsContent value="recent" className="space-y-4 mt-4">
                  {isLoading ? (
                    <div className="text-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                    </div>
                  ) : generatedContent && generatedContent.length > 0 ? (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto">
                      {generatedContent.map((content) => (
                        <Card key={content.id} className="p-4">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <Badge variant="secondary">{content.platform}</Badge>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(content.generated_text, content.id)}
                              >
                                {copiedId === content.id ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => publishMutation.mutate({ 
                                  contentId: content.id, 
                                  platforms: [content.platform] 
                                })}
                                disabled={publishMutation.isPending || content.status === 'published'}
                              >
                                {publishMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : content.status === 'published' ? (
                                  "Published"
                                ) : (
                                  "Publish"
                                )}
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{content.generated_text}</p>
                          {content.hashtags && Array.isArray(content.hashtags) && content.hashtags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {content.hashtags.map((tag: string, idx: number) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  #{tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                          {content.generated_images && Array.isArray(content.generated_images) && content.generated_images.length > 0 && (
                            <div className="mt-2 grid grid-cols-2 gap-2">
                              {content.generated_images.map((img: string, idx: number) => (
                                <img
                                  key={idx}
                                  src={img}
                                  alt={`Generated ${idx + 1}`}
                                  className="w-full rounded border"
                                />
                              ))}
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(content.created_at).toLocaleString()}
                          </p>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Sparkles className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No content generated yet</p>
                      <p className="text-sm">Start creating with AI!</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="drafts">
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Draft management coming soon</p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}