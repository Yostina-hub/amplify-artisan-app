import { 
  PenTool, 
  Calendar, 
  CalendarDays, 
  Image, 
  Inbox, 
  Radio, 
  Users, 
  BarChart3, 
  Target, 
  UserCheck, 
  UsersIcon, 
  CheckCircle, 
  Plug, 
  Settings 
} from 'lucide-react';
import { Service, ServiceCategory } from './types';

export const SERVICES: Service[] = [
  // Create & Publish
  { 
    id: 'composer', 
    title: 'Composer', 
    value: 'Write once, publish everywhere.', 
    path: '/composer',
    icon: PenTool,
    category: 'create'
  },
  { 
    id: 'scheduler', 
    title: 'Scheduler', 
    value: 'Plan posts across channels.', 
    path: '/calendar',
    icon: Calendar,
    category: 'create'
  },
  { 
    id: 'calendar', 
    title: 'Calendar', 
    value: 'See your week at a glance.', 
    path: '/calendar',
    icon: CalendarDays,
    category: 'create'
  },
  { 
    id: 'assets', 
    title: 'Assets', 
    value: 'Store brand-safe media.', 
    path: '/composer',
    icon: Image,
    category: 'create'
  },
  
  // Engage
  { 
    id: 'inbox', 
    title: 'Inbox', 
    value: 'Reply to DMs & comments faster.', 
    path: '/social-listening',
    icon: Inbox,
    category: 'engage'
  },
  { 
    id: 'streams', 
    title: 'Streams', 
    value: 'Monitor keywords & mentions.', 
    path: '/social-listening',
    icon: Radio,
    category: 'engage'
  },
  { 
    id: 'profiles', 
    title: 'Profiles', 
    value: 'One view of each follower.', 
    path: '/brand-monitoring',
    icon: Users,
    category: 'engage'
  },
  
  // Grow
  { 
    id: 'analytics', 
    title: 'Analytics', 
    value: 'Understand what works.', 
    path: '/analytics',
    icon: BarChart3,
    category: 'grow'
  },
  { 
    id: 'ads', 
    title: 'Ads', 
    value: 'Boost top content.', 
    path: '/ad-campaigns',
    icon: Target,
    category: 'grow'
  },
  { 
    id: 'influencers', 
    title: 'Influencers', 
    value: 'Partner with creators.', 
    path: '/influencer-marketing',
    icon: UserCheck,
    category: 'grow'
  },
  { 
    id: 'audience', 
    title: 'Audience', 
    value: 'Know who you\'re reaching.', 
    path: '/social-media-metrics',
    icon: UsersIcon,
    category: 'grow'
  },
  
  // Admin & Integrations
  { 
    id: 'team', 
    title: 'Team', 
    value: 'Invite teammates & set roles.', 
    path: '/settings',
    icon: UsersIcon,
    category: 'admin'
  },
  { 
    id: 'approvals', 
    title: 'Approvals', 
    value: 'Review before publishing.', 
    path: '/agents',
    icon: CheckCircle,
    category: 'admin'
  },
  { 
    id: 'integrations', 
    title: 'Integrations', 
    value: 'Connect your tools.', 
    path: '/settings',
    icon: Plug,
    category: 'admin'
  },
  { 
    id: 'settings', 
    title: 'Settings', 
    value: 'Brand, compliance, and more.', 
    path: '/settings',
    icon: Settings,
    category: 'admin'
  }
];

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: 'create',
    title: 'Create & Publish',
    services: SERVICES.filter(s => s.category === 'create')
  },
  {
    id: 'engage',
    title: 'Engage',
    services: SERVICES.filter(s => s.category === 'engage')
  },
  {
    id: 'grow',
    title: 'Grow',
    services: SERVICES.filter(s => s.category === 'grow')
  },
  {
    id: 'admin',
    title: 'Admin & Integrations',
    services: SERVICES.filter(s => s.category === 'admin')
  }
];
