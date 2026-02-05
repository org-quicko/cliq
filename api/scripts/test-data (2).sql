-- Test Data for Dashboard
-- Execute these queries in pgAdmin in the order provided

-- ========================================
-- STEP 1: Insert Programs
-- ========================================
INSERT INTO program (program_id, name, website, visibility, currency, referral_key_type, logo_url, theme_color, terms_and_conditions, date_format, time_zone, created_at, updated_at)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Acme SaaS Platform', 'https://acme-saas.com', 'PUBLIC', 'USD', 'SLUG', 'https://via.placeholder.com/150', '#4F46E5', 'Standard terms apply', 'DD-MM-YYYY', 'Asia/Kolkata', NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222222', 'E-Commerce Store', 'https://ecommerce-demo.com', 'PUBLIC', 'USD', 'CODE', 'https://via.placeholder.com/150', '#10B981', 'Refer a friend and earn', 'MM-DD-YYYY', 'America/New_York', NOW(), NOW()),
  ('33333333-3333-3333-3333-333333333333', 'Fitness App Pro', 'https://fitness-pro.com', 'PRIVATE', 'EUR', 'SLUG', 'https://via.placeholder.com/150', '#F59E0B', 'Terms and conditions apply', 'DD-MM-YYYY', 'Europe/London', NOW(), NOW())
ON CONFLICT (program_id) DO NOTHING;

-- ========================================
-- STEP 2: Insert Promoters
-- ========================================
INSERT INTO promoter (promoter_id, name, logo_url, status, created_at, updated_at)
VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'John Doe', 'https://via.placeholder.com/100', 'ACTIVE', NOW(), NOW()),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Jane Smith', 'https://via.placeholder.com/100', 'ACTIVE', NOW(), NOW()),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Mike Johnson', 'https://via.placeholder.com/100', 'ACTIVE', NOW(), NOW()),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Sarah Williams', 'https://via.placeholder.com/100', 'INACTIVE', NOW(), NOW())
ON CONFLICT (promoter_id) DO NOTHING;

