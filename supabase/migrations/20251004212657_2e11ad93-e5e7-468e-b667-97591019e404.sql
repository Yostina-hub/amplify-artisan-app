-- Phase 1: Module Builder Tables

-- Table to store custom modules (entities)
CREATE TABLE IF NOT EXISTS public.custom_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  icon_name TEXT DEFAULT 'Box',
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  UNIQUE(company_id, name)
);

-- Table to store fields for custom modules
CREATE TABLE IF NOT EXISTS public.custom_module_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES public.custom_modules(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  field_type TEXT NOT NULL, -- text, number, date, boolean, select, multiselect, etc.
  is_required BOOLEAN DEFAULT false,
  is_unique BOOLEAN DEFAULT false,
  default_value TEXT,
  validation_rules JSONB DEFAULT '{}'::jsonb,
  field_options JSONB DEFAULT '[]'::jsonb, -- for select/multiselect types
  field_order INTEGER DEFAULT 0,
  help_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(module_id, field_name)
);

-- Table to store relationships between modules
CREATE TABLE IF NOT EXISTS public.custom_module_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_module_id UUID NOT NULL REFERENCES public.custom_modules(id) ON DELETE CASCADE,
  target_module_id UUID NOT NULL REFERENCES public.custom_modules(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL, -- one_to_one, one_to_many, many_to_many
  relationship_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(source_module_id, target_module_id, relationship_name)
);

-- Table to store actual data for custom modules (dynamic schema)
CREATE TABLE IF NOT EXISTS public.custom_module_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES public.custom_modules(id) ON DELETE CASCADE,
  company_id UUID NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.custom_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_module_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_module_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_module_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies for custom_modules
CREATE POLICY "Admins can manage all modules"
  ON public.custom_modules FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Companies can view their modules"
  ON public.custom_modules FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Companies can create their modules"
  ON public.custom_modules FOR INSERT
  WITH CHECK (company_id = get_user_company_id(auth.uid()) AND created_by = auth.uid());

CREATE POLICY "Companies can update their modules"
  ON public.custom_modules FOR UPDATE
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Companies can delete their modules"
  ON public.custom_modules FOR DELETE
  USING (company_id = get_user_company_id(auth.uid()));

-- RLS Policies for custom_module_fields
CREATE POLICY "Admins can manage all fields"
  ON public.custom_module_fields FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view fields for their company modules"
  ON public.custom_module_fields FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.custom_modules
    WHERE id = custom_module_fields.module_id
    AND company_id = get_user_company_id(auth.uid())
  ));

CREATE POLICY "Users can create fields for their company modules"
  ON public.custom_module_fields FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.custom_modules
    WHERE id = custom_module_fields.module_id
    AND company_id = get_user_company_id(auth.uid())
  ));

CREATE POLICY "Users can update fields for their company modules"
  ON public.custom_module_fields FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.custom_modules
    WHERE id = custom_module_fields.module_id
    AND company_id = get_user_company_id(auth.uid())
  ));

CREATE POLICY "Users can delete fields for their company modules"
  ON public.custom_module_fields FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.custom_modules
    WHERE id = custom_module_fields.module_id
    AND company_id = get_user_company_id(auth.uid())
  ));

-- RLS Policies for custom_module_relationships
CREATE POLICY "Admins can manage all relationships"
  ON public.custom_module_relationships FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view relationships for their company modules"
  ON public.custom_module_relationships FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.custom_modules
    WHERE id = custom_module_relationships.source_module_id
    AND company_id = get_user_company_id(auth.uid())
  ));

CREATE POLICY "Users can create relationships for their company modules"
  ON public.custom_module_relationships FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.custom_modules
    WHERE id = custom_module_relationships.source_module_id
    AND company_id = get_user_company_id(auth.uid())
  ));

CREATE POLICY "Users can delete relationships for their company modules"
  ON public.custom_module_relationships FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.custom_modules
    WHERE id = custom_module_relationships.source_module_id
    AND company_id = get_user_company_id(auth.uid())
  ));

-- RLS Policies for custom_module_data
CREATE POLICY "Admins can manage all custom data"
  ON public.custom_module_data FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their company's custom data"
  ON public.custom_module_data FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can create their company's custom data"
  ON public.custom_module_data FOR INSERT
  WITH CHECK (company_id = get_user_company_id(auth.uid()) AND created_by = auth.uid());

CREATE POLICY "Users can update their company's custom data"
  ON public.custom_module_data FOR UPDATE
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete their company's custom data"
  ON public.custom_module_data FOR DELETE
  USING (company_id = get_user_company_id(auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER update_custom_modules_updated_at
  BEFORE UPDATE ON public.custom_modules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_custom_module_fields_updated_at
  BEFORE UPDATE ON public.custom_module_fields
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_custom_module_data_updated_at
  BEFORE UPDATE ON public.custom_module_data
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();