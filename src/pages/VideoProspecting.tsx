import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Video,
  Play,
  Pause,
  Upload,
  Send,
  Link as LinkIcon,
  BarChart3,
  Eye,
  Clock,
  Download,
  Share2,
  MessageSquare,
  TrendingUp,
  Sparkles,
  Users,
  Mail,
  Copy,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { PageHelp } from "@/components/PageHelp";
import { toast } from "sonner";

interface VideoMessage {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  recipient: string;
  sentDate: string;
  status: "sent" | "viewed" | "replied";
  views: number;
  watchTime: string;
  engagement: number;
}

const mockVideos: VideoMessage[] = [
  {
    id: "1",
    title: "Product Demo for Acme Corp",
    thumbnail: "/api/placeholder/320/180",
    duration: "2:34",
    recipient: "sarah@acmecorp.com",
    sentDate: "2 days ago",
    status: "viewed",
    views: 3,
    watchTime: "85%",
    engagement: 85
  },
  {
    id: "2",
    title: "Follow-up: Q4 Implementation",
    thumbnail: "/api/placeholder/320/180",
    duration: "1:45",
    recipient: "michael@techstart.com",
    sentDate: "5 days ago",
    status: "replied",
    views: 2,
    watchTime: "100%",
    engagement: 95
  },
  {
    id: "3",
    title: "Cold Outreach: Sales Automation",
    thumbnail: "/api/placeholder/320/180",
    duration: "1:15",
    recipient: "lisa@globalsys.com",
    sentDate: "1 week ago",
    status: "sent",
    views: 0,
    watchTime: "0%",
    engagement: 0
  }
];

