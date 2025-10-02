import { Building2, Home, DollarSign, Landmark, Heart, GraduationCap, Briefcase, Scale, Users, HandHeart } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

const industries = [
  { name: "Small business", icon: Building2 },
  { name: "Real estate", icon: Home },
  { name: "Financial services", icon: DollarSign },
  { name: "Government", icon: Landmark },
  { name: "Healthcare", icon: Heart },
  { name: "Education", icon: GraduationCap },
  { name: "Professional services", icon: Briefcase },
  { name: "Legal", icon: Scale },
  { name: "Agencies", icon: Users },
  { name: "Nonprofit", icon: HandHeart },
];

export const IndustriesDropdown = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="text-sm font-medium text-foreground hover:text-accent transition-colors flex items-center gap-1 outline-none">
        Industries <ChevronDown className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[500px] bg-white z-50 p-4">
        <div className="grid grid-cols-2 gap-2">
          {industries.map((industry) => (
            <DropdownMenuItem
              key={industry.name}
              className="flex items-center gap-3 p-3 cursor-pointer hover:bg-secondary rounded-md"
            >
              <industry.icon className="h-5 w-5 text-foreground" />
              <span className="text-sm text-foreground">{industry.name}</span>
            </DropdownMenuItem>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t">
          <button className="text-sm text-accent hover:underline flex items-center gap-2">
            See all industries
            <span>→</span>
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
