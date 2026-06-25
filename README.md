<div align="center">

# ⚽ AS PRO SCOUT · U.D. Santa Mariña

**Sistema profesional de scouting y captación de jugadores.**
Seguimiento de talento, informes de partido, comparativas y analítica — optimizado para uso en móvil, tablet y escritorio.

</div>

---

## 🧰 Stack técnico

- **React 19** + **Vite 6** + **TypeScript**
- **Tailwind CSS v4** (`@tailwindcss/vite`)
- **Supabase** (PostgreSQL + Storage) como backend
- **Recharts** (radares y gráficas) · **Motion** (animaciones) · **lucide-react** (iconos)

## 🚀 Ejecutar en local

**Requisitos:** Node.js 18+

1. Instala dependencias:
   ```bash
   npm install
   ```
2. Crea un archivo `.env` (o `.env.local`) a partir de `.env.example`:
   ```env
   VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-anon-key-publica
   ```
   Las claves están en **Supabase → Project Settings → API**.
3. Arranca la app:
   ```bash
   npm run dev
   ```

## 🗄️ Base de datos (Supabase)

Ejecuta en el **SQL Editor** de Supabase, en este orden:

1. `supabase_schema.sql` — esquema base (solo la primera vez).
2. `fix_rls_policies_migration.sql` — **políticas RLS de `matches`, `videos`, `categories`** (necesarias para guardar partidos y vídeos).
3. `reset_ref_codes_migration.sql` — códigos de referencia legibles: `player00001`, `club0001`… (mantiene los UUID internos intactos).
4. *(Opcional, según historial de tu BD)* `perfil_futbolistico_migration.sql`, `club_location_migration.sql`, `club_logos_storage_migration.sql`, `storage_bucket_migration.sql`.

> Los scripts son **idempotentes**: puedes ejecutarlos varias veces sin riesgo.

## ☁️ Despliegue en Vercel

1. Sube el repositorio a GitHub.
2. En Vercel, **Import Project** desde GitHub. La configuración de [`vercel.json`](vercel.json) (framework Vite, salida `dist`, rewrites SPA) se detecta automáticamente.
3. En **Settings → Environment Variables** añade:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. **Deploy**. Vercel ejecuta `vite build` y publica `dist/`.

## 📦 Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run lint` | Comprobación de tipos (`tsc --noEmit`) |
