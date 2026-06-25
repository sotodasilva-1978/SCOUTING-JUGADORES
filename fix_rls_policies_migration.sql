-- ============================================================================
-- MIGRACIÓN: Políticas RLS faltantes (matches, videos, categories)
-- ----------------------------------------------------------------------------
-- En el esquema original se activó Row Level Security en `matches` y `videos`
-- pero NO se crearon políticas -> Postgres deniega TODO por defecto, así que
-- no se podían guardar ni leer partidos ni vídeos (fallo silencioso).
--
-- Este script es DEFENSIVO: solo aplica políticas a las tablas que existan,
-- así no falla aunque alguna tabla (p.ej. `categories`) no esté creada.
-- Idempotente. Ejecútalo en el SQL Editor de Supabase.
-- ============================================================================

DO $$
DECLARE
  t   text;
  act text;
  -- Tablas a las que damos acceso público de lectura/escritura
  tables text[] := ARRAY['matches', 'videos', 'categories', 'players', 'reports', 'clubs', 'teams', 'history_logs'];
BEGIN
  FOREACH t IN ARRAY tables
  LOOP
    -- Saltar si la tabla no existe en el esquema public
    IF to_regclass('public.' || t) IS NULL THEN
      RAISE NOTICE 'Tabla "%" no existe, se omite.', t;
      CONTINUE;
    END IF;

    -- Asegurar que RLS está activado
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);

    -- Crear (o recrear) una política por cada acción
    FOREACH act IN ARRAY ARRAY['select', 'insert', 'update', 'delete']
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS "Allow public %s on %s" ON public.%I;', act, t, t);

      IF act = 'insert' THEN
        EXECUTE format('CREATE POLICY "Allow public %s on %s" ON public.%I FOR INSERT WITH CHECK (true);', act, t, t);
      ELSIF act = 'select' THEN
        EXECUTE format('CREATE POLICY "Allow public %s on %s" ON public.%I FOR SELECT USING (true);', act, t, t);
      ELSIF act = 'update' THEN
        EXECUTE format('CREATE POLICY "Allow public %s on %s" ON public.%I FOR UPDATE USING (true);', act, t, t);
      ELSIF act = 'delete' THEN
        EXECUTE format('CREATE POLICY "Allow public %s on %s" ON public.%I FOR DELETE USING (true);', act, t, t);
      END IF;
    END LOOP;

    RAISE NOTICE 'Políticas aplicadas a "%".', t;
  END LOOP;
END $$;
