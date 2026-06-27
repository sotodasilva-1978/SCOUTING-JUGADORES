-- Crear bucket público "imagenes-ayuda"
INSERT INTO storage.buckets (id, name, public, allowed_mime_types)
VALUES (
  'imagenes-ayuda',
  'imagenes-ayuda',
  true,
  ARRAY['image/jpeg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Política: lectura pública
CREATE POLICY "Lectura pública imagenes-ayuda"
ON storage.objects FOR SELECT
USING (bucket_id = 'imagenes-ayuda');

-- Política: subida solo para admins autenticados
CREATE POLICY "Subida autenticada imagenes-ayuda"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'imagenes-ayuda' AND auth.role() = 'authenticated');

-- Política: borrado solo para admins autenticados
CREATE POLICY "Borrado autenticado imagenes-ayuda"
ON storage.objects FOR DELETE
USING (bucket_id = 'imagenes-ayuda' AND auth.role() = 'authenticated');
