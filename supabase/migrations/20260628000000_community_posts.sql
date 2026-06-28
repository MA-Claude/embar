CREATE TABLE IF NOT EXISTS community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id text NOT NULL,
  author text NOT NULL,
  type text NOT NULL,
  title text,
  body text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Anyone can read posts"
  ON community_posts FOR SELECT
  USING (true);

CREATE POLICY IF NOT EXISTS "Authenticated users can insert posts"
  ON community_posts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS community_posts_channel_id_idx ON community_posts (channel_id, created_at DESC);
