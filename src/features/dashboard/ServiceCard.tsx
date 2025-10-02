import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { Service } from './types';

interface ServiceCardProps {
  service: Service;
  onAIClick: (service: Service) => void;
}

export const ServiceCard = ({ service, onAIClick }: ServiceCardProps) => {
  const navigate = useNavigate();
  const Icon = service.icon;

  const handlePrimaryClick = () => {
    navigate(service.path);
  };

  const handleAIClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAIClick(service);
  };

  return (
    <Card className="relative group hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">{service.title}</h3>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleAIClick}
          >
            <Sparkles className="h-4 w-4 text-primary" />
          </Button>
        </div>

        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {service.value}
        </p>

        <Button 
          onClick={handlePrimaryClick}
          className="w-full"
          size="sm"
        >
          Open {service.title}
        </Button>
      </CardContent>
    </Card>
  );
};
