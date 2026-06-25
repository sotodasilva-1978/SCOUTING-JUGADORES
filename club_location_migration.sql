-- Migration: add location column to clubs table
-- Run this in Supabase SQL Editor

ALTER TABLE clubs ADD COLUMN IF NOT EXISTS location TEXT;

-- Allow delete so clubs can be managed from the UI
DROP POLICY IF EXISTS "Allow public delete on clubs" ON clubs;
CREATE POLICY "Allow public delete on clubs" ON clubs FOR DELETE USING (true);
