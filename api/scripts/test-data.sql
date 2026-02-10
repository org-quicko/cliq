-- ============================================================================
-- COMPREHENSIVE TEST DATA FOR DASHBOARD
-- Program ID: 930433e7-591c-4dda-a300-d3bfe17bd03d (The Jedi)
-- Date Range: 2021-2026 for comprehensive chart testing
-- ============================================================================

-- ============================================================================
-- STEP 0: CLEANUP - Delete all data from all tables
-- ============================================================================
TRUNCATE commission CASCADE;
TRUNCATE purchase CASCADE;
TRUNCATE sign_up CASCADE;
TRUNCATE contact CASCADE;
TRUNCATE link CASCADE;
TRUNCATE circle_promoter CASCADE;
TRUNCATE promoter_member CASCADE;
TRUNCATE circle CASCADE;
TRUNCATE function CASCADE;
TRUNCATE condition CASCADE;
TRUNCATE member CASCADE;
TRUNCATE program_promoter CASCADE;
TRUNCATE program_user CASCADE;
TRUNCATE promoter CASCADE;
TRUNCATE api_key CASCADE;
TRUNCATE webhook CASCADE;
-- Keep programs and users

-- ============================================================================
-- STEP 1: Insert Users
-- Using existing users from the database
-- ============================================================================

-- ============================================================================
-- STEP 2: Program Users for The Jedi (930433e7-591c-4dda-a300-d3bfe17bd03d)
-- ============================================================================
INSERT INTO program_user (program_id, user_id, status, role, created_at, updated_at)
VALUES 
  ('930433e7-591c-4dda-a300-d3bfe17bd03d', 'bacea157-5c8c-4d94-8659-e38f63d7d220', 'active', 'super_admin', '2021-01-01', NOW()),
  ('930433e7-591c-4dda-a300-d3bfe17bd03d', '9daf8d36-754d-46db-a3f8-f291dcec975f', 'active', 'admin', '2021-01-01', NOW())
ON CONFLICT (program_id, user_id) DO NOTHING;

-- ============================================================================
-- STEP 3: API Key
-- ============================================================================
INSERT INTO api_key (api_key_id, key, secret, status, program_id, created_at, updated_at)
VALUES 
  ('00001111-1111-1111-1111-111111111111', 'pk_test_jedi_live_001', '$2b$10$rQnF7yYdZhKxHHC4mONKdOqGqFZYdHPQpFLnJJ0QFHXzRZ3ZR8ZYq', 'active', '930433e7-591c-4dda-a300-d3bfe17bd03d', '2021-01-01', NOW())
ON CONFLICT (api_key_id) DO NOTHING;

-- ============================================================================
-- STEP 4: Webhook
-- ============================================================================
INSERT INTO webhook (webhook_id, url, program_id, secret, events, created_at, updated_at)
VALUES 
  ('00002222-2222-2222-2222-222222222222', 'https://thejedi.com/api/webhooks', '930433e7-591c-4dda-a300-d3bfe17bd03d', 'whsec_jedi_secret_456', ARRAY['commission.created', 'signup.created', 'purchase.created'], '2021-01-01', NOW())
ON CONFLICT (webhook_id) DO NOTHING;

-- ============================================================================
-- STEP 5: Insert 25 Promoters with varied join dates
-- ============================================================================
INSERT INTO promoter (promoter_id, name, logo_url, status, created_at, updated_at)
VALUES 
  -- 2021 joiners
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'John Doe', 'https://via.placeholder.com/100/6366F1/FFFFFF?text=JD', 'active', '2021-01-15', NOW()),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Jane Smith', 'https://via.placeholder.com/100/EC4899/FFFFFF?text=JS', 'active', '2021-03-20', NOW()),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Mike Johnson', 'https://via.placeholder.com/100/14B8A6/FFFFFF?text=MJ', 'active', '2021-06-10', NOW()),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Sarah Williams', 'https://via.placeholder.com/100/F97316/FFFFFF?text=SW', 'active', '2021-09-05', NOW()),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Alex Turner', 'https://via.placeholder.com/100/8B5CF6/FFFFFF?text=AT', 'active', '2021-11-22', NOW()),
  -- 2022 joiners
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Emma Davis', 'https://via.placeholder.com/100/DC2626/FFFFFF?text=ED', 'active', '2022-02-14', NOW()),
  ('10101010-1010-1010-1010-101010101010', 'Oliver Brown', 'https://via.placeholder.com/100/2563EB/FFFFFF?text=OB', 'active', '2022-04-18', NOW()),
  ('12121212-1212-1212-1212-121212121212', 'Sophia Wilson', 'https://via.placeholder.com/100/9333EA/FFFFFF?text=SW', 'active', '2022-07-25', NOW()),
  ('13131313-1313-1313-1313-131313131313', 'Liam Martinez', 'https://via.placeholder.com/100/EA580C/FFFFFF?text=LM', 'active', '2022-10-08', NOW()),
  ('14141414-1414-1414-1414-141414141414', 'Isabella Garcia', 'https://via.placeholder.com/100/16A34A/FFFFFF?text=IG', 'active', '2022-12-01', NOW()),
  -- 2023 joiners
  ('15151515-1515-1515-1515-151515151515', 'Noah Rodriguez', 'https://via.placeholder.com/100/0891B2/FFFFFF?text=NR', 'active', '2023-01-22', NOW()),
  ('16161616-1616-1616-1616-161616161616', 'Ava Taylor', 'https://via.placeholder.com/100/7C3AED/FFFFFF?text=AT', 'active', '2023-04-05', NOW()),
  ('17171717-1717-1717-1717-171717171717', 'Ethan Anderson', 'https://via.placeholder.com/100/DB2777/FFFFFF?text=EA', 'active', '2023-06-18', NOW()),
  ('18181818-1818-1818-1818-181818181818', 'Mia Thomas', 'https://via.placeholder.com/100/059669/FFFFFF?text=MT', 'active', '2023-09-27', NOW()),
  ('19191919-1919-1919-1919-191919191919', 'James Jackson', 'https://via.placeholder.com/100/D97706/FFFFFF?text=JJ', 'active', '2023-11-14', NOW()),
  -- 2024 joiners
  ('20202020-2020-2020-2020-202020202020', 'Charlotte White', 'https://via.placeholder.com/100/0F766E/FFFFFF?text=CW', 'active', '2024-02-10', NOW()),
  ('21212121-2121-2121-2121-212121212121', 'Benjamin Harris', 'https://via.placeholder.com/100/7C2D12/FFFFFF?text=BH', 'active', '2024-05-19', NOW()),
  ('22222222-2222-2222-2222-222222222222', 'Amelia Martin', 'https://via.placeholder.com/100/3B82F6/FFFFFF?text=AM', 'active', '2024-07-28', NOW()),
  ('23232323-2323-2323-2323-232323232323', 'Lucas Powell', 'https://via.placeholder.com/100/F97316/FFFFFF?text=LP', 'archived', '2024-09-15', NOW()),
  ('24242424-2424-2424-2424-242424242424', 'Harper Lee', 'https://via.placeholder.com/100/A855F7/FFFFFF?text=HL', 'active', '2024-11-03', NOW()),
  -- 2025 joiners
  ('25252525-2525-2525-2525-252525252525', 'Mason Long', 'https://via.placeholder.com/100/06B6D4/FFFFFF?text=ML', 'active', '2025-01-20', NOW()),
  ('26262626-2626-2626-2626-262626262626', 'Evelyn Patterson', 'https://via.placeholder.com/100/EF4444/FFFFFF?text=EP', 'active', '2025-04-12', NOW()),
  ('27272727-2727-2727-2727-272727272727', 'Logan Hughes', 'https://via.placeholder.com/100/1F2937/FFFFFF?text=LH', 'active', '2025-07-05', NOW()),
  ('28282828-2828-2828-2828-282828282828', 'Abigail Myers', 'https://via.placeholder.com/100/4B5563/FFFFFF?text=AM', 'active', '2025-10-18', NOW()),
  ('29292929-2929-2929-2929-292929292929', 'Lucas Ford', 'https://via.placeholder.com/100/8B7355/FFFFFF?text=LF', 'active', '2025-12-01', NOW())
ON CONFLICT (promoter_id) DO NOTHING;

