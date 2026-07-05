-- Migration: add contact fields to players table
ALTER TABLE players
  ADD COLUMN IF NOT EXISTS contact_own TEXT,
  ADD COLUMN IF NOT EXISTS contact_tutor1 TEXT,
  ADD COLUMN IF NOT EXISTS contact_tutor1_role TEXT,
  ADD COLUMN IF NOT EXISTS contact_other TEXT,
  ADD COLUMN IF NOT EXISTS contact_other_role TEXT;
