-- Migration: add multi-assign + sub-task columns to tasks
-- Run once on an existing DB:
--   npx wrangler d1 execute se-sitrep --remote --file=./migrate.sql

ALTER TABLE tasks ADD COLUMN assignees_json TEXT DEFAULT '[]';
ALTER TABLE tasks ADD COLUMN parent_task_id INTEGER DEFAULT NULL;
ALTER TABLE tasks ADD COLUMN updated_at TEXT;
ALTER TABLE tasks ADD COLUMN subtask_review_status TEXT DEFAULT NULL;
ALTER TABLE tasks ADD COLUMN description TEXT DEFAULT '';

CREATE TABLE IF NOT EXISTS task_reviews (
  id INTEGER PRIMARY KEY,
  parent_task_id INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  reviewer TEXT,
  created TEXT,
  notes TEXT
);
