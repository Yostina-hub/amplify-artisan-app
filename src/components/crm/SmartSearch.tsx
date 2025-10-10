import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Sparkles, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SmartSearchProps {
  onSearch: (query: string, filters?: any) => void;
  placeholder?: string;
  suggestions?: string[];
}

export function SmartSearch({ onSearch, placeholder = "Search or ask AI...", suggestions = [] }: SmartSearchProps) {
  const [query, setQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleSearch = (value: string) => {
    setQuery(value);
    onSearch(value, { filters: activeFilters });
  };

  const addFilter = (filter: string) => {
    if (!activeFilters.includes(filter)) {
      const newFilters = [...activeFilters, filter];
      setActiveFilters(newFilters);
      onSearch(query, { filters: newFilters });
    }
  };

  const removeFilter = (filter: string) => {
    const newFilters = activeFilters.filter(f => f !== filter);
    setActiveFilters(newFilters);
    onSearch(query, { filters: newFilters });
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={placeholder}
          className="pl-10 pr-10 h-11 bg-card border-2"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSearch("")}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map((filter) => (
            <Badge key={filter} variant="secondary" className="gap-1">
              {filter}
              <X
                className="h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={() => removeFilter(filter)}
              />
            </Badge>
          ))}
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 p-3 rounded-lg border bg-card shadow-lg space-y-2 animate-fade-in">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <Sparkles className="h-3 w-3" />
            <span>AI Suggestions</span>
          </div>
          {suggestions.map((suggestion, i) => (
            <Button
              key={i}
              variant="ghost"
              size="sm"
              onClick={() => handleSearch(suggestion)}
              className="w-full justify-start text-left text-sm h-auto py-2"
            >
              {suggestion}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
