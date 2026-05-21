-- Demo password for all users: demo1234
DELETE FROM availability;
DELETE FROM ai_logs;
DELETE FROM reports;
DELETE FROM issues;
DELETE FROM tasks;
DELETE FROM meetings;
DELETE FROM sessions;
DELETE FROM users;
DELETE FROM sprints;

INSERT INTO users (id, name, email, password_hash, role, avatar, is_admin) VALUES
(1, 'Maya Patel', 'maya@team.local', 'bdb8c193cd6687f527a1e21c304fa2ff:4c8d07d8f0e41de1ac55dfb4c219570d024f5b3f303182947874a442f89a349b0437ea5822d795eab9bd55f58166e58506c9a7a9d4947682adc49b86a8b4a48e', 'Project Manager', 'MP', 1),
(2, 'Alex Chen', 'alex@team.local', 'bdb8c193cd6687f527a1e21c304fa2ff:4c8d07d8f0e41de1ac55dfb4c219570d024f5b3f303182947874a442f89a349b0437ea5822d795eab9bd55f58166e58506c9a7a9d4947682adc49b86a8b4a48e', 'Frontend', 'AC', 0),
(3, 'Jordan Lee', 'jordan@team.local', 'bdb8c193cd6687f527a1e21c304fa2ff:4c8d07d8f0e41de1ac55dfb4c219570d024f5b3f303182947874a442f89a349b0437ea5822d795eab9bd55f58166e58506c9a7a9d4947682adc49b86a8b4a48e', 'Backend', 'JL', 0),
(4, 'Priya Shah', 'priya@team.local', 'bdb8c193cd6687f527a1e21c304fa2ff:4c8d07d8f0e41de1ac55dfb4c219570d024f5b3f303182947874a442f89a349b0437ea5822d795eab9bd55f58166e58506c9a7a9d4947682adc49b86a8b4a48e', 'QA / Testing', 'PS', 0),
(5, 'Sam Rivera', 'sam@team.local', 'bdb8c193cd6687f527a1e21c304fa2ff:4c8d07d8f0e41de1ac55dfb4c219570d024f5b3f303182947874a442f89a349b0437ea5822d795eab9bd55f58166e58506c9a7a9d4947682adc49b86a8b4a48e', 'Documentation', 'SR', 0);

INSERT INTO sprints (id, name, start_date, end_date, status) VALUES
(1, 'Sprint 1', '2026-05-01', '2026-05-08', 'completed'),
(2, 'Sprint 2', '2026-05-12', '2026-05-19', 'active'),
(3, 'Sprint 3', '2026-05-22', '2026-05-29', 'planned');

INSERT INTO meetings (id, sprint_id, title, date, time, format, location, zoom_link, goal) VALUES
(1, 2, 'Sprint Standup', '2026-05-14', '10:00', 'hybrid', 'CSE B210', 'https://zoom.us/j/example', 'Sync blockers and sprint progress');

INSERT INTO tasks (id, title, owner, sprint_id, priority, status, due) VALUES
(1, 'Migrate billing schema to v3', 'Jordan Lee', 2, 'critical', 'blocked', '2026-05-15'),
(2, 'Implement OAuth redirect handler', 'Alex Chen', 2, 'high', 'progress', '2026-05-16');

INSERT INTO issues (id, title, severity, status, tags_json, author, assignee, sprint_id, created, description, due) VALUES
(1, 'Staging environment is down', 'critical', 'open', '["Blocker"]', 'Priya Shah', 'Jordan Lee', 2, '2026-05-13', 'All endpoints 502 since 09:00', '2026-05-19'),
(2, 'Settings flow design review', 'medium', 'progress', '["Process Issue"]', 'Alex Chen', 'Maya Patel', 2, '2026-05-12', 'Empty states need approval', '2026-05-19');

INSERT INTO reports (id, user_id, sprint_id, date, status, mood, progress, blockers, notes, timestamp) VALUES
(1, 1, 2, '2026-05-13', 'In Progress', 'Good', 'Lead standup', 'None', '', '2026-05-13T09:00:00Z'),
(2, 2, 2, '2026-05-13', 'In Progress', 'Neutral', 'OAuth work', 'Staging down', '', '2026-05-13T09:30:00Z');

INSERT INTO ai_logs (id, type, title, status, content, timestamp, details_json) VALUES
(1, 'Summary', 'AI Summary Generated', 'approved', 'Team mostly on track.', '2026-05-13T09:30:00Z', '{}');
