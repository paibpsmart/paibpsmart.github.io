PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS content (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  author_name TEXT NOT NULL DEFAULT '',
  author_school TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS news (
  id TEXT PRIMARY KEY,
  updated_at TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  date TEXT NOT NULL DEFAULT '',
  summary TEXT NOT NULL DEFAULT '',
  image_file_id TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  author_name TEXT NOT NULL DEFAULT '',
  author_school TEXT NOT NULL DEFAULT '',
  is_published INTEGER NOT NULL DEFAULT 1,
  sort_order REAL NOT NULL DEFAULT 0,
  payload_json TEXT NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_news_public ON news(is_published, date DESC, updated_at DESC);

CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL,
  session_id TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT '',
  user_name TEXT NOT NULL DEFAULT '',
  school TEXT NOT NULL DEFAULT '',
  student_class TEXT NOT NULL DEFAULT '',
  teacher_name TEXT NOT NULL DEFAULT '',
  teacher_school TEXT NOT NULL DEFAULT '',
  teacher_scope TEXT NOT NULL DEFAULT '',
  action TEXT NOT NULL DEFAULT '',
  space TEXT NOT NULL DEFAULT '',
  chapter TEXT NOT NULL DEFAULT '',
  section TEXT NOT NULL DEFAULT '',
  payload_json TEXT NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_activities_timestamp ON activities(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_activities_session ON activities(session_id, timestamp DESC);

CREATE TABLE IF NOT EXISTS feedback (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT '',
  school TEXT NOT NULL DEFAULT '',
  rating REAL NOT NULL DEFAULT 0,
  comment TEXT NOT NULL DEFAULT '',
  is_approved INTEGER NOT NULL DEFAULT 1,
  session_id TEXT NOT NULL DEFAULT '',
  page_url TEXT NOT NULL DEFAULT '',
  payload_json TEXT NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_feedback_public ON feedback(is_approved, timestamp DESC);

CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL,
  session_id TEXT NOT NULL DEFAULT '',
  student_name TEXT NOT NULL DEFAULT '',
  student_class TEXT NOT NULL DEFAULT '',
  student_number TEXT NOT NULL DEFAULT '',
  school TEXT NOT NULL DEFAULT '',
  teacher_name TEXT NOT NULL DEFAULT '',
  teacher_school TEXT NOT NULL DEFAULT '',
  teacher_scope TEXT NOT NULL DEFAULT '',
  chapter_id TEXT NOT NULL DEFAULT '',
  chapter_title TEXT NOT NULL DEFAULT '',
  exercise_score TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'terkirim',
  payload_json TEXT NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_submissions_timestamp ON submissions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_teacher ON submissions(teacher_scope, timestamp DESC);

CREATE TABLE IF NOT EXISTS kv (
  namespace TEXT NOT NULL,
  key TEXT NOT NULL,
  value_json TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY(namespace, key)
);

CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

INSERT INTO meta(key,value,updated_at)
VALUES('schema_version','126',datetime('now'))
ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at;
