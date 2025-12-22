-- Podcasts table for audio-based TTS podcast generation
-- FINAL VERSION with proper permissions
-- Run this in Supabase SQL Editor as postgres user

-- Drop existing table if needed (CAUTION: This deletes all data)
-- DROP TABLE IF EXISTS podcasts CASCADE;

-- Create the table
CREATE TABLE IF NOT EXISTS podcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User and file references
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

-- Grant permissions on public schema (important!)
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;

-- Grant specific permissions on podcasts table
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE podcasts TO postgres, service_role;
GRANT SELECT ON TABLE podcasts TO anon, authenticated;

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_podcasts_user_id ON podcasts(user_id);
CREATE INDEX IF NOT EXISTS idx_podcasts_file_id ON podcasts(file_id);
CREATE INDEX IF NOT EXISTS idx_podcasts_status ON podcasts(status);
CREATE INDEX IF NOT EXISTS idx_podcasts_created_at ON podcasts(created_at DESC);

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
-- Service role bypasses RLS anyway, but we disable it explicitly
ALTER TABLE podcasts DISABLE ROW LEVEL SECURITY;

-- Optional: Enable RLS if you want frontend access control
-- Uncomment these if you want users to access via anon/authenticated keys:
/*
ALTER TABLE podcasts ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS automatically
CREATE POLICY "Service role has full access"
  ON podcasts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow users to see their own podcasts
CREATE POLICY "Users can view their own podcasts"
  ON podcasts
  FOR SELECT
  TO anon, authenticated
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Allow users to create their own podcasts
CREATE POLICY "Users can create their own podcasts"
  ON podcasts
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');
*/

-- Verify permissions
DO $$
BEGIN
  RAISE NOTICE 'Table created successfully with permissions granted';
  RAISE NOTICE 'Service role can now INSERT, UPDATE, DELETE, SELECT on podcasts table';
END $$;
