-- ═══════════════════════════════════════════════════════════════
-- COPY THIS ENTIRE FILE AND PASTE INTO SUPABASE SQL EDITOR
-- Then click "Run" to fix the schema
-- ═══════════════════════════════════════════════════════════════

DROP TABLE IF EXISTS podcasts CASCADE;

CREATE TABLE podcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  file_id TEXT,
  title VARCHAR(500) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'ready', 'failed')),
  tts_text TEXT NOT NULL,
  char_count INTEGER NOT NULL,
  word_count INTEGER NOT NULL,
  audio_url TEXT,
  audio_file_id TEXT,
  duration FLOAT,
  voice_id VARCHAR(100) DEFAULT 'en-US-AriaNeural',
  lang VARCHAR(10) DEFAULT 'en',
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE podcasts TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE podcasts TO service_role;

CREATE INDEX idx_podcasts_user_id ON podcasts(user_id);
CREATE INDEX idx_podcasts_file_id ON podcasts(file_id);
CREATE INDEX idx_podcasts_status ON podcasts(status);
CREATE INDEX idx_podcasts_created_at ON podcasts(created_at DESC);

CREATE OR REPLACE FUNCTION update_podcasts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS podcasts_updated_at_trigger ON podcasts;

CREATE TRIGGER podcasts_updated_at_trigger
  BEFORE UPDATE ON podcasts
  FOR EACH ROW
  EXECUTE FUNCTION update_podcasts_updated_at();

ALTER TABLE podcasts DISABLE ROW LEVEL SECURITY;
