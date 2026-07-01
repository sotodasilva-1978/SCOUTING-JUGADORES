-- Supabase Database Schema for Scouting Application

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Tables

-- Clubs
CREATE TABLE IF NOT EXISTS clubs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  current_season TEXT NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles (Users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('SUPERADMIN', 'ADMIN_CLUB', 'SCOUT', 'GUEST')),
  club_id UUID REFERENCES clubs(id),
  category_id TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  season TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teams
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  club_name TEXT NOT NULL,
  category_id TEXT NOT NULL,
  league TEXT,
  zone TEXT,
  home_field TEXT,
  season TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Players
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID REFERENCES clubs(id),
  first_name TEXT NOT NULL,
  last_name TEXT,
  full_name TEXT NOT NULL,
  birth_date DATE,
  birth_year INTEGER,
  calculated_age INTEGER,
  nationality TEXT,
  category_id TEXT,
  current_team_id UUID REFERENCES teams(id),
  club_name TEXT,
  league TEXT,
  usual_number TEXT,
  main_position TEXT NOT NULL,
  secondary_positions TEXT[],
  dominant_foot TEXT NOT NULL CHECK (dominant_foot IN ('LEFT', 'RIGHT', 'BOTH', 'UNKNOWN')),
  approximate_height DECIMAL,
  approximate_weight DECIMAL,
  area TEXT,
  source TEXT,
  avatar_url TEXT,
  status TEXT NOT NULL,
  interest_level INTEGER DEFAULT 1,
  global_rating DECIMAL,
  potential_rating DECIMAL,
  
  -- Detailed Profile
  strengths TEXT[] DEFAULT '{}',
  weaknesses TEXT[] DEFAULT '{}',
  why_interested TEXT,
  main_strength TEXT,
  main_doubt TEXT,
  differential_talent TEXT,
  club_fit TEXT,
  risk_level TEXT CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
  next_step TEXT,
  decision_final TEXT,
  decision_date DATE,
  short_name TEXT,
  competition TEXT,
  lateralidad TEXT,
  tracking_history JSONB DEFAULT '[]'::jsonb,
  
  -- Ratings (1-5)
  rating_technical DECIMAL DEFAULT 3,
  rating_tactical DECIMAL DEFAULT 3,
  rating_physical DECIMAL DEFAULT 3,
  rating_mental DECIMAL DEFAULT 3,
  rating_competitive DECIMAL DEFAULT 0,
  rating_decision_making DECIMAL DEFAULT 0,
  rating_pace DECIMAL DEFAULT 0,
  rating_intelligence DECIMAL DEFAULT 0,
  rating_personality DECIMAL DEFAULT 0,
  rating_potential DECIMAL DEFAULT 0,
  
  -- Detailed Physical Ratings
  rating_velo_despl DECIMAL DEFAULT 0,
  rating_acel DECIMAL DEFAULT 0,
  rating_fuerza DECIMAL DEFAULT 0,
  rating_resis DECIMAL DEFAULT 0,
  rating_agil DECIMAL DEFAULT 0,
  rating_coord DECIMAL DEFAULT 0,
  rating_velo_reac DECIMAL DEFAULT 0,
  rating_poten DECIMAL DEFAULT 0,
  rating_recup_fatiga DECIMAL DEFAULT 0,
  rating_tenden_lesion DECIMAL DEFAULT 0,

  -- Detailed Technical Ratings
  rating_pase_corto DECIMAL DEFAULT 0,
  rating_pase_largo DECIMAL DEFAULT 0,
  rating_ctrl_balon DECIMAL DEFAULT 0,
  rating_tiro DECIMAL DEFAULT 0,
  rating_regate DECIMAL DEFAULT 0,
  rating_conduc DECIMAL DEFAULT 0,
  rating_superf_cont DECIMAL DEFAULT 0,
  rating_despeje DECIMAL DEFAULT 0,
  rating_entrada DECIMAL DEFAULT 0,
  rating_pierna_menos DECIMAL DEFAULT 0,

  -- Detailed Tactical Ratings
  rating_posic DECIMAL DEFAULT 0,
  rating_cobertura DECIMAL DEFAULT 0,
  rating_repliegue DECIMAL DEFAULT 0,
  rating_ayuda_def DECIMAL DEFAULT 0,
  rating_marcajes DECIMAL DEFAULT 0,
  rating_dom_espacios DECIMAL DEFAULT 0,
  rating_vigilancias DECIMAL DEFAULT 0,
  rating_apoyos_off DECIMAL DEFAULT 0,
  rating_desmarques DECIMAL DEFAULT 0,
  rating_temporiz DECIMAL DEFAULT 0,

  -- Detailed Mental/Cognitive Ratings
  rating_liderazgo DECIMAL DEFAULT 0,
  rating_caracter DECIMAL DEFAULT 0,
  rating_competitiv DECIMAL DEFAULT 0,
  rating_companerismo DECIMAL DEFAULT 0,
  rating_mentalidad DECIMAL DEFAULT 0,
  rating_agresividad DECIMAL DEFAULT 0,
  rating_polivalencia DECIMAL DEFAULT 0,
  rating_inteligencia DECIMAL DEFAULT 0,
  rating_comunicacion DECIMAL DEFAULT 0,
  rating_personalidad DECIMAL DEFAULT 0,

  -- Specific Ratings
  rating_juego_aereo DECIMAL DEFAULT 0,

  custom_ratings JSONB DEFAULT '[]'::jsonb,
  rating_club_fit DECIMAL,

  -- Profiles (Text)
  risks_analysis TEXT,
  improvement_margin TEXT,
  player_type TEXT,
  ideal_role TEXT,
  current_level_club TEXT,
  future_level_estimated TEXT,
  comparison_players TEXT,
  technical_profile TEXT,
  tactical_profile TEXT,
  physical_profile TEXT,
  mental_profile TEXT,
  
  birth_place TEXT,
  passport TEXT,
  agent_name TEXT,
  weight_kg DECIMAL,
  info_source TEXT,
  general_observations TEXT,
  contact_own TEXT,
  contact_tutor1 TEXT,
  contact_tutor1_role TEXT,
  contact_other TEXT,
  verification_status JSONB DEFAULT '{}'::jsonb,
  
  has_video BOOLEAN DEFAULT false,
  has_images BOOLEAN DEFAULT false,
  possible_duplicate BOOLEAN DEFAULT false,
  
  created_by UUID REFERENCES auth.users(id),
  validated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Matches
