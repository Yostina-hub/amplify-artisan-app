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
  Settings,
  Briefcase,
  Building2,
  FileText,
  Phone,
  DollarSign,
  Mail,
  FolderOpen,
  MapPin,
  HeadphonesIcon,
  ClipboardList,
  FileCheck,
  Sparkles,
  Zap,
  MessageSquare,
  Brain,
  Blocks,
  Workflow,
  PieChart,
  Shield,
  Wrench,
  CreditCard,
  FileSignature
} from 'lucide-react';
import { Service, ServiceCategory } from './types';

export const SERVICES: Service[] = [
  // Social Media & Content
  { 
    id: 'composer', 
    title: 'Composer', 
    value: 'Write once, publish everywhere.', 
    path: '/composer',
    icon: PenTool,
    category: 'social'
  },
  { 
    id: 'calendar', 
    title: 'Calendar', 
    value: 'Plan posts across channels.', 
    path: '/calendar',
    icon: Calendar,
    category: 'social'
  },
  { 
    id: 'social-inbox', 
    title: 'Social Inbox', 
    value: 'Reply to DMs & comments.', 
    path: '/social-inbox',
    icon: Inbox,
    category: 'social'
  },
  { 
    id: 'social-listening', 
    title: 'Social Listening', 
    value: 'Monitor keywords & mentions.', 
    path: '/social-listening',
    icon: Radio,
    category: 'social'
  },
  { 
    id: 'brand-monitoring', 
    title: 'Brand Monitoring', 
    value: 'Track your brand reputation.', 
    path: '/brand-monitoring',
    icon: Users,
    category: 'social'
  },
  { 
    id: 'social-intelligence', 
    title: 'Social Intelligence', 
    value: 'AI-powered social insights.', 
    path: '/social-intelligence',
    icon: Brain,
    category: 'social'
  },
  { 
    id: 'social-metrics', 
    title: 'Social Metrics', 
    value: 'Track engagement & reach.', 
    path: '/social-media-metrics',
    icon: BarChart3,
    category: 'social'
  },
  
  // Marketing & Growth
  { 
    id: 'ad-campaigns', 
    title: 'Ad Campaigns', 
    value: 'Boost your best content.', 
    path: '/ad-campaigns',
    icon: Target,
    category: 'marketing'
  },
  { 
    id: 'influencers', 
    title: 'Influencer Marketing', 
    value: 'Partner with creators.', 
    path: '/influencer-marketing',
    icon: UserCheck,
    category: 'marketing'
  },
  { 
    id: 'email-marketing', 
    title: 'Email Marketing', 
    value: 'Send targeted campaigns.', 
    path: '/email-marketing',
    icon: Mail,
    category: 'marketing'
  },
  { 
    id: 'analytics', 
    title: 'Analytics', 
    value: 'Measure what matters.', 
    path: '/analytics',
    icon: BarChart3,
    category: 'marketing'
  },
  
  // AI & Automation
  { 
    id: 'ai-studio', 
    title: 'AI Studio', 
    value: 'Generate content with AI.', 
    path: '/ai-studio',
    icon: Sparkles,
    category: 'ai'
  },
  { 
    id: 'automation', 
    title: 'Automation', 
    value: 'Automate workflows.', 
    path: '/automation',
    icon: Zap,
    category: 'ai'
  },
  { 
    id: 'ai-analytics', 
    title: 'AI Analytics', 
    value: 'Smart insights & predictions.', 
    path: '/ai-analytics',
    icon: Brain,
    category: 'ai'
  },
  
  // CRM & Sales
  { 
    id: 'contacts', 
    title: 'Contacts', 
    value: 'Manage customer relationships.', 
    path: '/contacts',
    icon: Users,
    category: 'crm'
  },
  { 
    id: 'accounts', 
    title: 'Accounts', 
    value: 'Track company accounts.', 
    path: '/accounts',
    icon: Building2,
    category: 'crm'
  },
  { 
    id: 'leads', 
    title: 'Leads', 
    value: 'Capture & nurture leads.', 
    path: '/leads',
    icon: UserCheck,
    category: 'crm'
  },
  { 
    id: 'pipeline', 
    title: 'Sales Pipeline', 
    value: 'Visualize your deals.', 
    path: '/pipeline',
    icon: BarChart3,
    category: 'crm'
  },
  { 
    id: 'activities', 
    title: 'Activities', 
    value: 'Log calls, meetings & tasks.', 
    path: '/activities',
    icon: ClipboardList,
    category: 'crm'
  },
  { 
    id: 'products', 
    title: 'Products', 
    value: 'Manage your product catalog.', 
    path: '/products',
    icon: Briefcase,
    category: 'crm'
  },
  { 
    id: 'quotes', 
    title: 'Quotes', 
    value: 'Create & send proposals.', 
    path: '/quotes',
    icon: FileText,
    category: 'crm'
  },
  { 
    id: 'invoices', 
    title: 'Invoices', 
    value: 'Bill your customers.', 
    path: '/invoices',
    icon: FileCheck,
    category: 'crm'
  },
  { 
    id: 'payments', 
    title: 'Payments', 
    value: 'Process transactions.', 
    path: '/payments',
    icon: DollarSign,
    category: 'crm'
  },
  { 
    id: 'reports', 
    title: 'Reports', 
    value: 'Analyze sales performance.', 
    path: '/reports',
    icon: PieChart,
    category: 'crm'
  },
  { 
    id: 'documents', 
    title: 'Documents', 
    value: 'Store & share files.', 
    path: '/documents',
    icon: FolderOpen,
    category: 'crm'
  },
  { 
    id: 'territory', 
    title: 'Territory Management', 
    value: 'Organize sales regions.', 
    path: '/territory-management',
    icon: MapPin,
    category: 'crm'
  },
  { 
    id: 'contracts', 
    title: 'Contract Management', 
    value: 'Manage legal agreements.', 
    path: '/contract-management',
    icon: FileSignature,
    category: 'crm'
  },
  
  // Service & Support
  { 
    id: 'customer-support', 
    title: 'Customer Support', 
    value: 'Resolve customer issues.', 
    path: '/customer-support',
    icon: HeadphonesIcon,
    category: 'service'
  },
  { 
    id: 'call-center', 
    title: 'Call Center', 
    value: 'Make & receive calls.', 
    path: '/call-center',
    icon: Phone,
    category: 'service'
  },
  { 
    id: 'call-reports', 
    title: 'Call Reports', 
    value: 'Track call metrics.', 
    path: '/call-reports',
    icon: BarChart3,
    category: 'service'
  },
  
  // Project Management
  { 
    id: 'projects', 
    title: 'Project Management', 
    value: 'Manage projects & tasks.', 
    path: '/project-management',
    icon: Blocks,
    category: 'projects'
  },
  
  // Enterprise Builders
  { 
    id: 'module-builder', 
    title: 'Module Builder', 
    value: 'Create custom modules.', 
    path: '/module-builder',
    icon: Blocks,
    category: 'builders',
    requiresPermission: 'module_builder.view'
  },
  { 
    id: 'form-builder', 
    title: 'Form Builder', 
    value: 'Design custom forms.', 
    path: '/form-builder',
    icon: FileText,
    category: 'builders',
    requiresPermission: 'form_builder.view'
  },
  { 
    id: 'workflow-builder', 
    title: 'Workflow Builder', 
    value: 'Automate business processes.', 
    path: '/workflow-builder',
    icon: Workflow,
    category: 'builders',
    requiresPermission: 'workflow_builder.view'
  },
  { 
    id: 'reporting-dashboard', 
    title: 'Reporting Dashboard', 
    value: 'Build custom dashboards.', 
    path: '/reporting-dashboard',
    icon: PieChart,
    category: 'builders'
  },
  
  // Settings & Admin
  { 
    id: 'settings', 
    title: 'Settings', 
    value: 'Configure your account.', 
    path: '/settings',
    icon: Settings,
    category: 'admin'
  },
  { 
    id: 'content-moderation', 
    title: 'Content Moderation', 
    value: 'Review & moderate content.', 
    path: '/admin/moderation',
    icon: Shield,
    category: 'admin',
    requiresRole: 'admin'
  },
  { 
    id: 'help', 
    title: 'Help & Support', 
    value: 'Get help when you need it.', 
    path: '/help',
    icon: HeadphonesIcon,
    category: 'admin'
  }
];

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: 'social',
    title: 'Social Media & Content',
    services: SERVICES.filter(s => s.category === 'social')
  },
  {
    id: 'marketing',
    title: 'Marketing & Growth',
    services: SERVICES.filter(s => s.category === 'marketing')
  },
  {
    id: 'ai',
    title: 'AI & Automation',
    services: SERVICES.filter(s => s.category === 'ai')
  },
  {
    id: 'crm',
    title: 'CRM & Sales',
    services: SERVICES.filter(s => s.category === 'crm')
  },
  {
    id: 'service',
    title: 'Service & Support',
    services: SERVICES.filter(s => s.category === 'service')
  },
  {
    id: 'projects',
    title: 'Project Management',
    services: SERVICES.filter(s => s.category === 'projects')
  },
  {
    id: 'builders',
    title: 'Enterprise Builders',
    services: SERVICES.filter(s => s.category === 'builders')
  },
  {
    id: 'admin',
    title: 'Settings & Admin',
    services: SERVICES.filter(s => s.category === 'admin')
  }
];
