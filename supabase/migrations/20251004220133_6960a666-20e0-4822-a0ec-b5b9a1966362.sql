-- Create activities table for tracking interactions
CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  subject TEXT NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('call', 'meeting', 'email', 'task', 'note')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  description TEXT,
  related_to_type TEXT CHECK (related_to_type IN ('lead', 'contact', 'account', 'opportunity')),
  related_to_id UUID,
  assigned_to UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create notes table for comments and documentation
CREATE TABLE public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  related_to_type TEXT NOT NULL CHECK (related_to_type IN ('lead', 'contact', 'account', 'opportunity')),
  related_to_id UUID NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_activities_company ON public.activities(company_id);
CREATE INDEX idx_activities_created_by ON public.activities(created_by);
CREATE INDEX idx_activities_assigned_to ON public.activities(assigned_to);
CREATE INDEX idx_activities_due_date ON public.activities(due_date);
CREATE INDEX idx_activities_related ON public.activities(related_to_type, related_to_id);
CREATE INDEX idx_notes_company ON public.notes(company_id);
CREATE INDEX idx_notes_created_by ON public.notes(created_by);
CREATE INDEX idx_notes_related ON public.notes(related_to_type, related_to_id);

-- Enable RLS
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for activities
CREATE POLICY "Admins can manage all activities"
  ON public.activities FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their company activities"
  ON public.activities FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can insert their company activities"
  ON public.activities FOR INSERT
  WITH CHECK (
    company_id = get_user_company_id(auth.uid()) 
    AND created_by = auth.uid()
  );

CREATE POLICY "Users can update their company activities"
  ON public.activities FOR UPDATE
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete their company activities"
  ON public.activities FOR DELETE
  USING (company_id = get_user_company_id(auth.uid()));

-- RLS Policies for notes
CREATE POLICY "Admins can manage all notes"
  ON public.notes FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their company notes"
  ON public.notes FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can insert their company notes"
  ON public.notes FOR INSERT
  WITH CHECK (
    company_id = get_user_company_id(auth.uid()) 
    AND created_by = auth.uid()
  );

CREATE POLICY "Users can update their company notes"
  ON public.notes FOR UPDATE
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete their company notes"
  ON public.notes FOR DELETE
  USING (company_id = get_user_company_id(auth.uid()));

-- Add updated_at triggers
CREATE TRIGGER update_activities_updated_at
  BEFORE UPDATE ON public.activities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON public.notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();