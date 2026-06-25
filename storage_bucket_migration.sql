-- =============================================================
-- PASO 1 — Ejecutar este SQL en Supabase → SQL Editor
-- =============================================================
-- Crea el bucket player-photos (público, 100 KB máx por archivo)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'player-photos',
  'player-photos',
  true,
  102400,   -- 100 KB máx (las fotos se comprimen antes de subir)
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public          = true,
  file_size_limit = 102400,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- =============================================================
-- PASO 2 — Las políticas RLS NO se pueden crear desde el SQL
-- Editor con el rol postgres (Supabase no lo permite).
-- Créalas manualmente en el Dashboard:
--
--   Storage → player-photos → Policies → New policy
--
--   Política 1 — Lectura pública
--     Operation : SELECT
--     Target roles: anon, authenticated
--     USING: bucket_id = 'player-photos'
--
--   Política 2 — Subida
--     Operation : INSERT
--     Target roles: anon, authenticated
--     WITH CHECK: bucket_id = 'player-photos'
--
--   Política 3 — Actualizar (reemplazar foto)
--     Operation : UPDATE
--     Target roles: anon, authenticated
--     USING: bucket_id = 'player-photos'
--
--   Política 4 — Borrar
--     Operation : DELETE
--     Target roles: anon, authenticated
--     USING: bucket_id = 'player-photos'
--
-- =============================================================
-- Verificación: el bucket debe aparecer en Storage → player-photos
-- con el icono de candado abierto (público).
-- =============================================================
