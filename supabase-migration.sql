-- Run this in the Supabase SQL Editor at:
-- https://supabase.com/dashboard/project/wntaftiaptuzwzcekfhq/sql/new

-- Create community_posts table
CREATE TABLE IF NOT EXISTS community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id text NOT NULL,
  author text NOT NULL,
  type text NOT NULL CHECK (type IN ('spark', 'forum', 'read', 'wiki', 'gathering')),
  title text,
  body text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

-- Anyone can read posts
CREATE POLICY "Anyone can read posts"
  ON community_posts FOR SELECT
  USING (true);

-- Authenticated users can insert their own posts
CREATE POLICY "Authenticated users can insert posts"
  ON community_posts FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Users can update their own posts
CREATE POLICY "Users can update own posts"
  ON community_posts FOR UPDATE
  TO authenticated
  USING (author = (SELECT raw_user_meta_data->>'username' FROM auth.users WHERE id = auth.uid()));

-- Index for fast channel lookups
CREATE INDEX IF NOT EXISTS community_posts_channel_id_idx ON community_posts (channel_id, created_at DESC);
