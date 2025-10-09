import { useState } from "react";
import { Plus, Users, Building2, FileText, Calendar, Mail, Phone, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export function QuickActions() {
  const navigate = useNavigate();
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);

  const quickActions = [
    {
      group: "CRM",
      items: [
        { icon: Users, label: "New Contact", action: () => setIsContactDialogOpen(true) },
        { icon: Building2, label: "New Account", action: () => navigate("/accounts?new=true") },
        { icon: FileText, label: "New Quote", action: () => navigate("/quotes?new=true") },
        { icon: Phone, label: "Log Call", action: () => navigate("/call-center") },
      ],
    },
    {
      group: "Content",
      items: [
        { icon: Zap, label: "Generate AI Content", action: () => navigate("/ai-studio") },
        { icon: Calendar, label: "Schedule Post", action: () => navigate("/composer") },
      ],
    },
    {
      group: "Communication",
      items: [
        { icon: Mail, label: "Send Email", action: () => navigate("/email-marketing") },
        { icon: Calendar, label: "Create Event", action: () => setIsEventDialogOpen(true) },
      ],
    },
  ];

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="default" size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            <span className="hidden md:inline">Quick Actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {quickActions.map((group) => (
            <div key={group.group}>
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-xs text-muted-foreground px-2">
                  {group.group}
                </DropdownMenuLabel>
                {group.items.map((item) => (
                  <DropdownMenuItem key={item.label} onClick={item.action}>
                    <item.icon className="mr-2 h-4 w-4" />
                    <span>{item.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Quick Contact Dialog */}
      <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Contact</DialogTitle>
            <DialogDescription>
              Quickly add a new contact to your CRM
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" placeholder="John" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" placeholder="Doe" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="john@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" placeholder="+1 (555) 000-0000" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsContactDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                toast.success("Contact created successfully");
                setIsContactDialogOpen(false);
              }}
            >
              Create Contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Event Dialog */}
      <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Event</DialogTitle>
            <DialogDescription>Schedule a new calendar event</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="eventTitle">Event Title</Label>
              <Input id="eventTitle" placeholder="Team Meeting" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="eventDate">Date & Time</Label>
              <Input id="eventDate" type="datetime-local" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="eventDescription">Description</Label>
              <Textarea id="eventDescription" placeholder="Meeting agenda..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEventDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                toast.success("Event created successfully");
                setIsEventDialogOpen(false);
              }}
            >
              Create Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
