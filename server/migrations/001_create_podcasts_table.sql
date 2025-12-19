-- Podcasts table for audio-based TTS podcast generation
-- Stores podcast metadata, state, and audio file references

CREATE TABLE IF NOT EXISTS podcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User and file references
  user_id UUID NOT NULL,
  file_id UUID REFERENCES files(id) ON DELETE CASCADE,

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
  duration FLOAT, -- actual duration in seconds from audio metadata

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

CREATE TRIGGER podcasts_updated_at_trigger
  BEFORE UPDATE ON podcasts
  FOR EACH ROW
  EXECUTE FUNCTION update_podcasts_updated_at();

-- RLS Policies (if using Row Level Security)
ALTER TABLE podcasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own podcasts"
  ON podcasts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own podcasts"
  ON podcasts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own podcasts"
  ON podcasts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own podcasts"
  ON podcasts FOR DELETE
  USING (auth.uid() = user_id);
