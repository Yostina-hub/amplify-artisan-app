import { Building2, Home, DollarSign, Landmark, Heart, GraduationCap, Briefcase, Scale, Users, HandHeart, ChevronDown, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const iconMap: Record<string, any> = {
  Building2,
  Home,
  DollarSign,
  Landmark,
  Heart,
  GraduationCap,
  Briefcase,
  Scale,
  Users,
  HandHeart,
};

export const IndustriesDropdown = () => {
  const navigate = useNavigate();
  
  const { data: industries, isLoading } = useQuery({
    queryKey: ['industries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('industries')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="text-sm font-medium text-foreground hover:text-accent transition-colors flex items-center gap-1 outline-none">
        Industries <ChevronDown className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[600px] bg-white z-50 p-4 max-h-[600px] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-accent" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              {industries?.map((industry) => {
                const Icon = iconMap[industry.icon_name] || Building2;
                return (
                  <DropdownMenuItem
                    key={industry.id}
                    className="flex flex-col items-start gap-2 p-4 cursor-pointer hover:bg-secondary rounded-md"
                    onClick={() => navigate(`/industry/${industry.slug}`)}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <Icon className="h-5 w-5 text-accent flex-shrink-0" />
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
              <button className="text-sm text-accent hover:underline flex items-center gap-2 w-full justify-center">
                Explore industry solutions
                <span>→</span>
              </button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};