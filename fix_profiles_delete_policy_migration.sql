-- ============================================================================
-- MIGRACIÓN: Política RLS de DELETE (y refuerzo de SELECT/INSERT/UPDATE)
--            para la tabla `profiles`
-- ----------------------------------------------------------------------------
-- La UI de "Gestión de Usuarios" (SettingsPanel.tsx) ahora permite eliminar
-- usuarios (borra su fila de `profiles`), pero si la tabla no tiene una
-- política DELETE explícita, Postgres deniega la operación por defecto al
-- tener RLS activado (fallo silencioso: no borra nada o da error de RLS).
--
-- Idempotente. Ejecútalo en el SQL Editor de Supabase.
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public select on profiles" ON public.profiles;
CREATE POLICY "Allow public select on profiles" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert on profiles" ON public.profiles;
CREATE POLICY "Allow public insert on profiles" ON public.profiles FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on profiles" ON public.profiles;
CREATE POLICY "Allow public update on profiles" ON public.profiles FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete on profiles" ON public.profiles;
CREATE POLICY "Allow public delete on profiles" ON public.profiles FOR DELETE USING (true);
