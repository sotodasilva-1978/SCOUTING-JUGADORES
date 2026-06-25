-- ============================================================
-- MIGRACIÓN: Fusionar "UD SANTA MARIÑA" y "U.D. SANTA MARIÑA"
-- Conservamos el registro más antiguo ("U.D. SANTA MARIÑA")
-- y actualizamos todos los FK del registro duplicado más nuevo.
-- Ejecutar en: Supabase Dashboard > SQL Editor > New Query
-- ============================================================

DO $$
DECLARE
  keep_id   UUID;  -- ID a conservar  (U.D. SANTA MARIÑA - más antiguo)
  drop_id   UUID;  -- ID a eliminar   (UD SANTA MARIÑA   - más nuevo)
  keep_location TEXT;
  drop_location TEXT;
BEGIN
  -- Obtener IDs por nombre exacto
  SELECT id, location INTO keep_id, keep_location
    FROM clubs WHERE name = 'U.D. SANTA MARIÑA' ORDER BY created_at ASC LIMIT 1;

  SELECT id, location INTO drop_id, drop_location
    FROM clubs WHERE name = 'UD SANTA MARIÑA'  ORDER BY created_at ASC LIMIT 1;

  IF keep_id IS NULL OR drop_id IS NULL THEN
    RAISE NOTICE 'No se encontraron ambos registros. Nada que hacer.';
    RETURN;
  END IF;

  RAISE NOTICE 'Conservando: % | Eliminando: %', keep_id, drop_id;

  -- Si el que vamos a conservar no tiene location pero el duplicado sí, copiamos el dato
  IF keep_location IS NULL AND drop_location IS NOT NULL THEN
    UPDATE clubs SET location = drop_location, updated_at = NOW()
    WHERE id = keep_id;
    RAISE NOTICE 'Copiada location "%" al registro conservado', drop_location;
  END IF;

  -- Reasignar referencias en todas las tablas con FK a clubs(id)
  UPDATE players        SET club_id = keep_id WHERE club_id = drop_id;
  UPDATE profiles       SET club_id = keep_id WHERE club_id = drop_id;
  UPDATE categories     SET club_id = keep_id WHERE club_id = drop_id;
  UPDATE rating_weights SET club_id = keep_id WHERE club_id = drop_id;

  -- Eliminar el duplicado
  DELETE FROM clubs WHERE id = drop_id;
  RAISE NOTICE 'Registro duplicado "UD SANTA MARIÑA" eliminado.';

  -- Añadir UNIQUE constraint si no existe (evita futuros duplicados)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'clubs'::regclass AND conname = 'clubs_name_unique'
  ) THEN
    ALTER TABLE clubs ADD CONSTRAINT clubs_name_unique UNIQUE (name);
    RAISE NOTICE 'Restricción UNIQUE añadida en clubs.name';
  ELSE
    RAISE NOTICE 'Restricción UNIQUE ya existía.';
  END IF;

END$$;