export default function VideoProspecting() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [selectedVideo, setSelectedVideo] = useState<VideoMessage | null>(null);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);

  const handleStartRecording = () => {
    setIsRecording(true);
    // Simulate recording
    const interval = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);

    setTimeout(() => {
      clearInterval(interval);
      setIsRecording(false);
      setRecordingTime(0);
      toast.success("Video recorded successfully!");
    }, 5000);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    setRecordingTime(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      sent: "bg-blue-100 text-blue-800 border-blue-300",
      viewed: "bg-yellow-100 text-yellow-800 border-yellow-300",
      replied: "bg-green-100 text-green-800 border-green-300"
    };
    return styles[status as keyof typeof styles];
  };

  return (
    <div className="space-y-6">
      <PageHelp
        title="Video Prospecting"
        description="Create and send personalized video messages to prospects and customers."
        features={[
          "Record custom video messages",
          "Screen recording with webcam",
          "One-click sharing via email or link",
          "View tracking and analytics",
          "Engagement metrics",
          "Video templates and scripts"
        ]}
        tips={[
          "Keep videos under 2 minutes",
          "Personalize with prospect's name",
          "Show your face for authenticity",
          "Include clear call-to-action",
          "Follow up on viewed videos quickly"
        ]}
      />

      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Video className="h-8 w-8 text-primary" />
          Video Prospecting
        </h2>
        <p className="text-muted-foreground">
          Stand out with personalized video messages
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Videos Sent</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">View Rate</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78%</div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <p className="text-xs text-green-600 font-medium">+12% vs last month</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Watch Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">82%</div>
            <p className="text-xs text-muted-foreground mt-1">Of video duration</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reply Rate</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45%</div>
            <p className="text-xs text-muted-foreground mt-1">Recipients replied</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recording Studio */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recording Studio</CardTitle>
            <CardDescription>Create your personalized video message</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="record">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="record">Record</TabsTrigger>
                <TabsTrigger value="upload">Upload</TabsTrigger>
                <TabsTrigger value="templates">Templates</TabsTrigger>
              </TabsList>

              <TabsContent value="record" className="space-y-4">
                <div className="aspect-video bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg flex items-center justify-center relative overflow-hidden">
                  {!isRecording ? (
                    <div className="text-center">
                      <Video className="h-16 w-16 mx-auto mb-4 text-gray-600" />
                      <p className="text-gray-400 mb-4">Click record to start your video</p>
                      <Button size="lg" onClick={handleStartRecording}>
                        <Play className="mr-2 h-5 w-5" />
                        Start Recording
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="w-4 h-4 bg-red-500 rounded-full mx-auto mb-4 animate-pulse" />
                      <p className="text-white mb-2">Recording...</p>
                      <p className="text-2xl font-mono text-white mb-4">{formatTime(recordingTime)}</p>
                      <Button variant="destructive" onClick={handleStopRecording}>
                        <Pause className="mr-2 h-4 w-4" />
                        Stop Recording
                      </Button>
                    </div>
                  )}

                  {/* Simulated webcam preview */}
                  {isRecording && (
                    <div className="absolute bottom-4 right-4 w-32 h-24 bg-gray-700 rounded-lg border-2 border-red-500 flex items-center justify-center">
                      <Users className="h-8 w-8 text-gray-500" />
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Recording Mode</Label>
                      <Select defaultValue="camera">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="camera">Camera Only</SelectItem>
                          <SelectItem value="screen">Screen Only</SelectItem>
                          <SelectItem value="both">Camera + Screen</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Video Quality</Label>
                      <Select defaultValue="hd">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sd">Standard (480p)</SelectItem>
                          <SelectItem value="hd">HD (720p)</SelectItem>
                          <SelectItem value="fhd">Full HD (1080p)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Sparkles className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-blue-900 mb-1">Pro Tip</h4>
                        <p className="text-sm text-blue-800">
                          Start with the prospect's name, mention a specific pain point, and end with a clear next step.
                          Keep it under 2 minutes for best engagement.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="upload" className="space-y-4">
                <div className="border-2 border-dashed rounded-lg p-12 text-center hover:border-primary transition-colors cursor-pointer">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium mb-2">Upload Video</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Drag and drop or click to browse
                  </p>
                  <Button>
                    <Upload className="mr-2 h-4 w-4" />
                    Choose File
                  </Button>
                  <p className="text-xs text-muted-foreground mt-4">
                    Supports MP4, MOV, AVI up to 500MB
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="templates" className="space-y-3">
                {[
                  { name: "Cold Outreach", duration: "1:30", description: "Introduction + value prop + CTA" },
                  { name: "Follow-up", duration: "1:00", description: "Reference previous conversation" },
                  { name: "Product Demo", duration: "2:30", description: "Feature walkthrough + benefits" },
                  { name: "Thank You", duration: "0:45", description: "Express gratitude + next steps" },
                  { name: "Re-engagement", duration: "1:15", description: "Check-in + new offer" }
                ].map((template, i) => (
                  <Card key={i} className="cursor-pointer hover:border-primary transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">{template.name}</h4>
                          <p className="text-sm text-muted-foreground">{template.description}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline">{template.duration}</Badge>
                          <Button size="sm" className="mt-2">
                            Use Template
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Send Video */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Send Video</CardTitle>
            <CardDescription>Share your video message</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Video Title</Label>
                <Input placeholder="Product Demo for..." />
              </div>

              <div className="space-y-2">
                <Label>Recipient Email</Label>
                <Input type="email" placeholder="prospect@company.com" />
              </div>

              <div className="space-y-2">
                <Label>Personal Message</Label>
                <Textarea
                  placeholder="Hi {{first_name}}, I recorded this quick video to show you..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Thumbnail</Label>
                <Select defaultValue="auto">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto-generate</SelectItem>
                    <SelectItem value="custom">Upload Custom</SelectItem>
                    <SelectItem value="frame">Choose Frame</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="track" className="rounded" defaultChecked />
                <Label htmlFor="track" className="text-sm cursor-pointer">
                  Track views and engagement
                </Label>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1">
                  <Send className="mr-2 h-4 w-4" />
                  Send via Email
                </Button>
                <Button variant="outline" onClick={() => setIsShareDialogOpen(true)}>
                  <LinkIcon className="h-4 w-4" />
                </Button>
              </div>

              <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Share Video Link</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Shareable Link</Label>
                      <div className="flex gap-2">
                        <Input value="https://video.crm.io/v/abc123" readOnly />
                        <Button
                          variant="outline"
                          onClick={() => {
                            navigator.clipboard.writeText("https://video.crm.io/v/abc123");
                            toast.success("Link copied to clipboard!");
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <Button variant="outline" className="w-full">
                        <Mail className="mr-2 h-4 w-4" />
                        Email
                      </Button>
                      <Button variant="outline" className="w-full">
                        <Share2 className="mr-2 h-4 w-4" />
                        LinkedIn
                      </Button>
                      <Button variant="outline" className="w-full">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        SMS
                      </Button>
                    </div>

                    <div className="p-3 bg-muted rounded-lg text-sm">
                      <p className="text-muted-foreground">
                        Anyone with this link can view your video. View tracking is enabled.
                      </p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Video Library */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Video Library</CardTitle>
              <CardDescription>Your sent video messages</CardDescription>
            </div>
            <Select defaultValue="recent">
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="views">Most Viewed</SelectItem>
                <SelectItem value="engagement">Highest Engagement</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {mockVideos.map((video) => (
              <Card key={video.id} className="overflow-hidden hover:border-primary transition-colors cursor-pointer">
                <div className="relative aspect-video bg-gray-900">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Play className="h-12 w-12 text-white opacity-80" />
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {video.duration}
                  </div>
                </div>
                <CardContent className="p-4">
                  <h4 className="font-semibold text-sm mb-2 truncate">{video.title}</h4>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span>To: {video.recipient}</span>
                      <Badge variant="outline" className={getStatusBadge(video.status)}>
                        {video.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {video.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {video.watchTime}
                        </span>
                      </div>
                      <span>{video.sentDate}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span>Engagement</span>
                        <span className="font-medium">{video.engagement}%</span>
                      </div>
                      <Progress value={video.engagement} className="h-1" />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline" className="flex-1">
                      <BarChart3 className="h-3 w-3 mr-1" />
                      Analytics
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Share2 className="h-3 w-3 mr-1" />
                      Share
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Best Practices */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Video Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {[
              { icon: CheckCircle2, title: "Keep it Short", desc: "1-2 minutes is ideal. Longer videos see 40% drop in completion." },
              { icon: Users, title: "Show Your Face", desc: "Videos with faces get 2x higher engagement than screen-only." },
              { icon: MessageSquare, title: "Personalize", desc: "Mention prospect's name and specific pain point early." },
              { icon: Target, title: "Clear CTA", desc: "End with specific next step: book meeting, reply, etc." },
              { icon: TrendingUp, title: "Follow Up", desc: "Reach out within 24 hours after they watch your video." },
              { icon: AlertCircle, title: "Test First", desc: "Send yourself a test to check audio, lighting, and message." }
            ].map((tip, i) => (
              <div key={i} className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                  <tip.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-1">{tip.title}</h4>
                  <p className="text-xs text-muted-foreground">{tip.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
