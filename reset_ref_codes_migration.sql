-- ============================================================================
-- MIGRACIÓN: Códigos de referencia secuenciales (sin borrar registros)
-- ----------------------------------------------------------------------------
-- Reinicia/numera de forma legible los jugadores y clubes manteniendo intactos
-- los UUID internos (y por tanto todas las relaciones: informes, partidos...).
--
--   Jugadores -> player00001, player00002, ...   (columna players.ref_code)
--   Clubes    -> club0001,    club0002,    ...    (columna clubs.ref_code)
--
-- Es IDEMPOTENTE: se puede ejecutar varias veces sin duplicar ni romper nada.
-- Ejecútalo en el SQL Editor de Supabase.
-- ============================================================================

BEGIN;

-- ─── JUGADORES ──────────────────────────────────────────────────────────────
ALTER TABLE players ADD COLUMN IF NOT EXISTS ref_seq  INTEGER;
ALTER TABLE players ADD COLUMN IF NOT EXISTS ref_code TEXT;

-- Numeración secuencial estable por antigüedad (created_at) y desempate por id
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC NULLS LAST, id ASC) AS rn
  FROM players
)
UPDATE players p
SET ref_seq  = o.rn,
    ref_code = 'player' || LPAD(o.rn::text, 5, '0')
FROM ordered o
WHERE p.id = o.id;

-- Secuencia para los nuevos altas, arrancando tras el máximo actual
CREATE SEQUENCE IF NOT EXISTS players_ref_seq;
SELECT setval('players_ref_seq', COALESCE((SELECT MAX(ref_seq) FROM players), 0), true);

CREATE OR REPLACE FUNCTION assign_player_ref_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ref_seq IS NULL THEN
    NEW.ref_seq := nextval('players_ref_seq');
  END IF;
  NEW.ref_code := 'player' || LPAD(NEW.ref_seq::text, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_assign_player_ref_code ON players;
CREATE TRIGGER trg_assign_player_ref_code
  BEFORE INSERT ON players
  FOR EACH ROW EXECUTE FUNCTION assign_player_ref_code();

CREATE UNIQUE INDEX IF NOT EXISTS players_ref_code_key ON players (ref_code);


-- ─── CLUBES ─────────────────────────────────────────────────────────────────
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS ref_seq  INTEGER;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS ref_code TEXT;

WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC NULLS LAST, id ASC) AS rn
  FROM clubs
)
UPDATE clubs c
SET ref_seq  = o.rn,
    ref_code = 'club' || LPAD(o.rn::text, 4, '0')
FROM ordered o
WHERE c.id = o.id;

CREATE SEQUENCE IF NOT EXISTS clubs_ref_seq;
SELECT setval('clubs_ref_seq', COALESCE((SELECT MAX(ref_seq) FROM clubs), 0), true);

CREATE OR REPLACE FUNCTION assign_club_ref_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ref_seq IS NULL THEN
    NEW.ref_seq := nextval('clubs_ref_seq');
  END IF;
  NEW.ref_code := 'club' || LPAD(NEW.ref_seq::text, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_assign_club_ref_code ON clubs;
CREATE TRIGGER trg_assign_club_ref_code
  BEFORE INSERT ON clubs
  FOR EACH ROW EXECUTE FUNCTION assign_club_ref_code();

CREATE UNIQUE INDEX IF NOT EXISTS clubs_ref_code_key ON clubs (ref_code);

COMMIT;

-- ─── Verificación rápida (opcional) ─────────────────────────────────────────
-- SELECT ref_code, full_name FROM players ORDER BY ref_seq LIMIT 10;
-- SELECT ref_code, name      FROM clubs   ORDER BY ref_seq LIMIT 10;
