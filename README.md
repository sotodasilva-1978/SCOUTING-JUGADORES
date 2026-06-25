<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Create `.env.local` and configure:

```env
GEMINI_API_KEY=your-gemini-key
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

3. Run `supabase_schema.sql` in Supabase SQL Editor.
4. If your database already existed before the "Perfil Futbolistico" changes, also run `perfil_futbolistico_migration.sql`.
5. Run the app:
   `npm run dev`
