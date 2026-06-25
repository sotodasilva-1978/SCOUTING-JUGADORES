-- ============================================================
-- SCRIPT DE MIGRACIÓN - Añadir columnas faltantes a players
-- Ejecutar en: Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- Extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================
-- TABLA: clubs (crear si no existe)
-- ==========================
CREATE TABLE IF NOT EXISTS clubs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  current_season TEXT NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================
-- TABLA: teams (crear si no existe)
-- ==========================
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

-- ==========================
-- TABLA: players - Crear si no existe con TODAS las columnas
-- ==========================
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
  main_position TEXT NOT NULL DEFAULT '',
  secondary_positions TEXT[],
  dominant_foot TEXT NOT NULL DEFAULT 'UNKNOWN' CHECK (dominant_foot IN ('LEFT', 'RIGHT', 'BOTH', 'UNKNOWN')),
  approximate_height DECIMAL,
  approximate_weight DECIMAL,
  area TEXT,
  source TEXT,
  avatar_url TEXT,
  status TEXT NOT NULL DEFAULT 'TRACKING',
  interest_level INTEGER DEFAULT 1,
  global_rating DECIMAL,
  potential_rating DECIMAL,
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
  rating_technical DECIMAL DEFAULT 3,
  rating_tactical DECIMAL DEFAULT 3,
  rating_physical DECIMAL DEFAULT 3,
  rating_mental DECIMAL DEFAULT 3,
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
  rating_juego_aereo DECIMAL DEFAULT 0,
  custom_ratings JSONB DEFAULT '[]'::jsonb,
  rating_club_fit DECIMAL,
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
  verification_status JSONB DEFAULT '{}'::jsonb,
  has_video BOOLEAN DEFAULT false,
  has_images BOOLEAN DEFAULT false,
  possible_duplicate BOOLEAN DEFAULT false,
  created_by UUID,
  validated_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================
-- AÑADIR COLUMNAS FALTANTES (si la tabla ya existía sin ellas)
-- ==========================

-- Columnas básicas
ALTER TABLE players ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE players ADD COLUMN IF NOT EXISTS birth_year INTEGER;
ALTER TABLE players ADD COLUMN IF NOT EXISTS calculated_age INTEGER;
ALTER TABLE players ADD COLUMN IF NOT EXISTS nationality TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS category_id TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS club_name TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS league TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS usual_number TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS secondary_positions TEXT[];
ALTER TABLE players ADD COLUMN IF NOT EXISTS approximate_height DECIMAL;
ALTER TABLE players ADD COLUMN IF NOT EXISTS approximate_weight DECIMAL;
ALTER TABLE players ADD COLUMN IF NOT EXISTS area TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS interest_level INTEGER DEFAULT 1;
ALTER TABLE players ADD COLUMN IF NOT EXISTS global_rating DECIMAL;
ALTER TABLE players ADD COLUMN IF NOT EXISTS potential_rating DECIMAL;
ALTER TABLE players ADD COLUMN IF NOT EXISTS strengths TEXT[] DEFAULT '{}';
ALTER TABLE players ADD COLUMN IF NOT EXISTS weaknesses TEXT[] DEFAULT '{}';
ALTER TABLE players ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS club_id UUID;
ALTER TABLE players ADD COLUMN IF NOT EXISTS current_team_id UUID;
ALTER TABLE players ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE players ADD COLUMN IF NOT EXISTS validated_by UUID;
ALTER TABLE players ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE players ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Columnas de perfil avanzado
ALTER TABLE players ADD COLUMN IF NOT EXISTS competition TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS lateralidad TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS short_name TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS tracking_history JSONB DEFAULT '[]'::jsonb;
ALTER TABLE players ADD COLUMN IF NOT EXISTS decision_final TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS decision_date DATE;
ALTER TABLE players ADD COLUMN IF NOT EXISTS risks_analysis TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS improvement_margin TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS player_type TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS ideal_role TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS current_level_club TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS future_level_estimated TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS comparison_players TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS technical_profile TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS tactical_profile TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS physical_profile TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS mental_profile TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS birth_place TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS passport TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS agent_name TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS weight_kg DECIMAL;
ALTER TABLE players ADD COLUMN IF NOT EXISTS info_source TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS general_observations TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS verification_status JSONB DEFAULT '{}'::jsonb;
ALTER TABLE players ADD COLUMN IF NOT EXISTS has_video BOOLEAN DEFAULT false;
ALTER TABLE players ADD COLUMN IF NOT EXISTS has_images BOOLEAN DEFAULT false;
ALTER TABLE players ADD COLUMN IF NOT EXISTS possible_duplicate BOOLEAN DEFAULT false;
ALTER TABLE players ADD COLUMN IF NOT EXISTS rating_velo_despl DECIMAL DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS rating_acel DECIMAL DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS rating_fuerza DECIMAL DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS rating_resis DECIMAL DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS rating_agil DECIMAL DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS rating_coord DECIMAL DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS rating_velo_reac DECIMAL DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS rating_poten DECIMAL DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS rating_recup_fatiga DECIMAL DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS rating_tenden_lesion DECIMAL DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS rating_pase_corto DECIMAL DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS rating_pase_largo DECIMAL DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS rating_ctrl_balon DECIMAL DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS rating_tiro DECIMAL DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS rating_regate DECIMAL DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS rating_conduc DECIMAL DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS rating_superf_cont DECIMAL DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS rating_despeje DECIMAL DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS rating_entrada DECIMAL DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS rating_pierna_menos DECIMAL DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS rating_posic DECIMAL DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS rating_cobertura DECIMAL DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS rating_repliegue DECIMAL DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS rating_ayuda_def DECIMAL DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS rating_marcajes DECIMAL DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS rating_dom_espacios DECIMAL DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS rating_vigilancias DECIMAL DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS rating_apoyos_off DECIMAL DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS rating_desmarques DECIMAL DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS rating_temporiz DECIMAL DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS rating_liderazgo DECIMAL DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS rating_caracter DECIMAL DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS rating_competitiv DECIMAL DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS rating_companerismo DECIMAL DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS rating_mentalidad DECIMAL DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS rating_agresividad DECIMAL DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS rating_polivalencia DECIMAL DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS rating_inteligencia DECIMAL DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS rating_comunicacion DECIMAL DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS rating_personalidad DECIMAL DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS rating_juego_aereo DECIMAL DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS custom_ratings JSONB DEFAULT '[]'::jsonb;
ALTER TABLE players ADD COLUMN IF NOT EXISTS rating_club_fit DECIMAL;
ALTER TABLE players ADD COLUMN IF NOT EXISTS why_interested TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS main_strength TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS main_doubt TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS differential_talent TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS club_fit TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS risk_level TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS next_step TEXT;

