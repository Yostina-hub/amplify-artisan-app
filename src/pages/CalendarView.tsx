import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronLeft, ChevronRight, Plus, Clock, MapPin, Search, Filter, Calendar as CalendarIcon, Trash, Sparkles, Globe, Link, Repeat, Video, List, LayoutGrid, CalendarDays, Instagram, Facebook, Twitter, Linkedin, Send, ChevronDown, FileText, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { format, isSameDay, startOfWeek, addDays, addWeeks, subWeeks, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";

const TIMEZONES = ["Africa/Addis_Ababa", "UTC", "America/New_York", "Europe/London", "Asia/Tokyo"];

interface Event {
  id: string;
  title: string;
  description: string;
  date: Date;
  time: string;
  endTime?: string;
  category: "meeting" | "deadline" | "social" | "personal" | "work" | "campaign" | "review";
  location?: string;
  attendees?: string[];
  color: string;
  timezone?: string;
  isRecurring?: boolean;
  recurrenceRule?: string;
  meetingLink?: string;
  reminders?: number[];
  metadata?: any;
  imageUrl?: string;
  platforms?: string[];
}

interface SocialPost {
  id: string;
  content: string;
  platforms: string[];
  scheduledFor: Date;
  status: string;
  imageUrl?: string;
  accountName?: string;
}

const categoryConfig = {
  meeting: { 
    gradient: "from-blue-500 via-cyan-500 to-blue-600",
    badge: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
    icon: "👥"
  },
  deadline: { 
    gradient: "from-red-500 via-pink-500 to-red-600",
    badge: "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20",
    icon: "⏰"
  },
  social: { 
    gradient: "from-purple-500 via-pink-500 to-purple-600",
    badge: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20",
    icon: "🎉"
  },
  personal: { 
    gradient: "from-green-500 via-emerald-500 to-green-600",
    badge: "bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20",
    icon: "⭐"
  },
  work: { 
    gradient: "from-orange-500 via-yellow-500 to-orange-600",
    badge: "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20",
    icon: "💼"
  },
  campaign: { 
    gradient: "from-indigo-500 via-purple-500 to-indigo-600",
    badge: "bg-indigo-500/10 text-indigo-700 dark:text-purple-300 border-indigo-500/20",
    icon: "📢"
  },
  review: { 
    gradient: "from-teal-500 via-cyan-500 to-teal-600",
    badge: "bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20",
    icon: "✅"
  },
};

const PlatformIcon = ({ platform, className }: { platform: string; className?: string }) => {
  const icons: Record<string, React.ReactNode> = {
    instagram: <Instagram className={cn("h-4 w-4 text-pink-500", className)} />,
    facebook: <Facebook className={cn("h-4 w-4 text-blue-600", className)} />,
    twitter: <Twitter className={cn("h-4 w-4 text-sky-500", className)} />,
    linkedin: <Linkedin className={cn("h-4 w-4 text-blue-700", className)} />,
    telegram: <Send className={cn("h-4 w-4 text-sky-400", className)} />,
  };
  return icons[platform.toLowerCase()] || <Globe className={cn("h-4 w-4", className)} />;
};

export default function CalendarView() {
  const { session } = useAuth();
  const { sendEventCreatedNotification } = useNotifications();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [view, setView] = useState<"list" | "week" | "month">("week");
  const [activeTab, setActiveTab] = useState("calendar");
  const [events, setEvents] = useState<Event[]>([]);
  const [socialPosts, setSocialPosts] = useState<SocialPost[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [timezone, setTimezone] = useState("GMT +03:00");
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    date: new Date(),
    time: "",
    endTime: "",
    category: "meeting" as Event["category"],
    location: "",
    meetingLink: "",
    isRecurring: false,
    recurrenceRule: "daily",
  });

  // Week view helpers
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));
  
  const getWeekRange = () => {
    const start = format(weekDays[0], "MMM d");
    const end = format(weekDays[6], "d, yyyy");
    return `${start} - ${end}`;
  };

  useEffect(() => {
    fetchEvents();
  }, [session?.user?.id]);

  const fetchEvents = async () => {
    if (!session?.user?.id) return;
    
    setIsLoading(true);
    try {
      const { data: calendarData, error: calendarError } = await supabase
        .from("calendar_events")
        .select("*")
        .eq("user_id", session.user.id)
        .order("event_date", { ascending: true });

      if (calendarError) throw calendarError;

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", session.user.id)
        .single();

      let scheduledPosts: any[] = [];
      if (profile?.company_id) {
        const { data: postsData, error: postsError } = await supabase
          .from("social_media_posts")
          .select("id, platforms, content, status, approved_at, scheduled_at, scheduled_for, media_urls")
          .eq("company_id", profile.company_id)
          .or("scheduled_at.not.is.null,scheduled_for.not.is.null")
          .order("scheduled_at", { ascending: true, nullsFirst: false });

        if (!postsError && postsData) {
          scheduledPosts = postsData;
        }
      }

      // Process social posts for display
      const processedSocialPosts: SocialPost[] = scheduledPosts
        .filter((post) => {
          const scheduledDate = post.scheduled_at || post.scheduled_for;
          return scheduledDate;
        })
        .map((post) => {
          const scheduledDate = post.scheduled_at || post.scheduled_for;
          return {
            id: post.id,
            content: post.content || "",
            platforms: post.platforms || [],
            scheduledFor: new Date(scheduledDate),
            status: post.status,
            imageUrl: post.media_urls?.[0] || undefined,
            accountName: "Business Account",
          };
        });

      setSocialPosts(processedSocialPosts);

      const formattedEvents: Event[] = [
        ...(calendarData || []).map((event) => ({
          id: event.id,
          title: event.title,
          description: event.description || "",
          date: new Date(event.event_date),
          time: event.event_time || "",
          endTime: event.end_time || undefined,
          category: event.category as Event["category"],
          location: event.location || undefined,
          attendees: event.attendees || undefined,
          color: categoryConfig[event.category as Event["category"]].gradient,
          timezone: "Africa/Addis_Ababa",
          isRecurring: false,
          meetingLink: "",
        })),
        ...processedSocialPosts.map((post) => ({
          id: `post-${post.id}`,
          title: post.content.substring(0, 50) + (post.content.length > 50 ? "..." : ""),
          description: post.content,
          date: post.scheduledFor,
          time: format(post.scheduledFor, 'h:mma'),
          category: "social" as Event["category"],
          color: categoryConfig.social.gradient,
          platforms: post.platforms,
          imageUrl: post.imageUrl,
          metadata: {
            type: "social_post",
            postId: post.id,
            platforms: post.platforms,
            status: post.status,
            accountName: post.accountName,
          }
        }))
      ];

      setEvents(formattedEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
      toast.error("Failed to load events");
    } finally {
      setIsLoading(false);
    }
  };

  const getEventsForDay = (day: Date) => {
    return events.filter(
      (event) =>
        isSameDay(event.date, day) &&
        (filterCategory === "all" || event.category === filterCategory) &&
        (searchQuery === "" || event.title.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };

  const handleAddEvent = async () => {
    if (!session?.user?.id) {
      toast.error("You must be logged in");
      return;
    }
    if (!newEvent.title.trim()) {
      toast.error("Please enter an event title");
      return;
    }

    try {
      const eventDateTime = new Date(newEvent.date);
      if (newEvent.time) {
        const [hours, minutes] = newEvent.time.split(':');
        eventDateTime.setHours(parseInt(hours), parseInt(minutes));
      }

      const { data, error } = await supabase
        .from("calendar_events")
        .insert({
          user_id: session.user.id,
          title: newEvent.title,
          description: newEvent.description,
          event_date: eventDateTime.toISOString(),
          event_time: newEvent.time,
          end_time: newEvent.endTime,
          category: newEvent.category,
          location: newEvent.location || null,
        })
        .select()
        .single();

      if (error) throw error;

      const newEventObj: Event = {
        id: data.id,
        title: data.title,
        description: data.description || "",
        date: new Date(data.event_date),
        time: data.event_time || "",
        endTime: data.end_time || undefined,
        category: data.category as Event["category"],
        location: data.location || undefined,
        color: categoryConfig[data.category as Event["category"]].gradient,
      };

      setEvents([...events, newEventObj]);
      setIsAddEventOpen(false);
      toast.success("Event created successfully!");
      await sendEventCreatedNotification(newEvent.title);
      
      setNewEvent({
        title: "",
        description: "",
        date: new Date(),
        time: "",
        endTime: "",
        category: "meeting",
        location: "",
        meetingLink: "",
        isRecurring: false,
        recurrenceRule: "daily",
      });
    } catch (error) {
      console.error("Error creating event:", error);
      toast.error("Failed to create event");
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      const { error } = await supabase.from("calendar_events").delete().eq("id", id);
      if (error) throw error;
      setEvents(events.filter((e) => e.id !== id));
      toast.success("Event deleted");
    } catch (error) {
      toast.error("Failed to delete event");
    }
  };

  const navigateWeek = (direction: "prev" | "next") => {
    setCurrentDate(direction === "next" ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Social Post Card Component
  const SocialPostCard = ({ post, event }: { post?: SocialPost; event: Event }) => {
    const platforms = event.platforms || post?.platforms || event.metadata?.platforms || [];
    const time = format(event.date, 'h:mma');
    const accountName = event.metadata?.accountName || "Account";
    const imageUrl = event.imageUrl || post?.imageUrl;
    const content = event.description || post?.content || "";
    
    return (
      <div className="group relative bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer border border-border/50">
        {/* Image Preview */}
        {imageUrl ? (
          <div className="aspect-video bg-gradient-to-br from-purple-400 via-pink-400 to-orange-300 relative">
            <img src={imageUrl} alt="" className="w-full h-full object-cover" />
            {/* Platform badge */}
            <div className="absolute bottom-2 left-2">
              {platforms.slice(0, 1).map((platform: string) => (
                <div key={platform} className="bg-white/90 rounded-full p-1 shadow-sm">
                  <PlatformIcon platform={platform} className="h-3 w-3" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="aspect-video bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 flex items-center justify-center">
            <div className="text-white/80 text-xs px-2 text-center line-clamp-3">
              {content.substring(0, 80)}...
            </div>
            <div className="absolute bottom-2 left-2">
              {platforms.slice(0, 1).map((platform: string) => (
                <div key={platform} className="bg-white/90 rounded-full p-1 shadow-sm">
                  <PlatformIcon platform={platform} className="h-3 w-3" />
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Post Info */}
        <div className="p-2 space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{accountName}</span>
            <span className="text-xs text-muted-foreground">{time}</span>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-1">{content}</p>
        </div>
      </div>
    );
  };

  // Event Card Component for non-social events
  const EventCard = ({ event }: { event: Event }) => (
    <Popover>
      <PopoverTrigger asChild>
        <div
          className={cn(
            "text-xs px-2 py-1.5 rounded-md truncate font-medium text-white bg-gradient-to-r cursor-pointer shadow-sm hover:shadow-md transition-all",
            categoryConfig[event.category].gradient
          )}
        >
          <div className="flex items-center gap-1">
            <span>{categoryConfig[event.category].icon}</span>
            <span className="truncate">{event.title}</span>
          </div>
          <div className="text-[10px] opacity-80">{event.time}</div>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80" side="right">
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold text-base flex items-center gap-2">
              {categoryConfig[event.category].icon} {event.title}
            </h4>
            <Badge className={categoryConfig[event.category].badge}>
              {event.category}
            </Badge>
          </div>
          {event.description && (
            <p className="text-sm text-muted-foreground">{event.description}</p>
          )}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span>{format(event.date, "PPP")}</span>
            </div>
            {event.time && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{event.time} {event.endTime && `- ${event.endTime}`}</span>
              </div>
            )}
            {event.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{event.location}</span>
              </div>
            )}
          </div>
          {!event.id.startsWith("post-") && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDeleteEvent(event.id)}
              className="w-full"
            >
              <Trash className="h-4 w-4 mr-2" />
              Delete Event
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary mx-auto"></div>
            <CalendarIcon className="h-6 w-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-muted-foreground font-medium">Loading your calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto">
          {/* Top Tabs */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="bg-transparent border-0 p-0 h-auto gap-6">
                <TabsTrigger 
                  value="calendar" 
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none pb-3 px-1 text-base font-medium"
                >
                  Calendar
                </TabsTrigger>
                <TabsTrigger 
                  value="drafts"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none pb-3 px-1 text-base font-medium"
                >
                  Drafts
                </TabsTrigger>
                <TabsTrigger 
                  value="content"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none pb-3 px-1 text-base font-medium"
                >
                  Content
                </TabsTrigger>
                <TabsTrigger 
                  value="approvals"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none pb-3 px-1 text-base font-medium"
                >
                  Approvals
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Post Now Button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                  Post now
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Instagram className="h-4 w-4 mr-2" /> Post to Instagram
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Facebook className="h-4 w-4 mr-2" /> Post to Facebook
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Twitter className="h-4 w-4 mr-2" /> Post to Twitter
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Linkedin className="h-4 w-4 mr-2" /> Post to LinkedIn
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Send className="h-4 w-4 mr-2" /> Post to Telegram
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Navigation Bar */}
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              {/* Navigation Arrows */}
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" onClick={() => navigateWeek("prev")} className="h-8 w-8">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={goToToday} className="h-8 px-3 font-medium">
                  Today
                </Button>
                <Button variant="outline" size="icon" onClick={() => navigateWeek("next")} className="h-8 w-8">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Date Range */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" className="text-lg font-semibold gap-2">
                    {getWeekRange()}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={currentDate}
                    onSelect={(date) => date && setCurrentDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center gap-3">
              {/* View Toggle */}
              <div className="flex border rounded-lg p-1 bg-muted/30">
                <Button
                  variant={view === "list" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setView("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={view === "week" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setView("week")}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={view === "month" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setView("month")}
                >
                  <CalendarDays className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Content */}
      <div className="container mx-auto p-4">
        <Tabs value={activeTab} className="w-full">
          <TabsContent value="calendar" className="mt-0">
            {view === "week" && (
              <div className="bg-card rounded-lg border overflow-hidden">
                {/* Week Header */}
                <div className="grid grid-cols-[80px_repeat(7,1fr)] border-b">
                  <div className="p-3 text-xs text-muted-foreground flex items-center">
                    <Globe className="h-3 w-3 mr-1" />
                    {timezone}
                  </div>
                  {weekDays.map((day) => {
                    const dayEvents = getEventsForDay(day);
                    const dayIsToday = isToday(day);
                    return (
                      <div key={day.toISOString()} className={cn("p-3 text-center border-l", dayIsToday && "bg-primary/5")}>
                        <div className="text-xs text-muted-foreground font-medium">{format(day, "EEE")}</div>
                        <div className={cn(
                          "text-lg font-semibold mt-1 inline-flex items-center justify-center",
                          dayIsToday && "bg-foreground text-background rounded-full h-8 w-8"
                        )}>
                          {format(day, "d")}
                        </div>
                        {dayEvents.length > 0 && (
                          <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
                            {dayEvents.length}
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Week Content */}
                <div className="grid grid-cols-[80px_repeat(7,1fr)] min-h-[500px]">
                  {/* Time Column */}
                  <div className="border-r">
                    {/* Recommended time badge placeholder */}
                  </div>

                  {/* Day Columns */}
                  {weekDays.map((day) => {
                    const dayEvents = getEventsForDay(day);
                    const socialEvents = dayEvents.filter(e => e.category === "social" || e.id.startsWith("post-"));
                    const otherEvents = dayEvents.filter(e => e.category !== "social" && !e.id.startsWith("post-"));
                    const dayIsToday = isToday(day);

                    return (
                      <div key={day.toISOString()} className={cn("border-l p-2 space-y-2", dayIsToday && "bg-primary/5")}>
                        {/* Social Post Cards */}
                        {socialEvents.map((event) => (
                          <SocialPostCard key={event.id} event={event} />
                        ))}
                        
                        {/* Other Events */}
                        {otherEvents.map((event) => (
                          <EventCard key={event.id} event={event} />
                        ))}

                        {/* Recommended Time Indicator (show on first empty slot) */}
                        {dayEvents.length === 0 && dayIsToday && (
                          <div className="mt-4">
                            <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 text-[10px]">
                              <Clock className="h-3 w-3 mr-1" />
                              Recommended time 2:30 PM
                            </Badge>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {view === "month" && (
              <Card className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="grid grid-cols-7 gap-2 mb-4">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                      <div key={day} className="text-center font-semibold text-sm text-muted-foreground py-2">
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay() }).map((_, i) => (
                      <div key={`empty-${i}`} className="aspect-square" />
                    ))}

                    {Array.from({ length: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate() }).map((_, i) => {
                      const day = i + 1;
                      const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                      const dayEvents = getEventsForDay(dayDate);
                      const dayIsToday = isToday(dayDate);

                      return (
                        <div
                          key={day}
                          className={cn(
                            "aspect-square p-2 border rounded-lg transition-all hover:shadow-lg cursor-pointer",
                            dayIsToday ? "border-primary bg-primary/10" : "border-border bg-card hover:bg-muted/50",
                            dayEvents.length > 0 && "ring-1 ring-primary/20"
                          )}
                        >
                          <div className={cn(
                            "font-semibold text-sm mb-1 inline-flex items-center justify-center",
                            dayIsToday && "bg-primary text-primary-foreground rounded-full h-6 w-6"
                          )}>{day}</div>
                          <ScrollArea className="h-[calc(100%-24px)]">
                            <div className="space-y-1">
                              {dayEvents.slice(0, 2).map((event) => (
                                event.category === "social" || event.id.startsWith("post-") ? (
                                  <div key={event.id} className="text-xs px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 truncate flex items-center gap-1">
                                    {event.platforms?.slice(0, 1).map((p: string) => (
                                      <PlatformIcon key={p} platform={p} className="h-3 w-3" />
                                    ))}
                                    <span className="truncate">{event.time}</span>
                                  </div>
                                ) : (
                                  <div
                                    key={event.id}
                                    className={cn(
                                      "text-xs px-1.5 py-0.5 rounded truncate text-white bg-gradient-to-r",
                                      categoryConfig[event.category].gradient
                                    )}
                                  >
                                    {event.title}
                                  </div>
                                )
                              ))}
                              {dayEvents.length > 2 && (
                                <div className="text-[10px] text-center text-muted-foreground">
                                  +{dayEvents.length - 2} more
                                </div>
                              )}
                            </div>
                          </ScrollArea>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {view === "list" && (
              <Card>
                <CardHeader>
                  <CardTitle>Scheduled Content</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {events
                      .filter(e => e.date >= new Date())
                      .sort((a, b) => a.date.getTime() - b.date.getTime())
                      .slice(0, 10)
                      .map((event) => (
                        <div
                          key={event.id}
                          className="flex items-center gap-4 p-4 rounded-lg border hover:shadow-md transition-all"
                        >
                          {/* Preview Image or Icon */}
                          {event.imageUrl ? (
                            <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                              <img src={event.imageUrl} alt="" className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className={cn("w-16 h-16 rounded-lg flex items-center justify-center text-2xl bg-gradient-to-br", categoryConfig[event.category].gradient)}>
                              {categoryConfig[event.category].icon}
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {event.platforms?.map((p: string) => (
                                <PlatformIcon key={p} platform={p} />
                              ))}
                              <span className="font-medium truncate">{event.title}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <CalendarIcon className="h-3 w-3" />
                                {format(event.date, "MMM d, yyyy")}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {event.time}
                              </span>
                            </div>
                          </div>

                          <Badge variant="outline" className={categoryConfig[event.category].badge}>
                            {event.category}
                          </Badge>

                          {!event.id.startsWith("post-") && (
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteEvent(event.id)}>
                              <Trash className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="drafts" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Drafts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mb-4 opacity-50" />
                  <p>No drafts yet</p>
                  <p className="text-sm">Create content and save as draft to see it here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LayoutGrid className="h-5 w-5" />
                  Content Library
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <LayoutGrid className="h-12 w-12 mb-4 opacity-50" />
                  <p>No content in library</p>
                  <p className="text-sm">Upload images and videos to use in your posts</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="approvals" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Pending Approvals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mb-4 opacity-50" />
                  <p>No pending approvals</p>
                  <p className="text-sm">Content requiring approval will appear here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Event Dialog */}
      <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Create New Event</DialogTitle>
            <DialogDescription>Schedule meetings, deadlines, and campaigns</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-base font-semibold">Event Title *</Label>
              <Input
                id="title"
                placeholder="Team Strategy Meeting"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                className="text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Discuss Q4 objectives and key results..."
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                className="min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(newEvent.date, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={newEvent.date}
                      onSelect={(date) => date && setNewEvent({ ...newEvent, date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={newEvent.category} onValueChange={(value: Event["category"]) => setNewEvent({ ...newEvent, category: value })}>
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {Object.entries(categoryConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <span className="flex items-center gap-2">
                          <span>{config.icon}</span>
                          <span className="capitalize">{key}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="time">Start Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={newEvent.time}
                  onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={newEvent.endTime}
                  onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="location"
                  placeholder="Conference Room A / Zoom"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  className="pl-9"
                />
              </div>
            </div>

            <Button onClick={handleAddEvent} className="w-full h-12 text-base font-semibold">
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
