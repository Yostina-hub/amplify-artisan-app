-- Add RLS policies for custom_modules table
CREATE POLICY "Users can view company modules"
  ON custom_modules
  FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can create company modules"
  ON custom_modules
  FOR INSERT
  WITH CHECK (company_id = get_user_company_id(auth.uid()) AND created_by = auth.uid());

CREATE POLICY "Users can update company modules"
  ON custom_modules
  FOR UPDATE
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete company modules"
  ON custom_modules
  FOR DELETE
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Admins can manage all modules"
  ON custom_modules
  FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Add similar policies for custom_module_fields
CREATE POLICY "Users can view company module fields"
  ON custom_module_fields
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM custom_modules 
    WHERE custom_modules.id = custom_module_fields.module_id 
    AND custom_modules.company_id = get_user_company_id(auth.uid())
  ));

CREATE POLICY "Users can create company module fields"
  ON custom_module_fields
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM custom_modules 
    WHERE custom_modules.id = custom_module_fields.module_id 
    AND custom_modules.company_id = get_user_company_id(auth.uid())
  ));

CREATE POLICY "Users can update company module fields"
  ON custom_module_fields
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM custom_modules 
    WHERE custom_modules.id = custom_module_fields.module_id 
    AND custom_modules.company_id = get_user_company_id(auth.uid())
  ));

CREATE POLICY "Users can delete company module fields"
  ON custom_module_fields
  FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM custom_modules 
    WHERE custom_modules.id = custom_module_fields.module_id 
    AND custom_modules.company_id = get_user_company_id(auth.uid())
  ));

CREATE POLICY "Admins can manage all module fields"
  ON custom_module_fields
  FOR ALL
  USING (has_role(auth.uid(), 'admin'));