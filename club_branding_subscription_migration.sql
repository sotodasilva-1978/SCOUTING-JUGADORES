-- Fase 1 · Multi-club: identidad de marca y control de suscripción por club
-- Seguro de ejecutar varias veces (usa IF NOT EXISTS).
-- Solo AÑADE columnas nuevas a "clubs". No modifica ni borra nada existente.

-- Identidad visual del club
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS primary_color TEXT;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS secondary_color TEXT;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS tertiary_color TEXT;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS background_image_url TEXT;

-- Control de suscripción (12 meses, gestión manual por ahora)
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'trial';
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS subscription_start_date DATE;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS subscription_end_date DATE;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS monthly_fee DECIMAL;

-- Restringe los valores válidos de subscription_status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'clubs_subscription_status_check'
  ) THEN
    ALTER TABLE clubs ADD CONSTRAINT clubs_subscription_status_check
      CHECK (subscription_status IN ('trial', 'active', 'expired'));
  END IF;
END $$;

-- U.D. Santa Mariña: la dejamos como "active" para que no se vea afectada
-- por ningún futuro bloqueo de acceso por caducidad de suscripción.
UPDATE clubs
SET subscription_status = 'active'
WHERE name = 'U.D. SANTA MARIÑA' AND subscription_status = 'trial';

-- ============================================================
-- ROLLBACK (deshacer) — solo si hiciera falta volver atrás.
-- No lo ejecutes salvo que quieras eliminar estos campos.
-- ============================================================
-- ALTER TABLE clubs DROP CONSTRAINT IF EXISTS clubs_subscription_status_check;
-- ALTER TABLE clubs DROP COLUMN IF EXISTS primary_color;
-- ALTER TABLE clubs DROP COLUMN IF EXISTS secondary_color;
-- ALTER TABLE clubs DROP COLUMN IF EXISTS tertiary_color;
-- ALTER TABLE clubs DROP COLUMN IF EXISTS background_image_url;
-- ALTER TABLE clubs DROP COLUMN IF EXISTS subscription_status;
-- ALTER TABLE clubs DROP COLUMN IF EXISTS subscription_start_date;
-- ALTER TABLE clubs DROP COLUMN IF EXISTS subscription_end_date;
-- ALTER TABLE clubs DROP COLUMN IF EXISTS monthly_fee;
