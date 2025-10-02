import { ServiceCard } from './ServiceCard';
import { Service } from './types';

interface ServiceSectionProps {
  title: string;
  services: Service[];
  onAIClick: (service: Service) => void;
}

export const ServiceSection = ({ title, services, onAIClick }: ServiceSectionProps) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map(service => (
          <ServiceCard 
            key={service.id} 
            service={service}
            onAIClick={onAIClick}
          />
        ))}
      </div>
    </div>
  );
};
