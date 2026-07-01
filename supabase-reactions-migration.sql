-- REACTIONS MIGRATION
-- Run this in the Supabase SQL Editor at:
-- https://supabase.com/dashboard/project/wntaftiaptuzwzcekfhq/sql/new
--
-- Safe to run more than once. It creates the post_reactions table that stores
-- the warmth / lightbulb / heart reactions on forum posts and replies.

-- Step 1: Create the table (does nothing if it already exists)
CREATE TABLE IF NOT EXISTS post_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  author text NOT NULL,
  reaction text NOT NULL,           -- 'w' warmth, 'l' lightbulb, 'h' heart, 'c' chat
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (post_id, author, reaction) -- one person can give each reaction once per post
);

-- Step 2: Grant table access to the app roles, then enable Row Level Security.
-- (RLS policies below control WHICH rows; these GRANTs allow touching the table at all.)
GRANT SELECT ON public.post_reactions TO anon;
GRANT SELECT, INSERT, DELETE ON public.post_reactions TO authenticated;

ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;

-- Step 3: Create policies (skip if they already exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'post_reactions' AND policyname = 'Anyone can read reactions'
  ) THEN
    CREATE POLICY "Anyone can read reactions"
      ON post_reactions FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'post_reactions' AND policyname = 'Authenticated users can add reactions'
  ) THEN
    CREATE POLICY "Authenticated users can add reactions"
      ON post_reactions FOR INSERT TO authenticated WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'post_reactions' AND policyname = 'Authenticated users can remove reactions'
  ) THEN
    CREATE POLICY "Authenticated users can remove reactions"
      ON post_reactions FOR DELETE TO authenticated USING (true);
  END IF;
END $$;

-- Step 4: Index for fast lookups by post
CREATE INDEX IF NOT EXISTS post_reactions_post_id_idx
  ON post_reactions (post_id);
