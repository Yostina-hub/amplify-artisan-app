import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronLeft, ChevronRight, Plus, Clock, MapPin, Users, Tag, Search, Filter, Calendar as CalendarIcon, MoreVertical, Edit, Trash, Copy } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Event {
  id: string;
  title: string;
  description: string;
  date: Date;
  time: string;
  endTime?: string;
  category: "meeting" | "deadline" | "social" | "personal" | "work";
  location?: string;
  attendees?: string[];
  color: string;
}

const categoryColors = {
  meeting: "from-blue-500 to-cyan-500",
  deadline: "from-red-500 to-pink-500",
  social: "from-purple-500 to-indigo-500",
  personal: "from-green-500 to-emerald-500",
  work: "from-orange-500 to-yellow-500",
};

const categoryBadgeColors = {
  meeting: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
  deadline: "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20",
  social: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20",
  personal: "bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20",
  work: "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20",
};

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [view, setView] = useState<"month" | "week" | "day">("month");
  const [events, setEvents] = useState<Event[]>([
    {
      id: "1",
      title: "Team Standup",
      description: "Daily team sync meeting",
      date: new Date(2025, 9, 15, 10, 0),
      time: "10:00 AM",
      endTime: "10:30 AM",
      category: "meeting",
      location: "Conference Room A",
      attendees: ["John", "Sarah", "Mike"],
      color: categoryColors.meeting,
    },
    {
      id: "2",
      title: "Project Deadline",
      description: "Submit final deliverables",
      date: new Date(2025, 9, 20, 17, 0),
      time: "5:00 PM",
      category: "deadline",
      color: categoryColors.deadline,
    },
    {
      id: "3",
      title: "Social Media Campaign Launch",
      description: "Launch Q4 social media campaign",
      date: new Date(2025, 9, 18, 9, 0),
      time: "9:00 AM",
      category: "social",
      color: categoryColors.social,
    },
  ]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    date: new Date(),
    time: "",
    endTime: "",
    category: "meeting" as Event["category"],
    location: "",
  });

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay();

  const monthName = currentDate.toLocaleString("default", { month: "long" });
  const year = currentDate.getFullYear();

  const previousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
    );
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

  const upcomingEvents = events
    .filter((event) => event.date >= new Date())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 5);

  const handleAddEvent = () => {
    const event: Event = {
      id: Date.now().toString(),
      title: newEvent.title,
      description: newEvent.description,
      date: newEvent.date,
      time: newEvent.time,
      endTime: newEvent.endTime,
      category: newEvent.category,
      location: newEvent.location,
      color: categoryColors[newEvent.category],
    };
    setEvents([...events, event]);
    setIsAddEventOpen(false);
    toast.success("Event added successfully!");
    setNewEvent({
      title: "",
      description: "",
      date: new Date(),
      time: "",
      endTime: "",
      category: "meeting",
      location: "",
    });
  };

  const handleDeleteEvent = (id: string) => {
    setEvents(events.filter((e) => e.id !== id));
    toast.success("Event deleted successfully!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 animate-in fade-in-50 duration-700">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent animate-in slide-in-from-left duration-500">
              Smart Calendar
            </h1>
            <p className="text-muted-foreground animate-in slide-in-from-left duration-500 delay-75">
              Organize your life with intelligent scheduling
            </p>
          </div>
          
          <div className="flex gap-2 animate-in slide-in-from-right duration-500">
            <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Event
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Event</DialogTitle>
                  <DialogDescription>
                    Add a new event to your calendar
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Event Title</Label>
                    <Input
                      id="title"
                      placeholder="Team Meeting"
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Discuss project updates..."
                      value={newEvent.description}
                      onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {format(newEvent.date, "PPP")}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={newEvent.date}
                            onSelect={(date) => date && setNewEvent({ ...newEvent, date })}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select value={newEvent.category} onValueChange={(value: Event["category"]) => setNewEvent({ ...newEvent, category: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="meeting">Meeting</SelectItem>
                          <SelectItem value="deadline">Deadline</SelectItem>
                          <SelectItem value="social">Social</SelectItem>
                          <SelectItem value="personal">Personal</SelectItem>
                          <SelectItem value="work">Work</SelectItem>
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
                    <Label htmlFor="location">Location (Optional)</Label>
                    <Input
                      id="location"
                      placeholder="Conference Room A"
                      value={newEvent.location}
                      onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                    />
                  </div>
                  <Button onClick={handleAddEvent} className="w-full">Create Event</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Calendar */}
          <div className="lg:col-span-3 space-y-4">
            {/* Controls */}
            <Card className="border-primary/20 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm bg-card/95">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={previousMonth} className="hover:scale-110 transition-transform">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="min-w-[200px] text-center">
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                        {monthName} {year}
                      </h2>
                    </div>
                    <Button variant="outline" size="icon" onClick={nextMonth} className="hover:scale-110 transition-transform">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search events..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 w-[200px]"
                      />
                    </div>
                    
                    <Select value={filterCategory} onValueChange={setFilterCategory}>
                      <SelectTrigger className="w-[140px]">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Events</SelectItem>
                        <SelectItem value="meeting">Meetings</SelectItem>
                        <SelectItem value="deadline">Deadlines</SelectItem>
                        <SelectItem value="social">Social</SelectItem>
                        <SelectItem value="personal">Personal</SelectItem>
                        <SelectItem value="work">Work</SelectItem>
                      </SelectContent>
                    </Select>

                    <Tabs value={view} onValueChange={(v) => setView(v as any)} className="hidden md:block">
                      <TabsList>
                        <TabsTrigger value="month">Month</TabsTrigger>
                        <TabsTrigger value="week">Week</TabsTrigger>
                        <TabsTrigger value="day">Day</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Calendar Grid */}
            <Card className="border-primary/20 shadow-2xl hover:shadow-3xl transition-all duration-500 backdrop-blur-sm bg-card/95 overflow-hidden">
              <CardContent className="p-6">
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div
                      key={day}
                      className="text-center text-sm font-semibold text-muted-foreground py-3 bg-muted/30 rounded-lg"
                    >
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
                    const isToday = day === new Date().getDate() && 
                                   currentDate.getMonth() === new Date().getMonth() &&
                                   currentDate.getFullYear() === new Date().getFullYear();

                    return (
                      <div
                        key={day}
                        className={cn(
                          "aspect-square border rounded-xl p-2 transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer group relative overflow-hidden",
                          isToday ? "border-primary bg-gradient-to-br from-primary/20 to-purple-500/20 shadow-lg ring-2 ring-primary/50" : "border-border hover:border-primary/50",
                          dayEvents.length > 0 && "bg-gradient-to-br from-primary/5 to-transparent"
                        )}
                      >
                        <div className={cn(
                          "text-sm font-semibold mb-1 transition-colors",
                          isToday ? "text-primary" : "text-foreground"
                        )}>
                          {day}
                        </div>
                        <div className="space-y-1">
                          {dayEvents.slice(0, 2).map((event) => (
                            <Popover key={event.id}>
                              <PopoverTrigger asChild>
                                <div
                                  className={cn(
                                    "text-xs px-2 py-1 rounded-lg truncate cursor-pointer transition-all duration-200 hover:scale-105",
                                    `bg-gradient-to-r ${event.color} text-white shadow-sm hover:shadow-md`
                                  )}
                                >
                                  {event.title}
                                </div>
                              </PopoverTrigger>
                              <PopoverContent className="w-80 p-0" align="start">
                                <div className={cn("p-4 bg-gradient-to-r text-white rounded-t-lg", event.color)}>
                                  <h3 className="font-semibold text-lg">{event.title}</h3>
                                  <p className="text-sm opacity-90">{event.time}</p>
                                </div>
                                <div className="p-4 space-y-3">
                                  {event.description && (
                                    <p className="text-sm text-muted-foreground">{event.description}</p>
                                  )}
                                  {event.location && (
                                    <div className="flex items-center gap-2 text-sm">
                                      <MapPin className="h-4 w-4 text-muted-foreground" />
                                      <span>{event.location}</span>
                                    </div>
                                  )}
                                  {event.endTime && (
                                    <div className="flex items-center gap-2 text-sm">
                                      <Clock className="h-4 w-4 text-muted-foreground" />
                                      <span>{event.time} - {event.endTime}</span>
                                    </div>
                                  )}
                                  <Badge className={categoryBadgeColors[event.category]}>
                                    {event.category}
                                  </Badge>
                                  <div className="flex gap-2 pt-2">
                                    <Button size="sm" variant="outline" className="flex-1">
                                      <Edit className="h-3 w-3 mr-1" />
                                      Edit
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      className="flex-1 text-destructive hover:text-destructive"
                                      onClick={() => handleDeleteEvent(event.id)}
                                    >
                                      <Trash className="h-3 w-3 mr-1" />
                                      Delete
                                    </Button>
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                          ))}
                          {dayEvents.length > 2 && (
                            <div className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded text-center">
                              +{dayEvents.length - 2} more
                            </div>
                          )}
                        </div>
                        {dayEvents.length === 0 && (
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Plus className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Mini Calendar */}
            <Card className="border-primary/20 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm bg-card/95">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Quick Navigation</CardTitle>
              </CardHeader>
              <CardContent>
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border pointer-events-auto"
                />
              </CardContent>
            </Card>

            {/* Upcoming Events */}
            <Card className="border-primary/20 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm bg-card/95">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Upcoming Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-3">
                    {upcomingEvents.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No upcoming events
                      </p>
                    ) : (
                      upcomingEvents.map((event) => (
                        <div
                          key={event.id}
                          className="p-3 rounded-lg border border-border hover:border-primary/50 transition-all duration-200 hover:shadow-md cursor-pointer group"
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h4 className="font-medium text-sm group-hover:text-primary transition-colors">{event.title}</h4>
                            <Badge className={cn("text-xs", categoryBadgeColors[event.category])}>
                              {event.category}
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <CalendarIcon className="h-3 w-3" />
                              <span>{format(event.date, "MMM dd, yyyy")}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>{event.time}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Event Stats */}
            <Card className="border-primary/20 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm bg-gradient-to-br from-card/95 to-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">This Month</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Events</span>
                  <span className="text-2xl font-bold text-primary">{events.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Meetings</span>
                  <span className="text-lg font-semibold">{events.filter(e => e.category === "meeting").length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Deadlines</span>
                  <span className="text-lg font-semibold">{events.filter(e => e.category === "deadline").length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}