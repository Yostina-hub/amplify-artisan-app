import { Calendar, BarChart3, MessageSquare, Zap, Users, Search } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

const features = [
  { name: "Content Scheduling", icon: Calendar, description: "Plan and schedule posts" },
  { name: "Analytics", icon: BarChart3, description: "Track performance" },
  { name: "Social Inbox", icon: MessageSquare, description: "Manage conversations" },
  { name: "AI Assistant", icon: Zap, description: "Generate content" },
  { name: "Team Collaboration", icon: Users, description: "Work together" },
  { name: "Social Listening", icon: Search, description: "Monitor mentions" },
];

export const FeaturesDropdown = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="text-sm font-medium text-foreground hover:text-accent transition-colors flex items-center gap-1 outline-none">
        Top features <ChevronDown className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[400px] bg-white z-50 p-4">
        <div className="space-y-2">
          {features.map((feature) => (
            <DropdownMenuItem
              key={feature.name}
              className="flex items-start gap-3 p-3 cursor-pointer hover:bg-secondary rounded-md"
            >
              <feature.icon className="h-5 w-5 text-accent mt-0.5" />
              <div>
                <div className="text-sm font-medium text-foreground">{feature.name}</div>
                <div className="text-xs text-muted-foreground">{feature.description}</div>
              </div>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
