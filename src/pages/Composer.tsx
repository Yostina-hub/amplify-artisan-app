import { useState } from "react";
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

export default function Composer() {
  const [content, setContent] = useState("");
  const [date, setDate] = useState<Date>();
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

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

  const handleSchedule = () => {
    if (!content.trim()) {
      toast.error("Please write some content first");
      return;
    }
    if (selectedPlatforms.length === 0) {
      toast.error("Please select at least one platform");
      return;
    }
    toast.success("Post scheduled successfully!");
    setContent("");
    setDate(undefined);
    setSelectedPlatforms([]);
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

          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Image className="h-4 w-4 mr-2" />
              Add Media
            </Button>
            <Button variant="outline" size="sm">
              <Smile className="h-4 w-4 mr-2" />
              Emoji
            </Button>
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
            >
              {date ? "Schedule Post" : "Publish Now"}
            </Button>
            <Button variant="outline">Save Draft</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
