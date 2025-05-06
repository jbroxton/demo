-- Main stages
INSERT INTO approval_stages (id, name, description, order_num, type, created_at, updated_at)
VALUES 
  ('stage-1', 'Product Definition', 'Initial product requirements and scope', 10, 'main', datetime('now'), datetime('now')),
  ('stage-2', 'UX Design', 'User experience design and wireframes', 20, 'main', datetime('now'), datetime('now')),
  ('stage-3', 'Research', 'User research, data analysis, and validation', 30, 'main', datetime('now'), datetime('now')),
  ('stage-4', 'Engineering', 'Technical implementation and development', 40, 'main', datetime('now'), datetime('now')),
  ('stage-5', 'QA', 'Quality assurance and testing', 50, 'main', datetime('now'), datetime('now'));

-- Launch stages
INSERT INTO approval_stages (id, name, description, order_num, type, created_at, updated_at)
VALUES 
  ('stage-6', 'Internal Testing', 'Testing with internal users', 10, 'launch', datetime('now'), datetime('now')),
  ('stage-7', 'Limited Release', 'Limited availability to select users', 20, 'launch', datetime('now'), datetime('now')),
  ('stage-8', 'Partial Launch', 'Availability to specific market segments', 30, 'launch', datetime('now'), datetime('now')),
  ('stage-9', 'Full Launch', 'Complete availability to all users', 40, 'launch', datetime('now'), datetime('now'));

-- Statuses
INSERT INTO approval_statuses (id, name, color, description, created_at, updated_at)
VALUES 
  ('status-1', 'Not Started', '#6c757d', 'Work has not yet begun', datetime('now'), datetime('now')),
  ('status-2', 'In Progress', '#007bff', 'Work is currently underway', datetime('now'), datetime('now')),
  ('status-3', 'Pending Approval', '#ffc107', 'Waiting for approval', datetime('now'), datetime('now')),
  ('status-4', 'Approved', '#28a745', 'Formally approved', datetime('now'), datetime('now')),
  ('status-5', 'Completed', '#20c997', 'Work is finished', datetime('now'), datetime('now')),
  ('status-6', 'Rejected', '#dc3545', 'Approval was denied', datetime('now'), datetime('now')),
  ('status-7', 'Blocked', '#fd7e14', 'Progress is blocked', datetime('now'), datetime('now')),
  ('status-8', 'Not Needed', '#6c757d', 'This stage is not required', datetime('now'), datetime('now'));