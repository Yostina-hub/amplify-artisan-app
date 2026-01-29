import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  LayoutGrid,
  DollarSign,
  Users,
  Package,
  BarChart3,
  MessageSquare,
  Shield,
  Calendar,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  label: string;
  icon: React.ReactNode;
  count: number;
  color: string;
}

const categories: Category[] = [
  { id: "all", label: "All Reports", icon: <LayoutGrid className="h-4 w-4" />, count: 24, color: "from-slate-500 to-slate-600" },
  { id: "sales", label: "Sales", icon: <DollarSign className="h-4 w-4" />, count: 8, color: "from-green-500 to-emerald-600" },
  { id: "crm", label: "CRM", icon: <Users className="h-4 w-4" />, count: 6, color: "from-blue-500 to-cyan-600" },
  { id: "inventory", label: "Inventory", icon: <Package className="h-4 w-4" />, count: 4, color: "from-amber-500 to-orange-600" },
  { id: "analytics", label: "Analytics", icon: <BarChart3 className="h-4 w-4" />, count: 5, color: "from-violet-500 to-purple-600" },
  { id: "social", label: "Social", icon: <MessageSquare className="h-4 w-4" />, count: 3, color: "from-pink-500 to-rose-600" },
  { id: "security", label: "Security", icon: <Shield className="h-4 w-4" />, count: 2, color: "from-red-500 to-red-600" },
];

interface ReportCategoriesProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export function ReportCategories({ selectedCategory, onCategoryChange }: ReportCategoriesProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => {
        const isSelected = selectedCategory === category.id;
        
        return (
          <Button
            key={category.id}
            variant={isSelected ? "default" : "outline"}
            size="sm"
            onClick={() => onCategoryChange(category.id)}
            className={cn(
              "h-9 gap-2 transition-all duration-300",
              isSelected && "shadow-lg",
              !isSelected && "hover:border-primary/50"
            )}
          >
            <span className={cn(
              "transition-colors",
              isSelected ? "text-primary-foreground" : "text-muted-foreground"
            )}>
              {category.icon}
            </span>
            <span>{category.label}</span>
            <Badge 
              variant={isSelected ? "secondary" : "outline"} 
              className={cn(
                "ml-1 h-5 px-1.5 text-[10px]",
                isSelected && "bg-primary-foreground/20 text-primary-foreground border-0"
              )}
            >
              {category.count}
            </Badge>
          </Button>
        );
      })}
    </div>
  );
}
