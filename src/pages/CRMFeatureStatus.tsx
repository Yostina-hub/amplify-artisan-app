import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingUp, Users, DollarSign, Target, Zap, Activity, ArrowUp, ArrowDown, Mic, MessageSquare, Clock, Award, AlertCircle, CheckCircle2, Phone, Mail, Calendar, FileText, BarChart3, Database, ShieldAlert, Megaphone, Package, Receipt, UserCheck, Workflow, LineChart, PieChart, TrendingDown, Share2, ThumbsUp, Eye, Hash, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TTSSettings } from "@/components/TTSSettings";

interface QueryData {
  type: string;
  data: any;
  visualization: string;
}

export default function CRMFeatureStatus() {
  const { toast } = useToast();
  const [isListening, setIsListening] = useState(false);
  const [aiInsight, setAiInsight] = useState("Analyzing real-time data...");
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [currentReportIndex, setCurrentReportIndex] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [queryData, setQueryData] = useState<QueryData | null>(null);
  const [realtimeMetrics, setRealtimeMetrics] = useState({
    revenue: 2847239,
    deals: 143,
    conversion: 67.8,
    engagement: 89.2
  });

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setRealtimeMetrics(prev => ({
        revenue: prev.revenue + Math.floor(Math.random() * 10000 - 5000),
        deals: prev.deals + Math.floor(Math.random() * 3 - 1),
        conversion: Math.min(100, Math.max(0, prev.conversion + (Math.random() * 2 - 1))),
        engagement: Math.min(100, Math.max(0, prev.engagement + (Math.random() * 1.5 - 0.75)))
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Simulate AI insights rotation
  useEffect(() => {
    const insights = [
      "🎯 Top performer: Sarah J. closed 3 deals worth $245K today",
      "⚠️ 5 high-value opportunities need follow-up within 24 hours",
      "📈 Conversion rate up 12% this week - maintaining momentum",
      "🔥 New lead from Fortune 500 company - immediate attention recommended",
      "💡 Best time to contact prospects: 10 AM - 12 PM (87% success rate)",
      "🎨 Email template 'Modern Approach' has 94% open rate",
      "⏰ 8 meetings scheduled for tomorrow - preparation reminder sent"
    ];
    
    let index = 0;
    const insightInterval = setInterval(() => {
      index = (index + 1) % insights.length;
      setAiInsight(insights[index]);
    }, 5000);

    return () => clearInterval(insightInterval);
  }, []);

  // System-wide reports data
  const systemReports = [
    {
      title: "Sales Pipeline Health",
      icon: TrendingUp,
      style: "gradient",
      data: [
        { label: "Hot Leads", value: "47", change: "+23%", color: "text-red-400" },
        { label: "Warm Prospects", value: "89", change: "+15%", color: "text-orange-400" },
        { label: "Qualified Leads", value: "156", change: "+8%", color: "text-yellow-400" },
        { label: "Conversion Rate", value: "34%", change: "+5%", color: "text-green-400" }
      ]
    },
    {
      title: "System Performance Metrics",
      icon: Database,
      style: "stats",
      data: [
        { label: "API Response Time", value: "45ms", status: "excellent" },
        { label: "Database Load", value: "67%", status: "good" },
        { label: "Active Sessions", value: "1,247", status: "high" },
        { label: "System Uptime", value: "99.98%", status: "excellent" }
      ]
    },
    {
      title: "Revenue Breakdown",
      icon: DollarSign,
      style: "chart",
      data: [
        { category: "Enterprise", amount: "$1.2M", percentage: 42 },
        { category: "Mid-Market", amount: "$890K", percentage: 31 },
        { category: "SMB", amount: "$520K", percentage: 18 },
        { category: "Recurring", amount: "$237K", percentage: 9 }
      ]
    },
    {
      title: "Critical Alerts & Actions",
      icon: ShieldAlert,
      style: "alerts",
      data: [
        { priority: "high", message: "5 contracts expiring in 7 days", action: "Review & Renew" },
        { priority: "medium", message: "3 payment failures detected", action: "Contact Clients" },
        { priority: "high", message: "System backup scheduled tonight", action: "Monitor" },
        { priority: "low", message: "Q4 forecast ready for review", action: "Schedule Meeting" }
      ]
    },
    {
      title: "Marketing Campaign ROI",
      icon: Megaphone,
      style: "performance",
      data: [
        { campaign: "Email Campaign Q4", roi: "340%", spent: "$45K", revenue: "$153K" },
        { campaign: "Social Media Ads", roi: "280%", spent: "$67K", revenue: "$188K" },
        { campaign: "Content Marketing", roi: "420%", spent: "$23K", revenue: "$97K" },
        { campaign: "PPC Google Ads", roi: "195%", spent: "$89K", revenue: "$174K" }
      ]
    },
    {
      title: "Inventory & Product Status",
      icon: Package,
      style: "inventory",
      data: [
        { product: "Premium Plan", stock: "Unlimited", sales: "342 units", trend: "up" },
        { product: "Enterprise Plan", stock: "Limited", sales: "89 units", trend: "up" },
        { product: "Starter Plan", stock: "Available", sales: "1,247 units", trend: "stable" },
        { product: "Add-on Services", stock: "Available", sales: "567 units", trend: "up" }
      ]
    },
    {
      title: "Customer Satisfaction Index",
      icon: UserCheck,
      style: "satisfaction",
      data: [
        { metric: "NPS Score", value: "72", benchmark: "68", status: "above" },
        { metric: "CSAT", value: "4.8/5", benchmark: "4.5/5", status: "above" },
        { metric: "Response Time", value: "2.3h", benchmark: "4h", status: "excellent" },
        { metric: "Resolution Rate", value: "94%", benchmark: "85%", status: "excellent" }
      ]
    },
    {
      title: "Workflow Automation Status",
      icon: Workflow,
      style: "automation",
      data: [
        { workflow: "Lead Qualification", runs: "1,234", success: "98%", saved: "45h" },
        { workflow: "Email Follow-ups", runs: "3,456", success: "96%", saved: "89h" },
        { workflow: "Invoice Generation", runs: "567", success: "100%", saved: "23h" },
        { workflow: "Report Distribution", runs: "234", success: "97%", saved: "12h" }
      ]
    }
  ];

  // Rotate reports every 5-8 seconds
  useEffect(() => {
    const randomInterval = Math.floor(Math.random() * 3000) + 5000; // 5-8 seconds
    const rotationTimer = setInterval(() => {
      setCurrentReportIndex((prev) => (prev + 1) % systemReports.length);
    }, randomInterval);

    return () => clearInterval(rotationTimer);
  }, []);

  const currentReport = systemReports[currentReportIndex];

  // Text-to-Speech via backend with client fallback
  const speakResponse = async (text: string) => {
    // Browser TTS fallback
    const speakWithWebAPI = () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        // Simple language hint: Amharic block detection
        const isAmharic = /[\u1200-\u137F]/.test(text);
        utterance.lang = isAmharic ? 'am-ET' : 'en-US';
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
        return true;
      }
      return false;
    };

    try {
      setIsSpeaking(true);
      console.log('Generating speech for:', text);
      
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text, voice: 'alloy' } // OpenAI voice (backend falls back to ElevenLabs if needed)
      });

      if (error) throw error;

      if (data?.audioContent) {
        const audioBlob = new Blob(
          [Uint8Array.from(atob(data.audioContent), c => c.charCodeAt(0))],
          { type: 'audio/mpeg' }
        );
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        audio.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
        };
        
        audio.onerror = () => setIsSpeaking(false);
        
        await audio.play();
      } else {
        // No audio returned – try client fallback
        const usedFallback = speakWithWebAPI();
        if (!usedFallback) {
          setIsSpeaking(false);
          toast({ title: 'Speech Error', description: 'No audio returned', variant: 'destructive' });
        }
      }
    } catch (error: any) {
      console.error('Speech error:', error);
      const msg = typeof error?.message === 'string' ? error.message : String(error);
      const isQuota = msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('payment required');
      const usedFallback = speakWithWebAPI();
      if (!usedFallback) {
        setIsSpeaking(false);
        toast({
          title: 'Speech Error',
          description: isQuota ? 'Speech service quota exceeded. Please add credits or switch provider (e.g., ElevenLabs).' : 'Could not generate speech',
          variant: 'destructive'
        });
      } else {
        toast({ title: 'Using device voice', description: 'Cloud TTS unavailable; using browser voice temporarily.' });
      }
    }
  };

  // Voice Recognition using OpenAI Whisper
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      
      // Stop recording after 5 seconds
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, 5000);
      
    } catch (error) {
      console.error('Recording error:', error);
      toast({
        title: "Microphone Error",
        description: "Could not access microphone",
        variant: "destructive"
      });
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        try {
          const base64Audio = (reader.result as string).split(',')[1];
          
          console.log('Transcribing audio...');
          const { data, error } = await supabase.functions.invoke('transcribe-audio', {
            body: { audio: base64Audio, language: 'am' }
          });

          if (error) throw error;

          if (data?.text) {
            const transcript = data.text;
            setVoiceTranscript(transcript);
            console.log('Transcription:', transcript);
            
            await processVoiceQuery(transcript);
          }
        } catch (err: any) {
          console.error('Transcription invoke error:', err);
          const msg = typeof err?.message === 'string' ? err.message : String(err);
          const isQuota = msg.toLowerCase().includes('quota');
          toast({
            title: 'Transcription Error',
            description: isQuota ? 'Speech service quota exceeded. Please add credits or switch provider.' : 'Could not transcribe audio',
            variant: 'destructive'
          });
        }
      };
    } catch (error) {
      console.error('Transcription error:', error);
      toast({
        title: "Transcription Error",
        description: "Could not transcribe audio",
        variant: "destructive"
      });
    }
  };

  const processVoiceQuery = async (transcript: string) => {
    try {
      console.log('Processing voice query:', transcript);
      
      const { data, error } = await supabase.functions.invoke('process-voice-query', {
        body: { transcript }
      });

      if (error) throw error;

      const aiGeneratedResponse = data?.response;
      
      if (!aiGeneratedResponse) {
        throw new Error('No response from AI');
      }

      console.log('AI Response:', aiGeneratedResponse);
      setAiResponse(aiGeneratedResponse);
      await speakResponse(aiGeneratedResponse);
      
    } catch (error) {
      console.error('Query processing error:', error);
      const fallbackResponse = "I'm having trouble processing that request. Could you please try again?";
      setAiResponse(fallbackResponse);
      await speakResponse(fallbackResponse);
    }
  };

  const toggleVoice = async () => {
    if (!isListening) {
      setIsListening(true);
      setVoiceTranscript("");
      setAiResponse("");
      
      const welcomeMessage = "Hello, I'm your AI executive assistant. I support Amharic and many other languages. How can I help you today?";
      setAiResponse(welcomeMessage);
      await speakResponse(welcomeMessage);
      
      toast({
        title: "AI Assistant Active",
        description: "Speak in Amharic or any language",
      });
      
      // Start recording
      await startRecording();
    } else {
      setIsListening(false);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      setIsSpeaking(false);
    }
  };

  const executiveMetrics = [
    {
      title: "Revenue Pipeline",
      value: `$${(realtimeMetrics.revenue / 1000000).toFixed(2)}M`,
      change: "+12.5%",
      trend: "up",
      icon: DollarSign,
      color: "from-emerald-500 to-green-600",
      glowColor: "emerald"
    },
    {
      title: "Active Deals",
      value: realtimeMetrics.deals,
      change: "+8",
      trend: "up",
      icon: Target,
      color: "from-blue-500 to-indigo-600",
      glowColor: "blue"
    },
    {
      title: "Win Rate",
      value: `${realtimeMetrics.conversion.toFixed(1)}%`,
      change: "+5.2%",
      trend: "up",
      icon: TrendingUp,
      color: "from-purple-500 to-pink-600",
      glowColor: "purple"
    },
    {
      title: "Team Engagement",
      value: `${realtimeMetrics.engagement.toFixed(1)}%`,
      change: "+3.1%",
      trend: "up",
      icon: Users,
      color: "from-orange-500 to-red-600",
      glowColor: "orange"
    }
  ];

  const liveActivities = [
    { user: "Sarah J.", action: "closed deal with", client: "TechCorp Inc", value: "$125K", time: "2m ago", icon: CheckCircle2, color: "text-green-500" },
    { user: "Mike R.", action: "scheduled meeting with", client: "Global Systems", value: "Tomorrow", time: "5m ago", icon: Calendar, color: "text-blue-500" },
    { user: "Emma L.", action: "sent proposal to", client: "Innovation Labs", value: "$89K", time: "8m ago", icon: FileText, color: "text-purple-500" },
    { user: "David K.", action: "called prospect", client: "Future Dynamics", value: "Follow-up", time: "12m ago", icon: Phone, color: "text-orange-500" },
    { user: "Lisa M.", action: "emailed", client: "Smart Solutions", value: "Demo Request", time: "15m ago", icon: Mail, color: "text-pink-500" }
  ];

  const aiPredictions = [
    { title: "Hot Lead Alert", desc: "Enterprise Corp shows 94% conversion probability", priority: "critical", icon: Zap },
    { title: "Churn Risk", desc: "Client ABC may churn - proactive outreach suggested", priority: "high", icon: AlertCircle },
    { title: "Upsell Opportunity", desc: "5 accounts ready for premium upgrade", priority: "medium", icon: TrendingUp },
    { title: "Performance Insight", desc: "Q4 projected to exceed target by 23%", priority: "low", icon: Award }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-950 text-white relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-r from-purple-600/30 via-pink-600/30 to-purple-600/30 rounded-full blur-[150px] animate-glow-pulse" />
        <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-gradient-to-r from-blue-600/30 via-cyan-600/30 to-blue-600/30 rounded-full blur-[150px] animate-glow-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-1/4 left-1/3 w-[600px] h-[600px] bg-gradient-to-r from-emerald-600/30 via-green-600/30 to-emerald-600/30 rounded-full blur-[150px] animate-glow-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 right-1/3 w-[600px] h-[600px] bg-gradient-to-r from-orange-600/25 via-red-600/25 to-orange-600/25 rounded-full blur-[150px] animate-glow-pulse" style={{ animationDelay: '3s' }} />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/50" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto p-6 space-y-6">
        {/* Revolutionary Header */}
        <div className="relative overflow-hidden rounded-3xl p-12 bg-gradient-to-br from-purple-900/60 via-blue-900/60 to-emerald-900/60 backdrop-blur-2xl border-2 border-white/20 shadow-[0_0_80px_rgba(168,85,247,0.4)] animate-fade-in">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.15),transparent_60%)]" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-500/50 via-pink-500/50 to-transparent rounded-full blur-3xl animate-glow-pulse" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-500/50 via-cyan-500/50 to-transparent rounded-full blur-3xl animate-glow-pulse" style={{ animationDelay: '1s' }} />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3 animate-slide-up">
                  <div className="relative">
                    <Brain className="h-12 w-12 text-purple-400 animate-float" />
                    <div className="absolute inset-0 bg-purple-500/50 blur-xl animate-pulse" />
                  </div>
                  <div>
                    <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-blue-400 to-emerald-400 animate-scale-in">
                      Executive Command Center
                    </h1>
                    <p className="text-white/70 text-lg mt-1">AI-Powered Real-Time Intelligence</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      size="lg"
                      variant="outline"
                      className="bg-gradient-to-r from-slate-500/20 to-slate-600/20 hover:from-slate-500/30 hover:to-slate-600/30 border-white/20"
                    >
                      <Settings className="mr-2 h-5 w-5" />
                      TTS Settings
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Text-to-Speech Settings</DialogTitle>
                    </DialogHeader>
                    <TTSSettings />
                  </DialogContent>
                </Dialog>

                <Button
                  onClick={toggleVoice}
                  size="lg"
                  className={`relative overflow-hidden transition-all duration-500 ${
                    isListening 
                      ? 'bg-gradient-to-r from-red-500 to-pink-600 shadow-[0_0_30px_rgba(239,68,68,0.6)] scale-110' 
                      : 'bg-gradient-to-r from-purple-500 to-blue-600 hover:shadow-[0_0_30px_rgba(147,51,234,0.6)]'
                  }`}
                >
                  <Mic className={`mr-2 h-5 w-5 ${isListening ? 'animate-pulse' : ''}`} />
                  {isListening ? 'Listening...' : 'Voice Command'}
                  {isListening && (
                    <div className="absolute inset-0 bg-white/30 animate-shimmer" />
                  )}
                </Button>
                
                {isSpeaking && (
                  <Badge className="bg-blue-500/50 text-white font-bold animate-pulse border-2 border-blue-300/50 shadow-[0_0_20px_rgba(59,130,246,0.8)]">
                    <MessageSquare className="h-4 w-4 mr-1" />
                    AI Speaking
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Query Data Visualization */}
        {queryData && (
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-600/40 via-blue-600/40 to-purple-600/40 backdrop-blur-xl border-2 border-white/30 p-6 animate-scale-in shadow-[0_0_50px_rgba(34,211,238,0.6)] mt-4">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_70%)]" />
                
                <div className="relative z-10">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <BarChart3 className="h-6 w-6 text-cyan-300 animate-float" />
                    {queryData.type === 'social' && 'Social Media Metrics'}
                    {queryData.type === 'revenue' && 'Revenue Breakdown'}
                    {queryData.type === 'customer' && 'Customer Intelligence'}
                    {queryData.type === 'deals' && 'Sales Pipeline'}
                    {queryData.type === 'team' && 'Team Performance'}
                    {queryData.type === 'marketing' && 'Marketing ROI'}
                    {queryData.type === 'system' && 'System Health'}
                    {queryData.type === 'analytics' && 'Key Metrics'}
                    {queryData.type === 'risk' && 'Risk Management'}
                    {queryData.type === 'products' && 'Product Analytics'}
                    {queryData.type === 'overview' && 'Executive Overview'}
                  </h3>

                  {/* Social Media Visualization */}
                  {queryData.type === 'social' && (
                    <div className="grid grid-cols-2 gap-4">
                      {queryData.data.map((platform: any, i: number) => (
                        <div key={i} className="p-4 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border-2 border-white/20 hover:scale-105 transition-all duration-300">
                          <div className="flex items-center gap-2 mb-3">
                            <Share2 className="h-5 w-5 text-cyan-300" />
                            <span className="text-white font-bold">{platform.platform}</span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-white/70">Followers</span>
                              <span className="text-white font-bold">{platform.followers}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-white/70">Engagement</span>
                              <span className="text-emerald-300 font-bold">{platform.engagement}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-white/70">Posts</span>
                              <span className="text-blue-300 font-bold">{platform.posts}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Revenue Visualization */}
                  {queryData.type === 'revenue' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="p-4 rounded-xl bg-emerald-500/20 border-2 border-emerald-400/50">
                          <p className="text-xs text-white/70 mb-1">Total Revenue</p>
                          <p className="text-3xl font-bold text-white">{queryData.data.total}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-blue-500/20 border-2 border-blue-400/50">
                          <p className="text-xs text-white/70 mb-1">Growth</p>
                          <p className="text-3xl font-bold text-emerald-300">{queryData.data.growth}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-purple-500/20 border-2 border-purple-400/50">
                          <p className="text-xs text-white/70 mb-1">MRR</p>
                          <p className="text-3xl font-bold text-white">{queryData.data.mrr}</p>
                        </div>
                      </div>
                      {queryData.data.segments.map((segment: any, i: number) => (
                        <div key={i} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-white font-semibold">{segment.name}</span>
                            <span className="text-white/70">${(segment.value / 1000).toFixed(0)}K ({segment.percentage}%)</span>
                          </div>
                          <Progress value={segment.percentage} className="h-3 bg-white/10" />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Customer Metrics */}
                  {queryData.type === 'customer' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-green-500/20 border-2 border-green-400/50">
                        <UserCheck className="h-6 w-6 text-green-300 mb-2" />
                        <p className="text-xs text-white/70">Satisfaction</p>
                        <p className="text-3xl font-bold text-white">{queryData.data.satisfaction}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-blue-500/20 border-2 border-blue-400/50">
                        <Award className="h-6 w-6 text-blue-300 mb-2" />
                        <p className="text-xs text-white/70">NPS Score</p>
                        <p className="text-3xl font-bold text-white">{queryData.data.nps}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-purple-500/20 border-2 border-purple-400/50">
                        <CheckCircle2 className="h-6 w-6 text-purple-300 mb-2" />
                        <p className="text-xs text-white/70">Tickets Resolved</p>
                        <p className="text-3xl font-bold text-white">{queryData.data.tickets}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-cyan-500/20 border-2 border-cyan-400/50">
                        <Clock className="h-6 w-6 text-cyan-300 mb-2" />
                        <p className="text-xs text-white/70">Response Time</p>
                        <p className="text-3xl font-bold text-white">{queryData.data.responseTime}</p>
                      </div>
                    </div>
                  )}

                  {/* Other visualizations can be added similarly */}
                  {(queryData.type === 'deals' || queryData.type === 'team' || queryData.type === 'marketing') && (
                    <div className="p-6 rounded-xl bg-white/5 border border-white/20">
                      <p className="text-white text-center">📊 Detailed {queryData.type} analytics displayed</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* AI Insight Banner */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600/40 via-blue-600/40 to-emerald-600/40 backdrop-blur-xl border-2 border-white/30 p-5 animate-slide-up shadow-[0_0_40px_rgba(59,130,246,0.5)]">
              <div className="absolute inset-0 animate-shimmer" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)', backgroundSize: '200% 100%' }} />
              <div className="flex items-center gap-3 relative z-10">
                <Activity className="h-6 w-6 text-emerald-300 animate-pulse drop-shadow-[0_0_10px_rgba(110,231,183,0.8)]" />
                <p className="text-white text-sm font-semibold drop-shadow-lg">{aiInsight}</p>
                <Badge className="ml-auto bg-emerald-500/40 text-emerald-100 border-2 border-emerald-300/50 font-bold shadow-[0_0_20px_rgba(16,185,129,0.6)] animate-pulse">
                  LIVE
                </Badge>
              </div>
            </div>

            {/* Voice Interaction Display */}
            {(voiceTranscript || aiResponse) && (
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600/40 via-purple-600/40 to-pink-600/40 backdrop-blur-xl border-2 border-white/30 p-6 animate-scale-in shadow-[0_0_50px_rgba(168,85,247,0.6)] mt-4">
                <div className="space-y-4">
                  {voiceTranscript && (
                    <div className="relative">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-xl bg-blue-500/30 border border-blue-400/50">
                          <Mic className="h-5 w-5 text-blue-300 animate-pulse" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-white/60 font-semibold mb-1">You said:</p>
                          <p className="text-white font-medium drop-shadow-lg">{voiceTranscript}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  {aiResponse && (
                    <div className="relative">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-xl bg-purple-500/30 border border-purple-400/50 ${isSpeaking ? 'animate-pulse' : ''}`}>
                          <Brain className="h-5 w-5 text-purple-300 animate-float" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-xs text-white/60 font-semibold">AI Response:</p>
                            {isSpeaking && (
                              <div className="flex items-center gap-1">
                                <div className="w-1 h-3 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                                <div className="w-1 h-4 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                                <div className="w-1 h-3 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                              </div>
                            )}
                          </div>
                          <p className="text-white font-medium drop-shadow-lg">{aiResponse}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

        {/* Real-Time Metrics Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {executiveMetrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <div
                key={index}
                className="relative group animate-scale-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${metric.color} opacity-0 group-hover:opacity-50 transition-opacity duration-500 blur-2xl`} />
                <Card className="relative overflow-hidden bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border-2 border-white/30 hover:border-white/60 transition-all duration-500 hover:scale-105 shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:shadow-[0_0_60px_rgba(168,85,247,0.6)]">
                  <div className={`absolute inset-0 bg-gradient-to-br ${metric.color} opacity-20 group-hover:opacity-40 transition-opacity duration-500`} />
                  <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-white/20 to-transparent rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
                  
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-semibold text-white/90 drop-shadow-lg">{metric.title}</CardTitle>
                    <div className={`p-4 rounded-2xl bg-gradient-to-br ${metric.color} shadow-[0_0_30px_rgba(168,85,247,0.5)] group-hover:scale-125 group-hover:rotate-12 transition-all duration-500`}>
                      <Icon className="h-6 w-6 text-white animate-float drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-4xl font-bold text-white mb-2 group-hover:scale-110 transition-transform duration-300 drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]">
                      {metric.value}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`${metric.trend === 'up' ? 'bg-green-500/40 text-green-200 border-2 border-green-400/50 shadow-[0_0_15px_rgba(34,197,94,0.6)]' : 'bg-red-500/40 text-red-200 border-2 border-red-400/50 shadow-[0_0_15px_rgba(239,68,68,0.6)]'} font-semibold`}>
                        {metric.trend === 'up' ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
                        {metric.change}
                      </Badge>
                      <span className="text-xs text-white/70 font-medium">vs last period</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>

        {/* System-Wide Executive Report - Auto Rotating */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border-2 border-white/30 animate-fade-in shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:shadow-[0_0_60px_rgba(168,85,247,0.6)] transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/20 to-blue-600/20" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-cyan-500/30 to-transparent rounded-full blur-3xl animate-glow-pulse" />
          
          <CardHeader className="relative z-10">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-white drop-shadow-lg">
                <currentReport.icon className="h-7 w-7 text-cyan-300 animate-float drop-shadow-[0_0_12px_rgba(103,232,249,0.8)]" />
                <span className="font-bold text-xl">{currentReport.title}</span>
              </CardTitle>
              <Badge className="bg-cyan-500/40 text-cyan-100 border-2 border-cyan-300/50 font-bold shadow-[0_0_20px_rgba(34,211,238,0.6)] animate-pulse">
                LIVE REPORT {currentReportIndex + 1}/{systemReports.length}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="relative z-10">
            {currentReport.style === 'gradient' && (
              <div className="grid grid-cols-2 gap-4">
                {currentReport.data.map((item: any, i: number) => (
                  <div key={i} className="p-4 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border-2 border-white/20 hover:border-cyan-400/50 transition-all duration-300 animate-scale-in" style={{ animationDelay: `${i * 100}ms` }}>
                    <p className="text-xs text-white/70 font-semibold mb-2">{item.label}</p>
                    <p className={`text-3xl font-bold ${item.color} drop-shadow-[0_0_15px_currentColor] mb-1`}>{item.value}</p>
                    <p className="text-xs text-emerald-300 font-bold">{item.change}</p>
                  </div>
                ))}
              </div>
            )}

            {currentReport.style === 'stats' && (
              <div className="space-y-3">
                {currentReport.data.map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-white/10 to-white/5 border-2 border-white/20 hover:border-white/40 transition-all duration-300 animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                    <span className="text-white/90 font-semibold">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold text-lg drop-shadow-lg">{item.value}</span>
                      <Badge className={`${item.status === 'excellent' ? 'bg-green-500/40 border-green-400/50 text-green-200' : item.status === 'good' ? 'bg-blue-500/40 border-blue-400/50 text-blue-200' : 'bg-orange-500/40 border-orange-400/50 text-orange-200'} border-2 font-bold`}>
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {currentReport.style === 'chart' && (
              <div className="space-y-4">
                {currentReport.data.map((item: any, i: number) => (
                  <div key={i} className="space-y-2 animate-scale-in" style={{ animationDelay: `${i * 100}ms` }}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/90 font-semibold">{item.category}</span>
                      <span className="text-white font-bold drop-shadow-lg">{item.amount}</span>
                    </div>
                    <div className="relative h-3 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full shadow-[0_0_20px_rgba(34,211,238,0.6)] transition-all duration-1000"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {currentReport.style === 'alerts' && (
              <div className="space-y-3">
                {currentReport.data.map((item: any, i: number) => (
                  <div key={i} className={`p-4 rounded-xl border-2 backdrop-blur-sm animate-slide-up transition-all duration-300 hover:scale-105 cursor-pointer ${
                    item.priority === 'high' ? 'bg-gradient-to-r from-red-600/30 to-pink-600/30 border-red-400/50 shadow-[0_0_20px_rgba(239,68,68,0.4)]' :
                    item.priority === 'medium' ? 'bg-gradient-to-r from-orange-600/30 to-yellow-600/30 border-orange-400/50 shadow-[0_0_20px_rgba(249,115,22,0.4)]' :
                    'bg-gradient-to-r from-blue-600/30 to-cyan-600/30 border-blue-400/50 shadow-[0_0_20px_rgba(59,130,246,0.4)]'
                  }`} style={{ animationDelay: `${i * 100}ms` }}>
                    <div className="flex items-start gap-3">
                      <AlertCircle className={`h-5 w-5 mt-0.5 ${item.priority === 'high' ? 'text-red-300' : item.priority === 'medium' ? 'text-orange-300' : 'text-blue-300'} drop-shadow-[0_0_8px_currentColor]`} />
                      <div className="flex-1">
                        <p className="text-white font-semibold mb-1 drop-shadow-lg">{item.message}</p>
                        <p className="text-xs text-white/70 font-medium">Action: {item.action}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {currentReport.style === 'performance' && (
              <div className="space-y-3">
                {currentReport.data.map((item: any, i: number) => (
                  <div key={i} className="p-4 rounded-xl bg-gradient-to-r from-white/10 to-white/5 border-2 border-white/20 hover:border-emerald-400/50 transition-all duration-300 animate-scale-in" style={{ animationDelay: `${i * 100}ms` }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-semibold">{item.campaign}</span>
                      <Badge className="bg-emerald-500/40 text-emerald-200 border-2 border-emerald-400/50 font-bold shadow-[0_0_15px_rgba(16,185,129,0.6)]">
                        ROI: {item.roi}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/70">Spent: <span className="text-white font-bold">{item.spent}</span></span>
                      <span className="text-white/70">Revenue: <span className="text-emerald-300 font-bold drop-shadow-[0_0_8px_rgba(110,231,183,0.6)]">{item.revenue}</span></span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {currentReport.style === 'inventory' && (
              <div className="space-y-3">
                {currentReport.data.map((item: any, i: number) => (
                  <div key={i} className="p-4 rounded-xl bg-gradient-to-r from-white/10 to-white/5 border-2 border-white/20 hover:border-purple-400/50 transition-all duration-300 animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-semibold">{item.product}</span>
                      {item.trend === 'up' ? <TrendingUp className="h-5 w-5 text-emerald-400 drop-shadow-[0_0_8px_rgba(110,231,183,0.6)]" /> : <Activity className="h-5 w-5 text-blue-400" />}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/70">Stock: <span className="text-white font-bold">{item.stock}</span></span>
                      <span className="text-white/70">Sales: <span className="text-purple-300 font-bold">{item.sales}</span></span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {currentReport.style === 'satisfaction' && (
              <div className="grid grid-cols-2 gap-4">
                {currentReport.data.map((item: any, i: number) => (
                  <div key={i} className="p-4 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border-2 border-white/20 hover:border-green-400/50 transition-all duration-300 animate-scale-in" style={{ animationDelay: `${i * 100}ms` }}>
                    <p className="text-xs text-white/70 font-semibold mb-2">{item.metric}</p>
                    <p className="text-2xl font-bold text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] mb-1">{item.value}</p>
                    <div className="flex items-center gap-1">
                      {item.status === 'excellent' || item.status === 'above' ? (
                        <ArrowUp className="h-3 w-3 text-green-400" />
                      ) : null}
                      <p className="text-xs text-green-300 font-bold">vs {item.benchmark}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {currentReport.style === 'automation' && (
              <div className="space-y-3">
                {currentReport.data.map((item: any, i: number) => (
                  <div key={i} className="p-4 rounded-xl bg-gradient-to-r from-white/10 to-white/5 border-2 border-white/20 hover:border-indigo-400/50 transition-all duration-300 animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-semibold">{item.workflow}</span>
                      <Badge className="bg-indigo-500/40 text-indigo-200 border-2 border-indigo-400/50 font-bold">
                        {item.success}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/70">Runs: <span className="text-white font-bold">{item.runs}</span></span>
                      <span className="text-white/70">Saved: <span className="text-indigo-300 font-bold">{item.saved}</span></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Live Activity Feed */}
          <Card className="lg:col-span-2 relative overflow-hidden bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border-2 border-white/30 animate-fade-in shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20" />
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-2 text-white drop-shadow-lg">
                <Activity className="h-6 w-6 text-blue-300 animate-pulse drop-shadow-[0_0_10px_rgba(96,165,250,0.8)]" />
                <span className="font-bold">Live Activity Stream</span>
                <Badge className="ml-auto bg-red-500/50 text-white font-bold animate-pulse border-2 border-red-300/50 shadow-[0_0_20px_rgba(239,68,68,0.8)]">REAL-TIME</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 relative z-10">
              {liveActivities.map((activity, i) => {
                const Icon = activity.icon;
                return (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl border-2 border-white/20 hover:border-white/40 hover:bg-white/15 transition-all duration-500 group cursor-pointer animate-slide-up shadow-[0_4px_16px_rgba(0,0,0,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.4)]"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="relative">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br from-white/20 to-white/10 flex items-center justify-center group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 shadow-lg`}>
                        <Icon className={`w-7 h-7 ${activity.color} drop-shadow-[0_0_8px_currentColor]`} />
                      </div>
                      <div className={`absolute inset-0 ${activity.color} opacity-60 blur-xl group-hover:blur-2xl transition-all duration-500`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white drop-shadow-lg">
                        <span className="text-blue-300">{activity.user}</span> {activity.action} <span className="text-purple-300">{activity.client}</span>
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-emerald-300 font-bold drop-shadow-[0_0_8px_rgba(110,231,183,0.6)]">{activity.value}</span>
                        <span className="text-xs text-white/50">•</span>
                        <span className="text-xs text-white/60 font-medium">{activity.time}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* AI Predictions Panel */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border-2 border-white/30 animate-fade-in shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-pink-600/20" />
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-2 text-white drop-shadow-lg">
                <Brain className="h-6 w-6 text-purple-300 animate-float drop-shadow-[0_0_10px_rgba(216,180,254,0.8)]" />
                <span className="font-bold">AI Predictions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 relative z-10">
              {aiPredictions.map((pred, i) => {
                const Icon = pred.icon;
                const priorityColors = {
                  critical: 'from-red-600/40 to-pink-600/40 border-red-400/60 shadow-[0_0_25px_rgba(239,68,68,0.5)]',
                  high: 'from-orange-600/40 to-yellow-600/40 border-orange-400/60 shadow-[0_0_25px_rgba(249,115,22,0.5)]',
                  medium: 'from-blue-600/40 to-cyan-600/40 border-blue-400/60 shadow-[0_0_25px_rgba(59,130,246,0.5)]',
                  low: 'from-green-600/40 to-emerald-600/40 border-green-400/60 shadow-[0_0_25px_rgba(16,185,129,0.5)]'
                };
                const iconColors = {
                  critical: '#fca5a5',
                  high: '#fdba74',
                  medium: '#93c5fd',
                  low: '#6ee7b7'
                };
                return (
                  <div
                    key={i}
                    className={`p-5 rounded-2xl bg-gradient-to-br ${priorityColors[pred.priority as keyof typeof priorityColors]} backdrop-blur-xl border-2 hover:scale-105 transition-all duration-500 cursor-pointer group animate-scale-in`}
                    style={{ animationDelay: `${i * 150}ms` }}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className="h-6 w-6 mt-0.5 group-hover:rotate-12 group-hover:scale-125 transition-transform duration-500 drop-shadow-[0_0_8px_currentColor]" style={{ color: iconColors[pred.priority as keyof typeof iconColors] }} />
                      <div>
                        <p className="text-sm font-bold text-white mb-1 drop-shadow-lg">{pred.title}</p>
                        <p className="text-xs text-white/80 font-medium">{pred.desc}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Performance Overview */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border-2 border-white/30 animate-fade-in shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 to-blue-600/20" />
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center gap-2 text-white drop-shadow-lg">
              <BarChart3 className="h-6 w-6 text-emerald-300 drop-shadow-[0_0_10px_rgba(110,231,183,0.8)]" />
              <span className="font-bold">Team Performance Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-3 p-4 rounded-2xl bg-white/5 backdrop-blur-sm border-2 border-white/20 hover:border-emerald-400/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/90 font-semibold">Sales Target</span>
                  <span className="text-white font-bold drop-shadow-lg">$3.5M / $4M</span>
                </div>
                <Progress value={87.5} className="h-4 bg-white/10" />
                <p className="text-xs text-emerald-300 font-bold drop-shadow-[0_0_8px_rgba(110,231,183,0.6)]">87.5% achieved • On track to exceed</p>
              </div>
              <div className="space-y-3 p-4 rounded-2xl bg-white/5 backdrop-blur-sm border-2 border-white/20 hover:border-blue-400/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(59,130,246,0.4)]">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/90 font-semibold">Team Activity</span>
                  <span className="text-white font-bold drop-shadow-lg">892 / 1000</span>
                </div>
                <Progress value={89.2} className="h-4 bg-white/10" />
                <p className="text-xs text-blue-300 font-bold drop-shadow-[0_0_8px_rgba(147,197,253,0.6)]">89.2% of daily goal • Excellent pace</p>
              </div>
              <div className="space-y-3 p-4 rounded-2xl bg-white/5 backdrop-blur-sm border-2 border-white/20 hover:border-purple-400/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(168,85,247,0.4)]">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/90 font-semibold">Customer Satisfaction</span>
                  <span className="text-white font-bold drop-shadow-lg">4.8 / 5.0</span>
                </div>
                <Progress value={96} className="h-4 bg-white/10" />
                <p className="text-xs text-purple-300 font-bold drop-shadow-[0_0_8px_rgba(216,180,254,0.6)]">96% satisfaction rate • Outstanding</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Chat Assistant */}
        <div className="fixed bottom-6 right-6 z-50 animate-scale-in">
          <Button 
            size="lg"
            className="h-20 w-20 rounded-full bg-gradient-to-br from-purple-600 via-blue-600 to-emerald-600 shadow-[0_0_60px_rgba(147,51,234,0.8)] hover:shadow-[0_0_80px_rgba(147,51,234,1)] hover:scale-125 transition-all duration-500 group relative overflow-hidden border-4 border-white/30"
          >
            <MessageSquare className="h-8 w-8 text-white group-hover:rotate-12 transition-transform duration-500 relative z-10 drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
            <div className="absolute inset-0 bg-white/30 animate-shimmer" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)', backgroundSize: '200% 100%' }} />
            <div className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 rounded-full border-4 border-white shadow-[0_0_20px_rgba(239,68,68,0.8)] animate-pulse" />
          </Button>
        </div>
      </div>
    </div>
  );
}
