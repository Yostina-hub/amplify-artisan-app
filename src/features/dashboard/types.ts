export interface Service {
  id: string;
  title: string;
  value: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'create' | 'engage' | 'grow' | 'admin';
}

export interface ServiceCategory {
  id: string;
  title: string;
  services: Service[];
}
