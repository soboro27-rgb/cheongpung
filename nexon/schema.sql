-- Supabase SQL Editor에서 실행하세요

CREATE TABLE IF NOT EXISTS insp_users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'inspector',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS insp_locations (
  id SERIAL PRIMARY KEY,
  building TEXT NOT NULL,
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS insp_equipment (
  id SERIAL PRIMARY KEY,
  equipment_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  location_id INTEGER NOT NULL REFERENCES insp_locations(id),
  model TEXT,
  installed_at DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS insp_sessions (
  id SERIAL PRIMARY KEY,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  location_id INTEGER NOT NULL REFERENCES insp_locations(id),
  inspector_id INTEGER NOT NULL REFERENCES insp_users(id),
  status TEXT NOT NULL DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS insp_results (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES insp_sessions(id),
  equipment_id INTEGER NOT NULL REFERENCES insp_equipment(id),
  power_ok BOOLEAN DEFAULT TRUE,
  screen_ok BOOLEAN DEFAULT TRUE,
  network_ok BOOLEAN DEFAULT TRUE,
  cable_ok BOOLEAN DEFAULT TRUE,
  content_ok BOOLEAN DEFAULT TRUE,
  no_issues BOOLEAN DEFAULT TRUE,
  issue_description TEXT,
  action_taken TEXT,
  action_status TEXT DEFAULT 'normal',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, equipment_id)
);

-- RLS 비활성화 (서버에서만 접근)
ALTER TABLE insp_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE insp_locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE insp_equipment DISABLE ROW LEVEL SECURITY;
ALTER TABLE insp_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE insp_results DISABLE ROW LEVEL SECURITY;
