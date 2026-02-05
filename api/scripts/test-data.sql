-- ============================================================================
-- COMPREHENSIVE TEST DATA FOR DASHBOARD
-- ============================================================================
-- Execute these queries in pgAdmin in the order provided
-- Each section creates data for a specific table based on entity definitions
-- ============================================================================

-- ============================================================================
-- CLEANUP (Optional - Uncomment if you want to start fresh)
-- ============================================================================
-- TRUNCATE commission CASCADE;
-- TRUNCATE purchase CASCADE;
-- TRUNCATE sign_up CASCADE;
-- TRUNCATE contact CASCADE;
-- TRUNCATE link CASCADE;
-- TRUNCATE circle_promoter CASCADE;
-- TRUNCATE promoter_member CASCADE;
-- TRUNCATE circle CASCADE;
-- TRUNCATE function CASCADE;
-- TRUNCATE condition CASCADE;
-- TRUNCATE member CASCADE;
-- TRUNCATE program_promoter CASCADE;
-- TRUNCATE program_user CASCADE;
-- TRUNCATE promoter CASCADE;
-- TRUNCATE api_key CASCADE;
-- TRUNCATE webhook CASCADE;
-- TRUNCATE program CASCADE;
-- TRUNCATE "user" CASCADE;

-- ============================================================================
-- STEP 1: Insert Users (user table)
-- Columns: user_id, email, password, first_name, last_name, role, created_at, updated_at
-- Enum userRoleEnum: 'super_admin', 'admin', 'editor', 'viewer', 'regular'
-- Password is 'Test@123' hashed with bcrypt (10 rounds)
-- ============================================================================
INSERT INTO "user" (user_id, email, password, first_name, last_name, role, created_at, updated_at)
VALUES 
  ('00000001-0001-0001-0001-000000000001', 'superadmin@test.com', '$2b$10$rQnF7yYdZhKxHHC4mONKdOqGqFZYdHPQpFLnJJ0QFHXzRZ3ZR8ZYq', 'Super', 'Admin', 'super_admin', NOW(), NOW()),
  ('00000002-0002-0002-0002-000000000002', 'admin@test.com', '$2b$10$rQnF7yYdZhKxHHC4mONKdOqGqFZYdHPQpFLnJJ0QFHXzRZ3ZR8ZYq', 'Program', 'Admin', 'admin', NOW(), NOW()),
  ('00000003-0003-0003-0003-000000000003', 'editor@test.com', '$2b$10$rQnF7yYdZhKxHHC4mONKdOqGqFZYdHPQpFLnJJ0QFHXzRZ3ZR8ZYq', 'Content', 'Editor', 'editor', NOW(), NOW()),
  ('00000004-0004-0004-0004-000000000004', 'viewer@test.com', '$2b$10$rQnF7yYdZhKxHHC4mONKdOqGqFZYdHPQpFLnJJ0QFHXzRZ3ZR8ZYq', 'Read', 'Only', 'viewer', NOW(), NOW())
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- STEP 2: Programs (SKIPPED - Using existing programs)
-- ============================================================================
-- Using existing programs:
--   2dc9a6b5-e008-4bac-adb0-7f08290d3d2d - Quicko
--   727c1da5-2d78-48d5-9492-8488a74333ab - The Jedi
--   0f2e0568-b020-4de8-8f8e-cc7c0e6ac0f9 - Best
-- Programs already exist in database, skipping INSERT
-- ============================================================================

-- ============================================================================
-- STEP 3: Insert Program Users (program_user table)
-- Columns: program_id, user_id, status, role
-- Enum statusEnum: 'active', 'inactive'
-- Enum userRoleEnum (for program role): 'super_admin', 'admin', 'editor', 'viewer', 'regular'
-- ============================================================================
INSERT INTO program_user (program_id, user_id, status, role, created_at, updated_at)
VALUES 
  -- Super Admin has access to ALL programs
  ('2dc9a6b5-e008-4bac-adb0-7f08290d3d2d', '00000001-0001-0001-0001-000000000001', 'active', 'super_admin', NOW(), NOW()),
  ('727c1da5-2d78-48d5-9492-8488a74333ab', '00000001-0001-0001-0001-000000000001', 'active', 'super_admin', NOW(), NOW()),
  ('0f2e0568-b020-4de8-8f8e-cc7c0e6ac0f9', '00000001-0001-0001-0001-000000000001', 'active', 'super_admin', NOW(), NOW()),
  -- Program 1 (Quicko) users
  ('2dc9a6b5-e008-4bac-adb0-7f08290d3d2d', '00000002-0002-0002-0002-000000000002', 'active', 'admin', NOW(), NOW()),
  ('2dc9a6b5-e008-4bac-adb0-7f08290d3d2d', '00000003-0003-0003-0003-000000000003', 'active', 'editor', NOW(), NOW()),
  ('2dc9a6b5-e008-4bac-adb0-7f08290d3d2d', '00000004-0004-0004-0004-000000000004', 'active', 'viewer', NOW(), NOW()),
  -- Program 2 (The Jedi) users
  ('727c1da5-2d78-48d5-9492-8488a74333ab', '00000002-0002-0002-0002-000000000002', 'active', 'admin', NOW(), NOW()),
  -- Program 3 (Best) users
  ('0f2e0568-b020-4de8-8f8e-cc7c0e6ac0f9', '00000003-0003-0003-0003-000000000003', 'active', 'editor', NOW(), NOW())
ON CONFLICT (program_id, user_id) DO NOTHING;

-- ============================================================================
-- STEP 4: Insert API Keys (api_key table)
-- Columns: api_key_id, key, secret, status, program_id
-- Secret is hashed (example hash for 'test-secret-123')
-- ============================================================================
INSERT INTO api_key (api_key_id, key, secret, status, program_id, created_at, updated_at)
VALUES 
  ('00001111-0001-0001-0001-000000000001', 'pk_test_quicko_live_001', '$2b$10$rQnF7yYdZhKxHHC4mONKdOqGqFZYdHPQpFLnJJ0QFHXzRZ3ZR8ZYq', 'active', '2dc9a6b5-e008-4bac-adb0-7f08290d3d2d', NOW(), NOW()),
  ('00002222-0002-0002-0002-000000000002', 'pk_test_jedi_live_001', '$2b$10$rQnF7yYdZhKxHHC4mONKdOqGqFZYdHPQpFLnJJ0QFHXzRZ3ZR8ZYq', 'active', '727c1da5-2d78-48d5-9492-8488a74333ab', NOW(), NOW()),
  ('00003333-0003-0003-0003-000000000003', 'pk_test_best_001', '$2b$10$rQnF7yYdZhKxHHC4mONKdOqGqFZYdHPQpFLnJJ0QFHXzRZ3ZR8ZYq', 'inactive', '0f2e0568-b020-4de8-8f8e-cc7c0e6ac0f9', NOW(), NOW())
