-- ============================================================
-- MIGRACION: visibilidad de clubes por club-cliente
-- Cada cliente puede ocultar/mostrar clubes del catalogo GLOBAL
-- sin borrar nada ni afectar a otros clientes.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS client_club_visibility (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT client_club_visibility_unique UNIQUE (client_id, club_id)
);

CREATE INDEX IF NOT EXISTS idx_client_club_visibility_client
  ON client_club_visibility (client_id);

CREATE INDEX IF NOT EXISTS idx_client_club_visibility_club
  ON client_club_visibility (club_id);

CREATE INDEX IF NOT EXISTS idx_client_club_visibility_client_visible
  ON client_club_visibility (client_id, is_visible);

CREATE OR REPLACE FUNCTION update_client_club_visibility_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_client_club_visibility_updated_at ON client_club_visibility;
CREATE TRIGGER update_client_club_visibility_updated_at
  BEFORE UPDATE ON client_club_visibility
  FOR EACH ROW
  EXECUTE PROCEDURE update_client_club_visibility_updated_at();

ALTER TABLE client_club_visibility ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read client club visibility" ON client_club_visibility;
CREATE POLICY "Allow read client club visibility"
  ON client_club_visibility FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert client club visibility" ON client_club_visibility;
CREATE POLICY "Allow insert client club visibility"
  ON client_club_visibility FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update client club visibility" ON client_club_visibility;
CREATE POLICY "Allow update client club visibility"
  ON client_club_visibility FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow delete client club visibility" ON client_club_visibility;
CREATE POLICY "Allow delete client club visibility"
  ON client_club_visibility FOR DELETE USING (true);
