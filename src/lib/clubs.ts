import { supabase } from './supabase';

// Los clubes son un catálogo GLOBAL de equipos reales (Real Madrid, Coruxo CF...)
// compartido por TODOS los clientes de la plataforma. Un mismo club real NUNCA
// debe duplicarse en la tabla `clubs` solo porque lo haya dado de alta un
// cliente distinto: hay que buscarlo primero (ignorando acentos, mayúsculas y
// puntuación) y solo crearlo si de verdad no existe todavía.
export const normalizeClubName = (value: string): string =>
  (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quita acentos: á/é/í/ó/ú/ü/ñ...
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, '') // quita puntuación: puntos, comas, guiones...
    .replace(/\s+/g, ' ')
    .trim();

export type ClubRow = {
  id: string;
  name: string;
  [key: string]: unknown;
};

/**
 * Busca un club existente en el catálogo global por nombre (ignorando
 * acentos/mayúsculas/puntuación) y, solo si no existe, lo crea. Nunca
 * duplica un club que ya exista para otro cliente.
 *
 * Si dos clientes intentan crear el mismo club a la vez, el índice único de
 * la base de datos rechaza al segundo insert; en ese caso recuperamos el
 * registro que ganó la carrera en lugar de fallar o duplicar.
 */
export async function findOrCreateClub(
  rawName: string,
  extra: Record<string, unknown> = {},
): Promise<ClubRow | null> {
  const name = rawName.trim();
  if (!name) return null;
  const normalized = normalizeClubName(name);

  const { data: allClubs } = await supabase.from('clubs').select('id, name');
  const existing = (allClubs || []).find(club => normalizeClubName(club.name) === normalized);
  if (existing) return existing as ClubRow;

  const { data: created, error } = await supabase
    .from('clubs')
    .insert([{ name, current_season: '2026/2027', ...extra }])
    .select()
    .single();

  if (!error) return created as ClubRow;

  // Condición de carrera: otro cliente creó el mismo club justo antes.
  if (error.code === '23505') {
    const { data: refreshed } = await supabase.from('clubs').select('id, name');
    const winner = (refreshed || []).find(club => normalizeClubName(club.name) === normalized);
    if (winner) return winner as ClubRow;
  }

  console.error('Error creando/buscando club:', error);
  return null;
}
