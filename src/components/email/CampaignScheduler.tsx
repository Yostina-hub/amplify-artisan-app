import { useState } from "react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Clock } from "lucide-react";

interface CampaignSchedulerProps {
  scheduledFor: Date | null;
  onScheduleChange: (date: Date | null) => void;
}

export default function CampaignScheduler({ scheduledFor, onScheduleChange }: CampaignSchedulerProps) {
  const [date, setDate] = useState<Date | undefined>(scheduledFor || undefined);
  const [time, setTime] = useState(scheduledFor ? format(scheduledFor, 'HH:mm') : '09:00');

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    if (selectedDate) {
      const [hours, minutes] = time.split(':');
      selectedDate.setHours(parseInt(hours), parseInt(minutes));
      onScheduleChange(selectedDate);
    }
  };

  const handleTimeChange = (newTime: string) => {
    setTime(newTime);
    if (date) {
      const [hours, minutes] = newTime.split(':');
      const newDate = new Date(date);
      newDate.setHours(parseInt(hours), parseInt(minutes));
      onScheduleChange(newDate);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Label>Schedule Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, 'PPP') : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateSelect}
                initialFocus
                disabled={(date) => date < new Date()}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex-1">
          <Label>Schedule Time</Label>
          <div className="relative">
            <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="time"
              value={time}
              onChange={(e) => handleTimeChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {scheduledFor && (
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <p className="text-sm">
            Scheduled for: {format(scheduledFor, 'PPP p')}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setDate(undefined);
              onScheduleChange(null);
            }}
          >
            Clear
          </Button>
        </div>
      )}
    </div>
  );
}