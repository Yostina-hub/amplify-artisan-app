import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, PieChart, Table2, FormInput, List, Grid3x3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ComponentTypeSelectorProps {
  selectedTypes: string[];
  onToggleType: (type: string) => void;
}

const COMPONENT_TYPES = [
  {
    id: 'form',
    name: 'Form View',
    description: 'Create and edit records with a form',
    icon: FormInput,
    color: 'text-blue-500',
  },
  {
    id: 'table',
    name: 'Table View',
    description: 'Display records in a paginated table',
    icon: Table2,
    color: 'text-green-500',
  },
  {
    id: 'list',
    name: 'List View',
    description: 'Show records in a card-based list',
    icon: List,
    color: 'text-purple-500',
  },
  {
    id: 'grid',
    name: 'Grid View',
    description: 'Display records in a responsive grid',
    icon: Grid3x3,
    color: 'text-orange-500',
  },
  {
    id: 'chart_bar',
    name: 'Bar Chart',
    description: 'Visualize data with bar charts',
    icon: BarChart3,
    color: 'text-cyan-500',
  },
  {
    id: 'chart_pie',
    name: 'Pie Chart',
    description: 'Show data distribution in pie charts',
    icon: PieChart,
    color: 'text-pink-500',
  },
];

export function ComponentTypeSelector({ selectedTypes, onToggleType }: ComponentTypeSelectorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Component Types</CardTitle>
        <CardDescription>
          Select which components to generate for this module
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {COMPONENT_TYPES.map((type) => {
            const Icon = type.icon;
            const isSelected = selectedTypes.includes(type.id);
            
            return (
              <Button
                key={type.id}
                variant={isSelected ? "default" : "outline"}
                className="h-auto p-4 justify-start"
                onClick={() => onToggleType(type.id)}
              >
                <div className="flex items-start gap-3 w-full">
                  <Icon className={`h-5 w-5 ${isSelected ? '' : type.color}`} />
                  <div className="text-left flex-1">
                    <div className="font-medium">{type.name}</div>
                    <div className="text-xs text-muted-foreground font-normal mt-1">
                      {type.description}
                    </div>
                  </div>
                  {isSelected && (
                    <Badge variant="secondary" className="ml-2">✓</Badge>
                  )}
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