-- ============================================================================
-- STEP 6: Program Promoters - Link all promoters to The Jedi
-- ============================================================================
INSERT INTO program_promoter (program_id, promoter_id, accepted_terms_and_conditions, created_at, updated_at)
VALUES 
  ('930433e7-591c-4dda-a300-d3bfe17bd03d', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true, '2021-01-15', NOW()),
  ('930433e7-591c-4dda-a300-d3bfe17bd03d', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', true, '2021-03-20', NOW()),
  ('930433e7-591c-4dda-a300-d3bfe17bd03d', 'cccccccc-cccc-cccc-cccc-cccccccccccc', true, '2021-06-10', NOW()),
  ('930433e7-591c-4dda-a300-d3bfe17bd03d', 'dddddddd-dddd-dddd-dddd-dddddddddddd', true, '2021-09-05', NOW()),
  ('930433e7-591c-4dda-a300-d3bfe17bd03d', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', true, '2021-11-22', NOW()),
  ('930433e7-591c-4dda-a300-d3bfe17bd03d', 'ffffffff-ffff-ffff-ffff-ffffffffffff', true, '2022-02-14', NOW()),
  ('930433e7-591c-4dda-a300-d3bfe17bd03d', '10101010-1010-1010-1010-101010101010', true, '2022-04-18', NOW()),
  ('930433e7-591c-4dda-a300-d3bfe17bd03d', '12121212-1212-1212-1212-121212121212', true, '2022-07-25', NOW()),
  ('930433e7-591c-4dda-a300-d3bfe17bd03d', '13131313-1313-1313-1313-131313131313', true, '2022-10-08', NOW()),
  ('930433e7-591c-4dda-a300-d3bfe17bd03d', '14141414-1414-1414-1414-141414141414', true, '2022-12-01', NOW()),
  ('930433e7-591c-4dda-a300-d3bfe17bd03d', '15151515-1515-1515-1515-151515151515', true, '2023-01-22', NOW()),
  ('930433e7-591c-4dda-a300-d3bfe17bd03d', '16161616-1616-1616-1616-161616161616', true, '2023-04-05', NOW()),
  ('930433e7-591c-4dda-a300-d3bfe17bd03d', '17171717-1717-1717-1717-171717171717', true, '2023-06-18', NOW()),
  ('930433e7-591c-4dda-a300-d3bfe17bd03d', '18181818-1818-1818-1818-181818181818', true, '2023-09-27', NOW()),
  ('930433e7-591c-4dda-a300-d3bfe17bd03d', '19191919-1919-1919-1919-191919191919', true, '2023-11-14', NOW()),
  ('930433e7-591c-4dda-a300-d3bfe17bd03d', '20202020-2020-2020-2020-202020202020', true, '2024-02-10', NOW()),
  ('930433e7-591c-4dda-a300-d3bfe17bd03d', '21212121-2121-2121-2121-212121212121', true, '2024-05-19', NOW()),
  ('930433e7-591c-4dda-a300-d3bfe17bd03d', '22222222-2222-2222-2222-222222222222', true, '2024-07-28', NOW()),
  ('930433e7-591c-4dda-a300-d3bfe17bd03d', '23232323-2323-2323-2323-232323232323', false, '2024-09-15', NOW()),
  ('930433e7-591c-4dda-a300-d3bfe17bd03d', '24242424-2424-2424-2424-242424242424', true, '2024-11-03', NOW()),
  ('930433e7-591c-4dda-a300-d3bfe17bd03d', '25252525-2525-2525-2525-252525252525', true, '2025-01-20', NOW()),
  ('930433e7-591c-4dda-a300-d3bfe17bd03d', '26262626-2626-2626-2626-262626262626', true, '2025-04-12', NOW()),
  ('930433e7-591c-4dda-a300-d3bfe17bd03d', '27272727-2727-2727-2727-272727272727', true, '2025-07-05', NOW()),
  ('930433e7-591c-4dda-a300-d3bfe17bd03d', '28282828-2828-2828-2828-282828282828', true, '2025-10-18', NOW()),
  ('930433e7-591c-4dda-a300-d3bfe17bd03d', '29292929-2929-2929-2929-292929292929', true, '2025-12-01', NOW())
ON CONFLICT (program_id, promoter_id) DO NOTHING;

-- ============================================================================
-- STEP 7: Circles
-- ============================================================================
INSERT INTO circle (circle_id, name, is_default_circle, program_id, created_at, updated_at)
VALUES 
  ('00009999-0001-0001-0001-000000000001', 'Default Circle', true, '930433e7-591c-4dda-a300-d3bfe17bd03d', '2021-01-01', NOW()),
  ('00009999-0002-0002-0002-000000000002', 'Premium Partners', false, '930433e7-591c-4dda-a300-d3bfe17bd03d', '2021-01-01', NOW()),
  ('00009999-0003-0003-0003-000000000003', 'VIP Circle', false, '930433e7-591c-4dda-a300-d3bfe17bd03d', '2021-01-01', NOW())
ON CONFLICT (circle_id) DO NOTHING;

-- ============================================================================
-- STEP 8: Circle Promoters
-- ============================================================================
INSERT INTO circle_promoter (circle_id, promoter_id, created_at, updated_at)
VALUES 
  -- Default circle members
  ('00009999-0001-0001-0001-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NOW(), NOW()),
  ('00009999-0001-0001-0001-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NOW(), NOW()),
  ('00009999-0001-0001-0001-000000000001', 'cccccccc-cccc-cccc-cccc-cccccccccccc', NOW(), NOW()),
  ('00009999-0001-0001-0001-000000000001', 'dddddddd-dddd-dddd-dddd-dddddddddddd', NOW(), NOW()),
  ('00009999-0001-0001-0001-000000000001', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', NOW(), NOW()),
  ('00009999-0001-0001-0001-000000000001', '15151515-1515-1515-1515-151515151515', NOW(), NOW()),
  ('00009999-0001-0001-0001-000000000001', '16161616-1616-1616-1616-161616161616', NOW(), NOW()),
  ('00009999-0001-0001-0001-000000000001', '20202020-2020-2020-2020-202020202020', NOW(), NOW()),
  ('00009999-0001-0001-0001-000000000001', '25252525-2525-2525-2525-252525252525', NOW(), NOW()),
  ('00009999-0001-0001-0001-000000000001', '26262626-2626-2626-2626-262626262626', NOW(), NOW()),
  -- Premium partners
  ('00009999-0002-0002-0002-000000000002', 'ffffffff-ffff-ffff-ffff-ffffffffffff', NOW(), NOW()),
  ('00009999-0002-0002-0002-000000000002', '10101010-1010-1010-1010-101010101010', NOW(), NOW()),
  ('00009999-0002-0002-0002-000000000002', '12121212-1212-1212-1212-121212121212', NOW(), NOW()),
  ('00009999-0002-0002-0002-000000000002', '17171717-1717-1717-1717-171717171717', NOW(), NOW()),
  ('00009999-0002-0002-0002-000000000002', '21212121-2121-2121-2121-212121212121', NOW(), NOW()),
  ('00009999-0002-0002-0002-000000000002', '27272727-2727-2727-2727-272727272727', NOW(), NOW()),
  -- VIP circle
  ('00009999-0003-0003-0003-000000000003', '13131313-1313-1313-1313-131313131313', NOW(), NOW()),
  ('00009999-0003-0003-0003-000000000003', '14141414-1414-1414-1414-141414141414', NOW(), NOW()),
  ('00009999-0003-0003-0003-000000000003', '18181818-1818-1818-1818-181818181818', NOW(), NOW()),
  ('00009999-0003-0003-0003-000000000003', '19191919-1919-1919-1919-191919191919', NOW(), NOW()),
  ('00009999-0003-0003-0003-000000000003', '22222222-2222-2222-2222-222222222222', NOW(), NOW()),
  ('00009999-0003-0003-0003-000000000003', '24242424-2424-2424-2424-242424242424', NOW(), NOW()),
  ('00009999-0003-0003-0003-000000000003', '28282828-2828-2828-2828-282828282828', NOW(), NOW()),
  ('00009999-0003-0003-0003-000000000003', '29292929-2929-2929-2929-292929292929', NOW(), NOW())
ON CONFLICT (circle_id, promoter_id) DO NOTHING;

-- ============================================================================
-- STEP 9: Functions
-- ============================================================================
INSERT INTO function (function_id, name, trigger, effect_type, effect, status, circle_id, program_id, created_at, updated_at)
VALUES 
  ('00016666-0001-0001-0001-000000000001', 'Signup Commission $10', 'signup', 'generate_commission', '{"type": "fixed", "value": 10}', 'active', '00009999-0001-0001-0001-000000000001', '930433e7-591c-4dda-a300-d3bfe17bd03d', '2021-01-01', NOW()),
  ('00016666-0002-0002-0002-000000000002', 'Default Purchase 10%', 'purchase', 'generate_commission', '{"type": "percentage", "value": 10}', 'active', '00009999-0001-0001-0001-000000000001', '930433e7-591c-4dda-a300-d3bfe17bd03d', '2021-01-01', NOW()),
  ('00016666-0003-0003-0003-000000000003', 'Premium Purchase 15%', 'purchase', 'generate_commission', '{"type": "percentage", "value": 15}', 'active', '00009999-0002-0002-0002-000000000002', '930433e7-591c-4dda-a300-d3bfe17bd03d', '2021-01-01', NOW()),
  ('00016666-0004-0004-0004-000000000004', 'VIP Purchase 20%', 'purchase', 'generate_commission', '{"type": "percentage", "value": 20}', 'active', '00009999-0003-0003-0003-000000000003', '930433e7-591c-4dda-a300-d3bfe17bd03d', '2021-01-01', NOW())
ON CONFLICT (function_id) DO NOTHING;

-- ============================================================================
-- STEP 10: Members (Promoter portal users)
-- ============================================================================
INSERT INTO member (member_id, email, password, first_name, last_name, program_id, created_at, updated_at)
VALUES 
  ('00022121-0001-0001-0001-000000000001', 'john.member@test.com', '$2b$10$rQnF7yYdZhKxHHC4mONKdOqGqFZYdHPQpFLnJJ0QFHXzRZ3ZR8ZYq', 'John', 'Doe', '930433e7-591c-4dda-a300-d3bfe17bd03d', '2021-01-15', NOW()),
  ('00022121-0002-0002-0002-000000000002', 'jane.member@test.com', '$2b$10$rQnF7yYdZhKxHHC4mONKdOqGqFZYdHPQpFLnJJ0QFHXzRZ3ZR8ZYq', 'Jane', 'Smith', '930433e7-591c-4dda-a300-d3bfe17bd03d', '2021-03-20', NOW()),
  ('00022121-0003-0003-0003-000000000003', 'mike.member@test.com', '$2b$10$rQnF7yYdZhKxHHC4mONKdOqGqFZYdHPQpFLnJJ0QFHXzRZ3ZR8ZYq', 'Mike', 'Johnson', '930433e7-591c-4dda-a300-d3bfe17bd03d', '2021-06-10', NOW()),
  ('00022121-0004-0004-0004-000000000004', 'sarah.member@test.com', '$2b$10$rQnF7yYdZhKxHHC4mONKdOqGqFZYdHPQpFLnJJ0QFHXzRZ3ZR8ZYq', 'Sarah', 'Williams', '930433e7-591c-4dda-a300-d3bfe17bd03d', '2021-09-05', NOW()),
  ('00022121-0005-0005-0005-000000000005', 'emma.member@test.com', '$2b$10$rQnF7yYdZhKxHHC4mONKdOqGqFZYdHPQpFLnJJ0QFHXzRZ3ZR8ZYq', 'Emma', 'Davis', '930433e7-591c-4dda-a300-d3bfe17bd03d', '2022-02-14', NOW())
ON CONFLICT (member_id) DO NOTHING;

-- ============================================================================
-- STEP 11: Promoter Members
-- ============================================================================
INSERT INTO promoter_member (promoter_id, member_id, status, role, created_at, updated_at)
VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00022121-0001-0001-0001-000000000001', 'active', 'admin', NOW(), NOW()),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '00022121-0002-0002-0002-000000000002', 'active', 'admin', NOW(), NOW()),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '00022121-0003-0003-0003-000000000003', 'active', 'admin', NOW(), NOW()),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '00022121-0004-0004-0004-000000000004', 'active', 'admin', NOW(), NOW()),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', '00022121-0005-0005-0005-000000000005', 'active', 'admin', NOW(), NOW())
ON CONFLICT (promoter_id, member_id) DO NOTHING;

-- ============================================================================
-- STEP 12: Links (25 links - one per promoter)
-- ============================================================================
INSERT INTO link (link_id, name, ref_val, status, program_id, promoter_id, created_at, updated_at)
VALUES 
  ('00026565-0001-0001-0001-000000000001', 'John Main Link', 'john-main', 'active', '930433e7-591c-4dda-a300-d3bfe17bd03d', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2021-01-15', NOW()),
  ('00026565-0002-0002-0002-000000000002', 'Jane Social', 'jane-social', 'active', '930433e7-591c-4dda-a300-d3bfe17bd03d', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '2021-03-20', NOW()),
  ('00026565-0003-0003-0003-000000000003', 'Mike Blog', 'mike-blog', 'active', '930433e7-591c-4dda-a300-d3bfe17bd03d', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '2021-06-10', NOW()),
  ('00026565-0004-0004-0004-000000000004', 'Sarah TikTok', 'sarah-tiktok', 'active', '930433e7-591c-4dda-a300-d3bfe17bd03d', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '2021-09-05', NOW()),
  ('00026565-0005-0005-0005-000000000005', 'Alex YouTube', 'alex-yt', 'active', '930433e7-591c-4dda-a300-d3bfe17bd03d', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '2021-11-22', NOW()),
  ('00026565-0006-0006-0006-000000000006', 'Emma Newsletter', 'emma-news', 'active', '930433e7-591c-4dda-a300-d3bfe17bd03d', 'ffffffff-ffff-ffff-ffff-ffffffffffff', '2022-02-14', NOW()),
  ('00026565-0007-0007-0007-000000000007', 'Oliver Podcast', 'oliver-pod', 'active', '930433e7-591c-4dda-a300-d3bfe17bd03d', '10101010-1010-1010-1010-101010101010', '2022-04-18', NOW()),
  ('00026565-0008-0008-0008-000000000008', 'Sophia Instagram', 'sophia-ig', 'active', '930433e7-591c-4dda-a300-d3bfe17bd03d', '12121212-1212-1212-1212-121212121212', '2022-07-25', NOW()),
  ('00026565-0009-0009-0009-000000000009', 'Liam Twitter', 'liam-tw', 'active', '930433e7-591c-4dda-a300-d3bfe17bd03d', '13131313-1313-1313-1313-131313131313', '2022-10-08', NOW()),
  ('00026565-0010-0010-0010-000000000010', 'Isabella Blog', 'isabella-blog', 'active', '930433e7-591c-4dda-a300-d3bfe17bd03d', '14141414-1414-1414-1414-141414141414', '2022-12-01', NOW()),
  ('00026565-0011-0011-0011-000000000011', 'Noah Landing', 'noah-landing', 'active', '930433e7-591c-4dda-a300-d3bfe17bd03d', '15151515-1515-1515-1515-151515151515', '2023-01-22', NOW()),
  ('00026565-0012-0012-0012-000000000012', 'Ava Promo', 'ava-promo', 'active', '930433e7-591c-4dda-a300-d3bfe17bd03d', '16161616-1616-1616-1616-161616161616', '2023-04-05', NOW()),
  ('00026565-0013-0013-0013-000000000013', 'Ethan Review', 'ethan-review', 'active', '930433e7-591c-4dda-a300-d3bfe17bd03d', '17171717-1717-1717-1717-171717171717', '2023-06-18', NOW()),
  ('00026565-0014-0014-0014-000000000014', 'Mia Collab', 'mia-collab', 'active', '930433e7-591c-4dda-a300-d3bfe17bd03d', '18181818-1818-1818-1818-181818181818', '2023-09-27', NOW()),
  ('00026565-0015-0015-0015-000000000015', 'James Campaign', 'james-camp', 'active', '930433e7-591c-4dda-a300-d3bfe17bd03d', '19191919-1919-1919-1919-191919191919', '2023-11-14', NOW()),
  ('00026565-0016-0016-0016-000000000016', 'Charlotte Partner', 'charlotte-ptr', 'active', '930433e7-591c-4dda-a300-d3bfe17bd03d', '20202020-2020-2020-2020-202020202020', '2024-02-10', NOW()),
  ('00026565-0017-0017-0017-000000000017', 'Benjamin Affiliate', 'ben-aff', 'active', '930433e7-591c-4dda-a300-d3bfe17bd03d', '21212121-2121-2121-2121-212121212121', '2024-05-19', NOW()),
  ('00026565-0018-0018-0018-000000000018', 'Amelia Brand', 'amelia-brand', 'active', '930433e7-591c-4dda-a300-d3bfe17bd03d', '22222222-2222-2222-2222-222222222222', '2024-07-28', NOW()),
  ('00026565-0019-0019-0019-000000000019', 'Lucas Holiday', 'lucas-holiday', 'archived', '930433e7-591c-4dda-a300-d3bfe17bd03d', '23232323-2323-2323-2323-232323232323', '2024-09-15', NOW()),
  ('00026565-0020-0020-0020-000000000020', 'Harper Special', 'harper-special', 'active', '930433e7-591c-4dda-a300-d3bfe17bd03d', '24242424-2424-2424-2424-242424242424', '2024-11-03', NOW()),
  ('00026565-0021-0021-0021-000000000021', 'Mason Launch', 'mason-launch', 'active', '930433e7-591c-4dda-a300-d3bfe17bd03d', '25252525-2525-2525-2525-252525252525', '2025-01-20', NOW()),
  ('00026565-0022-0022-0022-000000000022', 'Evelyn Summer', 'evelyn-summer', 'active', '930433e7-591c-4dda-a300-d3bfe17bd03d', '26262626-2626-2626-2626-262626262626', '2025-04-12', NOW()),
  ('00026565-0023-0023-0023-000000000023', 'Logan Fall', 'logan-fall', 'active', '930433e7-591c-4dda-a300-d3bfe17bd03d', '27272727-2727-2727-2727-272727272727', '2025-07-05', NOW()),
  ('00026565-0024-0024-0024-000000000024', 'Abigail Winter', 'abigail-winter', 'active', '930433e7-591c-4dda-a300-d3bfe17bd03d', '28282828-2828-2828-2828-282828282828', '2025-10-18', NOW()),
  ('00026565-0025-0025-0025-000000000025', 'Lucas New Year', 'lucas-ny', 'active', '930433e7-591c-4dda-a300-d3bfe17bd03d', '29292929-2929-2929-2929-292929292929', '2025-12-01', NOW())
ON CONFLICT (link_id) DO NOTHING;

-- ============================================================================
-- STEP 13: Contacts (38 contacts spread across 2021-2026)
-- ============================================================================
INSERT INTO contact (contact_id, email, first_name, last_name, external_id, phone, status, program_id, created_at, updated_at)
VALUES 
  -- Contacts 1-30 distributed across last 30 days (Jan 7 - Feb 5, 2026)
  ('00030001-0001-0001-0001-000000000001', 'alice.2021@example.com', 'Alice', 'Brown', 'CUS-001', '+1234567001', 'active', '930433e7-591c-4dda-a300-d3bfe17bd03d', '2026-01-07', NOW()),
  ('00030002-0002-0002-0002-000000000002', 'bob.2021@example.com', 'Bob', 'Green', 'CUS-002', '+1234567002', 'active', '930433e7-591c-4dda-a300-d3bfe17bd03d', '2026-01-08', NOW()),
  ('00030003-0003-0003-0003-000000000003', 'charlie.2021@example.com', 'Charlie', 'White', 'CUS-003', '+1234567003', 'active', '930433e7-591c-4dda-a300-d3bfe17bd03d', '2026-01-09', NOW()),
  ('00030004-0004-0004-0004-000000000004', 'diana.2021@example.com', 'Diana', 'Black', 'CUS-004', '+1234567004', 'active', '930433e7-591c-4dda-a300-d3bfe17bd03d', '2026-01-10', NOW()),
  ('00030005-0005-0005-0005-000000000005', 'eve.2021@example.com', 'Eve', 'Silver', 'CUS-005', '+1234567005', 'lead', '930433e7-591c-4dda-a300-d3bfe17bd03d', '2026-01-11', NOW()),
  ('00030006-0006-0006-0006-000000000006', 'frank.2022@example.com', 'Frank', 'Gold', 'CUS-006', '+1234567006', 'active', '930433e7-591c-4dda-a300-d3bfe17bd03d', '2026-01-12', NOW()),
  ('00030007-0007-0007-0007-000000000007', 'grace.2022@example.com', 'Grace', 'Copper', 'CUS-007', '+1234567007', 'active', '930433e7-591c-4dda-a300-d3bfe17bd03d', '2026-01-13', NOW()),
  ('00030008-0008-0008-0008-000000000008', 'henry.2022@example.com', 'Henry', 'Bronze', 'CUS-008', '+1234567008', 'active', '930433e7-591c-4dda-a300-d3bfe17bd03d', '2026-01-14', NOW()),
  ('00030009-0009-0009-0009-000000000009', 'ivy.2022@example.com', 'Ivy', 'Platinum', 'CUS-009', '+1234567009', 'lead', '930433e7-591c-4dda-a300-d3bfe17bd03d', '2026-01-15', NOW()),
  ('00030010-0010-0010-0010-000000000010', 'jack.2022@example.com', 'Jack', 'Diamond', 'CUS-010', '+1234567010', 'active', '930433e7-591c-4dda-a300-d3bfe17bd03d', '2026-01-16', NOW()),
  ('00030011-0011-0011-0011-000000000011', 'kate.2023@example.com', 'Kate', 'Ruby', 'CUS-011', '+1234567011', 'active', '930433e7-591c-4dda-a300-d3bfe17bd03d', '2026-01-17', NOW()),
  ('00030012-0012-0012-0012-000000000012', 'leo.2023@example.com', 'Leo', 'Sapphire', 'CUS-012', '+1234567012', 'active', '930433e7-591c-4dda-a300-d3bfe17bd03d', '2026-01-18', NOW()),
  ('00030013-0013-0013-0013-000000000013', 'mia.2023@example.com', 'Mia', 'Emerald', 'CUS-013', '+1234567013', 'active', '930433e7-591c-4dda-a300-d3bfe17bd03d', '2026-01-19', NOW()),
  ('00030014-0014-0014-0014-000000000014', 'noah.2023@example.com', 'Noah', 'Topaz', 'CUS-014', '+1234567014', 'lead', '930433e7-591c-4dda-a300-d3bfe17bd03d', '2026-01-20', NOW()),
  ('00030015-0015-0015-0015-000000000015', 'olivia.2023@example.com', 'Olivia', 'Pearl', 'CUS-015', '+1234567015', 'active', '930433e7-591c-4dda-a300-d3bfe17bd03d', '2026-01-21', NOW()),
  ('00030016-0016-0016-0016-000000000016', 'peter.2024@example.com', 'Peter', 'Opal', 'CUS-016', '+1234567016', 'active', '930433e7-591c-4dda-a300-d3bfe17bd03d', '2026-01-22', NOW()),
  ('00030017-0017-0017-0017-000000000017', 'quinn.2024@example.com', 'Quinn', 'Jade', 'CUS-017', '+1234567017', 'active', '930433e7-591c-4dda-a300-d3bfe17bd03d', '2026-01-23', NOW()),
  ('00030018-0018-0018-0018-000000000018', 'rachel.2024@example.com', 'Rachel', 'Amber', 'CUS-018', '+1234567018', 'active', '930433e7-591c-4dda-a300-d3bfe17bd03d', '2026-01-24', NOW()),
  ('00030019-0019-0019-0019-000000000019', 'sam.2024@example.com', 'Sam', 'Onyx', 'CUS-019', '+1234567019', 'lead', '930433e7-591c-4dda-a300-d3bfe17bd03d', '2026-01-25', NOW()),
  ('00030020-0020-0020-0020-000000000020', 'tina.2024@example.com', 'Tina', 'Coral', 'CUS-020', '+1234567020', 'active', '930433e7-591c-4dda-a300-d3bfe17bd03d', '2026-01-26', NOW()),
  ('00030021-0021-0021-0021-000000000021', 'steve.2024@example.com', 'Steve', 'Iron', 'CUS-021', '+1234567021', 'active', '930433e7-591c-4dda-a300-d3bfe17bd03d', '2026-01-27', NOW()),
  ('00030022-0022-0022-0022-000000000022', 'uma.2025@example.com', 'Uma', 'Steel', 'CUS-022', '+1234567022', 'active', '930433e7-591c-4dda-a300-d3bfe17bd03d', '2026-01-28', NOW()),
  ('00030023-0023-0023-0023-000000000023', 'victor.2025@example.com', 'Victor', 'Chrome', 'CUS-023', '+1234567023', 'active', '930433e7-591c-4dda-a300-d3bfe17bd03d', '2026-01-29', NOW()),
  ('00030024-0024-0024-0024-000000000024', 'wendy.2025@example.com', 'Wendy', 'Zinc', 'CUS-024', '+1234567024', 'active', '930433e7-591c-4dda-a300-d3bfe17bd03d', '2026-01-30', NOW()),
  ('00030025-0025-0025-0025-000000000025', 'xavier.2025@example.com', 'Xavier', 'Nickel', 'CUS-025', '+1234567025', 'lead', '930433e7-591c-4dda-a300-d3bfe17bd03d', '2026-01-31', NOW()),
  ('00030026-0026-0026-0026-000000000026', 'yara.2025@example.com', 'Yara', 'Cobalt', 'CUS-026', '+1234567026', 'active', '930433e7-591c-4dda-a300-d3bfe17bd03d', '2026-02-01', NOW()),
  ('00030027-0027-0027-0027-000000000027', 'zack.2025@example.com', 'Zack', 'Titanium', 'CUS-027', '+1234567027', 'active', '930433e7-591c-4dda-a300-d3bfe17bd03d', '2026-02-02', NOW()),
  ('00030028-0028-0028-0028-000000000028', 'anna.2025@example.com', 'Anna', 'Magnesium', 'CUS-028', '+1234567028', 'active', '930433e7-591c-4dda-a300-d3bfe17bd03d', '2026-02-03', NOW()),
  ('00030029-0029-0029-0029-000000000029', 'brian.2025@example.com', 'Brian', 'Aluminum', 'CUS-029', '+1234567029', 'lead', '930433e7-591c-4dda-a300-d3bfe17bd03d', '2026-02-04', NOW()),
  ('00030030-0030-0030-0030-000000000030', 'cara.2025@example.com', 'Cara', 'Tin', 'CUS-030', '+1234567030', 'active', '930433e7-591c-4dda-a300-d3bfe17bd03d', '2026-02-05', NOW()),
  -- Contacts 31-38 (2026, keep beyond 30-day window)
  ('00030031-0031-0031-0031-000000000031', 'derek.2025@example.com', 'Derek', 'Lead', 'CUS-031', '+1234567031', 'active', '930433e7-591c-4dda-a300-d3bfe17bd03d', '2025-10-22', NOW()),
  ('00030032-0032-0032-0032-000000000032', 'elsa.2025@example.com', 'Elsa', 'Copper', 'CUS-032', '+1234567032', 'active', '930433e7-591c-4dda-a300-d3bfe17bd03d', '2025-11-08', NOW()),
  ('00030033-0033-0033-0033-000000000033', 'fred.2025@example.com', 'Fred', 'Mercury', 'CUS-033', '+1234567033', 'active', '930433e7-591c-4dda-a300-d3bfe17bd03d', '2025-12-01', NOW()),
  ('00030034-0034-0034-0034-000000000034', 'gina.2026@example.com', 'Gina', 'Iridium', 'CUS-034', '+1234567034', 'active', '930433e7-591c-4dda-a300-d3bfe17bd03d', '2026-01-05', NOW()),
  ('00030035-0035-0035-0035-000000000035', 'harry.2026@example.com', 'Harry', 'Osmium', 'CUS-035', '+1234567035', 'active', '930433e7-591c-4dda-a300-d3bfe17bd03d', '2026-01-15', NOW()),
  ('00030036-0036-0036-0036-000000000036', 'iris.2026@example.com', 'Iris', 'Rhodium', 'CUS-036', '+1234567036', 'lead', '930433e7-591c-4dda-a300-d3bfe17bd03d', '2026-01-25', NOW()),
  ('00030037-0037-0037-0037-000000000037', 'jake.2026@example.com', 'Jake', 'Palladium', 'CUS-037', '+1234567037', 'active', '930433e7-591c-4dda-a300-d3bfe17bd03d', '2026-02-01', NOW()),
  ('00030038-0038-0038-0038-000000000038', 'kelly.2026@example.com', 'Kelly', 'Ruthenium', 'CUS-038', '+1234567038', 'active', '930433e7-591c-4dda-a300-d3bfe17bd03d', '2026-02-05', NOW())
ON CONFLICT (contact_id) DO NOTHING;

-- ============================================================================
-- STEP 14: Sign Ups (distributed across last 30 days + historical)
-- ============================================================================
INSERT INTO sign_up (contact_id, promoter_id, link_id, utm_params, created_at, updated_at)
VALUES 
  -- Signups 1-30 distributed across last 30 days (Jan 7 - Feb 5, 2026)
  ('00030001-0001-0001-0001-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00026565-0001-0001-0001-000000000001', '{"utm_source": "google", "utm_medium": "cpc"}', '2026-01-07', NOW()),
  ('00030002-0002-0002-0002-000000000002', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '00026565-0002-0002-0002-000000000002', '{"utm_source": "facebook", "utm_medium": "social"}', '2026-01-08', NOW()),
  ('00030003-0003-0003-0003-000000000003', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '00026565-0003-0003-0003-000000000003', '{"utm_source": "blog", "utm_medium": "organic"}', '2026-01-09', NOW()),
  ('00030004-0004-0004-0004-000000000004', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '00026565-0004-0004-0004-000000000004', '{"utm_source": "tiktok", "utm_medium": "video"}', '2026-01-10', NOW()),
  ('00030005-0005-0005-0005-000000000005', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '00026565-0005-0005-0005-000000000005', '{"utm_source": "youtube", "utm_medium": "video"}', '2026-01-11', NOW()),
  ('00030006-0006-0006-0006-000000000006', 'ffffffff-ffff-ffff-ffff-ffffffffffff', '00026565-0006-0006-0006-000000000006', '{"utm_source": "email", "utm_medium": "newsletter"}', '2026-01-12', NOW()),
  ('00030007-0007-0007-0007-000000000007', '10101010-1010-1010-1010-101010101010', '00026565-0007-0007-0007-000000000007', '{"utm_source": "podcast", "utm_medium": "audio"}', '2026-01-13', NOW()),
  ('00030008-0008-0008-0008-000000000008', '12121212-1212-1212-1212-121212121212', '00026565-0008-0008-0008-000000000008', '{"utm_source": "instagram", "utm_medium": "social"}', '2026-01-14', NOW()),
  ('00030009-0009-0009-0009-000000000009', '13131313-1313-1313-1313-131313131313', '00026565-0009-0009-0009-000000000009', '{"utm_source": "twitter", "utm_medium": "social"}', '2026-01-15', NOW()),
  ('00030010-0010-0010-0010-000000000010', '14141414-1414-1414-1414-141414141414', '00026565-0010-0010-0010-000000000010', '{"utm_source": "blog", "utm_medium": "organic"}', '2026-01-16', NOW()),
  ('00030011-0011-0011-0011-000000000011', '15151515-1515-1515-1515-151515151515', '00026565-0011-0011-0011-000000000011', '{"utm_source": "google", "utm_medium": "organic"}', '2026-01-17', NOW()),
  ('00030012-0012-0012-0012-000000000012', '16161616-1616-1616-1616-161616161616', '00026565-0012-0012-0012-000000000012', '{"utm_source": "promo", "utm_medium": "influencer"}', '2026-01-18', NOW()),
  ('00030013-0013-0013-0013-000000000013', '17171717-1717-1717-1717-171717171717', '00026565-0013-0013-0013-000000000013', '{"utm_source": "review", "utm_medium": "blog"}', '2026-01-19', NOW()),
  ('00030014-0014-0014-0014-000000000014', '18181818-1818-1818-1818-181818181818', '00026565-0014-0014-0014-000000000014', '{"utm_source": "collab", "utm_medium": "partnership"}', '2026-01-20', NOW()),
  ('00030015-0015-0015-0015-000000000015', '19191919-1919-1919-1919-191919191919', '00026565-0015-0015-0015-000000000015', '{"utm_source": "campaign", "utm_medium": "paid"}', '2026-01-21', NOW()),
  ('00030016-0016-0016-0016-000000000016', '20202020-2020-2020-2020-202020202020', '00026565-0016-0016-0016-000000000016', '{"utm_source": "partner", "utm_medium": "referral"}', '2026-01-22', NOW()),
  ('00030017-0017-0017-0017-000000000017', '21212121-2121-2121-2121-212121212121', '00026565-0017-0017-0017-000000000017', '{"utm_source": "affiliate", "utm_medium": "link"}', '2026-01-23', NOW()),
  ('00030018-0018-0018-0018-000000000018', '22222222-2222-2222-2222-222222222222', '00026565-0018-0018-0018-000000000018', '{"utm_source": "brand", "utm_medium": "collab"}', '2026-01-24', NOW()),
  ('00030019-0019-0019-0019-000000000019', '23232323-2323-2323-2323-232323232323', '00026565-0019-0019-0019-000000000019', '{"utm_source": "holiday", "utm_medium": "promo"}', '2026-01-25', NOW()),
  ('00030020-0020-0020-0020-000000000020', '24242424-2424-2424-2424-242424242424', '00026565-0020-0020-0020-000000000020', '{"utm_source": "special", "utm_medium": "offer"}', '2026-01-26', NOW()),
  ('00030021-0021-0021-0021-000000000021', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00026565-0001-0001-0001-000000000001', '{"utm_source": "repeat", "utm_medium": "organic"}', '2026-01-27', NOW()),
  ('00030022-0022-0022-0022-000000000022', '25252525-2525-2525-2525-252525252525', '00026565-0021-0021-0021-000000000021', '{"utm_source": "launch", "utm_medium": "campaign"}', '2026-01-28', NOW()),
  ('00030023-0023-0023-0023-000000000023', '26262626-2626-2626-2626-262626262626', '00026565-0022-0022-0022-000000000022', '{"utm_source": "summer", "utm_medium": "promo"}', '2026-01-29', NOW()),
  ('00030024-0024-0024-0024-000000000024', '27272727-2727-2727-2727-272727272727', '00026565-0023-0023-0023-000000000023', '{"utm_source": "fall", "utm_medium": "campaign"}', '2026-01-30', NOW()),
  ('00030025-0025-0025-0025-000000000025', '28282828-2828-2828-2828-282828282828', '00026565-0024-0024-0024-000000000024', '{"utm_source": "winter", "utm_medium": "promo"}', '2026-01-31', NOW()),
  ('00030026-0026-0026-0026-000000000026', '29292929-2929-2929-2929-292929292929', '00026565-0025-0025-0025-000000000025', '{"utm_source": "newyear", "utm_medium": "campaign"}', '2026-02-01', NOW()),
  ('00030027-0027-0027-0027-000000000027', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00026565-0001-0001-0001-000000000001', '{"utm_source": "google", "utm_medium": "organic"}', '2026-02-02', NOW()),
  ('00030028-0028-0028-0028-000000000028', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '00026565-0002-0002-0002-000000000002', '{"utm_source": "social", "utm_medium": "paid"}', '2026-02-03', NOW()),
  ('00030029-0029-0029-0029-000000000029', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '00026565-0003-0003-0003-000000000003', '{"utm_source": "blog", "utm_medium": "seo"}', '2026-02-04', NOW()),
  ('00030030-0030-0030-0030-000000000030', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '00026565-0004-0004-0004-000000000004', '{"utm_source": "tiktok", "utm_medium": "viral"}', '2026-02-05', NOW()),
  -- Signups 31-38 (keep dates beyond 30-day window)
  ('00030031-0031-0031-0031-000000000031', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '00026565-0005-0005-0005-000000000005', '{"utm_source": "youtube", "utm_medium": "shorts"}', '2025-10-22', NOW()),
  ('00030032-0032-0032-0032-000000000032', 'ffffffff-ffff-ffff-ffff-ffffffffffff', '00026565-0006-0006-0006-000000000006', '{"utm_source": "email", "utm_medium": "blast"}', '2025-11-08', NOW()),
  ('00030033-0033-0033-0033-000000000033', '10101010-1010-1010-1010-101010101010', '00026565-0007-0007-0007-000000000007', '{"utm_source": "podcast", "utm_medium": "sponsorship"}', '2025-12-01', NOW()),
  ('00030034-0034-0034-0034-000000000034', '12121212-1212-1212-1212-121212121212', '00026565-0008-0008-0008-000000000008', '{"utm_source": "instagram", "utm_medium": "reels"}', '2026-01-05', NOW()),
  ('00030035-0035-0035-0035-000000000035', '13131313-1313-1313-1313-131313131313', '00026565-0009-0009-0009-000000000009', '{"utm_source": "twitter", "utm_medium": "thread"}', '2026-01-15', NOW()),
  ('00030036-0036-0036-0036-000000000036', '14141414-1414-1414-1414-141414141414', '00026565-0010-0010-0010-000000000010', '{"utm_source": "blog", "utm_medium": "guest"}', '2026-01-25', NOW()),
  ('00030037-0037-0037-0037-000000000037', '15151515-1515-1515-1515-151515151515', '00026565-0011-0011-0011-000000000011', '{"utm_source": "landing", "utm_medium": "ppc"}', '2026-02-01', NOW()),
  ('00030038-0038-0038-0038-000000000038', '16161616-1616-1616-1616-161616161616', '00026565-0012-0012-0012-000000000012', '{"utm_source": "promo", "utm_medium": "flash"}', '2026-02-05', NOW())
ON CONFLICT (contact_id) DO NOTHING;

-- ============================================================================
-- STEP 15: Purchases (37 purchases with varied amounts)
-- ============================================================================
INSERT INTO purchase (purchase_id, item_id, contact_id, amount, promoter_id, link_id, utm_params, created_at, updated_at)
VALUES 
  -- Purchases 1-30 distributed across last 30 days (Jan 7 - Feb 5, 2026)
  ('00031001-0001-0001-0001-000000000001', 'PROD-001', '00030001-0001-0001-0001-000000000001', 199.99, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00026565-0001-0001-0001-000000000001', '{"utm_source": "google"}', '2026-01-07', NOW()),
  ('00031002-0002-0002-0002-000000000002', 'PROD-002', '00030002-0002-0002-0002-000000000002', 349.50, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '00026565-0002-0002-0002-000000000002', '{"utm_source": "facebook"}', '2026-01-08', NOW()),
  ('00031003-0003-0003-0003-000000000003', 'PROD-003', '00030003-0003-0003-0003-000000000003', 149.00, 'cccccccc-cccc-cccc-cccc-cccccccccccc', '00026565-0003-0003-0003-000000000003', '{"utm_source": "blog"}', '2026-01-09', NOW()),
  ('00031004-0004-0004-0004-000000000004', 'PROD-004', '00030004-0004-0004-0004-000000000004', 499.99, 'dddddddd-dddd-dddd-dddd-dddddddddddd', '00026565-0004-0004-0004-000000000004', '{"utm_source": "tiktok"}', '2026-01-10', NOW()),
  ('00031005-0005-0005-0005-000000000005', 'PROD-005', '00030006-0006-0006-0006-000000000006', 75.00, 'ffffffff-ffff-ffff-ffff-ffffffffffff', '00026565-0006-0006-0006-000000000006', '{"utm_source": "email"}', '2026-01-12', NOW()),
  ('00031006-0006-0006-0006-000000000006', 'PROD-001', '00030007-0007-0007-0007-000000000007', 199.99, '10101010-1010-1010-1010-101010101010', '00026565-0007-0007-0007-000000000007', '{"utm_source": "podcast"}', '2026-01-13', NOW()),
  ('00031007-0007-0007-0007-000000000007', 'PROD-002', '00030008-0008-0008-0008-000000000008', 349.50, '12121212-1212-1212-1212-121212121212', '00026565-0008-0008-0008-000000000008', '{"utm_source": "instagram"}', '2026-01-14', NOW()),
  ('00031008-0008-0008-0008-000000000008', 'PROD-006', '00030009-0009-0009-0009-000000000009', 599.00, '13131313-1313-1313-1313-131313131313', '00026565-0009-0009-0009-000000000009', '{"utm_source": "twitter"}', '2026-01-15', NOW()),
  ('00031009-0009-0009-0009-000000000009', 'PROD-003', '00030010-0010-0010-0010-000000000010', 149.00, '14141414-1414-1414-1414-141414141414', '00026565-0010-0010-0010-000000000010', '{"utm_source": "blog"}', '2026-01-16', NOW()),
  ('00031010-0010-0010-0010-000000000010', 'PROD-007', '00030011-0011-0011-0011-000000000011', 299.99, '15151515-1515-1515-1515-151515151515', '00026565-0011-0011-0011-000000000011', '{"utm_source": "google"}', '2026-01-17', NOW()),
  ('00031011-0011-0011-0011-000000000011', 'PROD-001', '00030012-0012-0012-0012-000000000012', 199.99, '16161616-1616-1616-1616-161616161616', '00026565-0012-0012-0012-000000000012', '{"utm_source": "promo"}', '2026-01-18', NOW()),
  ('00031012-0012-0012-0012-000000000012', 'PROD-008', '00030013-0013-0013-0013-000000000013', 449.00, '17171717-1717-1717-1717-171717171717', '00026565-0013-0013-0013-000000000013', '{"utm_source": "review"}', '2026-01-19', NOW()),
  ('00031013-0013-0013-0013-000000000013', 'PROD-002', '00030014-0014-0014-0014-000000000014', 349.50, '18181818-1818-1818-1818-181818181818', '00026565-0014-0014-0014-000000000014', '{"utm_source": "collab"}', '2026-01-20', NOW()),
  ('00031014-0014-0014-0014-000000000014', 'PROD-009', '00030015-0015-0015-0015-000000000015', 799.99, '19191919-1919-1919-1919-191919191919', '00026565-0015-0015-0015-000000000015', '{"utm_source": "campaign"}', '2026-01-21', NOW()),
  ('00031015-0015-0015-0015-000000000015', 'PROD-010', '00030016-0016-0016-0016-000000000016', 129.99, '20202020-2020-2020-2020-202020202020', '00026565-0016-0016-0016-000000000016', '{"utm_source": "partner"}', '2026-01-22', NOW()),
  ('00031016-0016-0016-0016-000000000016', 'PROD-001', '00030017-0017-0017-0017-000000000017', 199.99, '21212121-2121-2121-2121-212121212121', '00026565-0017-0017-0017-000000000017', '{"utm_source": "affiliate"}', '2026-01-23', NOW()),
  ('00031017-0017-0017-0017-000000000017', 'PROD-011', '00030018-0018-0018-0018-000000000018', 549.00, '22222222-2222-2222-2222-222222222222', '00026565-0018-0018-0018-000000000018', '{"utm_source": "brand"}', '2026-01-24', NOW()),
  ('00031018-0018-0018-0018-000000000018', 'PROD-012', '00030019-0019-0019-0019-000000000019', 89.99, '23232323-2323-2323-2323-232323232323', '00026565-0019-0019-0019-000000000019', '{"utm_source": "holiday"}', '2026-01-25', NOW()),
  ('00031019-0019-0019-0019-000000000019', 'PROD-002', '00030020-0020-0020-0020-000000000020', 349.50, '24242424-2424-2424-2424-242424242424', '00026565-0020-0020-0020-000000000020', '{"utm_source": "special"}', '2026-01-26', NOW()),
  ('00031020-0020-0020-0020-000000000020', 'PROD-013', '00030021-0021-0021-0021-000000000021', 699.99, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00026565-0001-0001-0001-000000000001', '{"utm_source": "repeat"}', '2026-01-27', NOW()),
  ('00031021-0021-0021-0021-000000000021', 'PROD-001', '00030022-0022-0022-0022-000000000022', 199.99, '25252525-2525-2525-2525-252525252525', '00026565-0021-0021-0021-000000000021', '{"utm_source": "launch"}', '2026-01-28', NOW()),
  ('00031022-0022-0022-0022-000000000022', 'PROD-014', '00030023-0023-0023-0023-000000000023', 399.00, '26262626-2626-2626-2626-262626262626', '00026565-0022-0022-0022-000000000022', '{"utm_source": "summer"}', '2026-01-29', NOW()),
  ('00031023-0023-0023-0023-000000000023', 'PROD-002', '00030024-0024-0024-0024-000000000024', 349.50, '27272727-2727-2727-2727-272727272727', '00026565-0023-0023-0023-000000000023', '{"utm_source": "fall"}', '2026-01-30', NOW()),
  ('00031024-0024-0024-0024-000000000024', 'PROD-015', '00030025-0025-0025-0025-000000000025', 249.99, '28282828-2828-2828-2828-282828282828', '00026565-0024-0024-0024-000000000024', '{"utm_source": "winter"}', '2026-01-31', NOW()),
  ('00031025-0025-0025-0025-000000000025', 'PROD-003', '00030026-0026-0026-0026-000000000026', 149.00, '29292929-2929-2929-2929-292929292929', '00026565-0025-0025-0025-000000000025', '{"utm_source": "newyear"}', '2026-02-01', NOW()),
  ('00031026-0026-0026-0026-000000000026', 'PROD-016', '00030027-0027-0027-0027-000000000027', 899.99, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00026565-0001-0001-0001-000000000001', '{"utm_source": "google"}', '2026-02-02', NOW()),
  ('00031027-0027-0027-0027-000000000027', 'PROD-001', '00030028-0028-0028-0028-000000000028', 199.99, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '00026565-0002-0002-0002-000000000002', '{"utm_source": "social"}', '2026-02-03', NOW()),
  ('00031028-0028-0028-0028-000000000028', 'PROD-017', '00030029-0029-0029-0029-000000000029', 599.00, 'cccccccc-cccc-cccc-cccc-cccccccccccc', '00026565-0003-0003-0003-000000000003', '{"utm_source": "blog"}', '2026-02-04', NOW()),
  ('00031029-0029-0029-0029-000000000029', 'PROD-002', '00030030-0030-0030-0030-000000000030', 349.50, 'dddddddd-dddd-dddd-dddd-dddddddddddd', '00026565-0004-0004-0004-000000000004', '{"utm_source": "tiktok"}', '2026-02-05', NOW()),
  -- Purchases 31-37 (keep dates beyond 30-day window)
  ('00031030-0030-0030-0030-000000000030', 'PROD-018', '00030031-0031-0031-0031-000000000031', 1299.99, 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '00026565-0005-0005-0005-000000000005', '{"utm_source": "youtube"}', '2025-11-22', NOW()),
  ('00031031-0031-0031-0031-000000000031', 'PROD-001', '00030032-0032-0032-0032-000000000032', 199.99, 'ffffffff-ffff-ffff-ffff-ffffffffffff', '00026565-0006-0006-0006-000000000006', '{"utm_source": "email"}', '2025-12-08', NOW()),
  ('00031032-0032-0032-0032-000000000032', 'PROD-019', '00030033-0033-0033-0033-000000000033', 449.00, '10101010-1010-1010-1010-101010101010', '00026565-0007-0007-0007-000000000007', '{"utm_source": "podcast"}', '2025-12-20', NOW()),
  ('00031033-0033-0033-0033-000000000033', 'PROD-020', '00030034-0034-0034-0034-000000000034', 299.99, '12121212-1212-1212-1212-121212121212', '00026565-0008-0008-0008-000000000008', '{"utm_source": "instagram"}', '2026-01-10', NOW()),
  ('00031034-0034-0034-0034-000000000034', 'PROD-002', '00030035-0035-0035-0035-000000000035', 349.50, '13131313-1313-1313-1313-131313131313', '00026565-0009-0009-0009-000000000009', '{"utm_source": "twitter"}', '2026-01-20', NOW()),
  ('00031035-0035-0035-0035-000000000035', 'PROD-021', '00030036-0036-0036-0036-000000000036', 179.99, '14141414-1414-1414-1414-141414141414', '00026565-0010-0010-0010-000000000010', '{"utm_source": "blog"}', '2026-01-28', NOW()),
  ('00031036-0036-0036-0036-000000000036', 'PROD-001', '00030037-0037-0037-0037-000000000037', 199.99, '15151515-1515-1515-1515-151515151515', '00026565-0011-0011-0011-000000000011', '{"utm_source": "landing"}', '2026-02-03', NOW()),
  ('00031037-0037-0037-0037-000000000037', 'PROD-022', '00030038-0038-0038-0038-000000000038', 649.00, '16161616-1616-1616-1616-161616161616', '00026565-0012-0012-0012-000000000012', '{"utm_source": "promo"}', '2026-02-05', NOW())
ON CONFLICT (purchase_id) DO NOTHING;

-- ============================================================================
-- STEP 16: Commissions (signup $10 + purchase 10%)
-- ============================================================================
INSERT INTO commission (commission_id, conversion_type, external_id, amount, revenue, contact_id, promoter_id, link_id, created_at, updated_at)
VALUES 
  -- Commissions 1-30 distributed across last 30 days (Jan 7 - Feb 5, 2026)
  ('00032001-0001-0001-0001-000000000001', 'signup', '00030001-0001-0001-0001-000000000001', 10.00, NULL, '00030001-0001-0001-0001-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00026565-0001-0001-0001-000000000001', '2026-01-07', NOW()),
  ('00032002-0002-0002-0002-000000000002', 'signup', '00030002-0002-0002-0002-000000000002', 10.00, NULL, '00030002-0002-0002-0002-000000000002', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '00026565-0002-0002-0002-000000000002', '2026-01-08', NOW()),
  ('00032003-0003-0003-0003-000000000003', 'signup', '00030003-0003-0003-0003-000000000003', 10.00, NULL, '00030003-0003-0003-0003-000000000003', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '00026565-0003-0003-0003-000000000003', '2026-01-09', NOW()),
  ('00032004-0004-0004-0004-000000000004', 'signup', '00030004-0004-0004-0004-000000000004', 10.00, NULL, '00030004-0004-0004-0004-000000000004', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '00026565-0004-0004-0004-000000000004', '2026-01-10', NOW()),
  ('00032005-0005-0005-0005-000000000005', 'signup', '00030005-0005-0005-0005-000000000005', 10.00, NULL, '00030005-0005-0005-0005-000000000005', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '00026565-0005-0005-0005-000000000005', '2026-01-11', NOW()),
  -- Purchase commissions for contacts 1-5 (distributed across last 30 days)
  ('00032006-0006-0006-0006-000000000006', 'purchase', '00031001-0001-0001-0001-000000000001', 20.00, 199.99, '00030001-0001-0001-0001-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00026565-0001-0001-0001-000000000001', '2026-01-07', NOW()),
  ('00032007-0007-0007-0007-000000000007', 'purchase', '00031002-0002-0002-0002-000000000002', 34.95, 349.50, '00030002-0002-0002-0002-000000000002', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '00026565-0002-0002-0002-000000000002', '2026-01-08', NOW()),
  ('00032008-0008-0008-0008-000000000008', 'purchase', '00031003-0003-0003-0003-000000000003', 14.90, 149.00, '00030003-0003-0003-0003-000000000003', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '00026565-0003-0003-0003-000000000003', '2026-01-09', NOW()),
  ('00032009-0009-0009-0009-000000000009', 'purchase', '00031004-0004-0004-0004-000000000004', 50.00, 499.99, '00030004-0004-0004-0004-000000000004', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '00026565-0004-0004-0004-000000000004', '2026-01-10', NOW()),
  -- Signups 6-30
  ('00032010-0010-0010-0010-000000000010', 'signup', '00030006-0006-0006-0006-000000000006', 10.00, NULL, '00030006-0006-0006-0006-000000000006', 'ffffffff-ffff-ffff-ffff-ffffffffffff', '00026565-0006-0006-0006-000000000006', '2026-01-12', NOW()),
  ('00032011-0011-0011-0011-000000000011', 'signup', '00030007-0007-0007-0007-000000000007', 10.00, NULL, '00030007-0007-0007-0007-000000000007', '10101010-1010-1010-1010-101010101010', '00026565-0007-0007-0007-000000000007', '2026-01-13', NOW()),
  ('00032012-0012-0012-0012-000000000012', 'signup', '00030008-0008-0008-0008-000000000008', 10.00, NULL, '00030008-0008-0008-0008-000000000008', '12121212-1212-1212-1212-121212121212', '00026565-0008-0008-0008-000000000008', '2026-01-14', NOW()),
  ('00032013-0013-0013-0013-000000000013', 'signup', '00030009-0009-0009-0009-000000000009', 10.00, NULL, '00030009-0009-0009-0009-000000000009', '13131313-1313-1313-1313-131313131313', '00026565-0009-0009-0009-000000000009', '2026-01-15', NOW()),
  ('00032014-0014-0014-0014-000000000014', 'signup', '00030010-0010-0010-0010-000000000010', 10.00, NULL, '00030010-0010-0010-0010-000000000010', '14141414-1414-1414-1414-141414141414', '00026565-0010-0010-0010-000000000010', '2026-01-16', NOW()),
  -- Purchase commissions 6-30
  ('00032015-0015-0015-0015-000000000015', 'purchase', '00031005-0005-0005-0005-000000000005', 11.25, 75.00, '00030006-0006-0006-0006-000000000006', 'ffffffff-ffff-ffff-ffff-ffffffffffff', '00026565-0006-0006-0006-000000000006', '2026-01-12', NOW()),
  ('00032016-0016-0016-0016-000000000016', 'purchase', '00031006-0006-0006-0006-000000000006', 30.00, 199.99, '00030007-0007-0007-0007-000000000007', '10101010-1010-1010-1010-101010101010', '00026565-0007-0007-0007-000000000007', '2026-01-13', NOW()),
  ('00032017-0017-0017-0017-000000000017', 'purchase', '00031007-0007-0007-0007-000000000007', 52.43, 349.50, '00030008-0008-0008-0008-000000000008', '12121212-1212-1212-1212-121212121212', '00026565-0008-0008-0008-000000000008', '2026-01-14', NOW()),
  ('00032018-0018-0018-0018-000000000018', 'purchase', '00031008-0008-0008-0008-000000000008', 119.80, 599.00, '00030009-0009-0009-0009-000000000009', '13131313-1313-1313-1313-131313131313', '00026565-0009-0009-0009-000000000009', '2026-01-15', NOW()),
  ('00032019-0019-0019-0019-000000000019', 'purchase', '00031009-0009-0009-0009-000000000009', 29.80, 149.00, '00030010-0010-0010-0010-000000000010', '14141414-1414-1414-1414-141414141414', '00026565-0010-0010-0010-000000000010', '2026-01-16', NOW()),
  -- Signups 11-30
  ('00032020-0020-0020-0020-000000000020', 'signup', '00030011-0011-0011-0011-000000000011', 10.00, NULL, '00030011-0011-0011-0011-000000000011', '15151515-1515-1515-1515-151515151515', '00026565-0011-0011-0011-000000000011', '2026-01-17', NOW()),
  ('00032021-0021-0021-0021-000000000021', 'signup', '00030012-0012-0012-0012-000000000012', 10.00, NULL, '00030012-0012-0012-0012-000000000012', '16161616-1616-1616-1616-161616161616', '00026565-0012-0012-0012-000000000012', '2026-01-18', NOW()),
  ('00032022-0022-0022-0022-000000000022', 'signup', '00030013-0013-0013-0013-000000000013', 10.00, NULL, '00030013-0013-0013-0013-000000000013', '17171717-1717-1717-1717-171717171717', '00026565-0013-0013-0013-000000000013', '2026-01-19', NOW()),
  ('00032023-0023-0023-0023-000000000023', 'signup', '00030014-0014-0014-0014-000000000014', 10.00, NULL, '00030014-0014-0014-0014-000000000014', '18181818-1818-1818-1818-181818181818', '00026565-0014-0014-0014-000000000014', '2026-01-20', NOW()),
  ('00032024-0024-0024-0024-000000000024', 'signup', '00030015-0015-0015-0015-000000000015', 10.00, NULL, '00030015-0015-0015-0015-000000000015', '19191919-1919-1919-1919-191919191919', '00026565-0015-0015-0015-000000000015', '2026-01-21', NOW()),
  ('00032025-0025-0025-0025-000000000025', 'purchase', '00031010-0010-0010-0010-000000000010', 30.00, 299.99, '00030011-0011-0011-0011-000000000011', '15151515-1515-1515-1515-151515151515', '00026565-0011-0011-0011-000000000011', '2026-01-17', NOW()),
  ('00032026-0026-0026-0026-000000000026', 'purchase', '00031011-0011-0011-0011-000000000011', 20.00, 199.99, '00030012-0012-0012-0012-000000000012', '16161616-1616-1616-1616-161616161616', '00026565-0012-0012-0012-000000000012', '2026-01-18', NOW()),
  ('00032027-0027-0027-0027-000000000027', 'purchase', '00031012-0012-0012-0012-000000000012', 67.35, 449.00, '00030013-0013-0013-0013-000000000013', '17171717-1717-1717-1717-171717171717', '00026565-0013-0013-0013-000000000013', '2026-01-19', NOW()),
  ('00032028-0028-0028-0028-000000000028', 'purchase', '00031013-0013-0013-0013-000000000013', 69.90, 349.50, '00030014-0014-0014-0014-000000000014', '18181818-1818-1818-1818-181818181818', '00026565-0014-0014-0014-000000000014', '2026-01-20', NOW()),
  ('00032029-0029-0029-0029-000000000029', 'purchase', '00031014-0014-0014-0014-000000000014', 160.00, 799.99, '00030015-0015-0015-0015-000000000015', '19191919-1919-1919-1919-191919191919', '00026565-0015-0015-0015-000000000015', '2026-01-21', NOW()),
  -- Signups 16-30
  ('00032030-0030-0030-0030-000000000030', 'signup', '00030016-0016-0016-0016-000000000016', 10.00, NULL, '00030016-0016-0016-0016-000000000016', '20202020-2020-2020-2020-202020202020', '00026565-0016-0016-0016-000000000016', '2026-01-22', NOW()),
  ('00032031-0031-0031-0031-000000000031', 'signup', '00030017-0017-0017-0017-000000000017', 10.00, NULL, '00030017-0017-0017-0017-000000000017', '21212121-2121-2121-2121-212121212121', '00026565-0017-0017-0017-000000000017', '2026-01-23', NOW()),
  ('00032032-0032-0032-0032-000000000032', 'signup', '00030018-0018-0018-0018-000000000018', 10.00, NULL, '00030018-0018-0018-0018-000000000018', '22222222-2222-2222-2222-222222222222', '00026565-0018-0018-0018-000000000018', '2026-01-24', NOW()),
  ('00032033-0033-0033-0033-000000000033', 'signup', '00030019-0019-0019-0019-000000000019', 10.00, NULL, '00030019-0019-0019-0019-000000000019', '23232323-2323-2323-2323-232323232323', '00026565-0019-0019-0019-000000000019', '2026-01-25', NOW()),
  ('00032034-0034-0034-0034-000000000034', 'signup', '00030020-0020-0020-0020-000000000020', 10.00, NULL, '00030020-0020-0020-0020-000000000020', '24242424-2424-2424-2424-242424242424', '00026565-0020-0020-0020-000000000020', '2026-01-26', NOW()),
  ('00032035-0035-0035-0035-000000000035', 'signup', '00030021-0021-0021-0021-000000000021', 10.00, NULL, '00030021-0021-0021-0021-000000000021', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00026565-0001-0001-0001-000000000001', '2026-01-27', NOW()),
  ('00032036-0036-0036-0036-000000000036', 'purchase', '00031015-0015-0015-0015-000000000015', 13.00, 129.99, '00030016-0016-0016-0016-000000000016', '20202020-2020-2020-2020-202020202020', '00026565-0016-0016-0016-000000000016', '2026-01-22', NOW()),
  ('00032037-0037-0037-0037-000000000037', 'purchase', '00031016-0016-0016-0016-000000000016', 30.00, 199.99, '00030017-0017-0017-0017-000000000017', '21212121-2121-2121-2121-212121212121', '00026565-0017-0017-0017-000000000017', '2026-01-23', NOW()),
  ('00032038-0038-0038-0038-000000000038', 'purchase', '00031017-0017-0017-0017-000000000017', 109.80, 549.00, '00030018-0018-0018-0018-000000000018', '22222222-2222-2222-2222-222222222222', '00026565-0018-0018-0018-000000000018', '2026-01-24', NOW()),
  ('00032039-0039-0039-0039-000000000039', 'purchase', '00031018-0018-0018-0018-000000000018', 9.00, 89.99, '00030019-0019-0019-0019-000000000019', '23232323-2323-2323-2323-232323232323', '00026565-0019-0019-0019-000000000019', '2026-01-25', NOW()),
  ('00032040-0040-0040-0040-000000000040', 'purchase', '00031019-0019-0019-0019-000000000019', 69.90, 349.50, '00030020-0020-0020-0020-000000000020', '24242424-2424-2424-2424-242424242424', '00026565-0020-0020-0020-000000000020', '2026-01-26', NOW()),
  ('00032041-0041-0041-0041-000000000041', 'purchase', '00031020-0020-0020-0020-000000000020', 70.00, 699.99, '00030021-0021-0021-0021-000000000021', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00026565-0001-0001-0001-000000000001', '2026-01-27', NOW()),
  -- Signups 21-30
  ('00032042-0042-0042-0042-000000000042', 'signup', '00030022-0022-0022-0022-000000000022', 10.00, NULL, '00030022-0022-0022-0022-000000000022', '25252525-2525-2525-2525-252525252525', '00026565-0021-0021-0021-000000000021', '2026-01-28', NOW()),
  ('00032043-0043-0043-0043-000000000043', 'signup', '00030023-0023-0023-0023-000000000023', 10.00, NULL, '00030023-0023-0023-0023-000000000023', '26262626-2626-2626-2626-262626262626', '00026565-0022-0022-0022-000000000022', '2026-01-29', NOW()),
  ('00032044-0044-0044-0044-000000000044', 'signup', '00030024-0024-0024-0024-000000000024', 10.00, NULL, '00030024-0024-0024-0024-000000000024', '27272727-2727-2727-2727-272727272727', '00026565-0023-0023-0023-000000000023', '2026-01-30', NOW()),
  ('00032045-0045-0045-0045-000000000045', 'signup', '00030025-0025-0025-0025-000000000025', 10.00, NULL, '00030025-0025-0025-0025-000000000025', '28282828-2828-2828-2828-282828282828', '00026565-0024-0024-0024-000000000024', '2026-01-31', NOW()),
  ('00032046-0046-0046-0046-000000000046', 'signup', '00030026-0026-0026-0026-000000000026', 10.00, NULL, '00030026-0026-0026-0026-000000000026', '29292929-2929-2929-2929-292929292929', '00026565-0025-0025-0025-000000000025', '2026-02-01', NOW()),
  ('00032047-0047-0047-0047-000000000047', 'signup', '00030027-0027-0027-0027-000000000027', 10.00, NULL, '00030027-0027-0027-0027-000000000027', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00026565-0001-0001-0001-000000000001', '2026-02-02', NOW()),
  ('00032048-0048-0048-0048-000000000048', 'signup', '00030028-0028-0028-0028-000000000028', 10.00, NULL, '00030028-0028-0028-0028-000000000028', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '00026565-0002-0002-0002-000000000002', '2026-02-03', NOW()),
  ('00032049-0049-0049-0049-000000000049', 'signup', '00030029-0029-0029-0029-000000000029', 10.00, NULL, '00030029-0029-0029-0029-000000000029', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '00026565-0003-0003-0003-000000000003', '2026-02-04', NOW()),
  ('00032050-0050-0050-0050-000000000050', 'signup', '00030030-0030-0030-0030-000000000030', 10.00, NULL, '00030030-0030-0030-0030-000000000030', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '00026565-0004-0004-0004-000000000004', '2026-02-05', NOW()),
  ('00032054-0054-0054-0054-000000000054', 'purchase', '00031021-0021-0021-0021-000000000021', 20.00, 199.99, '00030022-0022-0022-0022-000000000022', '25252525-2525-2525-2525-252525252525', '00026565-0021-0021-0021-000000000021', '2026-01-28', NOW()),
  ('00032055-0055-0055-0055-000000000055', 'purchase', '00031022-0022-0022-0022-000000000022', 39.90, 399.00, '00030023-0023-0023-0023-000000000023', '26262626-2626-2626-2626-262626262626', '00026565-0022-0022-0022-000000000022', '2026-01-29', NOW()),
  ('00032056-0056-0056-0056-000000000056', 'purchase', '00031023-0023-0023-0023-000000000023', 52.43, 349.50, '00030024-0024-0024-0024-000000000024', '27272727-2727-2727-2727-272727272727', '00026565-0023-0023-0023-000000000023', '2026-01-30', NOW()),
  ('00032057-0057-0057-0057-000000000057', 'purchase', '00031024-0024-0024-0024-000000000024', 50.00, 249.99, '00030025-0025-0025-0025-000000000025', '28282828-2828-2828-2828-282828282828', '00026565-0024-0024-0024-000000000024', '2026-01-31', NOW()),
  ('00032058-0058-0058-0058-000000000058', 'purchase', '00031025-0025-0025-0025-000000000025', 29.80, 149.00, '00030026-0026-0026-0026-000000000026', '29292929-2929-2929-2929-292929292929', '00026565-0025-0025-0025-000000000025', '2026-02-01', NOW()),
  ('00032059-0059-0059-0059-000000000059', 'purchase', '00031026-0026-0026-0026-000000000026', 90.00, 899.99, '00030027-0027-0027-0027-000000000027', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00026565-0001-0001-0001-000000000001', '2026-02-02', NOW()),
  ('00032060-0060-0060-0060-000000000060', 'purchase', '00031027-0027-0027-0027-000000000027', 20.00, 199.99, '00030028-0028-0028-0028-000000000028', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '00026565-0002-0002-0002-000000000002', '2026-02-03', NOW()),
  ('00032061-0061-0061-0061-000000000061', 'purchase', '00031028-0028-0028-0028-000000000028', 59.90, 599.00, '00030029-0029-0029-0029-000000000029', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '00026565-0003-0003-0003-000000000003', '2026-02-04', NOW()),
  ('00032062-0062-0062-0062-000000000062', 'purchase', '00031029-0029-0029-0029-000000000029', 34.95, 349.50, '00030030-0030-0030-0030-000000000030', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '00026565-0004-0004-0004-000000000004', '2026-02-05', NOW()),
  -- Commissions 31-38 (keep dates beyond 30-day window)
  ('00032051-0051-0051-0051-000000000051', 'signup', '00030031-0031-0031-0031-000000000031', 10.00, NULL, '00030031-0031-0031-0031-000000000031', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '00026565-0005-0005-0005-000000000005', '2025-10-22', NOW()),
  ('00032052-0052-0052-0052-000000000052', 'signup', '00030032-0032-0032-0032-000000000032', 10.00, NULL, '00030032-0032-0032-0032-000000000032', 'ffffffff-ffff-ffff-ffff-ffffffffffff', '00026565-0006-0006-0006-000000000006', '2025-11-08', NOW()),
  ('00032053-0053-0053-0053-000000000053', 'signup', '00030033-0033-0033-0033-000000000033', 10.00, NULL, '00030033-0033-0033-0033-000000000033', '10101010-1010-1010-1010-101010101010', '00026565-0007-0007-0007-000000000007', '2025-12-01', NOW()),
  ('00032063-0063-0063-0063-000000000063', 'purchase', '00031030-0030-0030-0030-000000000030', 130.00, 1299.99, '00030031-0031-0031-0031-000000000031', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '00026565-0005-0005-0005-000000000005', '2025-11-22', NOW()),
  ('00032064-0064-0064-0064-000000000064', 'purchase', '00031031-0031-0031-0031-000000000031', 30.00, 199.99, '00030032-0032-0032-0032-000000000032', 'ffffffff-ffff-ffff-ffff-ffffffffffff', '00026565-0006-0006-0006-000000000006', '2025-12-08', NOW()),
  ('00032065-0065-0065-0065-000000000065', 'purchase', '00031032-0032-0032-0032-000000000032', 67.35, 449.00, '00030033-0033-0033-0033-000000000033', '10101010-1010-1010-1010-101010101010', '00026565-0007-0007-0007-000000000007', '2025-12-20', NOW()),
  -- Commissions 34-38 (2026 but outside first 30-day window originally, now adjusted contacts)
  ('00032066-0066-0066-0066-000000000066', 'signup', '00030034-0034-0034-0034-000000000034', 10.00, NULL, '00030034-0034-0034-0034-000000000034', '12121212-1212-1212-1212-121212121212', '00026565-0008-0008-0008-000000000008', '2026-01-05', NOW()),
  ('00032067-0067-0067-0067-000000000067', 'signup', '00030035-0035-0035-0035-000000000035', 10.00, NULL, '00030035-0035-0035-0035-000000000035', '13131313-1313-1313-1313-131313131313', '00026565-0009-0009-0009-000000000009', '2026-01-15', NOW()),
  ('00032068-0068-0068-0068-000000000068', 'signup', '00030036-0036-0036-0036-000000000036', 10.00, NULL, '00030036-0036-0036-0036-000000000036', '14141414-1414-1414-1414-141414141414', '00026565-0010-0010-0010-000000000010', '2026-01-25', NOW()),
  ('00032069-0069-0069-0069-000000000069', 'signup', '00030037-0037-0037-0037-000000000037', 10.00, NULL, '00030037-0037-0037-0037-000000000037', '15151515-1515-1515-1515-151515151515', '00026565-0011-0011-0011-000000000011', '2026-02-01', NOW()),
  ('00032070-0070-0070-0070-000000000070', 'signup', '00030038-0038-0038-0038-000000000038', 10.00, NULL, '00030038-0038-0038-0038-000000000038', '16161616-1616-1616-1616-161616161616', '00026565-0012-0012-0012-000000000012', '2026-02-05', NOW()),
  ('00032071-0071-0071-0071-000000000071', 'purchase', '00031033-0033-0033-0033-000000000033', 45.00, 299.99, '00030034-0034-0034-0034-000000000034', '12121212-1212-1212-1212-121212121212', '00026565-0008-0008-0008-000000000008', '2026-01-10', NOW()),
  ('00032072-0072-0072-0072-000000000072', 'purchase', '00031034-0034-0034-0034-000000000034', 69.90, 349.50, '00030035-0035-0035-0035-000000000035', '13131313-1313-1313-1313-131313131313', '00026565-0009-0009-0009-000000000009', '2026-01-20', NOW()),
  ('00032073-0073-0073-0073-000000000073', 'purchase', '00031035-0035-0035-0035-000000000035', 36.00, 179.99, '00030036-0036-0036-0036-000000000036', '14141414-1414-1414-1414-141414141414', '00026565-0010-0010-0010-000000000010', '2026-01-28', NOW()),
  ('00032074-0074-0074-0074-000000000074', 'purchase', '00031036-0036-0036-0036-000000000036', 20.00, 199.99, '00030037-0037-0037-0037-000000000037', '15151515-1515-1515-1515-151515151515', '00026565-0011-0011-0011-000000000011', '2026-02-03', NOW()),
  ('00032075-0075-0075-0075-000000000075', 'purchase', '00031037-0037-0037-0037-000000000037', 64.90, 649.00, '00030038-0038-0038-0038-000000000038', '16161616-1616-1616-1616-161616161616', '00026565-0012-0012-0012-000000000012', '2026-02-05', NOW())
ON CONFLICT (commission_id) DO NOTHING;

-- ============================================================================
-- STEP 17: Refresh Materialized Views
-- ============================================================================
REFRESH MATERIALIZED VIEW program_summary_mv;
REFRESH MATERIALIZED VIEW promoter_analytics_day_wise_mv;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Data summary by year
SELECT 
  'Signups' as type,
  EXTRACT(YEAR FROM created_at)::int as year,
  COUNT(*) as count
FROM sign_up GROUP BY EXTRACT(YEAR FROM created_at)
UNION ALL
SELECT 
  'Purchases' as type,
  EXTRACT(YEAR FROM created_at)::int as year,
  COUNT(*) as count
FROM purchase GROUP BY EXTRACT(YEAR FROM created_at)
UNION ALL
SELECT 
  'Commissions' as type,
  EXTRACT(YEAR FROM created_at)::int as year,
  COUNT(*) as count
FROM commission GROUP BY EXTRACT(YEAR FROM created_at)
ORDER BY type, year;

-- ============================================================================
-- TEST CREDENTIALS
-- ============================================================================
-- Admin Portal: superadmin@test.com / Test@123
-- Promoter Portal: john.member@test.com / Test@123
-- ============================================================================
