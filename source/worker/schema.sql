CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT,
  avatar TEXT,
  is_admin INTEGER DEFAULT 0,
  availability_json TEXT DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sprints (
  id INTEGER PRIMARY KEY,
  name TEXT,
  start_date TEXT,
  end_date TEXT,
  status TEXT
);

CREATE TABLE IF NOT EXISTS meetings (
  id INTEGER PRIMARY KEY,
  sprint_id INTEGER,
  title TEXT,
  date TEXT,
  time TEXT,
  format TEXT,
  location TEXT,
  zoom_link TEXT,
  goal TEXT
);

CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY,
  title TEXT,
  owner TEXT,
  sprint_id INTEGER,
  priority TEXT,
  status TEXT,
  due TEXT,
  source TEXT
);

CREATE TABLE IF NOT EXISTS issues (
  id INTEGER PRIMARY KEY,
  title TEXT,
  severity TEXT,
  status TEXT,
  tags_json TEXT,
  author TEXT,
  assignee TEXT,
  sprint_id INTEGER,
  created TEXT,
  description TEXT,
  due TEXT
);

CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  sprint_id INTEGER,
  date TEXT,
  status TEXT,
  mood TEXT,
  progress TEXT,
  blockers TEXT,
  notes TEXT,
  timestamp TEXT
);

CREATE TABLE IF NOT EXISTS ai_logs (
  id INTEGER PRIMARY KEY,
  type TEXT,
  title TEXT,
  status TEXT,
  content TEXT,
  timestamp TEXT,
  details_json TEXT
);

CREATE TABLE IF NOT EXISTS availability (
  date TEXT,
  user_id INTEGER,
  slots_json TEXT,
  PRIMARY KEY (date, user_id)
);
