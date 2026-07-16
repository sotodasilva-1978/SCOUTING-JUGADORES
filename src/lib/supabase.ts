import { createClient } from '@supabase/supabase-js';
import type { Profile } from '../types';
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
// Comprime la imagen a JPEG ≤80 KB / 400 px y la sube al bucket player-photos,
// en una carpeta propia por club (bucket privado — enlace firmado, no público).
// Devuelve un enlace firmado de larga duración o null en caso de error.
const SIGNED_URL_EXPIRY_SECONDS = 60 * 60 * 24 * 365 * 10; // 10 años

export const uploadPlayerPhoto = async (
  playerId: string,
  file: File,
  onProgress?: (phase: 'compressing' | 'uploading' | 'done' | 'error', detail?: string) => void,
  ownerClubId?: string | null
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

  // ── 2. Subir al bucket, en la carpeta del club ───────────────────────────
  onProgress?.('uploading');
  const folder = ownerClubId || 'sin-club';
  const fileName = `${folder}/${playerId}.jpg`;

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

  // ── 3. Obtener enlace firmado (el bucket es privado) ─────────────────────
  const { data, error: signError } = await supabase.storage
    .from('player-photos')
    .createSignedUrl(fileName, SIGNED_URL_EXPIRY_SECONDS);

  if (signError || !data) {
    const msg = signError?.message || 'No se pudo generar el enlace de la foto';
    console.error('Error generando enlace firmado:', msg);
    onProgress?.('error', msg);
    return null;
  }

  // Cache-buster para forzar recarga del avatar tras actualizar
  const signedUrl = `${data.signedUrl}&t=${Date.now()}`;
  onProgress?.('done');
  return signedUrl;
};

// ─── Auth Helpers ────────────────────────────────────────────────────────────

export const signIn = (email: string, password: string) =>
  supabase.auth.signInWithPassword({ email, password });

export const signOut = () => supabase.auth.signOut();

export const getOrCreateProfile = async (
  userId: string,
  email: string
): Promise<Profile | null> => {
  const { data: existing } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (existing) return existing as Profile;

  const { data: created } = await supabase
    .from('profiles')
    .insert([{
      user_id: userId,
      full_name: email.split('@')[0],
      email,
      role: 'SCOUT',
      active: true,
    }])
    .select()
    .single();

  return created as Profile | null;
};
