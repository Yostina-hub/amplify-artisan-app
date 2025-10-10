import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { ChevronLeft, ChevronRight, Plus, Clock, MapPin, Search, Filter, Calendar as CalendarIcon, Trash, Sparkles, Globe, Link, Repeat, Video } from "lucide-react";
import { useState, useEffect } from "react";
import { format, isSameDay } from "date-fns";
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
    badge: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20",
    icon: "📢"
  },
  review: { 
    gradient: "from-teal-500 via-cyan-500 to-teal-600",
    badge: "bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20",
    icon: "✅"
  },
};

export default function CalendarView() {
  const { session } = useAuth();
  const { sendEventCreatedNotification } = useNotifications();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [view, setView] = useState<"month" | "week" | "day">("month");
  const [events, setEvents] = useState<Event[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [isEditEventOpen, setIsEditEventOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timezone, setTimezone] = useState("Africa/Addis_Ababa");
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

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const monthName = currentDate.toLocaleString("default", { month: "long" });
  const year = currentDate.getFullYear();

  useEffect(() => {
    fetchEvents();
  }, [session?.user?.id]);

  const fetchEvents = async () => {
    if (!session?.user?.id) return;
    
    setIsLoading(true);
    try {
      // Fetch calendar events
      const { data: calendarData, error: calendarError } = await supabase
        .from("calendar_events")
        .select("*")
        .eq("user_id", session.user.id)
        .order("event_date", { ascending: true });

      if (calendarError) throw calendarError;

      // Fetch scheduled social media posts
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", session.user.id)
        .single();

      let scheduledPosts: any[] = [];
      if (profile?.company_id) {
        const { data: postsData, error: postsError } = await supabase
          .from("social_media_posts")
          .select("*, profiles!social_media_posts_user_id_fkey(full_name), approved_profiles:profiles!social_media_posts_approved_by_fkey(full_name)")
          .eq("company_id", profile.company_id)
          .or("scheduled_at.not.is.null,scheduled_for.not.is.null")
          .order("scheduled_at", { ascending: true, nullsFirst: false });

        if (!postsError && postsData) {
          scheduledPosts = postsData;
        }
      }

      // Combine calendar events and scheduled posts
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
        ...scheduledPosts.map((post) => {
          const scheduledDate = post.scheduled_at || post.scheduled_for;
          return {
            id: `post-${post.id}`,
            title: `📱 ${post.platforms?.join(", ")} Post`,
            description: post.content || "",
            date: new Date(scheduledDate),
            time: new Date(scheduledDate).toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit', 
              hour12: false,
              timeZone: 'Africa/Addis_Ababa'
            }),
            category: "social" as Event["category"],
            color: categoryConfig.social.gradient,
            metadata: {
              type: "social_post",
              postId: post.id,
              platforms: post.platforms,
              status: post.status,
              postedBy: post.profiles?.full_name || "Unknown",
              approvedBy: post.approved_profiles?.full_name || null,
              approvedAt: post.approved_at,
              scheduledFor: scheduledDate,
            }
          };
        })
      ];

      setEvents(formattedEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
      toast.error("Failed to load events");
    } finally {
      setIsLoading(false);
    }
  };

  const getEventsForDay = (day: number) => {
    return events.filter(
      (event) =>
        event.date.getDate() === day &&
        event.date.getMonth() === currentDate.getMonth() &&
        event.date.getFullYear() === currentDate.getFullYear() &&
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
      
      // Reset
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-accent/10">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary mx-auto"></div>
            <CalendarIcon className="h-6 w-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-muted-foreground font-medium">Loading your intelligent calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10 animate-in fade-in-50 duration-700">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 backdrop-blur-sm bg-card/50 p-6 rounded-2xl border-2">
          <div>
            <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent animate-in slide-in-from-left duration-500">
              Smart Calendar
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              AI-powered scheduling with timezone support
            </p>
          </div>
          
          <div className="flex gap-2">
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger className="w-[200px]">
                <Globe className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["Africa/Addis_Ababa", "UTC", "America/New_York", "America/Los_Angeles", "Europe/London", "Europe/Paris", "Asia/Tokyo", "Asia/Shanghai", "Asia/Dubai"].map(tz => (
                  <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 shadow-lg hover:shadow-xl transition-all duration-300">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Event
                </Button>
              </DialogTrigger>
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
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
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

                  <Tabs defaultValue="details" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="details">Details</TabsTrigger>
                      <TabsTrigger value="advanced">Advanced</TabsTrigger>
                    </TabsList>

                    <TabsContent value="details" className="space-y-4 mt-4">
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

                      <div className="space-y-2">
                        <Label htmlFor="meetingLink">Meeting Link</Label>
                        <div className="relative">
                          <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="meetingLink"
                            placeholder="https://zoom.us/j/..."
                            value={newEvent.meetingLink}
                            onChange={(e) => setNewEvent({ ...newEvent, meetingLink: e.target.value })}
                            className="pl-9"
                          />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="advanced" className="space-y-4 mt-4">
                      <div className="flex items-center space-x-2 p-3 border rounded-lg">
                        <Checkbox 
                          id="recurring"
                          checked={newEvent.isRecurring}
                          onCheckedChange={(checked) => setNewEvent({ ...newEvent, isRecurring: checked as boolean })}
                        />
                        <Label htmlFor="recurring" className="flex items-center gap-2 cursor-pointer">
                          <Repeat className="h-4 w-4" />
                          <span>Recurring Event</span>
                        </Label>
                      </div>

                      {newEvent.isRecurring && (
                        <Select value={newEvent.recurrenceRule} onValueChange={(value) => setNewEvent({ ...newEvent, recurrenceRule: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="yearly">Yearly</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </TabsContent>
                  </Tabs>

                  <Button onClick={handleAddEvent} className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-purple-500">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Create Event
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* View Selector & Filters */}
        <Card className="backdrop-blur-sm bg-card/95 border-2">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-2xl font-bold min-w-[200px] text-center">
                  {monthName} {year}
                </h2>
                <Button variant="outline" size="icon" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search events..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-[200px]"
                  />
                </div>

                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-[150px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
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

                <div className="flex border rounded-lg p-1">
                  {["month", "week", "day"].map((v) => (
                    <Button
                      key={v}
                      variant={view === v ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setView(v as any)}
                      className="capitalize"
                    >
                      {v}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calendar Grid */}
        <Card className="backdrop-blur-sm bg-card/95 border-2 shadow-2xl">
          <CardContent className="p-6">
            <div className="grid grid-cols-7 gap-2 mb-4">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="text-center font-semibold text-sm text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dayEvents = getEventsForDay(day);
                const isToday = isSameDay(
                  new Date(currentDate.getFullYear(), currentDate.getMonth(), day),
                  new Date()
                );

                return (
                  <div
                    key={day}
                    className={cn(
                      "aspect-square p-2 border-2 rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer",
                      isToday ? "border-primary bg-primary/10 shadow-md" : "border-border bg-card/50 hover:bg-card",
                      dayEvents.length > 0 && "ring-2 ring-accent/30"
                    )}
                  >
                    <div className="font-semibold text-sm mb-1">{day}</div>
                    <ScrollArea className="h-[calc(100%-24px)]">
                      <div className="space-y-1">
                        {dayEvents.slice(0, 3).map((event) => (
                          <div
                            key={event.id}
                            className={cn(
                              "text-xs px-2 py-1 rounded-md truncate font-medium text-white bg-gradient-to-r",
                              categoryConfig[event.category].gradient,
                              "shadow-sm hover:shadow-md transition-shadow"
                            )}
                            title={event.title}
                          >
                            {categoryConfig[event.category].icon} {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-center text-muted-foreground py-1">
                            +{dayEvents.length - 3} more
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

        {/* Upcoming Events */}
        <Card className="backdrop-blur-sm bg-gradient-to-r from-card/95 to-accent/5 border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Upcoming Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {events
                .filter(e => e.date >= new Date())
                .sort((a, b) => a.date.getTime() - b.date.getTime())
                .slice(0, 5)
                .map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-4 rounded-xl border-2 hover:shadow-lg transition-all bg-card"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn("w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-2xl shadow-md", categoryConfig[event.category].gradient)}>
                        {categoryConfig[event.category].icon}
                      </div>
                      <div>
                        <h3 className="font-semibold">{event.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className={categoryConfig[event.category].badge}>
                            {event.category}
                          </Badge>
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(event.date, "MMM d")} at {event.time}
                          </span>
                          {event.isRecurring && (
                            <Badge variant="secondary" className="gap-1">
                              <Repeat className="h-3 w-3" />
                              {event.recurrenceRule}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {event.meetingLink && (
                        <Button variant="ghost" size="icon" onClick={() => window.open(event.meetingLink, '_blank')}>
                          <Video className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteEvent(event.id)}>
                        <Trash className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}