-- Player career history (one row per season/team)
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

CREATE INDEX IF NOT EXISTS idx_player_career_entries_player ON player_career_entries(player_id);
CREATE INDEX IF NOT EXISTS idx_player_career_entries_club ON player_career_entries(club_id);

CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date TIMESTAMPTZ NOT NULL,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  competition TEXT NOT NULL,
  venue TEXT,
  score TEXT,
  observed_players_ids UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- reports
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  match_id UUID REFERENCES matches(id),
  observer_id UUID REFERENCES auth.users(id),
  report_date DATE NOT NULL,
  category_id TEXT,
  position_played TEXT,
  minutes_observed INTEGER,
  match_context TEXT,
  technical_comment TEXT,
  tactical_comment TEXT,
  physical_comment TEXT,
  mental_comment TEXT,
  strengths TEXT[] DEFAULT '{}',
  weaknesses TEXT[] DEFAULT '{}',
  key_actions TEXT,
  doubts TEXT,
  recommendation TEXT NOT NULL,
  next_step TEXT,
  match_rating DECIMAL NOT NULL,
  rating_physical DECIMAL DEFAULT 0,
  rating_technical DECIMAL DEFAULT 0,
  rating_tactical DECIMAL DEFAULT 0,
  rating_mental DECIMAL DEFAULT 0,
  custom_ratings JSONB DEFAULT '[]'::jsonb,
  video_urls TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Videos
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  match_id UUID REFERENCES matches(id),
  report_id UUID REFERENCES reports(id),
  url TEXT NOT NULL,
  platform TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_min INTEGER,
  end_min INTEGER,
  action_type TEXT,
  rating DECIMAL,
  is_key BOOLEAN DEFAULT false,
  pending_review BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- History Logs
