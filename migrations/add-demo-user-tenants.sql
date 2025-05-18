-- Add demo user tenants assignment
-- This ensures the demo user has access to the demo tenants

-- Insert user_tenants relationships if they don't exist
-- Assuming demo user has id '1' and we want to give access to both org1 and org2
INSERT INTO user_tenants (user_id, tenant_id, created_at)
VALUES 
  ('1', 'org1', CURRENT_TIMESTAMP),
  ('1', 'org2', CURRENT_TIMESTAMP)
ON CONFLICT (user_id, tenant_id) DO NOTHING;

-- Verify the assignments
SELECT 
  u.email,
  u.name,
  ut.tenant_id,
  t.name as tenant_name
FROM users u
JOIN user_tenants ut ON u.id = ut.user_id
JOIN tenants t ON ut.tenant_id = t.id
WHERE u.email = 'demo@example.com';