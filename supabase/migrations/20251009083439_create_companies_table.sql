/*
  # Create Companies Table

  1. New Tables
    - `companies`
      - `id` (uuid, primary key)
      - `name` (text) - Company name
      - `email` (text, unique) - Company email
      - `phone` (text) - Phone number
      - `website` (text) - Company website
      - `industry` (text) - Industry type
      - `company_size` (text) - Company size range
      - `address` (text) - Company address
      - `pricing_plan_id` (uuid) - Selected pricing plan
      - `status` (text) - pending, approved, rejected
      - `is_active` (boolean) - Whether company is active
      - `approved_at` (timestamptz) - When approved
      - `approved_by` (uuid) - Admin who approved
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `companies` table
    - Add policy for public to insert applications
    - Add policy for authenticated users to view their company
    - Add policy for admins to manage all companies
*/

CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  website text,
  industry text,
  company_size text,
  address text,
  pricing_plan_id uuid REFERENCES pricing_plans(id),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  is_active boolean DEFAULT false,
  approved_at timestamptz,
  approved_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can submit an application (insert)
CREATE POLICY "Anyone can submit company application"
  ON companies
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy: Users can view their own company by email
CREATE POLICY "Users can view own company"
  ON companies
  FOR SELECT
  TO authenticated
  USING (
    email IN (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  );

-- Policy: Admins can view all companies
CREATE POLICY "Admins can view all companies"
  ON companies
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Policy: Admins can update all companies
CREATE POLICY "Admins can update all companies"
  ON companies
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Policy: Admins can delete companies
CREATE POLICY "Admins can delete companies"
  ON companies
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_companies_email ON companies(email);
CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);
CREATE INDEX IF NOT EXISTS idx_companies_is_active ON companies(is_active);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_companies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_companies_updated_at_trigger ON companies;
CREATE TRIGGER update_companies_updated_at_trigger
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_companies_updated_at();