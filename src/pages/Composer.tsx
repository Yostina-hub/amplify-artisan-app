import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Image, Smile, Twitter, Instagram, Linkedin, Facebook, Youtube, MessageCircle, Pin, Camera, Send, Phone } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Composer() {
  const [content, setContent] = useState("");
  const [date, setDate] = useState<Date>();
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaLinks, setMediaLinks] = useState<string[]>([]);
  const [linkInput, setLinkInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast: showToast } = useToast();

  const platforms = [
    { id: "twitter", name: "Twitter", icon: Twitter, color: "text-[#1DA1F2]" },
    { id: "instagram", name: "Instagram", icon: Instagram, color: "text-[#E4405F]" },
    { id: "linkedin", name: "LinkedIn", icon: Linkedin, color: "text-[#0A66C2]" },
    { id: "facebook", name: "Facebook", icon: Facebook, color: "text-[#1877F2]" },
    { id: "youtube", name: "YouTube", icon: Youtube, color: "text-[#FF0000]" },
    { id: "tiktok", name: "TikTok", icon: MessageCircle, color: "text-foreground" },
    { id: "pinterest", name: "Pinterest", icon: Pin, color: "text-[#E60023]" },
    { id: "snapchat", name: "Snapchat", icon: Camera, color: "text-[#FFFC00]" },
    { id: "telegram", name: "Telegram", icon: Send, color: "text-[#0088cc]" },
    { id: "whatsapp", name: "WhatsApp", icon: Phone, color: "text-[#25D366]" },
  ];

  const handlePlatformToggle = (platformId: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId)
        ? prev.filter((id) => id !== platformId)
        : [...prev, platformId]
    );
  };

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setMediaFiles((prev) => [...prev, ...files]);
      toast.success(`${files.length} file(s) selected`);
    }
  };

  const handleRemoveMedia = (index: number) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddLink = () => {
    if (!linkInput.trim()) {
      toast.error("Please enter a valid link");
      return;
    }
    setMediaLinks((prev) => [...prev, linkInput.trim()]);
    setLinkInput("");
    toast.success("Link added");
  };

  const handleRemoveLink = (index: number) => {
    setMediaLinks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSchedule = async () => {
    if (!content.trim()) {
      toast.error("Please write some content first");
      return;
    }
    if (selectedPlatforms.length === 0) {
      toast.error("Please select at least one platform");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Get user's company_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      // Prepare media URLs: upload files + add external links
      const mediaUrls: Array<{ url: string; type: string }> = [];
      
      // Upload files to storage
      if (mediaFiles.length > 0) {
        for (const file of mediaFiles) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          const fileType = file.type.startsWith('video/') ? 'video' : 'photo';

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('post-media')
            .upload(fileName, file, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) {
            console.error('Upload error:', uploadError);
            throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
          }

          const { data: { publicUrl } } = supabase.storage
            .from('post-media')
            .getPublicUrl(fileName);

          mediaUrls.push({
            url: publicUrl,
            type: fileType
          });
        }
      }

      // Add external media links (including current input if not added yet)
      const pendingLink = linkInput?.trim() ? [linkInput.trim()] : [];
      const allLinks = [...mediaLinks, ...pendingLink];
      if (allLinks.length > 0) {
        for (const link of allLinks) {
          // Detect media type based on URL
          let type = 'link';
          if (link.includes('youtube.com') || link.includes('youtu.be')) {
            type = 'youtube';
          } else if (link.includes('vimeo.com')) {
            type = 'vimeo';
          } else if (link.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
            type = 'photo';
          } else if (link.match(/\.(mp4|mov|avi|webm)$/i)) {
            type = 'video';
          }

          mediaUrls.push({
            url: link,
            type
          });
        }
      }

      const { data: newPost, error } = await supabase
        .from('social_media_posts')
        .insert({
          content: content.trim(),
          platforms: selectedPlatforms,
          scheduled_at: date?.toISOString() || null,
          status: 'draft', // Start as draft
          user_id: user.id,
          company_id: profile?.company_id || null,
          media_urls: mediaUrls,
        })
        .select()
        .single();

      if (error) throw error;

      // Run AI moderation check in background (don't wait for it)
      if (newPost?.id) {
        supabase.functions.invoke('moderate-content', {
          body: {
            postId: newPost.id,
            content: content.trim(),
            platforms: selectedPlatforms
          }
        }).then(({ data: moderationData }) => {
          if (moderationData?.shouldFlag) {
            console.log('Post auto-flagged:', moderationData.flagReason);
          }
        }).catch(err => console.error('Auto-moderation error:', err));
      }

      showToast({
        title: "Post created",
        description: "Your post is pending review and will be published once approved",
      });

      setContent("");
      setDate(undefined);
      setSelectedPlatforms([]);
      setMediaFiles([]);
      setMediaLinks([]);
      setLinkInput("");
    } catch (error: any) {
      showToast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in-50 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Post Composer</h1>
        <p className="text-muted-foreground mt-1">
          Create and schedule your social media content
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Compose Your Post</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[200px] resize-none"
            />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{content.length} characters</span>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Media (Optional)</Label>
            <div className="space-y-3 p-4 border rounded-lg">
              <div className="flex gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleMediaSelect}
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Image className="h-4 w-4 mr-2" />
                  Upload Files
                </Button>
                <Button variant="outline" size="sm">
                  <Smile className="h-4 w-4 mr-2" />
                  Emoji
                </Button>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Or paste YouTube, Vimeo, or image link..."
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddLink())}
                  className="flex-1 px-3 py-2 text-sm border rounded-md"
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleAddLink}
                >
                  Add Link
                </Button>
              </div>

              {mediaFiles.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Uploaded Files:</p>
                  <div className="flex flex-wrap gap-2">
                    {mediaFiles.map((file, index) => (
                      <div key={index} className="relative">
                        <div className="px-3 py-2 bg-muted rounded-lg text-sm flex items-center gap-2">
                          <Image className="h-4 w-4" />
                          <span className="max-w-[150px] truncate">{file.name}</span>
                          <button
                            onClick={() => handleRemoveMedia(index)}
                            className="text-destructive hover:text-destructive/80"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {mediaLinks.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">External Links:</p>
                  <div className="flex flex-wrap gap-2">
                    {mediaLinks.map((link, index) => (
                      <div key={index} className="relative">
                        <div className="px-3 py-2 bg-primary/10 rounded-lg text-sm flex items-center gap-2">
                          <span className="max-w-[200px] truncate">{link}</span>
                          <button
                            onClick={() => handleRemoveLink(index)}
                            className="text-destructive hover:text-destructive/80"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Select Platforms</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {platforms.map((platform) => {
                const Icon = platform.icon;
                const isSelected = selectedPlatforms.includes(platform.id);
                return (
                  <div
                    key={platform.id}
                    className={`flex items-center space-x-3 p-4 border-2 rounded-xl transition-all cursor-pointer ${
                      isSelected 
                        ? 'border-primary bg-primary/5 shadow-md' 
                        : 'border-border hover:border-primary/50 hover:bg-muted/30'
                    }`}
                    onClick={() => handlePlatformToggle(platform.id)}
                  >
                    <Checkbox
                      id={platform.id}
                      checked={isSelected}
                      onCheckedChange={() => handlePlatformToggle(platform.id)}
                    />
                    <div className="flex items-center gap-2">
                      <Icon className={`w-5 h-5 ${platform.color}`} />
                      <label
                        htmlFor={platform.id}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {platform.name}
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Schedule Date (Optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleSchedule}
              className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90"
              disabled={loading}
            >
              {loading ? "Saving..." : (date ? "Schedule Post" : "Save Draft")}
            </Button>
            <Button variant="outline" onClick={() => {
              setContent("");
              setDate(undefined);
              setSelectedPlatforms([]);
              setMediaFiles([]);
              setMediaLinks([]);
              setLinkInput("");
            }}>Clear</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
