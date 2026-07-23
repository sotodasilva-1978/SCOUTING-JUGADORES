-- Migration: add province and autonomous_community columns to clubs table
-- (la columna `location` ya existente se sigue usando como "Ciudad")
-- Permite filtrar el listado de clubes por posición geográfica
-- (Ciudad / Provincia / Comunidad Autónoma).

ALTER TABLE clubs ADD COLUMN IF NOT EXISTS province TEXT;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS autonomous_community TEXT;

CREATE INDEX IF NOT EXISTS idx_clubs_location ON clubs (location);
CREATE INDEX IF NOT EXISTS idx_clubs_province ON clubs (province);
CREATE INDEX IF NOT EXISTS idx_clubs_autonomous_community ON clubs (autonomous_community);
