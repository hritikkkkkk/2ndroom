-- =====================================================================
-- User-Specific Topic Tracking Migration
-- =====================================================================
-- This migration creates a table to track which topics each user has
-- completed, enabling personalized topic selection.

-- Create the user_read_topics table
CREATE TABLE IF NOT EXISTS user_read_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id TEXT NOT NULL,
  read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Prevent duplicate entries for the same user and topic
  CONSTRAINT unique_user_topic UNIQUE (user_id, topic_id)
);

-- Create index for faster queries by user_id
CREATE INDEX IF NOT EXISTS idx_user_read_topics_user_id 
  ON user_read_topics(user_id);

-- Create index for faster queries by topic_id
CREATE INDEX IF NOT EXISTS idx_user_read_topics_topic_id 
  ON user_read_topics(topic_id);

-- Enable Row Level Security
ALTER TABLE user_read_topics ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view only their own reading history
CREATE POLICY "Users can view their own reading history"
  ON user_read_topics
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own reading records
CREATE POLICY "Users can insert their own reading records"
  ON user_read_topics
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own reading records (for re-reading)
CREATE POLICY "Users can update their own reading records"
  ON user_read_topics
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON user_read_topics TO authenticated;

-- Note: No DELETE policy - completed topics should remain in history
-- Users cannot delete their reading history
