export interface Service {
  id: string;
  title: string;
  value: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'social' | 'marketing' | 'ai' | 'crm' | 'service' | 'projects' | 'builders' | 'admin';
  requiresPermission?: string;
  requiresRole?: string;
}

export interface ServiceCategory {
  id: string;
  title: string;
  services: Service[];
}
