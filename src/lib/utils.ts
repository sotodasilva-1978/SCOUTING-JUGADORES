import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { UserRole } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRating(rating?: number) {
  if (rating === undefined || rating === null) return 'N/R';
  return rating.toFixed(1);
}

export function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    'NEW':                'bg-slate-500 text-white',
    'PENDING_VALIDATION': 'bg-orange-500 text-white',
    'VALIDATED':          'bg-blue-500 text-white',
    'TRACKING':           'bg-cyan-500 text-white',
    'OBSERVED':           'bg-sky-400 text-slate-900',
    'INTERESTING':        'bg-yellow-400 text-slate-900',
    'VERY_INTERESTING':   'bg-violet-500 text-white',
    'PRIORITY':           'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20',
    'CONTACTED':          'bg-pink-500 text-white',
    'ON_TRIAL':           'bg-amber-500 text-white',
    'SIGNED':             'bg-green-500 text-white',
    'DISCARDED':          'bg-red-500 text-white',
    'NOT_AVAILABLE':      'bg-slate-400 text-white',
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

const CATEGORY_ORDER: Record<string, number> = {
  'SENIOR': 1,
  'JUVENIL': 2,
  'CADETE': 3,
  'INFANTIL': 4,
  'ALEVÍN': 5,
  'ALEVIN': 5,
  'BENJAMÍN': 6,
  'BENJAMIN': 6,
  'PRE-BENJAMÍN': 7,
  'PRE-BENJAMIN': 7,
};

export function sortCategories(categories: string[]): string[] {
  return [...categories].sort((a, b) => {
    if (a === 'ALL' || a === 'TODAS') return -1;
    if (b === 'ALL' || b === 'TODAS') return 1;
    const priorityA = CATEGORY_ORDER[a.toUpperCase()] || 99;
    const priorityB = CATEGORY_ORDER[b.toUpperCase()] || 99;
    if (priorityA !== priorityB) return priorityA - priorityB;
    return a.localeCompare(b, 'es');
  });
}

/**
 * Calcula la edad exacta teniendo en cuenta si el cumpleaños ya pasó este año.
 * - Si se tiene birth_date (YYYY-MM-DD) usa día y mes exactos.
 * - Si solo hay birth_year usa la diferencia de años (aproximación ±0).
 */
export function resolveBirthYear(birthDate?: string | null, birthYear?: number | null): number | undefined {
  const numericBirthYear = typeof birthYear === 'number' && Number.isFinite(birthYear) ? birthYear : undefined;

  if (birthDate) {
    const bd = new Date(birthDate);
    if (!isNaN(bd.getTime())) {
      const dateYear = bd.getFullYear();
      if (numericBirthYear && dateYear !== numericBirthYear) return numericBirthYear;
      return numericBirthYear ?? dateYear;
    }
  }

  return numericBirthYear;
}

export function computeAge(birthDate?: string | null, birthYear?: number | null): number | undefined {
  const today = new Date();
  const resolvedBirthYear = resolveBirthYear(birthDate, birthYear);

  if (birthDate) {
    const bd = new Date(birthDate);
    if (isNaN(bd.getTime())) return resolvedBirthYear ? today.getFullYear() - resolvedBirthYear : undefined;
    if (resolvedBirthYear && bd.getFullYear() !== resolvedBirthYear) {
      return today.getFullYear() - resolvedBirthYear;
    }
    let age = today.getFullYear() - bd.getFullYear();
    const monthDiff = today.getMonth() - bd.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < bd.getDate())) age--;
    return age;
  }

  if (resolvedBirthYear) return today.getFullYear() - resolvedBirthYear;
  return undefined;
}

export function calculateCategory(birthYear?: number | null, birthDate?: string | null): string {
  const resolvedBirthYear = resolveBirthYear(birthDate, birthYear);
  if (!resolvedBirthYear) return 'SIN REGISTRO';
  const age = new Date().getFullYear() - resolvedBirthYear;
  if (age >= 19) return 'SENIOR';
  if (age >= 16) return 'JUVENIL';
  if (age >= 14) return 'CADETE';
  if (age >= 12) return 'INFANTIL';
  if (age >= 10) return 'ALEVÍN';
  if (age >= 8) return 'BENJAMÍN';
  if (age >= 6) return 'PRE-BENJAMÍN';
  return 'DEBUTANTE';
}

// ─── Helpers de formato de juego ─────────────────────────────────────────────

const F11_CATS = ['JUVENIL', 'CADETE', 'INFANTIL'];
const F8_CATS = ['ALEVÍN', 'ALEVIN', 'BENJAMÍN', 'BENJAMIN', 'PRE-BENJAMÍN', 'PRE-BENJAMIN'];

export function isF11Category(cat: string): boolean {
  return F11_CATS.some(c => cat.toUpperCase() === c);
}

export function isF8Category(cat: string): boolean {
  return F8_CATS.some(c => cat.toUpperCase() === c);
}

// ─── Helpers de permisos ─────────────────────────────────────────────────────

const SCOUT_ROLES: UserRole[] = ['SCOUT', 'SCOUT_F11', 'SCOUT_F8'];

export function isScoutRole(role: UserRole): boolean {
  return SCOUT_ROLES.includes(role);
}

export function canCreatePlayer(role: UserRole): boolean {
  return ['ADMIN', 'COORD', 'ENTREN', 'SCOUT', 'SCOUT_F11', 'SCOUT_F8'].includes(role);
}

export function canEditPlayer(role: UserRole, createdBy: string, userId: string): boolean {
  if (['ADMIN', 'COORD', 'ENTREN'].includes(role)) return true;
  if (isScoutRole(role)) return createdBy === userId;
  return false;
}

export function canDeletePlayer(role: UserRole): boolean {
  return role === 'ADMIN';
}

export function canCreateReport(role: UserRole): boolean {
  return ['ADMIN', 'COORD', 'ENTREN', 'SCOUT', 'SCOUT_F11', 'SCOUT_F8'].includes(role);
}

export function canEditReport(role: UserRole, observerId: string, userId: string): boolean {
  if (['ADMIN', 'COORD'].includes(role)) return true;
  if (['ENTREN', 'SCOUT', 'SCOUT_F11', 'SCOUT_F8'].includes(role)) return observerId === userId;
  return false;
}

export function canPrintReport(role: UserRole): boolean {
  return ['ADMIN', 'COORD', 'PRESID'].includes(role);
}

export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    ADMIN:     'Administrador',
    COORD:     'Coordinador',
    COORD_F11: 'Coordinador F11',
    COORD_F8:  'Coordinador F8',
    PRESID:    'Presidente',
    ENTREN:    'Entrenador',
    SCOUT:     'Scout General',
    SCOUT_F11: 'Scout F11',
    SCOUT_F8:  'Scout F8',
  };
  return labels[role] || role;
}
