-- ============================================================================
-- MIGRACIÓN: Reconstruir players.club_id según el CLUB REAL de cada jugador
-- ----------------------------------------------------------------------------
-- PROBLEMA: por un bug de la app, a todos los jugadores se les asignó el mismo
-- club_id (el primer club que existía), aunque cada uno juega en un club
-- distinto. El club real de cada jugador está en la columna club_name.
--
-- SOLUCIÓN (general, no solo para los ALEX):
--   1) Asegurar el club_name correcto de los dos ALEX detectados.
--   2) Crear un club por cada club_name distinto que aún no exista.
--   3) Asignar a cada jugador el club_id que corresponde a SU club_name.
--
-- SEGURA: solo actualiza columnas; NO borra ni recrea jugadores. Cada uno
-- conserva su id (UUID), su ref_code y sus vínculos (informes, vídeos...).
-- IDEMPOTENTE: se puede ejecutar varias veces sin efectos secundarios.
-- ============================================================================

-- 1) Fijar el club real (club_name) de los dos ALEX, por si estuviera vacío.
UPDATE public.players SET club_name = 'CORUXO CF'
 WHERE id::text LIKE '44607aad%';
UPDATE public.players SET club_name = 'FC BARCELONA'
 WHERE id::text LIKE 'cac7a642%';

-- 2) Crear un club por cada club_name distinto de los jugadores que no exista.
INSERT INTO public.clubs (name, current_season)
SELECT DISTINCT btrim(p.club_name), '2026/2027'
  FROM public.players p
 WHERE p.club_name IS NOT NULL
   AND btrim(p.club_name) <> ''
   AND NOT EXISTS (
     SELECT 1 FROM public.clubs c
      WHERE upper(btrim(c.name)) = upper(btrim(p.club_name))
   );

-- 3) Asignar a cada jugador el club_id correspondiente a SU club_name.
UPDATE public.players p
   SET club_id = c.id
  FROM public.clubs c
 WHERE upper(btrim(c.name)) = upper(btrim(p.club_name))
   AND p.club_name IS NOT NULL
   AND btrim(p.club_name) <> '';

-- ── Verificación: cada jugador con su club real ─────────────────────────────
SELECT p.first_name,
       p.last_name,
       p.club_name        AS club_texto,
       c.name             AS club_vinculado,
       p.club_id
  FROM public.players p
  LEFT JOIN public.clubs c ON c.id = p.club_id
 ORDER BY p.club_name, p.first_name;
