-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Modes Table
CREATE TABLE IF NOT EXISTS modes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  round_type TEXT CHECK (round_type IN ('binary', 'multi')) NOT NULL,
  active BOOLEAN DEFAULT false,
  rules_json JSONB DEFAULT '{}'::jsonb
);

-- 2. Items Table
CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mode_id TEXT REFERENCES modes(id),
  prompt_text TEXT,
  answer TEXT,
  choices_json JSONB,
  asset_type TEXT,
  blob_url TEXT,
  source_name TEXT,
  source_url TEXT,
  license TEXT,
  external_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  hash TEXT UNIQUE,
  quality_score INT DEFAULT 0,
  status TEXT CHECK (status IN ('active', 'quarantined', 'retired')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Daily Sets Table
CREATE TABLE IF NOT EXISTS daily_sets (
  date DATE PRIMARY KEY,
  seed BIGINT,
  snapshot_blob_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Daily Set Items Table
CREATE TABLE IF NOT EXISTS daily_set_items (
  date DATE REFERENCES daily_sets(date),
  mode_id TEXT REFERENCES modes(id),
  item_id UUID REFERENCES items(id),
  position INT,
  PRIMARY KEY (date, mode_id, position)
);

-- 5. Plays Table
CREATE TABLE IF NOT EXISTS plays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE,
  mode_id TEXT REFERENCES modes(id),
  item_id UUID REFERENCES items(id),
  session_id TEXT,
  user_id UUID NULL,
  answer_given TEXT,
  is_correct BOOLEAN,
  time_ms INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. Leaderboards Daily Table
CREATE TABLE IF NOT EXISTS leaderboards_daily (
  date DATE,
  mode_id TEXT REFERENCES modes(id),
  session_id TEXT,
  score INT DEFAULT 0,
  correct INT DEFAULT 0,
  played INT DEFAULT 0,
  avg_time_ms INT DEFAULT 0,
  PRIMARY KEY (date, mode_id, session_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_items_mode_status ON items(mode_id, status);
CREATE INDEX IF NOT EXISTS idx_plays_date_session ON plays(date, session_id);
CREATE INDEX IF NOT EXISTS idx_leaderboards_date_score ON leaderboards_daily(date, score DESC);