ON CONFLICT (api_key_id) DO NOTHING;

-- ============================================================================
-- STEP 5: Insert Webhooks (webhook table)
-- Columns: webhook_id, url, program_id, secret, events
-- ============================================================================
INSERT INTO webhook (webhook_id, url, program_id, secret, events, created_at, updated_at)
VALUES 
  ('00004444-0001-0001-0001-000000000001', 'https://quicko.com/webhooks/cliq', '2dc9a6b5-e008-4bac-adb0-7f08290d3d2d', 'whsec_quicko_secret_123', ARRAY['commission.created', 'signup.created', 'purchase.created'], NOW(), NOW()),
  ('00005555-0002-0002-0002-000000000002', 'https://thejedi.com/api/webhooks', '727c1da5-2d78-48d5-9492-8488a74333ab', 'whsec_jedi_secret_456', ARRAY['commission.created', 'purchase.created'], NOW(), NOW())
ON CONFLICT (webhook_id) DO NOTHING;

-- ============================================================================
-- STEP 6: Insert Promoters (promoter table)
-- Columns: promoter_id, name, logo_url, status
-- Enum promoterStatusEnum: 'active', 'archived'
-- ============================================================================
INSERT INTO promoter (promoter_id, name, logo_url, status, created_at, updated_at)
VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'John Doe', 'https://via.placeholder.com/100/6366F1/FFFFFF?text=JD', 'active', NOW() - INTERVAL '55 days', NOW()),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Jane Smith', 'https://via.placeholder.com/100/EC4899/FFFFFF?text=JS', 'active', NOW() - INTERVAL '50 days', NOW()),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Mike Johnson', 'https://via.placeholder.com/100/14B8A6/FFFFFF?text=MJ', 'active', NOW() - INTERVAL '40 days', NOW()),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Sarah Williams', 'https://via.placeholder.com/100/F97316/FFFFFF?text=SW', 'active', NOW() - INTERVAL '35 days', NOW()),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Alex Turner', 'https://via.placeholder.com/100/8B5CF6/FFFFFF?text=AT', 'archived', NOW() - INTERVAL '20 days', NOW())
ON CONFLICT (promoter_id) DO NOTHING;

