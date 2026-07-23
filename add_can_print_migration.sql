-- ============================================================================
-- MIGRACIÓN: Permiso individual de impresión (`can_print`) en `profiles`
-- ----------------------------------------------------------------------------
-- Antes, la opción de imprimir se activaba/desactivaba según el ROL del
-- usuario (hardcodeado en el frontend). Ahora es un permiso individual por
-- usuario, gestionable desde "Gestión de Usuarios" (SettingsPanel) con un
-- botón on/off, independientemente de su rol.
--
-- Por defecto se deja bloqueado (false) para todos, y se restaura el acceso
-- a quienes ya lo tenían garantizado por rol (ADMIN, SUPERADMIN, PRESID),
-- para no romper su flujo actual. El resto de roles (COORD, COORD_F11,
-- COORD_F8, ENTREN, SCOUT, SCOUT_F11, SCOUT_F8) queda bloqueado hasta que
-- un administrador lo habilite manualmente por usuario.
--
-- Idempotente. Ejecútalo en el SQL Editor de Supabase.
-- ============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS can_print boolean NOT NULL DEFAULT false;

UPDATE public.profiles
  SET can_print = true
  WHERE role IN ('ADMIN', 'SUPERADMIN', 'PRESID');
