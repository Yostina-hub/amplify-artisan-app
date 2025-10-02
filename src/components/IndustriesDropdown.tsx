import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import * as LucideIcons from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const IndustriesDropdown = () => {
  const { data: industries } = useQuery({
    queryKey: ["industries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("industries")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const getIcon = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName] || LucideIcons.Building2;
    return Icon;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="text-sm font-medium text-foreground hover:text-accent transition-colors flex items-center gap-1 outline-none">
        Industries <LucideIcons.ChevronDown className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[600px] bg-white z-50 p-4">
        <div className="grid grid-cols-2 gap-2">
          {industries?.map((industry) => {
            const Icon = getIcon(industry.icon_name);
            return (
              <DropdownMenuItem
                key={industry.id}
                className="flex flex-col items-start gap-2 p-4 cursor-pointer hover:bg-secondary rounded-md"
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-accent" />
                  <span className="text-sm font-semibold text-foreground">{industry.display_name}</span>
                </div>
                {industry.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 ml-8">
                    {industry.description}
                  </p>
                )}
              </DropdownMenuItem>
            );
          })}
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
