import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const SUPABASE_URL = 'https://xkjzgknmeqmpxoophcka.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhranpna25tZXFtcHhvb3BoY2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4ODcyNDYsImV4cCI6MjA5NzQ2MzI0Nn0.nxEkYA9ylfgzQ4F5TX1aWd6pzv2nM8BFNRIE_ZdVDqE';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const BUCKET = 'imagenes-ayuda';

async function main() {
  // 1. Crear bucket público
  console.log(`Creando bucket "${BUCKET}"...`);
  const { error: bucketError } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  });

  if (bucketError && bucketError.message !== 'The resource already exists') {
    console.error('Error creando bucket:', bucketError.message);
    process.exit(1);
  } else if (bucketError) {
    console.log('El bucket ya existe, continuando...');
  } else {
    console.log('Bucket creado correctamente.');
  }

  // 2. Subir COTOGRANDE.jpg
  console.log('Subiendo imagen COTOGRANDE.jpg...');
  const fileBuffer = readFileSync('./assets/COTOGRANDE.jpg');

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload('cotogrande.jpg', fileBuffer, {
      contentType: 'image/jpeg',
      upsert: true,
    });

  if (uploadError) {
    console.error('Error subiendo imagen:', uploadError.message);
    process.exit(1);
  }

  // 3. Obtener URL pública
  const { data } = supabase.storage.from(BUCKET).getPublicUrl('cotogrande.jpg');
  console.log('\n✅ ¡Listo! URL pública de la imagen:');
  console.log(data.publicUrl);
}

main();
