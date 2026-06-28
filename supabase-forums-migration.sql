-- FORUMS MIGRATION
-- Run this in the Supabase SQL Editor at:
-- https://supabase.com/dashboard/project/wntaftiaptuzwzcekfhq/sql/new
--
-- Safe to run even if community_posts already exists.
-- Run this INSTEAD OF supabase-migration.sql (it does everything that one does, plus more).

-- Step 1: Create the table (does nothing if it already exists)
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

-- Step 2: Add new columns for forums (safe even if they already exist)
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES community_posts(id) ON DELETE CASCADE;
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Step 3: Enable Row Level Security
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

-- Step 4: Create policies (skip if they already exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'community_posts' AND policyname = 'Anyone can read posts'
  ) THEN
    CREATE POLICY "Anyone can read posts"
      ON community_posts FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'community_posts' AND policyname = 'Authenticated users can insert posts'
  ) THEN
    CREATE POLICY "Authenticated users can insert posts"
      ON community_posts FOR INSERT TO authenticated WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'community_posts' AND policyname = 'Users can update own posts'
  ) THEN
    CREATE POLICY "Users can update own posts"
      ON community_posts FOR UPDATE TO authenticated
      USING (author = (SELECT raw_user_meta_data->>'username' FROM auth.users WHERE id = auth.uid()));
  END IF;
END $$;

-- Step 5: Indexes for fast queries
CREATE INDEX IF NOT EXISTS community_posts_channel_id_idx
  ON community_posts (channel_id, created_at DESC);

CREATE INDEX IF NOT EXISTS community_posts_parent_id_idx
  ON community_posts (parent_id);

CREATE INDEX IF NOT EXISTS community_posts_type_idx
  ON community_posts (channel_id, type, created_at DESC);
