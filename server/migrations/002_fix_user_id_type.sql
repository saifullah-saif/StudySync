-- Fix user_id and file_id column types
-- Changes UUID to TEXT to match the application's user ID format

-- Drop the table and recreate with correct types
-- WARNING: This will delete existing podcast data
DROP TABLE IF EXISTS podcasts CASCADE;

-- Recreate with TEXT instead of UUID for user_id and file_id
CREATE TABLE podcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User and file references (TEXT to match your auth system)
  user_id TEXT NOT NULL,
  file_id TEXT,

  -- Podcast metadata
  title VARCHAR(500) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'ready', 'failed')),

  -- Text content (stored for deterministic generation)
  tts_text TEXT NOT NULL,
  char_count INTEGER NOT NULL,
  word_count INTEGER NOT NULL,

  -- Audio file references
  audio_url TEXT,
  audio_file_id TEXT,
  duration FLOAT,

  -- TTS configuration
  voice_id VARCHAR(100) DEFAULT 'en-US-AriaNeural',
  lang VARCHAR(10) DEFAULT 'en',

  -- Error tracking
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE podcasts TO postgres, service_role;
GRANT SELECT ON TABLE podcasts TO anon, authenticated;

-- Indexes for efficient queries
CREATE INDEX idx_podcasts_user_id ON podcasts(user_id);
CREATE INDEX idx_podcasts_file_id ON podcasts(file_id);
CREATE INDEX idx_podcasts_status ON podcasts(status);
CREATE INDEX idx_podcasts_created_at ON podcasts(created_at DESC);

-- Updated timestamp trigger
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

-- DISABLE RLS for service role access
ALTER TABLE podcasts DISABLE ROW LEVEL SECURITY;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Table recreated successfully with TEXT user_id and file_id';
  RAISE NOTICE 'Schema is now compatible with your application';
END $$;
