-- Migration: add country column to clubs table
-- Permite añadir el filtro por País (además de Comunidad Autónoma /
-- Provincia / Ciudad) en la Estructura de Clubes.
-- Todos los clubes existentes hasta ahora son de España, así que se
-- rellenan directamente con ese valor.

ALTER TABLE clubs ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'España';

UPDATE clubs SET country = 'España' WHERE country IS NULL;

CREATE INDEX IF NOT EXISTS idx_clubs_country ON clubs (country);
