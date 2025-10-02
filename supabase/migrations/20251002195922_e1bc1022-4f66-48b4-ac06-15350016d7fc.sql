-- Create landing_page_content table for managing public page sections
CREATE TABLE public.landing_page_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text NOT NULL UNIQUE,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.landing_page_content ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view active landing content"
  ON public.landing_page_content
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage landing content"
  ON public.landing_page_content
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default content
INSERT INTO public.landing_page_content (section_key, content) VALUES
('hero', '{
  "title": "Drive real business impact with",
  "titleHighlight": "real-time social insights.",
  "subtitle": "SocialHub makes it easy.",
  "description": "Manage all your social media channels, schedule content, analyze performance, and engage with your audience—all from one powerful platform.",
  "ctaPrimary": "Start your free trial",
  "ctaSecondary": "Request a demo"
}'::jsonb),
('pricing_professional', '{
  "name": "Professional",
  "price": 99,
  "description": "Perfect for small teams",
  "features": [
    "Up to 10 social accounts",
    "Unlimited scheduling",
    "Advanced analytics",
    "5 team members"
  ]
}'::jsonb),
('pricing_team', '{
  "name": "Team",
  "price": 249,
  "description": "For growing businesses",
  "featured": true,
  "features": [
    "Up to 20 social accounts",
    "Everything in Professional",
    "AI content assistant",
    "10 team members",
    "Priority support"
  ]
}'::jsonb),
('pricing_business', '{
  "name": "Business",
  "price": 499,
  "description": "For large organizations",
  "features": [
    "Unlimited social accounts",
    "Everything in Team",
    "Custom integrations",
    "Unlimited team members",
    "Dedicated support"
  ]
}'::jsonb),
('features', '{
  "title": "Everything you need to succeed on social",
  "subtitle": "Powerful features designed to help you grow your brand and engage your audience",
  "items": [
    {
      "title": "Smart Scheduling",
      "description": "Plan and publish content across all your social platforms from one unified calendar",
      "icon": "Calendar"
    },
    {
      "title": "Real-Time Analytics",
      "description": "Track performance metrics and gain actionable insights with comprehensive analytics",
      "icon": "BarChart3"
    },
    {
      "title": "Unified Inbox",
      "description": "Manage all your social conversations and comments from a single dashboard",
      "icon": "MessageSquare"
    },
    {
      "title": "Growth Insights",
      "description": "Monitor audience growth and optimize your social media strategy with AI-powered recommendations",
      "icon": "TrendingUp"
    },
    {
      "title": "AI-Powered Content",
      "description": "Generate engaging content ideas and captions with built-in AI assistance",
      "icon": "Zap"
    },
    {
      "title": "Team Collaboration",
      "description": "Collaborate seamlessly with approval workflows and role-based permissions",
      "icon": "Shield"
    }
  ]
}'::jsonb);

-- Trigger for updated_at
CREATE TRIGGER update_landing_page_content_updated_at
  BEFORE UPDATE ON public.landing_page_content
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();