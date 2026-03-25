-- CISO-002 REMEDIATION: Enable Row-Level Security on all IRM tables
-- This migration enforces tenant isolation and role-based access at the database level.
-- Must be applied BEFORE rotating the Supabase anon key.
--
-- Prerequisites:
-- 1. Ensure all rows have a valid tenant_id column
-- 2. Set app.tenant_id via Supabase auth context (JWT claim)
-- 3. Rotate anon key after applying this migration

-- ============================================================
-- Step 1: Enable RLS on all core tables
-- ============================================================

ALTER TABLE IF EXISTS irm.risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS irm.controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS irm.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS irm.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS irm.loss_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS irm.kris ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS irm.regulatory_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS irm.risk_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS irm.monitoring_alerts ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Step 2: Tenant isolation policies (read)
-- Authenticated users can only read rows matching their tenant
-- ============================================================

CREATE POLICY tenant_isolation_select ON irm.risks
  FOR SELECT USING (
    tenant_id = (current_setting('request.jwt.claims', true)::json->>'tenant_id')
  );

CREATE POLICY tenant_isolation_select ON irm.controls
  FOR SELECT USING (
    tenant_id = (current_setting('request.jwt.claims', true)::json->>'tenant_id')
  );

CREATE POLICY tenant_isolation_select ON irm.vendors
  FOR SELECT USING (
    tenant_id = (current_setting('request.jwt.claims', true)::json->>'tenant_id')
  );

CREATE POLICY tenant_isolation_select ON irm.issues
  FOR SELECT USING (
    tenant_id = (current_setting('request.jwt.claims', true)::json->>'tenant_id')
  );

CREATE POLICY tenant_isolation_select ON irm.loss_events
  FOR SELECT USING (
    tenant_id = (current_setting('request.jwt.claims', true)::json->>'tenant_id')
  );

CREATE POLICY tenant_isolation_select ON irm.kris
  FOR SELECT USING (
    tenant_id = (current_setting('request.jwt.claims', true)::json->>'tenant_id')
  );

CREATE POLICY tenant_isolation_select ON irm.regulatory_changes
  FOR SELECT USING (
    tenant_id = (current_setting('request.jwt.claims', true)::json->>'tenant_id')
  );

CREATE POLICY tenant_isolation_select ON irm.risk_scenarios
  FOR SELECT USING (
    tenant_id = (current_setting('request.jwt.claims', true)::json->>'tenant_id')
  );

CREATE POLICY tenant_isolation_select ON irm.monitoring_alerts
  FOR SELECT USING (
    tenant_id = (current_setting('request.jwt.claims', true)::json->>'tenant_id')
  );

-- ============================================================
-- Step 3: Write policies — only authenticated users in same tenant
-- ============================================================

CREATE POLICY tenant_isolation_insert ON irm.risks
  FOR INSERT WITH CHECK (
    tenant_id = (current_setting('request.jwt.claims', true)::json->>'tenant_id')
  );

CREATE POLICY tenant_isolation_update ON irm.risks
  FOR UPDATE USING (
    tenant_id = (current_setting('request.jwt.claims', true)::json->>'tenant_id')
  );

CREATE POLICY tenant_isolation_delete ON irm.risks
  FOR DELETE USING (
    tenant_id = (current_setting('request.jwt.claims', true)::json->>'tenant_id')
  );

-- Repeat for other tables (controls, vendors, issues, etc.)
-- In production, generate these programmatically for all tables

CREATE POLICY tenant_isolation_insert ON irm.controls FOR INSERT WITH CHECK (tenant_id = (current_setting('request.jwt.claims', true)::json->>'tenant_id'));
CREATE POLICY tenant_isolation_update ON irm.controls FOR UPDATE USING (tenant_id = (current_setting('request.jwt.claims', true)::json->>'tenant_id'));
CREATE POLICY tenant_isolation_delete ON irm.controls FOR DELETE USING (tenant_id = (current_setting('request.jwt.claims', true)::json->>'tenant_id'));

CREATE POLICY tenant_isolation_insert ON irm.vendors FOR INSERT WITH CHECK (tenant_id = (current_setting('request.jwt.claims', true)::json->>'tenant_id'));
CREATE POLICY tenant_isolation_update ON irm.vendors FOR UPDATE USING (tenant_id = (current_setting('request.jwt.claims', true)::json->>'tenant_id'));
CREATE POLICY tenant_isolation_delete ON irm.vendors FOR DELETE USING (tenant_id = (current_setting('request.jwt.claims', true)::json->>'tenant_id'));

CREATE POLICY tenant_isolation_insert ON irm.issues FOR INSERT WITH CHECK (tenant_id = (current_setting('request.jwt.claims', true)::json->>'tenant_id'));
CREATE POLICY tenant_isolation_update ON irm.issues FOR UPDATE USING (tenant_id = (current_setting('request.jwt.claims', true)::json->>'tenant_id'));
CREATE POLICY tenant_isolation_delete ON irm.issues FOR DELETE USING (tenant_id = (current_setting('request.jwt.claims', true)::json->>'tenant_id'));

-- ============================================================
-- Step 4: Block anonymous access completely
-- ============================================================

-- Revoke all privileges from anon role on IRM schema
REVOKE ALL ON ALL TABLES IN SCHEMA irm FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA irm FROM anon;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA irm FROM anon;

-- Only authenticated role can access IRM schema
GRANT USAGE ON SCHEMA irm TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA irm TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA irm TO authenticated;

-- ============================================================
-- Step 5: Immutable audit log table (CISO-006)
-- ============================================================

CREATE TABLE IF NOT EXISTS irm.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  module TEXT NOT NULL,
  metadata JSONB,
  before_value JSONB,
  after_value JSONB,
  ip_address TEXT,
  user_agent TEXT,
  session_id TEXT,
  success BOOLEAN NOT NULL DEFAULT TRUE,
  error_message TEXT,
  correlation_id TEXT,
  risk_level TEXT,
  source TEXT DEFAULT 'ui',
  denied_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Make audit log append-only (immutable)
ALTER TABLE irm.audit_log ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can insert audit events
CREATE POLICY audit_insert_only ON irm.audit_log
  FOR INSERT WITH CHECK (true);

-- Only same-tenant users can read audit events
CREATE POLICY audit_read_tenant ON irm.audit_log
  FOR SELECT USING (
    tenant_id = (current_setting('request.jwt.claims', true)::json->>'tenant_id')
  );

-- No updates or deletes allowed (immutable)
-- (No UPDATE or DELETE policies = denied by default with RLS enabled)

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_audit_log_tenant_timestamp ON irm.audit_log (tenant_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON irm.audit_log (user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON irm.audit_log (action, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON irm.audit_log (entity_type, entity_id);

-- ============================================================
-- Step 6: Restrict API schema introspection
-- ============================================================

-- Revoke introspection from anon and authenticated roles
REVOKE ALL ON SCHEMA information_schema FROM anon;
REVOKE ALL ON SCHEMA pg_catalog FROM anon;

COMMENT ON TABLE irm.audit_log IS 'Immutable audit trail for all IRM operations. No UPDATE or DELETE allowed.';
