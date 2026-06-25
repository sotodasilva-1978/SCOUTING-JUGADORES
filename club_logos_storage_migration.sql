-- =============================================================
-- PASO 1 — Ejecutar este SQL en Supabase → SQL Editor
-- =============================================================
-- Crea el bucket club-logos (público, 100 KB máx por archivo)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'club-logos',
  'club-logos',
  true,
  102400,   -- 100 KB máx (los escudos se comprimen antes de subir)
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public             = true,
  file_size_limit    = 102400,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];

-- =============================================================
-- PASO 2 — Las políticas RLS NO se pueden crear desde el SQL
-- Editor con el rol postgres (Supabase no lo permite).
-- Créalas manualmente en el Dashboard:
--
--   Storage → club-logos → Policies → New policy
--
--   Política 1 — Lectura pública
--     Operation : SELECT
--     Target roles: anon, authenticated
--     USING: bucket_id = 'club-logos'
--
--   Política 2 — Subida
--     Operation : INSERT
--     Target roles: anon, authenticated
--     WITH CHECK: bucket_id = 'club-logos'
--
--   Política 3 — Actualizar (reemplazar escudo)
--     Operation : UPDATE
--     Target roles: anon, authenticated
--     USING: bucket_id = 'club-logos'
--
--   Política 4 — Borrar
--     Operation : DELETE
--     Target roles: anon, authenticated
--     USING: bucket_id = 'club-logos'
--
-- =============================================================
-- Verificación: el bucket debe aparecer en Storage → club-logos
-- con el icono de candado abierto (público).
-- =============================================================
