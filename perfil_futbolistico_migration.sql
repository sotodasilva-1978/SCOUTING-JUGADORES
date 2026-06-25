-- Refuerzo de esquema para la pantalla "Perfil Futbolistico"
-- Ejecuta este script en Supabase SQL Editor si tu proyecto ya existia antes de estos campos.

ALTER TABLE players ADD COLUMN IF NOT EXISTS rating_competitive DECIMAL DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS rating_decision_making DECIMAL DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS rating_pace DECIMAL DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS rating_intelligence DECIMAL DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS rating_personality DECIMAL DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS rating_potential DECIMAL DEFAULT 0;

ALTER TABLE history_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on history_logs" ON history_logs;
CREATE POLICY "Allow public read on history_logs"
ON history_logs FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Allow public insert on history_logs" ON history_logs;
CREATE POLICY "Allow public insert on history_logs"
ON history_logs FOR INSERT
WITH CHECK (true);
