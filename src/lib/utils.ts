import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRating(rating?: number) {
  if (rating === undefined || rating === null) return 'N/R';
  return rating.toFixed(1);
}

export function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    'NEW': 'bg-slate-500 text-white',
    'PENDING_VALIDATION': 'bg-slate-600 text-white',
    'VALIDATED': 'bg-blue-500 text-white',
    'TRACKING': 'bg-amber-500 text-white',
    'OBSERVED': 'bg-cyan-500 text-white',
    'INTERESTING': 'bg-amber-400 text-slate-900',
    'VERY_INTERESTING': 'bg-emerald-400 text-slate-900',
    'PRIORITY': 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20',
    'CONTACTED': 'bg-purple-500 text-white',
    'ON_TRIAL': 'bg-purple-600 text-white',
    'SIGNED': 'bg-green-600 text-white',
    'DISCARDED': 'bg-rose-500 text-white',
    'NOT_AVAILABLE': 'bg-slate-400 text-white',
  };
  return colors[status] || 'bg-gray-400 text-white';
}

export function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    'NEW': 'NUEVO',
    'PENDING_VALIDATION': 'VALIDACIÓN',
    'VALIDATED': 'VALIDADO',
    'TRACKING': 'SEGUIMIENTO',
    'OBSERVED': 'OBSERVADO',
    'INTERESTING': 'INTERESANTE',
    'VERY_INTERESTING': 'MUY INTERESANTE',
    'PRIORITY': 'PRIORIDAD',
    'CONTACTED': 'CONTACTADO',
    'ON_TRIAL': 'PRUEBA',
    'SIGNED': 'FICHADO',
    'DISCARDED': 'DESCARTADO',
    'NOT_AVAILABLE': 'INDISPONIBLE',
  };
  return labels[status] || status;
}

export function getCategoryName(catId: string) {
  const categories: Record<string, string> = {
    'cat-senior': 'SENIOR',
    'cat-juvenil': 'JUVENIL',
    'cat-cadete': 'CADETE',
    'cat-infantil': 'INFANTIL',
    'cat-alevin': 'ALEVIN',
    'cat-benjamin': 'BENJAMÍN',
    'cat-prebenjamin': 'PRE-BENJAMÍN',
  };
  return categories[catId] || catId;
}

export const POSITION_ORDER: Record<string, number> = {
  'POR': 1,
  'LD': 2, 'LI': 3, 'DFC': 4, 'DF': 5,
  'MCD': 6, 'MC': 7, 'MCO': 8, 'MI': 9, 'MD': 10,
  'EI': 11, 'ED': 12, 'SD': 13, 'DC': 14
};

export function sortPositions(positions: string[]): string[] {
  return [...positions].sort((a, b) => {
    if (a === 'ALL') return -1;
    if (b === 'ALL') return 1;
    const priorityA = POSITION_ORDER[a] || 99;
    const priorityB = POSITION_ORDER[b] || 99;
    return priorityA - priorityB;
  });
}

/**
 * Calcula la edad exacta teniendo en cuenta si el cumpleaños ya pasó este año.
 * - Si se tiene birth_date (YYYY-MM-DD) usa día y mes exactos.
 * - Si solo hay birth_year usa la diferencia de años (aproximación ±0).
 */
export function computeAge(birthDate?: string | null, birthYear?: number | null): number | undefined {
  const today = new Date();

  if (birthDate) {
    const bd = new Date(birthDate);
    if (isNaN(bd.getTime())) return birthYear ? today.getFullYear() - birthYear : undefined;
    let age = today.getFullYear() - bd.getFullYear();
    const monthDiff = today.getMonth() - bd.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < bd.getDate())) age--;
    return age;
  }

  if (birthYear) return today.getFullYear() - birthYear;
  return undefined;
}

export function calculateCategory(birthYear: number): string {
  if (!birthYear) return 'SIN REGISTRO';
  const age = new Date().getFullYear() - birthYear;
  if (age >= 19) return 'SENIOR';
  if (age >= 16) return 'JUVENIL';
  if (age >= 14) return 'CADETE';
  if (age >= 12) return 'INFANTIL';
  if (age >= 10) return 'ALEVÍN';
  if (age >= 8) return 'BENJAMÍN';
  if (age >= 6) return 'PRE-BENJAMÍN';
  return 'DEBUTANTE';
}