-- ========================================
-- STEP 3: Link Programs and Promoters
-- ========================================
INSERT INTO program_promoter (program_id, promoter_id, accepted_terms_and_conditions, created_at, updated_at)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true, NOW(), NOW()),
  ('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', true, NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222222', 'cccccccc-cccc-cccc-cccc-cccccccccccc', true, NOW(), NOW()),
  ('33333333-3333-3333-3333-333333333333', 'dddddddd-dddd-dddd-dddd-dddddddddddd', false, NOW(), NOW())
ON CONFLICT (program_id, promoter_id) DO NOTHING;

-- ========================================
-- STEP 4: Insert Links
-- ========================================
INSERT INTO link (link_id, name, ref_val, status, program_id, promoter_id, created_at, updated_at)
VALUES 
  ('11110001-0001-0001-0001-000000000001', 'Main Landing Page', 'john-main', 'ACTIVE', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NOW(), NOW()),
  ('11110002-0002-0002-0002-000000000002', 'Blog Campaign', 'john-blog', 'ACTIVE', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NOW(), NOW()),
  ('11110003-0003-0003-0003-000000000003', 'Social Media', 'jane-social', 'ACTIVE', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NOW(), NOW()),
  ('22220001-0001-0001-0001-000000000001', 'Holiday Sale', 'MIKE2024', 'ACTIVE', '22222222-2222-2222-2222-222222222222', 'cccccccc-cccc-cccc-cccc-cccccccccccc', NOW(), NOW())
ON CONFLICT (link_id) DO NOTHING;

-- ========================================
-- STEP 5: Insert Contacts
-- ========================================
INSERT INTO contact (contact_id, email, first_name, last_name, external_id, phone, status, program_id, created_at, updated_at)
VALUES 
  ('c0000001-0001-0001-0001-000000000001', 'alice@example.com', 'Alice', 'Brown', 'EXT-001', '+1234567890', 'CUSTOMER', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '30 days', NOW()),
  ('c0000002-0002-0002-0002-000000000002', 'bob@example.com', 'Bob', 'Green', 'EXT-002', '+1234567891', 'CUSTOMER', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '25 days', NOW()),
  ('c0000003-0003-0003-0003-000000000003', 'charlie@example.com', 'Charlie', 'White', 'EXT-003', '+1234567892', 'LEAD', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '20 days', NOW()),
  ('c0000004-0004-0004-0004-000000000004', 'diana@example.com', 'Diana', 'Black', 'EXT-004', '+1234567893', 'CUSTOMER', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '15 days', NOW()),
  ('c0000005-0005-0005-0005-000000000005', 'eve@example.com', 'Eve', 'Silver', 'EXT-005', '+1234567894', 'LEAD', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '10 days', NOW()),
  ('c0000006-0006-0006-0006-000000000006', 'frank@example.com', 'Frank', 'Gold', 'EXT-006', '+1234567895', 'CUSTOMER', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '5 days', NOW())
ON CONFLICT (contact_id) DO NOTHING;

-- ========================================
-- STEP 6: Insert Sign Ups
-- ========================================
INSERT INTO sign_up (contact_id, promoter_id, link_id, utm_params, created_at, updated_at)
VALUES 
  ('c0000001-0001-0001-0001-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11110001-0001-0001-0001-000000000001', '{"utm_source": "google", "utm_medium": "cpc", "utm_campaign": "summer2024"}', NOW() - INTERVAL '30 days', NOW()),
  ('c0000002-0002-0002-0002-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11110002-0002-0002-0002-000000000002', '{"utm_source": "facebook", "utm_medium": "social", "utm_campaign": "brand"}', NOW() - INTERVAL '25 days', NOW()),
  ('c0000003-0003-0003-0003-000000000003', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11110003-0003-0003-0003-000000000003', '{"utm_source": "twitter", "utm_medium": "social"}', NOW() - INTERVAL '20 days', NOW()),
  ('c0000004-0004-0004-0004-000000000004', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11110001-0001-0001-0001-000000000001', '{"utm_source": "email", "utm_campaign": "newsletter"}', NOW() - INTERVAL '15 days', NOW()),
  ('c0000005-0005-0005-0005-000000000005', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '22220001-0001-0001-0001-000000000001', NULL, NOW() - INTERVAL '10 days', NOW()),
  ('c0000006-0006-0006-0006-000000000006', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '22220001-0001-0001-0001-000000000001', '{"utm_source": "direct"}', NOW() - INTERVAL '5 days', NOW())
ON CONFLICT (contact_id) DO NOTHING;

-- ========================================
-- STEP 7: Insert Purchases
-- ========================================
INSERT INTO purchase (purchase_id, item_id, contact_id, amount, promoter_id, link_id, utm_params, created_at, updated_at)
VALUES 
  ('p0000001-0001-0001-0001-000000000001', 'ITEM-001', 'c0000001-0001-0001-0001-000000000001', 99.99, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11110001-0001-0001-0001-000000000001', '{"utm_source": "google"}', NOW() - INTERVAL '28 days', NOW()),
  ('p0000002-0002-0002-0002-000000000002', 'ITEM-002', 'c0000001-0001-0001-0001-000000000001', 149.50, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11110001-0001-0001-0001-000000000001', '{"utm_source": "google"}', NOW() - INTERVAL '20 days', NOW()),
  ('p0000003-0003-0003-0003-000000000003', 'ITEM-003', 'c0000002-0002-0002-0002-000000000002', 199.00, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11110002-0002-0002-0002-000000000002', '{"utm_source": "facebook"}', NOW() - INTERVAL '23 days', NOW()),
  ('p0000004-0004-0004-0004-000000000004', 'ITEM-004', 'c0000004-0004-0004-0004-000000000004', 79.99, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11110001-0001-0001-0001-000000000001', '{"utm_source": "email"}', NOW() - INTERVAL '14 days', NOW()),
  ('p0000005-0005-0005-0005-000000000005', 'ITEM-005', 'c0000006-0006-0006-0006-000000000006', 299.00, 'cccccccc-cccc-cccc-cccc-cccccccccccc', '22220001-0001-0001-0001-000000000001', '{"utm_source": "direct"}', NOW() - INTERVAL '4 days', NOW()),
  ('p0000006-0006-0006-0006-000000000006', 'ITEM-006', 'c0000001-0001-0001-0001-000000000001', 59.99, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11110001-0001-0001-0001-000000000001', NULL, NOW() - INTERVAL '10 days', NOW()),
  ('p0000007-0007-0007-0007-000000000007', 'ITEM-007', 'c0000002-0002-0002-0002-000000000002', 89.99, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11110002-0002-0002-0002-000000000002', NULL, NOW() - INTERVAL '18 days', NOW()),
  ('p0000008-0008-0008-0008-000000000008', 'ITEM-008', 'c0000004-0004-0004-0004-000000000004', 120.00, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11110001-0001-0001-0001-000000000001', NULL, NOW() - INTERVAL '12 days', NOW())
ON CONFLICT (purchase_id) DO NOTHING;

-- ========================================
-- STEP 8: Refresh Materialized Views
-- ========================================
-- This will update the dashboard data immediately
REFRESH MATERIALIZED VIEW CONCURRENTLY program_summary_mv;
REFRESH MATERIALIZED VIEW CONCURRENTLY promoter_analytics_day_wise_mv;

-- ========================================
-- Verification Queries
-- ========================================
-- Run these to verify your data

-- Check program summary
SELECT * FROM program_summary_mv ORDER BY name;

-- Check promoter analytics
SELECT * FROM promoter_analytics_day_wise_mv ORDER BY created_at DESC LIMIT 20;

-- Count records by table
SELECT 'programs' as table_name, COUNT(*) as count FROM program
UNION ALL
SELECT 'promoters', COUNT(*) FROM promoter
UNION ALL
SELECT 'program_promoter', COUNT(*) FROM program_promoter
UNION ALL
SELECT 'links', COUNT(*) FROM link
UNION ALL
SELECT 'contacts', COUNT(*) FROM contact
UNION ALL
SELECT 'sign_ups', COUNT(*) FROM sign_up
UNION ALL
SELECT 'purchases', COUNT(*) FROM purchase;
