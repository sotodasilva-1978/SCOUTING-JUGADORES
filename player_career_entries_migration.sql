-- Historial normalizado de trayectoria por jugador.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS player_career_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  club_id UUID REFERENCES clubs(id) ON DELETE SET NULL,
  club_name_snapshot TEXT NOT NULL,
  season TEXT NOT NULL,
  team_name TEXT NOT NULL,
  category TEXT NOT NULL,
  competition TEXT NOT NULL,
  matches_played INTEGER NOT NULL DEFAULT 0 CHECK (matches_played >= 0),
  minutes_played INTEGER NOT NULL DEFAULT 0 CHECK (minutes_played >= 0),
  goals INTEGER NOT NULL DEFAULT 0 CHECK (goals >= 0),
  yellow_cards INTEGER NOT NULL DEFAULT 0 CHECK (yellow_cards >= 0),
  red_cards INTEGER NOT NULL DEFAULT 0 CHECK (red_cards >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_player_career_entries_player
  ON player_career_entries(player_id);
CREATE INDEX IF NOT EXISTS idx_player_career_entries_club
  ON player_career_entries(club_id);
CREATE INDEX IF NOT EXISTS idx_player_career_entries_season
  ON player_career_entries(season);

DROP TRIGGER IF EXISTS update_player_career_entries_updated_at ON player_career_entries;
CREATE TRIGGER update_player_career_entries_updated_at
  BEFORE UPDATE ON player_career_entries
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

ALTER TABLE player_career_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read career entries" ON player_career_entries;
CREATE POLICY "Allow read career entries" ON player_career_entries
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow insert career entries" ON player_career_entries;
CREATE POLICY "Allow insert career entries" ON player_career_entries
  FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow update career entries" ON player_career_entries;
CREATE POLICY "Allow update career entries" ON player_career_entries
  FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow delete career entries" ON player_career_entries;
CREATE POLICY "Allow delete career entries" ON player_career_entries
  FOR DELETE USING (true);
