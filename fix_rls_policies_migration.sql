-- ============================================================================
-- MIGRACIÓN: Políticas RLS faltantes (matches, videos, categories)
-- ----------------------------------------------------------------------------
-- En el esquema original se activó Row Level Security en `matches` y `videos`
-- pero NO se crearon políticas -> Postgres deniega TODO por defecto, así que
-- no se podían guardar ni leer partidos ni vídeos (fallo silencioso).
-- Este script añade las políticas públicas que faltan. Idempotente.
-- Ejecútalo en el SQL Editor de Supabase.
-- ============================================================================

BEGIN;

-- ─── MATCHES ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Allow public read on matches" ON matches;
CREATE POLICY "Allow public read on matches"   ON matches FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert on matches" ON matches;
CREATE POLICY "Allow public insert on matches" ON matches FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update on matches" ON matches;
CREATE POLICY "Allow public update on matches" ON matches FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow public delete on matches" ON matches;
CREATE POLICY "Allow public delete on matches" ON matches FOR DELETE USING (true);

-- ─── VIDEOS ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Allow public read on videos" ON videos;
CREATE POLICY "Allow public read on videos"   ON videos FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert on videos" ON videos;
CREATE POLICY "Allow public insert on videos" ON videos FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update on videos" ON videos;
CREATE POLICY "Allow public update on videos" ON videos FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow public delete on videos" ON videos;
CREATE POLICY "Allow public delete on videos" ON videos FOR DELETE USING (true);

-- ─── CATEGORIES ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Allow public read on categories" ON categories;
CREATE POLICY "Allow public read on categories"   ON categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert on categories" ON categories;
CREATE POLICY "Allow public insert on categories" ON categories FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update on categories" ON categories;
CREATE POLICY "Allow public update on categories" ON categories FOR UPDATE USING (true);

-- ─── PLAYERS: permitir borrado (faltaba la política DELETE) ──────────────────
DROP POLICY IF EXISTS "Allow public delete on players" ON players;
CREATE POLICY "Allow public delete on players" ON players FOR DELETE USING (true);

-- ─── REPORTS: permitir borrado (faltaba la política DELETE) ──────────────────
DROP POLICY IF EXISTS "Allow public delete on reports" ON reports;
CREATE POLICY "Allow public delete on reports" ON reports FOR DELETE USING (true);

COMMIT;
