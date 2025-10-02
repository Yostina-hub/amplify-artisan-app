import { BookOpen, Video, FileText, HelpCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

const resources = [
  { name: "Blog", icon: BookOpen, description: "Latest insights and tips" },
  { name: "Webinars", icon: Video, description: "Live and on-demand" },
  { name: "Case Studies", icon: FileText, description: "Success stories" },
  { name: "Help Center", icon: HelpCircle, description: "Get support" },
];

export const ResourcesDropdown = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="text-sm font-medium text-foreground hover:text-accent transition-colors flex items-center gap-1 outline-none">
        Resources <ChevronDown className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[300px] bg-white z-50 p-4">
        <div className="space-y-2">
          {resources.map((resource) => (
            <DropdownMenuItem
              key={resource.name}
              className="flex items-start gap-3 p-3 cursor-pointer hover:bg-secondary rounded-md"
            >
              <resource.icon className="h-5 w-5 text-accent mt-0.5" />
              <div>
                <div className="text-sm font-medium text-foreground">{resource.name}</div>
                <div className="text-xs text-muted-foreground">{resource.description}</div>
              </div>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
