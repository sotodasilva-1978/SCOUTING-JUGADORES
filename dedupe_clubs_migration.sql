-- ============================================================================
-- MIGRACIÓN: Eliminar clubes duplicados (solución general)
-- ----------------------------------------------------------------------------
-- Detecta clubes con el MISMO nombre (ignorando mayúsculas y espacios),
-- conserva el más antiguo, repunta TODAS las referencias (players, categories,
-- profiles, rating_weights) al club que se conserva y borra los duplicados.
-- Luego crea un índice ÚNICO para impedir que vuelvan a existir duplicados.
--
-- SEGURA: no se pierde ningún jugador ni informe; solo se reescribe club_id
-- para que apunte al club conservado. DEFENSIVA: omite tablas que no existan.
-- IDEMPOTENTE: se puede ejecutar varias veces sin efectos secundarios.
-- ============================================================================

DO $$
DECLARE
  rec        RECORD;
  t          TEXT;
  ref_tables TEXT[] := ARRAY['players', 'categories', 'profiles', 'rating_weights'];
  borrados   INTEGER := 0;
BEGIN
  -- Recorre cada duplicado (dup_id) emparejado con el club a conservar (keep_id).
  FOR rec IN
    SELECT dup_id, keep_id
      FROM (
        SELECT id AS dup_id,
               first_value(id) OVER (
                 PARTITION BY upper(btrim(name))
                 ORDER BY created_at ASC NULLS LAST, id ASC
               ) AS keep_id
          FROM public.clubs
      ) m
     WHERE dup_id <> keep_id
  LOOP
    -- Repuntar todas las FKs del duplicado hacia el club conservado.
    FOREACH t IN ARRAY ref_tables LOOP
      IF to_regclass('public.' || t) IS NOT NULL THEN
        EXECUTE format('UPDATE public.%I SET club_id = $1 WHERE club_id = $2', t)
          USING rec.keep_id, rec.dup_id;
      END IF;
    END LOOP;

    DELETE FROM public.clubs WHERE id = rec.dup_id;
    borrados := borrados + 1;
  END LOOP;

  RAISE NOTICE 'Clubes duplicados eliminados: %', borrados;
END $$;

-- Impedir duplicados futuros (mismo nombre normalizado = no permitido).
CREATE UNIQUE INDEX IF NOT EXISTS clubs_name_unique_ci
  ON public.clubs (upper(btrim(name)));

-- ── Verificación: no debe quedar ningún nombre repetido ─────────────────────
SELECT upper(btrim(name)) AS club_normalizado, count(*) AS veces
  FROM public.clubs
 GROUP BY upper(btrim(name))
HAVING count(*) > 1
 ORDER BY veces DESC;
