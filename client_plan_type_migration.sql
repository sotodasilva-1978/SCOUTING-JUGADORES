-- Migration: versión contratada (plan_type) por club-cliente + límite real de usuarios.
-- Seguro de ejecutar varias veces (usa IF NOT EXISTS / OR REPLACE / DROP...IF EXISTS).
-- Solo AÑADE una columna nueva a "clients" y crea un trigger sobre "profiles".
-- No modifica ni borra nada existente.

-- 1) Columna de versión contratada
ALTER TABLE clients ADD COLUMN IF NOT EXISTS plan_type TEXT NOT NULL DEFAULT 'basico';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'clients_plan_type_check'
  ) THEN
    ALTER TABLE clients ADD CONSTRAINT clients_plan_type_check
      CHECK (plan_type IN ('particular', 'basico', 'premium'));
  END IF;
END $$;

-- 2) Límite de usuarios activos por plan, aplicado de verdad en la base de datos:
--    particular -> 1, basico -> 9, premium -> sin límite.
--    Se dispara al crear un usuario nuevo o al reactivar/mover uno existente.
CREATE OR REPLACE FUNCTION enforce_client_user_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_plan_type TEXT;
  v_max_users INT;
  v_current_count INT;
BEGIN
  IF NEW.club_id IS NULL OR NEW.active IS DISTINCT FROM true THEN
    RETURN NEW;
  END IF;

  -- Si es un UPDATE que no cambia de club ni reactiva al usuario, no hay nada que comprobar.
  IF TG_OP = 'UPDATE' AND OLD.club_id = NEW.club_id AND OLD.active = true THEN
    RETURN NEW;
  END IF;

  SELECT plan_type INTO v_plan_type FROM clients WHERE id = NEW.club_id;

  v_max_users := CASE v_plan_type
    WHEN 'particular' THEN 1
    WHEN 'basico' THEN 9
    ELSE NULL -- premium o plan desconocido: sin límite
  END;

  IF v_max_users IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO v_current_count
  FROM profiles
  WHERE club_id = NEW.club_id
    AND active = true
    AND role <> 'SUPERADMIN'
    AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

  IF v_current_count >= v_max_users THEN
    RAISE EXCEPTION 'Límite de usuarios alcanzado: el plan "%" permite un máximo de % usuario(s) activo(s) por club.', v_plan_type, v_max_users;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_client_user_limit ON profiles;
CREATE TRIGGER trg_enforce_client_user_limit
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION enforce_client_user_limit();

-- ============================================================
-- ROLLBACK (deshacer) — solo si hiciera falta volver atrás.
-- No lo ejecutes salvo que quieras eliminar estos cambios.
-- ============================================================
-- DROP TRIGGER IF EXISTS trg_enforce_client_user_limit ON profiles;
-- DROP FUNCTION IF EXISTS enforce_client_user_limit();
-- ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_plan_type_check;
-- ALTER TABLE clients DROP COLUMN IF EXISTS plan_type;