-- ============================================================================
-- STEP 7: Insert Program Promoters (program_promoter table)
-- Columns: program_id, promoter_id, accepted_terms_and_conditions
-- ============================================================================
INSERT INTO program_promoter (program_id, promoter_id, accepted_terms_and_conditions, created_at, updated_at)
VALUES 
  -- Program 1 (Quicko) promoters
  ('2dc9a6b5-e008-4bac-adb0-7f08290d3d2d', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true, NOW() - INTERVAL '55 days', NOW()),
  ('2dc9a6b5-e008-4bac-adb0-7f08290d3d2d', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', true, NOW() - INTERVAL '50 days', NOW()),
  ('2dc9a6b5-e008-4bac-adb0-7f08290d3d2d', 'cccccccc-cccc-cccc-cccc-cccccccccccc', true, NOW() - INTERVAL '40 days', NOW()),
  -- Program 2 (The Jedi) promoters
  ('727c1da5-2d78-48d5-9492-8488a74333ab', 'cccccccc-cccc-cccc-cccc-cccccccccccc', true, NOW() - INTERVAL '40 days', NOW()),
  ('727c1da5-2d78-48d5-9492-8488a74333ab', 'dddddddd-dddd-dddd-dddd-dddddddddddd', true, NOW() - INTERVAL '35 days', NOW()),
  -- Program 3 (Best) promoters
  ('0f2e0568-b020-4de8-8f8e-cc7c0e6ac0f9', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', false, NOW() - INTERVAL '20 days', NOW())
ON CONFLICT (program_id, promoter_id) DO NOTHING;

-- ============================================================================
-- STEP 8: Insert Circles (circle table)
-- Columns: circle_id, name, is_default_circle, program_id
-- ============================================================================
INSERT INTO circle (circle_id, name, is_default_circle, program_id, created_at, updated_at)
VALUES 
  -- Program 1 (Quicko) circles
  ('00006666-0001-0001-0001-000000000001', 'Default Circle', true, '2dc9a6b5-e008-4bac-adb0-7f08290d3d2d', NOW(), NOW()),
  ('00007777-0002-0002-0002-000000000002', 'VIP Affiliates', false, '2dc9a6b5-e008-4bac-adb0-7f08290d3d2d', NOW(), NOW()),
  ('00008888-0003-0003-0003-000000000003', 'New Joiners', false, '2dc9a6b5-e008-4bac-adb0-7f08290d3d2d', NOW(), NOW()),
  -- Program 2 (The Jedi) circles
  ('00009999-0004-0004-0004-000000000004', 'Default Circle', true, '727c1da5-2d78-48d5-9492-8488a74333ab', NOW(), NOW()),
  ('00010101-0005-0005-0005-000000000005', 'Premium Partners', false, '727c1da5-2d78-48d5-9492-8488a74333ab', NOW(), NOW()),
  -- Program 3 (Best) circles
  ('00011111-0006-0006-0006-000000000006', 'Default Circle', true, '0f2e0568-b020-4de8-8f8e-cc7c0e6ac0f9', NOW(), NOW())
ON CONFLICT (circle_id) DO NOTHING;

-- ============================================================================
-- STEP 9: Insert Circle Promoters (circle_promoter table)
-- Columns: circle_id, promoter_id
-- ============================================================================
INSERT INTO circle_promoter (circle_id, promoter_id, created_at, updated_at)
VALUES 
  -- Program 1 circle memberships
  ('00006666-0001-0001-0001-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NOW(), NOW()),
  ('00007777-0002-0002-0002-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NOW(), NOW()), -- John is VIP
  ('00006666-0001-0001-0001-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NOW(), NOW()),
  ('00008888-0003-0003-0003-000000000003', 'cccccccc-cccc-cccc-cccc-cccccccccccc', NOW(), NOW()), -- Mike is new joiner
  -- Program 2 circle memberships
  ('00009999-0004-0004-0004-000000000004', 'cccccccc-cccc-cccc-cccc-cccccccccccc', NOW(), NOW()),
  ('00010101-0005-0005-0005-000000000005', 'dddddddd-dddd-dddd-dddd-dddddddddddd', NOW(), NOW()), -- Sarah is premium
  -- Program 3 circle memberships
  ('00011111-0006-0006-0006-000000000006', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', NOW(), NOW())
ON CONFLICT (circle_id, promoter_id) DO NOTHING;

-- ============================================================================
-- STEP 10: Insert Functions (function table)
-- Columns: function_id, name, trigger, effect_type, effect, status, circle_id, program_id
-- Enum triggerEnum: 'signup', 'purchase'
-- Enum effectEnum: 'switch_circle', 'generate_commission'
-- Enum functionStatusEnum: 'active', 'inactive'
-- ============================================================================
INSERT INTO function (function_id, name, trigger, effect_type, effect, status, circle_id, program_id, created_at, updated_at)
VALUES 
  -- Program 1 (Quicko) functions
  ('00012222-0001-0001-0001-000000000001', 'Signup Commission', 'signup', 'generate_commission', '{"type": "fixed", "value": 10}', 'active', '00006666-0001-0001-0001-000000000001', '2dc9a6b5-e008-4bac-adb0-7f08290d3d2d', NOW(), NOW()),
  ('00013333-0002-0002-0002-000000000002', 'Purchase Commission 10%', 'purchase', 'generate_commission', '{"type": "percentage", "value": 10}', 'active', '00006666-0001-0001-0001-000000000001', '2dc9a6b5-e008-4bac-adb0-7f08290d3d2d', NOW(), NOW()),
  ('00014444-0003-0003-0003-000000000003', 'VIP Commission 20%', 'purchase', 'generate_commission', '{"type": "percentage", "value": 20}', 'active', '00007777-0002-0002-0002-000000000002', '2dc9a6b5-e008-4bac-adb0-7f08290d3d2d', NOW(), NOW()),
  ('00015555-0004-0004-0004-000000000004', 'Upgrade to VIP', 'purchase', 'switch_circle', '{"targetCircleId": "00007777-0002-0002-0002-000000000002"}', 'active', '00008888-0003-0003-0003-000000000003', '2dc9a6b5-e008-4bac-adb0-7f08290d3d2d', NOW(), NOW()),
  -- Program 2 (The Jedi) functions
  ('00016666-0005-0005-0005-000000000005', 'Default Purchase 5%', 'purchase', 'generate_commission', '{"type": "percentage", "value": 5}', 'active', '00009999-0004-0004-0004-000000000004', '727c1da5-2d78-48d5-9492-8488a74333ab', NOW(), NOW()),
  ('00017777-0006-0006-0006-000000000006', 'Premium Purchase 15%', 'purchase', 'generate_commission', '{"type": "percentage", "value": 15}', 'active', '00010101-0005-0005-0005-000000000005', '727c1da5-2d78-48d5-9492-8488a74333ab', NOW(), NOW()),
  -- Program 3 (Best) functions
  ('00018888-0007-0007-0007-000000000007', 'Signup Bonus', 'signup', 'generate_commission', '{"type": "fixed", "value": 25}', 'inactive', '00011111-0006-0006-0006-000000000006', '0f2e0568-b020-4de8-8f8e-cc7c0e6ac0f9', NOW(), NOW())
ON CONFLICT (function_id) DO NOTHING;

-- ============================================================================
-- STEP 11: Insert Conditions (condition table)
-- Columns: condition_id, function_id, parameter, operator, value
-- Enum conditionParameterEnum: 'revenue', 'no. of signups', 'no. of purchases', 'item_id'
-- Enum conditionOperatorEnum: 'greater_than_or_equal_to', 'less_than_or_equal_to', 'greater_than', 'less_than', 'equals', 'contains'
-- ============================================================================
INSERT INTO condition (condition_id, function_id, parameter, operator, value)
VALUES 
  -- Condition for VIP upgrade: revenue >= 500
  ('00019999-0001-0001-0001-000000000001', '00015555-0004-0004-0004-000000000004', 'revenue', 'greater_than_or_equal_to', '500'),
  -- Condition for VIP commission: revenue >= 100 per purchase
  ('00020202-0002-0002-0002-000000000002', '00014444-0003-0003-0003-000000000003', 'revenue', 'greater_than_or_equal_to', '100'),
  -- Condition for premium commission: specific item
  ('00021212-0003-0003-0003-000000000003', '00017777-0006-0006-0006-000000000006', 'item_id', 'contains', 'PREMIUM')
ON CONFLICT (condition_id) DO NOTHING;

-- ============================================================================
-- STEP 12: Insert Members (member table) - Promoter portal users
-- Columns: member_id, email, password, first_name, last_name, program_id
-- Password is 'Test@123' hashed with bcrypt
-- ============================================================================
INSERT INTO member (member_id, email, password, first_name, last_name, program_id, created_at, updated_at)
VALUES 
  -- Program 1 (Quicko) members
  ('00022121-0001-0001-0001-000000000001', 'john.member@test.com', '$2b$10$rQnF7yYdZhKxHHC4mONKdOqGqFZYdHPQpFLnJJ0QFHXzRZ3ZR8ZYq', 'John', 'Doe', '2dc9a6b5-e008-4bac-adb0-7f08290d3d2d', NOW(), NOW()),
  ('00023232-0002-0002-0002-000000000002', 'jane.member@test.com', '$2b$10$rQnF7yYdZhKxHHC4mONKdOqGqFZYdHPQpFLnJJ0QFHXzRZ3ZR8ZYq', 'Jane', 'Smith', '2dc9a6b5-e008-4bac-adb0-7f08290d3d2d', NOW(), NOW()),
  -- Program 2 (The Jedi) members
  ('00024343-0003-0003-0003-000000000003', 'mike.member@test.com', '$2b$10$rQnF7yYdZhKxHHC4mONKdOqGqFZYdHPQpFLnJJ0QFHXzRZ3ZR8ZYq', 'Mike', 'Johnson', '727c1da5-2d78-48d5-9492-8488a74333ab', NOW(), NOW()),
  ('00025454-0004-0004-0004-000000000004', 'sarah.member@test.com', '$2b$10$rQnF7yYdZhKxHHC4mONKdOqGqFZYdHPQpFLnJJ0QFHXzRZ3ZR8ZYq', 'Sarah', 'Williams', '727c1da5-2d78-48d5-9492-8488a74333ab', NOW(), NOW())
ON CONFLICT (member_id) DO NOTHING;

-- ============================================================================
-- STEP 13: Insert Promoter Members (promoter_member table)
-- Columns: promoter_id, member_id, status, role
-- Enum statusEnum: 'active', 'inactive'
-- Enum memberRoleEnum: 'admin', 'editor', 'viewer'
-- ============================================================================
INSERT INTO promoter_member (promoter_id, member_id, status, role, created_at, updated_at)
VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00022121-0001-0001-0001-000000000001', 'active', 'admin', NOW(), NOW()),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '00023232-0002-0002-0002-000000000002', 'active', 'admin', NOW(), NOW()),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '00024343-0003-0003-0003-000000000003', 'active', 'admin', NOW(), NOW()),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '00025454-0004-0004-0004-000000000004', 'active', 'admin', NOW(), NOW())
ON CONFLICT (promoter_id, member_id) DO NOTHING;

-- ============================================================================
-- STEP 14: Insert Links (link table)
-- Columns: link_id, name, ref_val, status, program_id, promoter_id
-- Enum linkStatusEnum: 'active', 'archived'
-- ============================================================================
INSERT INTO link (link_id, name, ref_val, status, program_id, promoter_id, created_at, updated_at)
VALUES 
  -- Program 1 (Quicko) - John's links
  ('00026565-0001-0001-0001-000000000001', 'Main Landing Page', 'john-main', 'active', '2dc9a6b5-e008-4bac-adb0-7f08290d3d2d', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NOW() - INTERVAL '55 days', NOW()),
  ('00027676-0002-0002-0002-000000000002', 'Blog Campaign', 'john-blog', 'active', '2dc9a6b5-e008-4bac-adb0-7f08290d3d2d', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NOW() - INTERVAL '50 days', NOW()),
  ('00028787-0003-0003-0003-000000000003', 'YouTube Channel', 'john-youtube', 'active', '2dc9a6b5-e008-4bac-adb0-7f08290d3d2d', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NOW() - INTERVAL '45 days', NOW()),
  -- Program 1 (Quicko) - Jane's links
  ('00029898-0004-0004-0004-000000000004', 'Social Media', 'jane-social', 'active', '2dc9a6b5-e008-4bac-adb0-7f08290d3d2d', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NOW() - INTERVAL '48 days', NOW()),
  ('00030909-0005-0005-0005-000000000005', 'Newsletter', 'jane-newsletter', 'active', '2dc9a6b5-e008-4bac-adb0-7f08290d3d2d', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NOW() - INTERVAL '40 days', NOW()),
  -- Program 1 (Quicko) - Mike's links
  ('00031010-0006-0006-0006-000000000006', 'Instagram Bio', 'mike-ig', 'active', '2dc9a6b5-e008-4bac-adb0-7f08290d3d2d', 'cccccccc-cccc-cccc-cccc-cccccccccccc', NOW() - INTERVAL '38 days', NOW()),
  -- Program 2 (The Jedi) - Mike's links
  ('00032121-0007-0007-0007-000000000007', 'Holiday Sale 2024', 'MIKE2024', 'active', '727c1da5-2d78-48d5-9492-8488a74333ab', 'cccccccc-cccc-cccc-cccc-cccccccccccc', NOW() - INTERVAL '35 days', NOW()),
  ('00033232-0008-0008-0008-000000000008', 'Product Review', 'mike-review', 'active', '727c1da5-2d78-48d5-9492-8488a74333ab', 'cccccccc-cccc-cccc-cccc-cccccccccccc', NOW() - INTERVAL '30 days', NOW()),
  -- Program 2 (The Jedi) - Sarah's links
  ('00034343-0009-0009-0009-000000000009', 'TikTok Link', 'sarah-tiktok', 'active', '727c1da5-2d78-48d5-9492-8488a74333ab', 'dddddddd-dddd-dddd-dddd-dddddddddddd', NOW() - INTERVAL '32 days', NOW()),
  ('00035454-0010-0010-0010-000000000010', 'Podcast Mention', 'sarah-podcast', 'archived', '727c1da5-2d78-48d5-9492-8488a74333ab', 'dddddddd-dddd-dddd-dddd-dddddddddddd', NOW() - INTERVAL '25 days', NOW()),
  -- Program 3 (Best) - Alex's links
  ('00036565-0011-0011-0011-000000000011', 'Blog Link', 'alex-blog', 'active', '0f2e0568-b020-4de8-8f8e-cc7c0e6ac0f9', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', NOW() - INTERVAL '18 days', NOW())
ON CONFLICT (link_id) DO NOTHING;

-- ============================================================================
-- STEP 15: Insert Contacts (contact table)
-- Columns: contact_id, email, first_name, last_name, external_id, phone, status, program_id
-- Enum contactStatusEnum: 'active', 'lead'
-- ============================================================================
INSERT INTO contact (contact_id, email, first_name, last_name, external_id, phone, status, program_id, created_at, updated_at)
VALUES 
  -- Program 1 (Quicko) contacts (various dates for analytics)
  ('00030001-0001-0001-0001-000000000001', 'alice.brown@example.com', 'Alice', 'Brown', 'CUS-001', '+1234567890', 'active', '2dc9a6b5-e008-4bac-adb0-7f08290d3d2d', NOW() - INTERVAL '50 days', NOW()),
  ('00030002-0002-0002-0002-000000000002', 'bob.green@example.com', 'Bob', 'Green', 'CUS-002', '+1234567891', 'active', '2dc9a6b5-e008-4bac-adb0-7f08290d3d2d', NOW() - INTERVAL '45 days', NOW()),
  ('00030003-0003-0003-0003-000000000003', 'charlie.white@example.com', 'Charlie', 'White', 'CUS-003', '+1234567892', 'lead', '2dc9a6b5-e008-4bac-adb0-7f08290d3d2d', NOW() - INTERVAL '40 days', NOW()),
  ('00030004-0004-0004-0004-000000000004', 'diana.black@example.com', 'Diana', 'Black', 'CUS-004', '+1234567893', 'active', '2dc9a6b5-e008-4bac-adb0-7f08290d3d2d', NOW() - INTERVAL '35 days', NOW()),
  ('00030005-0005-0005-0005-000000000005', 'eve.silver@example.com', 'Eve', 'Silver', 'CUS-005', '+1234567894', 'active', '2dc9a6b5-e008-4bac-adb0-7f08290d3d2d', NOW() - INTERVAL '30 days', NOW()),
  ('00030006-0006-0006-0006-000000000006', 'frank.gold@example.com', 'Frank', 'Gold', 'CUS-006', '+1234567895', 'lead', '2dc9a6b5-e008-4bac-adb0-7f08290d3d2d', NOW() - INTERVAL '25 days', NOW()),
  ('00030007-0007-0007-0007-000000000007', 'grace.copper@example.com', 'Grace', 'Copper', 'CUS-007', '+1234567896', 'active', '2dc9a6b5-e008-4bac-adb0-7f08290d3d2d', NOW() - INTERVAL '20 days', NOW()),
  ('00030008-0008-0008-0008-000000000008', 'henry.bronze@example.com', 'Henry', 'Bronze', 'CUS-008', '+1234567897', 'active', '2dc9a6b5-e008-4bac-adb0-7f08290d3d2d', NOW() - INTERVAL '15 days', NOW()),
  ('00030009-0009-0009-0009-000000000009', 'ivy.platinum@example.com', 'Ivy', 'Platinum', 'CUS-009', '+1234567898', 'lead', '2dc9a6b5-e008-4bac-adb0-7f08290d3d2d', NOW() - INTERVAL '10 days', NOW()),
  ('00030010-0010-0010-0010-000000000010', 'jack.diamond@example.com', 'Jack', 'Diamond', 'CUS-010', '+1234567899', 'active', '2dc9a6b5-e008-4bac-adb0-7f08290d3d2d', NOW() - INTERVAL '5 days', NOW()),
  -- Program 2 (The Jedi) contacts
  ('00030011-0011-0011-0011-000000000011', 'kate.ruby@example.com', 'Kate', 'Ruby', 'CUS-011', '+2234567890', 'active', '727c1da5-2d78-48d5-9492-8488a74333ab', NOW() - INTERVAL '30 days', NOW()),
  ('00030012-0012-0012-0012-000000000012', 'leo.sapphire@example.com', 'Leo', 'Sapphire', 'CUS-012', '+2234567891', 'active', '727c1da5-2d78-48d5-9492-8488a74333ab', NOW() - INTERVAL '25 days', NOW()),
  ('00030013-0013-0013-0013-000000000013', 'mia.emerald@example.com', 'Mia', 'Emerald', 'CUS-013', '+2234567892', 'lead', '727c1da5-2d78-48d5-9492-8488a74333ab', NOW() - INTERVAL '20 days', NOW()),
  ('00030014-0014-0014-0014-000000000014', 'noah.topaz@example.com', 'Noah', 'Topaz', 'CUS-014', '+2234567893', 'active', '727c1da5-2d78-48d5-9492-8488a74333ab', NOW() - INTERVAL '15 days', NOW()),
  ('00030015-0015-0015-0015-000000000015', 'olivia.pearl@example.com', 'Olivia', 'Pearl', 'CUS-015', '+2234567894', 'active', '727c1da5-2d78-48d5-9492-8488a74333ab', NOW() - INTERVAL '10 days', NOW()),
  -- Program 3 (Best) contacts
  ('00030016-0016-0016-0016-000000000016', 'peter.opal@example.com', 'Peter', 'Opal', 'CUS-016', '+3234567890', 'lead', '0f2e0568-b020-4de8-8f8e-cc7c0e6ac0f9', NOW() - INTERVAL '15 days', NOW()),
  ('00030017-0017-0017-0017-000000000017', 'quinn.jade@example.com', 'Quinn', 'Jade', 'CUS-017', '+3234567891', 'active', '0f2e0568-b020-4de8-8f8e-cc7c0e6ac0f9', NOW() - INTERVAL '10 days', NOW())
ON CONFLICT (contact_id) DO NOTHING;

-- ============================================================================
-- STEP 16: Insert Sign Ups (sign_up table)
-- Columns: contact_id (PK), promoter_id, link_id, utm_params
-- ============================================================================
INSERT INTO sign_up (contact_id, promoter_id, link_id, utm_params, created_at, updated_at)
VALUES 
  -- Program 1 signups via John's links
  ('00030001-0001-0001-0001-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00026565-0001-0001-0001-000000000001', '{"utm_source": "google", "utm_medium": "cpc", "utm_campaign": "summer2024"}', NOW() - INTERVAL '50 days', NOW()),
  ('00030002-0002-0002-0002-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00027676-0002-0002-0002-000000000002', '{"utm_source": "blog", "utm_medium": "organic", "utm_campaign": "tech-review"}', NOW() - INTERVAL '45 days', NOW()),
  ('00030007-0007-0007-0007-000000000007', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00028787-0003-0003-0003-000000000003', '{"utm_source": "youtube", "utm_medium": "video"}', NOW() - INTERVAL '20 days', NOW()),
  ('00030008-0008-0008-0008-000000000008', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00026565-0001-0001-0001-000000000001', '{"utm_source": "google", "utm_medium": "organic"}', NOW() - INTERVAL '15 days', NOW()),
  -- Program 1 signups via Jane's links
  ('00030003-0003-0003-0003-000000000003', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '00029898-0004-0004-0004-000000000004', '{"utm_source": "twitter", "utm_medium": "social", "utm_campaign": "brand"}', NOW() - INTERVAL '40 days', NOW()),
  ('00030004-0004-0004-0004-000000000004', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '00030909-0005-0005-0005-000000000005', '{"utm_source": "email", "utm_medium": "newsletter"}', NOW() - INTERVAL '35 days', NOW()),
  ('00030009-0009-0009-0009-000000000009', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '00029898-0004-0004-0004-000000000004', '{"utm_source": "instagram", "utm_medium": "social"}', NOW() - INTERVAL '10 days', NOW()),
  -- Program 1 signups via Mike's links
  ('00030005-0005-0005-0005-000000000005', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '00031010-0006-0006-0006-000000000006', '{"utm_source": "instagram", "utm_medium": "bio"}', NOW() - INTERVAL '30 days', NOW()),
  ('00030006-0006-0006-0006-000000000006', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '00031010-0006-0006-0006-000000000006', NULL, NOW() - INTERVAL '25 days', NOW()),
  ('00030010-0010-0010-0010-000000000010', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '00031010-0006-0006-0006-000000000006', '{"utm_source": "direct"}', NOW() - INTERVAL '5 days', NOW()),
  -- Program 2 signups via Mike's links
  ('00030011-0011-0011-0011-000000000011', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '00032121-0007-0007-0007-000000000007', '{"utm_source": "twitter", "utm_medium": "promo", "utm_campaign": "holiday2024"}', NOW() - INTERVAL '30 days', NOW()),
  ('00030012-0012-0012-0012-000000000012', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '00033232-0008-0008-0008-000000000008', '{"utm_source": "blog", "utm_medium": "review"}', NOW() - INTERVAL '25 days', NOW()),
  -- Program 2 signups via Sarah's links
  ('00030013-0013-0013-0013-000000000013', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '00034343-0009-0009-0009-000000000009', '{"utm_source": "tiktok", "utm_medium": "video"}', NOW() - INTERVAL '20 days', NOW()),
  ('00030014-0014-0014-0014-000000000014', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '00034343-0009-0009-0009-000000000009', '{"utm_source": "tiktok", "utm_medium": "bio"}', NOW() - INTERVAL '15 days', NOW()),
  ('00030015-0015-0015-0015-000000000015', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '00035454-0010-0010-0010-000000000010', '{"utm_source": "podcast", "utm_campaign": "tech-talk"}', NOW() - INTERVAL '10 days', NOW()),
  -- Program 3 signups
  ('00030016-0016-0016-0016-000000000016', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '00036565-0011-0011-0011-000000000011', '{"utm_source": "blog", "utm_campaign": "fitness-tips"}', NOW() - INTERVAL '15 days', NOW()),
  ('00030017-0017-0017-0017-000000000017', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '00036565-0011-0011-0011-000000000011', NULL, NOW() - INTERVAL '10 days', NOW())
ON CONFLICT (contact_id) DO NOTHING;

-- ============================================================================
-- STEP 17: Insert Purchases (purchase table)
-- Columns: purchase_id, item_id, contact_id, amount, promoter_id, link_id, utm_params
-- ============================================================================
INSERT INTO purchase (purchase_id, item_id, contact_id, amount, promoter_id, link_id, utm_params, created_at, updated_at)
VALUES 
  -- Program 1 purchases - John's referrals
  ('00031001-0001-0001-0001-000000000001', 'PROD-001', '00030001-0001-0001-0001-000000000001', 99.99, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00026565-0001-0001-0001-000000000001', '{"utm_source": "google"}', NOW() - INTERVAL '48 days', NOW()),
  ('00031002-0002-0002-0002-000000000002', 'PROD-002', '00030001-0001-0001-0001-000000000001', 149.50, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00026565-0001-0001-0001-000000000001', '{"utm_source": "google"}', NOW() - INTERVAL '40 days', NOW()),
  ('00031003-0003-0003-0003-000000000003', 'PROD-003', '00030001-0001-0001-0001-000000000001', 75.00, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00026565-0001-0001-0001-000000000001', NULL, NOW() - INTERVAL '30 days', NOW()),
  ('00031004-0004-0004-0004-000000000004', 'PROD-001', '00030002-0002-0002-0002-000000000002', 199.00, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00027676-0002-0002-0002-000000000002', '{"utm_source": "blog"}', NOW() - INTERVAL '43 days', NOW()),
  ('00031005-0005-0005-0005-000000000005', 'PROD-004', '00030002-0002-0002-0002-000000000002', 59.99, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00027676-0002-0002-0002-000000000002', NULL, NOW() - INTERVAL '35 days', NOW()),
  ('00031006-0006-0006-0006-000000000006', 'PROD-005', '00030007-0007-0007-0007-000000000007', 299.99, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00028787-0003-0003-0003-000000000003', '{"utm_source": "youtube"}', NOW() - INTERVAL '18 days', NOW()),
  ('00031007-0007-0007-0007-000000000007', 'PROD-002', '00030008-0008-0008-0008-000000000008', 149.50, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00026565-0001-0001-0001-000000000001', NULL, NOW() - INTERVAL '12 days', NOW()),
  -- Program 1 purchases - Jane's referrals
  ('00031008-0008-0008-0008-000000000008', 'PROD-002', '00030004-0004-0004-0004-000000000004', 149.50, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '00030909-0005-0005-0005-000000000005', '{"utm_source": "email"}', NOW() - INTERVAL '32 days', NOW()),
  ('00031009-0009-0009-0009-000000000009', 'PROD-006', '00030004-0004-0004-0004-000000000004', 89.99, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '00030909-0005-0005-0005-000000000005', NULL, NOW() - INTERVAL '25 days', NOW()),
  -- Program 1 purchases - Mike's referrals
  ('00031010-0010-0010-0010-000000000010', 'PROD-003', '00030005-0005-0005-0005-000000000005', 75.00, 'cccccccc-cccc-cccc-cccc-cccccccccccc', '00031010-0006-0006-0006-000000000006', '{"utm_source": "instagram"}', NOW() - INTERVAL '28 days', NOW()),
  ('00031011-0011-0011-0011-000000000011', 'PROD-001', '00030010-0010-0010-0010-000000000010', 99.99, 'cccccccc-cccc-cccc-cccc-cccccccccccc', '00031010-0006-0006-0006-000000000006', NULL, NOW() - INTERVAL '3 days', NOW()),
  -- Program 2 purchases - Mike's referrals
  ('00031012-0012-0012-0012-000000000012', 'ECOM-001', '00030011-0011-0011-0011-000000000011', 299.00, 'cccccccc-cccc-cccc-cccc-cccccccccccc', '00032121-0007-0007-0007-000000000007', '{"utm_source": "twitter"}', NOW() - INTERVAL '28 days', NOW()),
  ('00031013-0013-0013-0013-000000000013', 'ECOM-002', '00030011-0011-0011-0011-000000000011', 149.00, 'cccccccc-cccc-cccc-cccc-cccccccccccc', '00032121-0007-0007-0007-000000000007', NULL, NOW() - INTERVAL '20 days', NOW()),
  ('00031014-0014-0014-0014-000000000014', 'ECOM-003', '00030012-0012-0012-0012-000000000012', 79.99, 'cccccccc-cccc-cccc-cccc-cccccccccccc', '00033232-0008-0008-0008-000000000008', '{"utm_source": "blog"}', NOW() - INTERVAL '22 days', NOW()),
  -- Program 2 purchases - Sarah's referrals
  ('00031015-0015-0015-0015-000000000015', 'ECOM-PREMIUM-001', '00030014-0014-0014-0014-000000000014', 499.00, 'dddddddd-dddd-dddd-dddd-dddddddddddd', '00034343-0009-0009-0009-000000000009', '{"utm_source": "tiktok"}', NOW() - INTERVAL '12 days', NOW()),
  ('00031016-0016-0016-0016-000000000016', 'ECOM-001', '00030015-0015-0015-0015-000000000015', 299.00, 'dddddddd-dddd-dddd-dddd-dddddddddddd', '00035454-0010-0010-0010-000000000010', '{"utm_source": "podcast"}', NOW() - INTERVAL '8 days', NOW()),
  -- Program 3 purchases
  ('00031017-0017-0017-0017-000000000017', 'FIT-001', '00030017-0017-0017-0017-000000000017', 49.99, 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '00036565-0011-0011-0011-000000000011', NULL, NOW() - INTERVAL '8 days', NOW())
ON CONFLICT (purchase_id) DO NOTHING;

-- ============================================================================
-- STEP 18: Insert Commissions (commission table)
-- Columns: commission_id, conversion_type, external_id, amount, revenue, contact_id, promoter_id, link_id
-- Enum conversionTypeEnum: 'signup', 'purchase'
-- ============================================================================
INSERT INTO commission (commission_id, conversion_type, external_id, amount, revenue, contact_id, promoter_id, link_id, created_at, updated_at)
VALUES 
  -- Program 1 signup commissions (John - $10 per signup)
  ('00032001-0001-0001-0001-000000000001', 'signup', '00030001-0001-0001-0001-000000000001', 10.00, NULL, '00030001-0001-0001-0001-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00026565-0001-0001-0001-000000000001', NOW() - INTERVAL '50 days', NOW()),
  ('00032002-0002-0002-0002-000000000002', 'signup', '00030002-0002-0002-0002-000000000002', 10.00, NULL, '00030002-0002-0002-0002-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00027676-0002-0002-0002-000000000002', NOW() - INTERVAL '45 days', NOW()),
  ('00032003-0003-0003-0003-000000000003', 'signup', '00030007-0007-0007-0007-000000000007', 10.00, NULL, '00030007-0007-0007-0007-000000000007', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00028787-0003-0003-0003-000000000003', NOW() - INTERVAL '20 days', NOW()),
  ('00032004-0004-0004-0004-000000000004', 'signup', '00030008-0008-0008-0008-000000000008', 10.00, NULL, '00030008-0008-0008-0008-000000000008', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00026565-0001-0001-0001-000000000001', NOW() - INTERVAL '15 days', NOW()),
  -- Program 1 purchase commissions (John - 10% for default, 20% for VIP)
  ('00032005-0005-0005-0005-000000000005', 'purchase', '00031001-0001-0001-0001-000000000001', 20.00, 99.99, '00030001-0001-0001-0001-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00026565-0001-0001-0001-000000000001', NOW() - INTERVAL '48 days', NOW()),
  ('00032006-0006-0006-0006-000000000006', 'purchase', '00031002-0002-0002-0002-000000000002', 29.90, 149.50, '00030001-0001-0001-0001-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00026565-0001-0001-0001-000000000001', NOW() - INTERVAL '40 days', NOW()),
  ('00032007-0007-0007-0007-000000000007', 'purchase', '00031003-0003-0003-0003-000000000003', 15.00, 75.00, '00030001-0001-0001-0001-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00026565-0001-0001-0001-000000000001', NOW() - INTERVAL '30 days', NOW()),
  ('00032008-0008-0008-0008-000000000008', 'purchase', '00031004-0004-0004-0004-000000000004', 39.80, 199.00, '00030002-0002-0002-0002-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00027676-0002-0002-0002-000000000002', NOW() - INTERVAL '43 days', NOW()),
  ('00032009-0009-0009-0009-000000000009', 'purchase', '00031005-0005-0005-0005-000000000005', 12.00, 59.99, '00030002-0002-0002-0002-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00027676-0002-0002-0002-000000000002', NOW() - INTERVAL '35 days', NOW()),
  ('00032010-0010-0010-0010-000000000010', 'purchase', '00031006-0006-0006-0006-000000000006', 60.00, 299.99, '00030007-0007-0007-0007-000000000007', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00028787-0003-0003-0003-000000000003', NOW() - INTERVAL '18 days', NOW()),
  ('00032011-0011-0011-0011-000000000011', 'purchase', '00031007-0007-0007-0007-000000000007', 29.90, 149.50, '00030008-0008-0008-0008-000000000008', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00026565-0001-0001-0001-000000000001', NOW() - INTERVAL '12 days', NOW()),
  -- Program 1 signup commissions (Jane)
  ('00032012-0012-0012-0012-000000000012', 'signup', '00030003-0003-0003-0003-000000000003', 10.00, NULL, '00030003-0003-0003-0003-000000000003', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '00029898-0004-0004-0004-000000000004', NOW() - INTERVAL '40 days', NOW()),
  ('00032013-0013-0013-0013-000000000013', 'signup', '00030004-0004-0004-0004-000000000004', 10.00, NULL, '00030004-0004-0004-0004-000000000004', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '00030909-0005-0005-0005-000000000005', NOW() - INTERVAL '35 days', NOW()),
  -- Program 1 purchase commissions (Jane)
  ('00032014-0014-0014-0014-000000000014', 'purchase', '00031008-0008-0008-0008-000000000008', 14.95, 149.50, '00030004-0004-0004-0004-000000000004', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '00030909-0005-0005-0005-000000000005', NOW() - INTERVAL '32 days', NOW()),
  ('00032015-0015-0015-0015-000000000015', 'purchase', '00031009-0009-0009-0009-000000000009', 9.00, 89.99, '00030004-0004-0004-0004-000000000004', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '00030909-0005-0005-0005-000000000005', NOW() - INTERVAL '25 days', NOW()),
  -- Program 1 signup commissions (Mike)
  ('00032016-0016-0016-0016-000000000016', 'signup', '00030005-0005-0005-0005-000000000005', 10.00, NULL, '00030005-0005-0005-0005-000000000005', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '00031010-0006-0006-0006-000000000006', NOW() - INTERVAL '30 days', NOW()),
  -- Program 1 purchase commissions (Mike)
  ('00032017-0017-0017-0017-000000000017', 'purchase', '00031010-0010-0010-0010-000000000010', 7.50, 75.00, '00030005-0005-0005-0005-000000000005', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '00031010-0006-0006-0006-000000000006', NOW() - INTERVAL '28 days', NOW()),
  ('00032018-0018-0018-0018-000000000018', 'purchase', '00031011-0011-0011-0011-000000000011', 10.00, 99.99, '00030010-0010-0010-0010-000000000010', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '00031010-0006-0006-0006-000000000006', NOW() - INTERVAL '3 days', NOW()),
  -- Program 2 commissions (Mike - 5% default)
  ('00032019-0019-0019-0019-000000000019', 'purchase', '00031012-0012-0012-0012-000000000012', 14.95, 299.00, '00030011-0011-0011-0011-000000000011', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '00032121-0007-0007-0007-000000000007', NOW() - INTERVAL '28 days', NOW()),
  ('00032020-0020-0020-0020-000000000020', 'purchase', '00031013-0013-0013-0013-000000000013', 7.45, 149.00, '00030011-0011-0011-0011-000000000011', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '00032121-0007-0007-0007-000000000007', NOW() - INTERVAL '20 days', NOW()),
  ('00032021-0021-0021-0021-000000000021', 'purchase', '00031014-0014-0014-0014-000000000014', 4.00, 79.99, '00030012-0012-0012-0012-000000000012', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '00033232-0008-0008-0008-000000000008', NOW() - INTERVAL '22 days', NOW()),
  -- Program 2 commissions (Sarah - 15% premium for PREMIUM items)
  ('00032022-0022-0022-0022-000000000022', 'purchase', '00031015-0015-0015-0015-000000000015', 74.85, 499.00, '00030014-0014-0014-0014-000000000014', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '00034343-0009-0009-0009-000000000009', NOW() - INTERVAL '12 days', NOW()),
  ('00032023-0023-0023-0023-000000000023', 'purchase', '00031016-0016-0016-0016-000000000016', 14.95, 299.00, '00030015-0015-0015-0015-000000000015', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '00035454-0010-0010-0010-000000000010', NOW() - INTERVAL '8 days', NOW()),
  -- Program 3 commissions (Alex)
  ('00032024-0024-0024-0024-000000000024', 'purchase', '00031017-0017-0017-0017-000000000017', 5.00, 49.99, '00030017-0017-0017-0017-000000000017', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '00036565-0011-0011-0011-000000000011', NOW() - INTERVAL '8 days', NOW())
ON CONFLICT (commission_id) DO NOTHING;

-- ============================================================================
-- STEP 19: Refresh Materialized Views
-- ============================================================================
-- These refresh the dashboard aggregated data
REFRESH MATERIALIZED VIEW program_summary_mv;
-- REFRESH MATERIALIZED VIEW promoter_analytics_day_wise_mv;

-- ============================================================================
-- VERIFICATION QUERIES
-- Run these to verify your test data
-- ============================================================================

-- Check program summary view
SELECT * FROM program_summary_mv ORDER BY name;

-- Check promoter analytics (last 30 days)
SELECT * FROM promoter_analytics_day_wise_mv 
WHERE created_at > NOW() - INTERVAL '30 days'
ORDER BY created_at DESC, promoter_name;

-- Count records by table
SELECT 'users' as table_name, COUNT(*) as count FROM "user"
UNION ALL SELECT 'programs', COUNT(*) FROM program
UNION ALL SELECT 'program_user', COUNT(*) FROM program_user
UNION ALL SELECT 'api_key', COUNT(*) FROM api_key
UNION ALL SELECT 'webhook', COUNT(*) FROM webhook
UNION ALL SELECT 'promoters', COUNT(*) FROM promoter
UNION ALL SELECT 'program_promoter', COUNT(*) FROM program_promoter
UNION ALL SELECT 'circles', COUNT(*) FROM circle
UNION ALL SELECT 'circle_promoter', COUNT(*) FROM circle_promoter
UNION ALL SELECT 'functions', COUNT(*) FROM function
UNION ALL SELECT 'conditions', COUNT(*) FROM condition
UNION ALL SELECT 'members', COUNT(*) FROM member
UNION ALL SELECT 'promoter_member', COUNT(*) FROM promoter_member
UNION ALL SELECT 'links', COUNT(*) FROM link
UNION ALL SELECT 'contacts', COUNT(*) FROM contact
UNION ALL SELECT 'sign_ups', COUNT(*) FROM sign_up
UNION ALL SELECT 'purchases', COUNT(*) FROM purchase
UNION ALL SELECT 'commissions', COUNT(*) FROM commission
ORDER BY table_name;

-- ============================================================================
-- TEST CREDENTIALS
-- ============================================================================
-- Admin Portal Login:
--   Super Admin: superadmin@test.com / Test@123
--   Admin:       admin@test.com / Test@123
--   Editor:      editor@test.com / Test@123
--   Viewer:      viewer@test.com / Test@123
--
-- Promoter Portal Login:
--   john.member@test.com / Test@123 (Program - Quicko)
--   jane.member@test.com / Test@123 (Program - Quicko)
--   mike.member@test.com / Test@123 (Program - The Jedi)
--   sarah.member@test.com / Test@123 (Program - The Jedi)
-- ============================================================================
