-- WIKI MIGRATION
-- Run this in the Supabase SQL Editor at:
-- https://supabase.com/dashboard/project/wntaftiaptuzwzcekfhq/sql/new
--
-- Creates the community wiki: wiki_pages (the current version of each page)
-- and wiki_revisions (the full edit history — every save is snapshotted).
-- Safe to run more than once.

-- ── Table 1: wiki_pages (current state of each page) ──────────────────────────
CREATE TABLE IF NOT EXISTS wiki_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id text NOT NULL,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  created_by text NOT NULL,
  updated_by text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- ── Table 2: wiki_revisions (one row per save = full history) ──────────────────
CREATE TABLE IF NOT EXISTS wiki_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES wiki_pages(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  editor text NOT NULL,
  note text,                        -- optional short "what changed" summary
  created_at timestamptz DEFAULT now() NOT NULL
);

-- ── Grants (required — RLS alone is not enough) ───────────────────────────────
GRANT SELECT ON public.wiki_pages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wiki_pages TO authenticated;
GRANT SELECT ON public.wiki_revisions TO anon;
GRANT SELECT, INSERT ON public.wiki_revisions TO authenticated;

-- ── Row Level Security ────────────────────────────────────────────────────────
ALTER TABLE wiki_pages     ENABLE ROW LEVEL SECURITY;
ALTER TABLE wiki_revisions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- wiki_pages: anyone reads, signed-in users create/edit
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='wiki_pages' AND policyname='Anyone can read wiki pages') THEN
    CREATE POLICY "Anyone can read wiki pages" ON wiki_pages FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='wiki_pages' AND policyname='Authenticated can create wiki pages') THEN
    CREATE POLICY "Authenticated can create wiki pages" ON wiki_pages FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='wiki_pages' AND policyname='Authenticated can edit wiki pages') THEN
    CREATE POLICY "Authenticated can edit wiki pages" ON wiki_pages FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
  END IF;

  -- wiki_revisions: anyone reads history, signed-in users add revisions
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='wiki_revisions' AND policyname='Anyone can read wiki history') THEN
    CREATE POLICY "Anyone can read wiki history" ON wiki_revisions FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='wiki_revisions' AND policyname='Authenticated can add wiki revisions') THEN
    CREATE POLICY "Authenticated can add wiki revisions" ON wiki_revisions FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
END $$;

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS wiki_pages_channel_idx ON wiki_pages (channel_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS wiki_revisions_page_idx ON wiki_revisions (page_id, created_at DESC);
