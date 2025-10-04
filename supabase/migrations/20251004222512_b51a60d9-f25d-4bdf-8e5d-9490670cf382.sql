-- Create documents table for managing files
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  folder_path TEXT DEFAULT '/',
  related_to_type TEXT CHECK (related_to_type IN ('contact', 'lead', 'account', 'deal', 'quote', 'invoice')),
  related_to_id UUID,
  tags TEXT[] DEFAULT '{}',
  is_shared BOOLEAN DEFAULT false,
  shared_with UUID[],
  version INTEGER DEFAULT 1,
  parent_document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create document_access_logs table
CREATE TABLE public.document_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('view', 'download', 'share', 'delete', 'update')),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_documents_company ON public.documents(company_id);
CREATE INDEX idx_documents_created_by ON public.documents(created_by);
CREATE INDEX idx_documents_folder_path ON public.documents(folder_path);
CREATE INDEX idx_documents_related ON public.documents(related_to_type, related_to_id);
CREATE INDEX idx_documents_tags ON public.documents USING GIN(tags);
CREATE INDEX idx_document_access_logs_document ON public.document_access_logs(document_id);
CREATE INDEX idx_document_access_logs_user ON public.document_access_logs(user_id);

-- Enable RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_access_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for documents
CREATE POLICY "Admins can manage all documents"
  ON public.documents FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their company documents"
  ON public.documents FOR SELECT
  USING (
    company_id = get_user_company_id(auth.uid()) OR
    auth.uid() = ANY(shared_with)
  );

CREATE POLICY "Users can insert their company documents"
  ON public.documents FOR INSERT
  WITH CHECK (
    company_id = get_user_company_id(auth.uid()) 
    AND created_by = auth.uid()
  );

CREATE POLICY "Users can update their company documents"
  ON public.documents FOR UPDATE
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete their company documents"
  ON public.documents FOR DELETE
  USING (company_id = get_user_company_id(auth.uid()));

-- RLS Policies for document_access_logs
CREATE POLICY "Admins can view all access logs"
  ON public.document_access_logs FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view access logs for their company documents"
  ON public.document_access_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.documents
      WHERE documents.id = document_access_logs.document_id
      AND documents.company_id = get_user_company_id(auth.uid())
    )
  );

CREATE POLICY "System can insert access logs"
  ON public.document_access_logs FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Add updated_at trigger
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();