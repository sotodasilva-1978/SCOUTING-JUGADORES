import { createClient } from '@supabase/supabase-js';
import imageCompression from 'browser-image-compression';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isSupabaseConfigured = 
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://placeholder.supabase.co' && 
  supabaseAnonKey !== 'placeholder';

if (!isSupabaseConfigured) {
  console.info('Supabase URL or Anon Key is missing or placeholder. Database persistence is disabled.');
}

// Create a dummy client if not configured to avoid "Failed to fetch" spam
const createDummyClient = () => {
  const dummyResult = { data: [], error: null };
  const handler: ProxyHandler<any> = {
    get: (target, prop) => {
      // If the property is 'then', making it thenable (Promise-like)
      if (prop === 'then') {
        return (resolve: any) => resolve(dummyResult);
      }
      // Otherwise, return a function that returns a new proxy for chaining
      return () => new Proxy({}, handler);
    }
  };
  return new Proxy({}, handler) as any;
};

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createDummyClient();

// ─── Player Photo Upload ────────────────────────────────────────────────────
// Comprime la imagen a JPEG ≤80 KB / 400 px y la sube al bucket player-photos.
// Devuelve la URL pública o null en caso de error.
export const uploadPlayerPhoto = async (
  playerId: string,
  file: File,
  onProgress?: (phase: 'compressing' | 'uploading' | 'done' | 'error', detail?: string) => void
): Promise<string | null> => {
  if (!isSupabaseConfigured) {
    console.warn('Supabase no está configurado. La foto no se puede subir.');
    onProgress?.('error', 'Supabase no configurado');
    return null;
  }

  // ── 1. Comprimir a JPEG (universalmente soportado) ───────────────────────
  onProgress?.('compressing');
  let compressed: File;
  try {
    compressed = await imageCompression(file, {
      maxSizeMB: 0.08,          // 80 KB
      maxWidthOrHeight: 400,    // 400 px — suficiente para avatar e informe
      useWebWorker: true,
      fileType: 'image/jpeg',   // JPEG: soporte universal en todos los navegadores
      initialQuality: 0.80,
    });
    console.log(`Foto comprimida: ${(compressed.size / 1024).toFixed(1)} KB`);
  } catch (compressionErr) {
    console.warn('Compresión fallida, usando original:', compressionErr);
    compressed = file;
  }

  // ── 2. Subir al bucket ───────────────────────────────────────────────────
  onProgress?.('uploading');
  const fileName = `${playerId}.jpg`;

  const { error } = await supabase.storage
    .from('player-photos')
    .upload(fileName, compressed, {
      upsert: true,
      contentType: 'image/jpeg',
      cacheControl: '3600',
    });

  if (error) {
    const msg = error.message || String(error);
    console.error('Error subiendo foto a Supabase Storage:', msg);
    onProgress?.('error', msg);
    return null;
  }

  // ── 3. Obtener URL pública ───────────────────────────────────────────────
  const { data } = supabase.storage
    .from('player-photos')
    .getPublicUrl(fileName);

  // Cache-buster para forzar recarga del avatar tras actualizar
  const publicUrl = `${data.publicUrl}?t=${Date.now()}`;
  onProgress?.('done');
  return publicUrl;
};
