-- Registro manual de pagos por club-cliente (calendario de 12 meses).
-- Seguro de ejecutar varias veces (usa IF NOT EXISTS). Solo AÑADE una columna
-- nueva a "clients". No modifica ni borra nada existente.
--
-- Estructura del JSON (array de 12 posiciones, índice 0 = mes de activación):
--   [{ "paid": true, "paid_date": "2026-07-16" }, { "paid": false, "paid_date": null }, ...]

ALTER TABLE clients ADD COLUMN IF NOT EXISTS payment_log JSONB;

-- ============================================================
-- ROLLBACK (deshacer) — solo si hiciera falta volver atrás.
-- ============================================================
-- ALTER TABLE clients DROP COLUMN IF EXISTS payment_log;
