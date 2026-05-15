-- ================================================================
-- 넥슨코리아 공용부 점검 플랫폼 — 테이블 생성 스크립트
-- Supabase SQL Editor에서 실행하세요
-- ================================================================

-- ── 1. 사용자 ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS insp_users (
  id            BIGSERIAL PRIMARY KEY,
  username      TEXT      NOT NULL UNIQUE,
  password_hash TEXT      NOT NULL,
  name          TEXT      NOT NULL,
  role          TEXT      NOT NULL DEFAULT 'inspector',  -- 'admin' | 'inspector'
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 2. 장소 ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS insp_locations (
  id         BIGSERIAL PRIMARY KEY,
  building   TEXT NOT NULL,   -- 'NK' | 'GB1' | 'GB2'
  name       TEXT NOT NULL,
  sort_order INT  NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 3. 장비 ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS insp_equipment (
  id             BIGSERIAL PRIMARY KEY,
  equipment_code TEXT    NOT NULL UNIQUE,
  name           TEXT    NOT NULL,
  type           TEXT    NOT NULL,   -- 'TV'|'MIC'|'SPEAKER'|'CAMERA'|'PC'|'DID'|'SETTOP'
  location_id    BIGINT  NOT NULL REFERENCES insp_locations(id) ON DELETE CASCADE,
  model          TEXT,
  installed_at   TEXT,               -- 'YYYY-MM-DD' 문자열
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_insp_equipment_location ON insp_equipment(location_id);
CREATE INDEX IF NOT EXISTS idx_insp_equipment_type     ON insp_equipment(type);

-- ── 4. 점검 세션 ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS insp_sessions (
  id           BIGSERIAL PRIMARY KEY,
  year         INT    NOT NULL,
  month        INT    NOT NULL,
  location_id  BIGINT NOT NULL REFERENCES insp_locations(id),
  inspector_id BIGINT NOT NULL REFERENCES insp_users(id),
  status       TEXT   NOT NULL DEFAULT 'in_progress',  -- 'pending'|'in_progress'|'completed'
  started_at   TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_insp_sessions_location  ON insp_sessions(location_id);
CREATE INDEX IF NOT EXISTS idx_insp_sessions_inspector ON insp_sessions(inspector_id);
CREATE INDEX IF NOT EXISTS idx_insp_sessions_ym        ON insp_sessions(year, month);

-- ── 5. 점검 결과 ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS insp_results (
  id                BIGSERIAL PRIMARY KEY,
  session_id        BIGINT  NOT NULL REFERENCES insp_sessions(id) ON DELETE CASCADE,
  equipment_id      BIGINT  NOT NULL REFERENCES insp_equipment(id) ON DELETE CASCADE,
  power_ok          BOOLEAN NOT NULL DEFAULT TRUE,
  screen_ok         BOOLEAN NOT NULL DEFAULT TRUE,
  network_ok        BOOLEAN NOT NULL DEFAULT TRUE,
  cable_ok          BOOLEAN NOT NULL DEFAULT TRUE,
  content_ok        BOOLEAN NOT NULL DEFAULT TRUE,
  no_issues         BOOLEAN NOT NULL DEFAULT TRUE,
  issue_description TEXT,
  action_taken      TEXT,
  action_status     TEXT    NOT NULL DEFAULT 'normal',  -- 'normal'|'issue'|'as_request'|'completed'
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, equipment_id)
);

CREATE INDEX IF NOT EXISTS idx_insp_results_session   ON insp_results(session_id);
CREATE INDEX IF NOT EXISTS idx_insp_results_equipment ON insp_results(equipment_id);
