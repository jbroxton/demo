-- Seed data for local development
-- Two tenant setup: empty tenant for new users, populated tenant for testing

-- Insert test tenants
INSERT INTO public.tenants (id, name, slug, created_at, updated_at)
VALUES 
  -- Tenant 1: Empty tenant for new user testing
  (
    '11111111-1111-1111-1111-111111111111',
    'New User Tenant',
    'new-user-tenant',
    NOW(),
    NOW()
  ),
  -- Tenant 2: Populated tenant for existing user testing
  (
    '22222222-2222-2222-2222-222222222222',
    'ShopFlow Commerce',
    'shopflow-commerce',
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- Insert test users
-- Note: Using plain text "password" for local development
INSERT INTO public.users (id, email, name, role, password_hash, created_at, updated_at)
VALUES 
  -- New user in empty tenant
  (
    '10000000-0000-0000-0000-000000000001',
    'newuser@test.com',
    'New User',
    'user',
    'password',
    NOW(),
    NOW()
  ),
  -- PM1 in populated tenant
  (
    '20000000-0000-0000-0000-000000000001',
    'pm1@test.com',
    'Sarah Chen',
    'pm',
    'password',
    NOW(),
    NOW()
  ),
  -- PM2 in populated tenant
  (
    '20000000-0000-0000-0000-000000000002',
    'pm2@test.com',
    'Mike Rodriguez',
    'pm',
    'password',
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- Link users to tenants
INSERT INTO public.user_tenants (user_id, tenant_id, created_at)
VALUES 
  -- New user in tenant 1 (empty)
  ('10000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', NOW()),
  -- PM1 and PM2 in tenant 2 (populated)
  ('20000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', NOW()),
  ('20000000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', NOW())
ON CONFLICT (user_id, tenant_id) DO NOTHING;

-- ========================================
-- E-COMMERCE DATA FOR TENANT 2 ONLY
-- ========================================

-- Sample e-commerce products for tenant 2
INSERT INTO public.products (id, name, description, tenant_id, created_at, updated_at)
VALUES 
  (
    '30000000-0000-0000-0000-000000000001',
    'ShopFlow Mobile App',
    'Native iOS and Android shopping app with personalized recommendations',
    '22222222-2222-2222-2222-222222222222',
    NOW(),
    NOW()
  ),
  (
    '30000000-0000-0000-0000-000000000002',
    'E-commerce Web Platform',
    'Responsive web platform for online shopping with advanced search and filtering',
    '22222222-2222-2222-2222-222222222222',
    NOW(),
    NOW()
  ),
  (
    '30000000-0000-0000-0000-000000000003',
    'Merchant Dashboard',
    'Comprehensive seller portal for inventory, orders, and analytics management',
    '22222222-2222-2222-2222-222222222222',
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- Sample interfaces to connect products and features for tenant 2
INSERT INTO public.interfaces (id, name, description, product_id, tenant_id, created_at, updated_at)
VALUES 
  -- Mobile App Interfaces
  (
    '35000000-0000-0000-0000-000000000001',
    'Mobile App Core Interface',
    'Main user interface for the mobile shopping application',
    '30000000-0000-0000-0000-000000000001',
    '22222222-2222-2222-2222-222222222222',
    NOW(),
    NOW()
  ),
  (
    '35000000-0000-0000-0000-000000000002',
    'Mobile Checkout Interface',
    'Streamlined checkout and payment interface for mobile',
    '30000000-0000-0000-0000-000000000001',
    '22222222-2222-2222-2222-222222222222',
    NOW(),
    NOW()
  ),
  -- Web Platform Interfaces
  (
    '35000000-0000-0000-0000-000000000003',
    'Web Search & Discovery Interface',
    'Advanced search and product discovery interface for web platform',
    '30000000-0000-0000-0000-000000000002',
    '22222222-2222-2222-2222-222222222222',
    NOW(),
    NOW()
  ),
  (
    '35000000-0000-0000-0000-000000000004',
    'Web Social Commerce Interface',
    'Social shopping and community features interface',
    '30000000-0000-0000-0000-000000000002',
    '22222222-2222-2222-2222-222222222222',
    NOW(),
    NOW()
  ),
  -- Merchant Dashboard Interfaces
  (
    '35000000-0000-0000-0000-000000000005',
    'Merchant Analytics Interface',
    'Comprehensive analytics and reporting dashboard for merchants',
    '30000000-0000-0000-0000-000000000003',
    '22222222-2222-2222-2222-222222222222',
    NOW(),
    NOW()
  ),
  (
    '35000000-0000-0000-0000-000000000006',
    'Merchant Inventory Interface',
    'Inventory management and forecasting interface',
    '30000000-0000-0000-0000-000000000003',
    '22222222-2222-2222-2222-222222222222',
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- Sample e-commerce features for tenant 2
INSERT INTO public.features (id, name, description, priority, interface_id, tenant_id, created_at, updated_at)
VALUES 
  -- Mobile App Core Interface Features
  (
    '40000000-0000-0000-0000-000000000001',
    'Push Notifications',
    'Real-time notifications for order updates, promotions, and personalized offers',
    'high',
    '35000000-0000-0000-0000-000000000001',
    '22222222-2222-2222-2222-222222222222',
    NOW(),
    NOW()
  ),
  (
    '40000000-0000-0000-0000-000000000002',
    'AR Product Preview',
    'Augmented reality feature to visualize products in customer environment',
    'medium',
    '35000000-0000-0000-0000-000000000001',
    '22222222-2222-2222-2222-222222222222',
    NOW(),
    NOW()
  ),
  -- Mobile Checkout Interface Features
  (
    '40000000-0000-0000-0000-000000000003',
    'One-Click Checkout',
    'Streamlined checkout process with saved payment methods and addresses',
    'high',
    '35000000-0000-0000-0000-000000000002',
    '22222222-2222-2222-2222-222222222222',
    NOW(),
    NOW()
  ),
  -- Web Search & Discovery Interface Features
  (
    '40000000-0000-0000-0000-000000000004',
    'AI-Powered Search',
    'Intelligent search with natural language processing and visual search',
    'high',
    '35000000-0000-0000-0000-000000000003',
    '22222222-2222-2222-2222-222222222222',
    NOW(),
    NOW()
  ),
  (
    '40000000-0000-0000-0000-000000000005',
    'Dynamic Pricing Engine',
    'Real-time price optimization based on demand, competition, and inventory',
    'medium',
    '35000000-0000-0000-0000-000000000003',
    '22222222-2222-2222-2222-222222222222',
    NOW(),
    NOW()
  ),
  -- Web Social Commerce Interface Features
  (
    '40000000-0000-0000-0000-000000000006',
    'Social Commerce Integration',
    'Buy directly from social media posts and influencer recommendations',
    'medium',
    '35000000-0000-0000-0000-000000000004',
    '22222222-2222-2222-2222-222222222222',
    NOW(),
    NOW()
  ),
  -- Merchant Inventory Interface Features
  (
    '40000000-0000-0000-0000-000000000007',
    'Inventory Forecasting',
    'ML-powered inventory predictions and automated reorder suggestions',
    'low',
    '35000000-0000-0000-0000-000000000006',
    '22222222-2222-2222-2222-222222222222',
    NOW(),
    NOW()
  ),
  -- Merchant Analytics Interface Features
  (
    '40000000-0000-0000-0000-000000000008',
    'Multi-Channel Analytics',
    'Unified analytics across web, mobile, and marketplace channels',
    'medium',
    '35000000-0000-0000-0000-000000000005',
    '22222222-2222-2222-2222-222222222222',
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- Sample requirements for e-commerce features
INSERT INTO public.requirements (id, name, description, feature_id, priority, owner, tenant_id, created_at, updated_at)
VALUES 
  (
    '50000000-0000-0000-0000-000000000001',
    'Firebase Push Integration',
    'Implement Firebase Cloud Messaging for cross-platform push notifications',
    '40000000-0000-0000-0000-000000000001',
    'high',
    'Mobile Team',
    '22222222-2222-2222-2222-222222222222',
    NOW(),
    NOW()
  ),
  (
    '50000000-0000-0000-0000-000000000002',
    'ARKit/ARCore Implementation',
    'Native AR implementation for iOS and Android product visualization',
    '40000000-0000-0000-0000-000000000002',
    'medium',
    'AR Team',
    '22222222-2222-2222-2222-222222222222',
    NOW(),
    NOW()
  ),
  (
    '50000000-0000-0000-0000-000000000003',
    'Stripe Payment Integration',
    'Secure payment processing with support for digital wallets',
    '40000000-0000-0000-0000-000000000003',
    'high',
    'Payments Team',
    '22222222-2222-2222-2222-222222222222',
    NOW(),
    NOW()
  ),
  (
    '50000000-0000-0000-0000-000000000004',
    'Elasticsearch Integration',
    'Advanced search capabilities with autocomplete and typo tolerance',
    '40000000-0000-0000-0000-000000000004',
    'high',
    'Search Team',
    '22222222-2222-2222-2222-222222222222',
    NOW(),
    NOW()
  ),
  (
    '50000000-0000-0000-0000-000000000005',
    'A/B Testing Framework',
    'Infrastructure for testing different pricing strategies',
    '40000000-0000-0000-0000-000000000005',
    'medium',
    'Analytics Team',
    '22222222-2222-2222-2222-222222222222',
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- Sample roadmaps for e-commerce tenant
INSERT INTO public.roadmaps (id, name, description, tenant_id, created_at, updated_at)
VALUES 
  (
    '60000000-0000-0000-0000-000000000001',
    'Q2 2025 Mobile Experience',
    'Enhanced mobile shopping experience with AR and personalization',
    '22222222-2222-2222-2222-222222222222',
    NOW(),
    NOW()
  ),
  (
    '60000000-0000-0000-0000-000000000002',
    'Q3 2025 Merchant Tools',
    'Advanced analytics and inventory management for sellers',
    '22222222-2222-2222-2222-222222222222',
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;