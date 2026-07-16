-- ============================================================================
-- MIGRACIÓN: Deduplicar clubes de forma robusta y bloquear duplicados futuros
-- ----------------------------------------------------------------------------
-- CONTEXTO: `clubs` es un catálogo GLOBAL de equipos reales (Real Madrid,
-- Coruxo CF...) compartido por TODOS los clientes de la plataforma. NUNCA
-- debe haber una fila por cliente para el mismo club real, aunque el nombre
-- se haya escrito con distintos acentos, mayúsculas o puntuación
-- ("U.D. Santa Mariña" vs "ud santa marina" vs "UD SANTA MARIÑA").
--
-- Los índices únicos anteriores (dedupe_clubs_migration.sql,
-- fix_clubs_duplicates_migration.sql) solo detectaban mayúsculas/espacios,
-- no acentos ni puntuación, así que seguían permitiendo duplicados.
--
-- Este script:
--   1) Define normalize_club_name(): mayúsculas, sin acentos, sin puntuación.
--   2) Fusiona los clubes cuyo nombre normalizado coincide, conservando el
--      más antiguo y reasignando TODAS las referencias (players, categories,
--      profiles, rating_weights, player_career_entries).
--   3) Crea un índice ÚNICO sobre el nombre normalizado para impedir que
--      vuelvan a crearse duplicados, venga del cliente que venga.
--
-- SEGURA: no se pierde ningún jugador ni informe; solo se reescribe club_id
-- para que apunte al club conservado. DEFENSIVA: omite tablas que no existan.
-- IDEMPOTENTE: se puede ejecutar varias veces sin efectos secundarios.
-- ============================================================================

-- Normaliza el nombre: mayúsculas, sin acentos ni diéresis, sin puntuación,
-- espacios colapsados. No depende de ninguna extensión (unaccent puede no
-- estar disponible o no estar en el search_path en algunos proyectos de
-- Supabase), por eso se usa translate() con un mapeo explícito de acentos.
CREATE OR REPLACE FUNCTION public.normalize_club_name(value TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT btrim(
    regexp_replace(
      regexp_replace(
        translate(
          upper(coalesce(value, '')),
          'ÁÀÂÄÃÉÈÊËÍÌÎÏÓÒÔÖÕÚÙÛÜÑÇ',
          'AAAAAEEEEIIIIOOOOOUUUUNC'
        ),
        '[^A-Z0-9 ]', '', 'g'
      ),
      '\s+', ' ', 'g'
    )
  );
$$;

DO $$
DECLARE
  rec        RECORD;
  t          TEXT;
  ref_tables TEXT[] := ARRAY['players', 'categories', 'profiles', 'rating_weights', 'player_career_entries'];
  fundidos   INTEGER := 0;
BEGIN
  FOR rec IN
    SELECT dup_id, keep_id
      FROM (
        SELECT id AS dup_id,
               first_value(id) OVER (
                 PARTITION BY public.normalize_club_name(name)
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

    -- Conserva escudo/localización del duplicado si el club conservado no los tiene.
    UPDATE public.clubs keep
       SET logo_url = COALESCE(keep.logo_url, dup.logo_url),
           location = COALESCE(keep.location, dup.location),
           updated_at = NOW()
      FROM public.clubs dup
     WHERE keep.id = rec.keep_id AND dup.id = rec.dup_id;

    DELETE FROM public.clubs WHERE id = rec.dup_id;
    fundidos := fundidos + 1;
  END LOOP;

  RAISE NOTICE 'Clubes duplicados fusionados: %', fundidos;
END $$;

-- Impedir duplicados futuros (nombre normalizado = no permitido), sin
-- importar acentos, puntuación, mayúsculas ni qué cliente lo haya creado.
CREATE UNIQUE INDEX IF NOT EXISTS clubs_name_normalized_unique
  ON public.clubs (public.normalize_club_name(name));

-- ── Verificación: no debe quedar ningún nombre normalizado repetido ─────────
SELECT public.normalize_club_name(name) AS club_normalizado, count(*) AS veces
  FROM public.clubs
 GROUP BY public.normalize_club_name(name)
HAVING count(*) > 1
 ORDER BY veces DESC;
