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
    'NEW': 'bg-blue-500',
    'PENDING_VALIDATION': 'bg-yellow-500',
    'VALIDATED': 'bg-green-500',
    'TRACKING': 'bg-indigo-500',
    'OBSERVED': 'bg-cyan-500',
    'INTERESTING': 'bg-teal-500',
    'VERY_INTERESTING': 'bg-emerald-500',
    'PRIORITY': 'bg-orange-500 text-white shadow-lg shadow-orange-500/20',
    'CONTACTED': 'bg-purple-500',
    'ON_TRIAL': 'bg-pink-500',
    'SIGNED': 'bg-rose-600',
    'DISCARDED': 'bg-gray-500 text-slate-300',
    'NOT_AVAILABLE': 'bg-slate-400',
  };
  return colors[status] || 'bg-gray-400';
}

export function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    'NEW': 'NUEVO',
    'PENDING_VALIDATION': 'PENDIENTE',
    'VALIDATED': 'VALIDADO',
    'TRACKING': 'SEGUIMIENTO',
    'OBSERVED': 'OBSERVADO',
    'INTERESTING': 'INTERESANTE',
    'VERY_INTERESTING': 'MUY INTERESANTE',
    'PRIORITY': 'PRIORIDAD',
    'CONTACTED': 'CONTACTADO',
    'ON_TRIAL': 'A PRUEBA',
    'SIGNED': 'FICHADO',
    'DISCARDED': 'DESCARTADO',
    'NOT_AVAILABLE': 'NO DISPONIBLE',
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

export function calculateCategory(birthYear: number): string {
  if (!birthYear) return 'SIN REGISTRO';
  
  const currentYear = 2026; // System reference year
  const age = currentYear - birthYear;

  if (age >= 19) return 'SENIOR';
  if (age >= 16) return 'JUVENIL';
  if (age >= 14) return 'CADETE';
  if (age >= 12) return 'INFANTIL';
  if (age >= 10) return 'ALEVÍN';
  if (age >= 8) return 'BENJAMÍN';
  if (age >= 6) return 'PRE-BENJAMÍN';
  
  return 'DEBUTANTE';
}
