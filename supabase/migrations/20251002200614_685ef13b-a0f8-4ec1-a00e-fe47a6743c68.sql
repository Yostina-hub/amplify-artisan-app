-- Create industries table
CREATE TABLE public.industries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon_name TEXT NOT NULL,
  description TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  use_cases JSONB DEFAULT '[]'::jsonb,
  benefits JSONB DEFAULT '[]'::jsonb,
  case_study JSONB,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.industries ENABLE ROW LEVEL SECURITY;

-- Anyone can view active industries
CREATE POLICY "Anyone can view active industries"
ON public.industries
FOR SELECT
USING (is_active = true);

-- Admins can manage all industries
CREATE POLICY "Admins can manage industries"
ON public.industries
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default industries
INSERT INTO public.industries (name, display_name, slug, icon_name, description, features, use_cases, benefits, display_order) VALUES
('small_business', 'Small Business', 'small-business', 'Building2', 
 'Empower your small business with affordable, easy-to-use social media management tools designed for entrepreneurs and local businesses.',
 '["Affordable pricing plans", "Easy-to-use interface", "Multi-platform scheduling", "Basic analytics and reporting", "Customer engagement tools"]'::jsonb,
 '["Manage social presence across platforms", "Engage with local customers", "Share promotions and updates", "Build brand awareness"]'::jsonb,
 '["Save time with bulk scheduling", "Increase local visibility", "Grow customer base organically", "Compete with larger brands"]'::jsonb,
 1),

('real_estate', 'Real Estate', 'real-estate', 'Home',
 'Showcase properties, connect with buyers, and build your real estate brand with specialized social media tools.',
 '["Property listing templates", "Virtual tour integration", "Lead generation tools", "Market insights", "Client testimonial showcase"]'::jsonb,
 '["Share new property listings", "Host virtual open houses", "Showcase sold properties", "Share market updates"]'::jsonb,
 '["Generate qualified leads", "Build credibility", "Expand market reach", "Automate property promotion"]'::jsonb,
 2),

('financial_services', 'Financial Services', 'financial-services', 'DollarSign',
 'Build trust and educate clients with compliant, professional social media content for financial advisors and institutions.',
 '["Compliance-ready templates", "Educational content library", "Client communication tools", "Performance tracking", "Secure messaging"]'::jsonb,
 '["Share financial tips", "Educate about services", "Build thought leadership", "Client onboarding"]'::jsonb,
 '["Maintain compliance", "Establish expertise", "Attract new clients", "Strengthen relationships"]'::jsonb,
 3),

('government', 'Government', 'government', 'Landmark',
 'Improve citizen engagement and transparency with social media tools designed for government agencies and public services.',
 '["Public announcement system", "Crisis communication tools", "Citizen engagement features", "Multi-language support", "Accessibility compliance"]'::jsonb,
 '["Share public updates", "Emergency communications", "Community engagement", "Public education campaigns"]'::jsonb,
 '["Improve transparency", "Reach more citizens", "Foster community trust", "Streamline communications"]'::jsonb,
 4),

('healthcare', 'Healthcare', 'healthcare', 'Heart',
 'Connect with patients and share health information while maintaining HIPAA compliance and professional standards.',
 '["HIPAA-compliant platform", "Patient education content", "Appointment reminders", "Health awareness campaigns", "Staff spotlight features"]'::jsonb,
 '["Share health tips", "Promote services", "Patient testimonials", "Community health education"]'::jsonb,
 '["Build patient trust", "Increase appointments", "Educate community", "Enhance reputation"]'::jsonb,
 5),

('education', 'Education', 'education', 'GraduationCap',
 'Engage students, parents, and alumni with dynamic social media content that builds your educational brand.',
 '["Event calendar integration", "Student achievement showcase", "Parent communication tools", "Alumni engagement", "Enrollment campaigns"]'::jsonb,
 '["Share campus updates", "Celebrate achievements", "Promote events", "Alumni networking"]'::jsonb,
 '["Increase enrollment", "Strengthen community", "Showcase achievements", "Improve communications"]'::jsonb,
 6),

('professional_services', 'Professional Services', 'professional-services', 'Briefcase',
 'Position your firm as an industry leader with thought leadership content and professional networking tools.',
 '["Thought leadership content", "Case study templates", "Client success stories", "Industry insights", "Professional networking"]'::jsonb,
 '["Share expertise", "Showcase projects", "Build authority", "Network with peers"]'::jsonb,
 '["Generate quality leads", "Establish credibility", "Attract top talent", "Expand client base"]'::jsonb,
 7),

('legal', 'Legal', 'legal', 'Scale',
 'Build your legal practice with compliant, professional social media management for law firms and legal professionals.',
 '["Bar-compliant content", "Legal education resources", "Client testimonials", "Practice area promotion", "Legal news sharing"]'::jsonb,
 '["Share legal insights", "Promote services", "Client education", "Thought leadership"]'::jsonb,
 '["Attract new clients", "Build credibility", "Educate public", "Professional reputation"]'::jsonb,
 8),

('agencies', 'Marketing Agencies', 'agencies', 'Users',
 'Scale your agency operations with multi-client management, white-label solutions, and comprehensive reporting tools.',
 '["Multi-client dashboard", "White-label reports", "Team collaboration", "Client approval workflows", "Performance analytics"]'::jsonb,
 '["Manage multiple clients", "Streamline workflows", "Generate reports", "Collaborate with teams"]'::jsonb,
 '["Scale operations", "Improve efficiency", "Impress clients", "Increase retention"]'::jsonb,
 9),

('nonprofit', 'Nonprofit', 'nonprofit', 'HandHeart',
 'Amplify your mission and engage donors with social media tools designed for nonprofit organizations.',
 '["Donation campaign tools", "Volunteer engagement", "Impact storytelling", "Event promotion", "Donor recognition"]'::jsonb,
 '["Share impact stories", "Promote fundraisers", "Recruit volunteers", "Donor appreciation"]'::jsonb,
 '["Increase donations", "Grow volunteer base", "Amplify mission", "Build community"]'::jsonb,
 10);

-- Create trigger for updated_at
CREATE TRIGGER update_industries_updated_at
  BEFORE UPDATE ON public.industries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();