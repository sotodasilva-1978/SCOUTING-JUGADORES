-- Player contacts: historial de contactos y gestión de fichajes
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS player_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  contact_type TEXT NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_player_contacts_player
  ON player_contacts(player_id);
CREATE INDEX IF NOT EXISTS idx_player_contacts_created
  ON player_contacts(created_at);

DROP TRIGGER IF EXISTS update_player_contacts_updated_at ON player_contacts;
CREATE TRIGGER update_player_contacts_updated_at
  BEFORE UPDATE ON player_contacts
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

ALTER TABLE player_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read player contacts" ON player_contacts;
CREATE POLICY "Allow read player contacts" ON player_contacts
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow insert player contacts" ON player_contacts;
CREATE POLICY "Allow insert player contacts" ON player_contacts
  FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow update player contacts" ON player_contacts;
CREATE POLICY "Allow update player contacts" ON player_contacts
  FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow delete player contacts" ON player_contacts;
CREATE POLICY "Allow delete player contacts" ON player_contacts
  FOR DELETE USING (true);