CREATE TABLE IF NOT EXISTS history_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  field TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rating Weights
CREATE TABLE IF NOT EXISTS rating_weights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  technique_weight DECIMAL DEFAULT 1.0,
  tactics_weight DECIMAL DEFAULT 1.0,
  physical_weight DECIMAL DEFAULT 1.0,
  mentality_weight DECIMAL DEFAULT 1.0,
  potential_weight DECIMAL DEFAULT 1.0,
  club_fit_weight DECIMAL DEFAULT 1.0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_clubs_updated_at ON clubs;
CREATE TRIGGER update_clubs_updated_at BEFORE UPDATE ON clubs FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_players_updated_at ON players;
CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
DROP TRIGGER IF EXISTS update_player_career_entries_updated_at ON player_career_entries;
CREATE TRIGGER update_player_career_entries_updated_at BEFORE UPDATE ON player_career_entries FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Enable RLS on all tables
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_career_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE history_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rating_weights ENABLE ROW LEVEL SECURITY;

-- Basic Policies (example for scouts)
DROP POLICY IF EXISTS "Scouts can read all players" ON players;
CREATE POLICY "Scouts can read all players" ON players FOR SELECT USING (true);
DROP POLICY IF EXISTS "Scouts can insert players" ON players;
CREATE POLICY "Scouts can insert players" ON players FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Scouts can update all players" ON players;
CREATE POLICY "Scouts can update all players" ON players FOR UPDATE USING (true);

-- Allow public access to other tables too so bootstrapping works
DROP POLICY IF EXISTS "Allow public read on clubs" ON clubs;
CREATE POLICY "Allow public read on clubs" ON clubs FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert on clubs" ON clubs;
CREATE POLICY "Allow public insert on clubs" ON clubs FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update on clubs" ON clubs;
CREATE POLICY "Allow public update on clubs" ON clubs FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow read career entries" ON player_career_entries;
CREATE POLICY "Allow read career entries" ON player_career_entries FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow insert career entries" ON player_career_entries;
CREATE POLICY "Allow insert career entries" ON player_career_entries FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow update career entries" ON player_career_entries;
CREATE POLICY "Allow update career entries" ON player_career_entries FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow delete career entries" ON player_career_entries;
CREATE POLICY "Allow delete career entries" ON player_career_entries FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public read on teams" ON teams;
CREATE POLICY "Allow public read on teams" ON teams FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert on teams" ON teams;
CREATE POLICY "Allow public insert on teams" ON teams FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read on rating_weights" ON rating_weights;
CREATE POLICY "Allow public read on rating_weights" ON rating_weights FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert on rating_weights" ON rating_weights;
CREATE POLICY "Allow public insert on rating_weights" ON rating_weights FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update on rating_weights" ON rating_weights;
CREATE POLICY "Allow public update on rating_weights" ON rating_weights FOR UPDATE USING (true);

-- Polices for reports
DROP POLICY IF EXISTS "Allow public read on reports" ON reports;
CREATE POLICY "Allow public read on reports" ON reports FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert on reports" ON reports;
CREATE POLICY "Allow public insert on reports" ON reports FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update on reports" ON reports;
CREATE POLICY "Allow public update on reports" ON reports FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public read on history_logs" ON history_logs;
CREATE POLICY "Allow public read on history_logs" ON history_logs FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert on history_logs" ON history_logs;
CREATE POLICY "Allow public insert on history_logs" ON history_logs FOR INSERT WITH CHECK (true);
