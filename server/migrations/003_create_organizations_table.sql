-- Migration: Create organizations table for memorial book associations
-- Run this in Supabase SQL Editor

-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_en TEXT,
  type TEXT NOT NULL DEFAULT 'association' CHECK (type IN ('military_unit', 'association', 'community', 'school', 'other')),
  description TEXT,
  logo_url TEXT,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  website TEXT,

  -- Subscription info (JSONB)
  subscription JSONB DEFAULT '{
    "plan": "free",
    "maxBooks": 10,
    "maxMembers": 50,
    "pricePerMonth": 0,
    "startDate": null,
    "autoRenew": false
  }'::jsonb,

  -- Coupons array (JSONB)
  coupons JSONB DEFAULT '[]'::jsonb,

  -- Statistics (JSONB)
  statistics JSONB DEFAULT '{
    "totalMembers": 0,
    "totalBooks": 0,
    "activeBooks": 0,
    "publishedBooks": 0
  }'::jsonb,

  -- Admin and member user IDs
  admin_user_ids UUID[] DEFAULT '{}',
  member_user_ids UUID[] DEFAULT '{}',

  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add organization_id column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(status);
CREATE INDEX IF NOT EXISTS idx_organizations_type ON organizations(type);
CREATE INDEX IF NOT EXISTS idx_organizations_name ON organizations(name);
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_organizations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_organizations_updated_at();

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Admins can do everything
CREATE POLICY "Admins can manage organizations"
  ON organizations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Organization admins can view and update their organization
CREATE POLICY "Org admins can view their organization"
  ON organizations
  FOR SELECT
  USING (
    auth.uid() = ANY(admin_user_ids)
  );

CREATE POLICY "Org admins can update their organization"
  ON organizations
  FOR UPDATE
  USING (
    auth.uid() = ANY(admin_user_ids)
  );

-- Members can view their organization
CREATE POLICY "Members can view their organization"
  ON organizations
  FOR SELECT
  USING (
    auth.uid() = ANY(member_user_ids)
  );

-- Insert sample organizations for testing
INSERT INTO organizations (name, name_en, type, contact_email, description) VALUES
  ('עמותת גולני', 'Golani Association', 'military_unit', 'contact@golani.org.il', 'עמותת חיילי ונופלי גולני'),
  ('עמותת הצנחנים', 'Paratroopers Association', 'military_unit', 'contact@paratroopers.org.il', 'עמותת הצנחנים'),
  ('יד לבנים', 'Yad LaBanim', 'association', 'contact@yadlabanim.org.il', 'ארגון משפחות שכולות')
ON CONFLICT DO NOTHING;

-- Grant permissions
GRANT ALL ON organizations TO authenticated;
GRANT SELECT ON organizations TO anon;
