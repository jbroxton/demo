-- Insert default approval stages for dropdown menus
-- These are reference data that should exist in the database

-- Main approval stages
INSERT INTO approval_stages (id, name, description, order_num, type, created_at, updated_at) VALUES
  (gen_random_uuid(), 'Product Definition', 'Initial product requirements and scope', 10, 'main', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'UX Design', 'User experience design and wireframes', 20, 'main', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Research', 'User research, data analysis, and validation', 30, 'main', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Engineering', 'Technical implementation and development', 40, 'main', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'QA', 'Quality assurance and testing', 50, 'main', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Launch phase stages
INSERT INTO approval_stages (id, name, description, order_num, type, created_at, updated_at) VALUES
  (gen_random_uuid(), 'Internal Testing', 'Testing with internal users', 10, 'launch', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Limited Release', 'Limited availability to select users', 20, 'launch', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Partial Launch', 'Availability to specific market segments', 30, 'launch', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Full Launch', 'General availability to all users', 40, 'launch', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert default approval statuses
INSERT INTO approval_statuses (id, name, description, type, created_at, updated_at) VALUES
  (gen_random_uuid(), 'Not Started', 'Approval stage has not begun', 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'In Progress', 'Approval stage is currently active', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Completed', 'Approval stage has been completed', 'complete', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Blocked', 'Approval stage is blocked by dependencies', 'blocked', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Cancelled', 'Approval stage has been cancelled', 'cancelled', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);