-- ==========================
-- TABLA: matches
-- ==========================
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

-- ==========================
-- TABLA: reports
-- ==========================
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  match_id UUID REFERENCES matches(id),
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
  recommendation TEXT NOT NULL DEFAULT 'FOLLOW',
  next_step TEXT,
  match_rating DECIMAL NOT NULL DEFAULT 3,
  rating_physical DECIMAL DEFAULT 0,
  rating_technical DECIMAL DEFAULT 0,
  rating_tactical DECIMAL DEFAULT 0,
  rating_mental DECIMAL DEFAULT 0,
  custom_ratings JSONB DEFAULT '[]'::jsonb,
  video_urls TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================
-- AÑADIR COLUMNAS FALTANTES EN reports (si la tabla ya existía)
-- ==========================
ALTER TABLE reports ADD COLUMN IF NOT EXISTS category_id TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS position_played TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS minutes_observed INTEGER;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS match_context TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS technical_comment TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS tactical_comment TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS physical_comment TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS mental_comment TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS key_actions TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS doubts TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS next_step TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS rating_physical DECIMAL DEFAULT 0;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS rating_technical DECIMAL DEFAULT 0;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS rating_tactical DECIMAL DEFAULT 0;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS rating_mental DECIMAL DEFAULT 0;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS custom_ratings JSONB DEFAULT '[]'::jsonb;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS video_urls TEXT[];

-- ==========================
-- TABLA: videos
-- ==========================
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  match_id UUID REFERENCES matches(id),
  report_id UUID REFERENCES reports(id),
  url TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'URL',
  title TEXT NOT NULL DEFAULT 'Vídeo',
  description TEXT,
  start_min INTEGER,
  end_min INTEGER,
  action_type TEXT,
  rating DECIMAL,
  is_key BOOLEAN DEFAULT false,
  pending_review BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================
-- TABLA: rating_weights
-- ==========================
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

-- ==========================
-- COLUMNA location en clubs (para estructura de clubes)
-- ==========================
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS location TEXT;

-- ==========================
-- BUCKET club-logos en Supabase Storage
-- ==========================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('club-logos', 'club-logos', true, 102400, ARRAY['image/png','image/jpeg','image/webp','image/gif'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read club-logos" ON storage.objects;
CREATE POLICY "Public read club-logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'club-logos');

DROP POLICY IF EXISTS "Public upload club-logos" ON storage.objects;
CREATE POLICY "Public upload club-logos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'club-logos');

DROP POLICY IF EXISTS "Public update club-logos" ON storage.objects;
CREATE POLICY "Public update club-logos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'club-logos');

DROP POLICY IF EXISTS "Public delete club-logos" ON storage.objects;
CREATE POLICY "Public delete club-logos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'club-logos');

-- ==========================
-- DESHABILITAR RLS para desarrollo (acceso libre)
-- ==========================
ALTER TABLE clubs DISABLE ROW LEVEL SECURITY;
ALTER TABLE teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE players DISABLE ROW LEVEL SECURITY;
ALTER TABLE matches DISABLE ROW LEVEL SECURITY;
ALTER TABLE reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE videos DISABLE ROW LEVEL SECURITY;
ALTER TABLE rating_weights DISABLE ROW LEVEL SECURITY;

-- ==========================
-- TRIGGER updated_at para players
-- ==========================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_players_updated_at ON players;
CREATE TRIGGER update_players_updated_at
  BEFORE UPDATE ON players
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ============================================================
-- FIN DEL SCRIPT - ¡Ejecuta esto en Supabase SQL Editor!
-- ============================================================
