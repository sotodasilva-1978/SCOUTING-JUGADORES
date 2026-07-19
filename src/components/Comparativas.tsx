/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, Swords, BarChart2, ChevronDown, X, Printer } from 'lucide-react';
import { Player } from '../types';
import { calculateCategory, cn, sortCategories } from '../lib/utils';

// ── Áreas de comparación ────────────────────────────────────────────────────

const AREAS = {
  fisicas: {
    label: 'FÍSICAS',
    color: '#10b981',
    attrs: [
      { label: 'Vel. desplaz.',  field: 'rating_velo_despl'    },
      { label: 'Aceleración',    field: 'rating_acel'          },
      { label: 'Fuerza',         field: 'rating_fuerza'        },
      { label: 'Resistencia',    field: 'rating_resis'         },
      { label: 'Agilidad',       field: 'rating_agil'          },
      { label: 'Coordinación',   field: 'rating_coord'         },
      { label: 'Vel. reacción',  field: 'rating_velo_reac'     },
      { label: 'Potencia',       field: 'rating_poten'         },
      { label: 'Recup. fatiga',  field: 'rating_recup_fatiga'  },
      { label: 'Tend. lesiones', field: 'rating_tenden_lesion' },
    ],
  },
  tecnicas: {
    label: 'TÉCNICAS',
    color: '#60a5fa',
    attrs: [
      { label: 'Pase corto',    field: 'rating_pase_corto'  },
      { label: 'Pase largo',    field: 'rating_pase_largo'  },
      { label: 'Control balón', field: 'rating_ctrl_balon'  },
      { label: 'Tiro',          field: 'rating_tiro'        },
      { label: 'Regate',        field: 'rating_regate'      },
      { label: 'Conducción',    field: 'rating_conduc'      },
      { label: 'Sup. contacto', field: 'rating_superf_cont' },
      { label: 'Despeje',       field: 'rating_despeje'     },
      { label: 'Entrada',       field: 'rating_entrada'     },
      { label: 'Pierna débil',  field: 'rating_pierna_menos'},
    ],
  },
  tacticas: {
    label: 'TÁCTICAS',
    color: '#a78bfa',
    attrs: [
      { label: 'Posicionamiento', field: 'rating_posic'         },
      { label: 'Cobertura',       field: 'rating_cobertura'     },
      { label: 'Repliegue',       field: 'rating_repliegue'     },
      { label: 'Ayudas def.',     field: 'rating_ayuda_def'     },
      { label: 'Marcajes',        field: 'rating_marcajes'      },
      { label: 'Dom. espacios',   field: 'rating_dom_espacios'  },
      { label: 'Vigilancias',     field: 'rating_vigilancias'   },
      { label: 'Apoyos of.',      field: 'rating_apoyos_off'    },
      { label: 'Desmarques',      field: 'rating_desmarques'    },
      { label: 'Temporizaciones', field: 'rating_temporiz'      },
    ],
  },
  cognitivas: {
    label: 'COGNITIVAS',
    color: '#fbbf24',
    attrs: [
      { label: 'Liderazgo',      field: 'rating_liderazgo'    },
      { label: 'Carácter',       field: 'rating_caracter'     },
      { label: 'Competitividad', field: 'rating_competitiv'   },
      { label: 'Compañerismo',   field: 'rating_companerismo' },
      { label: 'Mentalidad',     field: 'rating_mentalidad'   },
      { label: 'Agresividad',    field: 'rating_agresividad'  },
      { label: 'Polivalencia',   field: 'rating_polivalencia' },
      { label: 'Inteligencia',   field: 'rating_inteligencia' },
      { label: 'Comunicación',   field: 'rating_comunicacion' },
      { label: 'Personalidad',   field: 'rating_personalidad' },
    ],
  },
} as const;

const GK_AREAS = {
  gk_bajo_palos: {
    label: 'BAJO PALOS',
    color: '#06b6d4',
    attrs: [
      { label: 'Reflejos',              field: 'rating_velo_reac'   },
      { label: 'Agilidad bajo palos',   field: 'rating_agil'        },
      { label: 'Colocación / posición', field: 'rating_posic'       },
      { label: 'Potencia de salto',     field: 'rating_poten'       },
      { label: 'Coordinación',          field: 'rating_coord'       },
    ],
  },
  gk_con_balon: {
    label: 'CON EL BALÓN',
    color: '#60a5fa',
    attrs: [
      { label: 'Juego pie (corto)',       field: 'rating_pase_corto'   },
      { label: 'Saque largo / distrib.',  field: 'rating_pase_largo'   },
      { label: 'Control / amortiguación', field: 'rating_ctrl_balon'   },
      { label: 'Despeje / puñetazo',      field: 'rating_despeje'      },
      { label: 'Pierna no dominante',     field: 'rating_pierna_menos' },
    ],
  },
  gk_salidas: {
    label: 'SALIDAS Y AÉREO',
    color: '#a78bfa',
    attrs: [
      { label: 'Dominio del área',        field: 'rating_juego_aereo'  },
      { label: 'Lectura de salidas',      field: 'rating_dom_espacios' },
      { label: 'Posición en 1vs1',        field: 'rating_marcajes'     },
      { label: 'Fortaleza en choques',    field: 'rating_fuerza'       },
      { label: 'Resistencia / concentr.', field: 'rating_resis'        },
    ],
  },
  gk_mental: {
    label: 'MENTAL Y LIDERAZGO',
    color: '#fbbf24',
    attrs: [
      { label: 'Liderazgo defensivo', field: 'rating_liderazgo'    },
      { label: 'Comunicación',        field: 'rating_comunicacion' },
      { label: 'Mentalidad / foco',   field: 'rating_mentalidad'   },
      { label: 'Competitividad',      field: 'rating_competitiv'   },
      { label: 'Personalidad',        field: 'rating_personalidad' },
    ],
  },
} as const;

const COLOR_A = { stroke: '#60a5fa', fill: 'rgba(96,165,250,0.28)',  badge: '#1e3a5f', text: '#93c5fd' };
const COLOR_B = { stroke: '#fb7185', fill: 'rgba(251,113,133,0.25)', badge: '#4c0519', text: '#fda4af' };

// ── Radar superpuesto ────────────────────────────────────────────────────────

type GenericArea = { label: string; color: string; attrs: ReadonlyArray<{ label: string; field: string }> };

function CompareRadar({ area, playerA, playerB }: { area: GenericArea; playerA: Player; playerB: Player | null; key?: string }) {
  const W = 460, H = 400;
  const cx = 230, cy = 200;
  const R = 108, RINGS = 5;
  const BADGE_R = R + 20;   // badges de valor justo más allá del anillo exterior
  const LABEL_R = R + 52;   // etiquetas de atributo fuera de los badges
  const n = area.attrs.length;
  const step = (2 * Math.PI) / n;
  const start = -Math.PI / 2;

  const pt = (a: number, r: number) => ({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });

  const getVals = (p: Player) =>
    area.attrs.map(attr => {
      const raw = Number((p as unknown as Record<string, unknown>)[attr.field]) || 0;
      return { raw, norm: raw / 5 };
    });

  const valsA = getVals(playerA);
  const valsB = playerB ? getVals(playerB) : null;

  const polyPts = (vals: typeof valsA) =>
    vals.map((d, i) => {
      const a = start + i * step;
      return `${cx + d.norm * R * Math.cos(a)},${cy + d.norm * R * Math.sin(a)}`;
    }).join(' ');

  const anch = (a: number) => Math.cos(a) > 0.2 ? 'start' : Math.cos(a) < -0.2 ? 'end' : 'middle';
  const dy0  = (a: number, multi: boolean) =>
    multi ? (Math.sin(a) < -0.3 ? '-0.6em' : '0em') : '-0.35em';

  const nameA = playerA.short_name || playerA.full_name.split(' ')[0];
  const nameB = playerB ? (playerB.short_name || playerB.full_name.split(' ')[0]) : '';

  return (
    <div className="rounded-2xl border border-slate-700/40 shadow-2xl" style={{ background: '#070c15' }}>
      {/* Cabecera + leyenda */}
      <div className="px-5 pt-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: area.color }} />
          <p className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: area.color }}>{area.label}</p>
        </div>
        {valsB && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-0.5 rounded" style={{ background: COLOR_A.stroke }} />
              <span className="text-[9px] font-black uppercase" style={{ color: COLOR_A.text }}>{nameA}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg width="16" height="3"><line x1="0" y1="1.5" x2="16" y2="1.5" stroke={COLOR_B.stroke} strokeWidth="2" strokeDasharray="4 2"/></svg>
              <span className="text-[9px] font-black uppercase" style={{ color: COLOR_B.text }}>{nameB}</span>
            </div>
          </div>
        )}
      </div>

      {/* SVG principal */}
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="block">
        {/* Anillos con relleno alternado */}
        {Array.from({ length: RINGS }).map((_, ri) => (
          <circle key={ri} cx={cx} cy={cy} r={R * ((ri + 1) / RINGS)}
            fill={ri % 2 === 0 ? '#0b1422' : 'transparent'}
            stroke={ri === RINGS - 1 ? '#1e3a5f' : '#0e1e30'}
            strokeWidth={ri === RINGS - 1 ? 1.5 : 0.75}
          />
        ))}
        {/* Marca de escala 1-5 en eje superior */}
        {[1,2,3,4,5].map(v => (
          <text key={v} x={cx + 3} y={cy - R * (v / 5) + 3}
            fill="#1e3a5f" fontSize={7} fontWeight="900" fontFamily="system-ui,sans-serif">{v}</text>
        ))}
        {/* Radios */}
        {area.attrs.map((_, i) => {
          const a = start + i * step, o = pt(a, R);
          return <line key={i} x1={cx} y1={cy} x2={o.x} y2={o.y} stroke="#0e1e30" strokeWidth={1} />;
        })}

        {/* Polígono B */}
        {valsB && <>
          <polygon points={polyPts(valsB)} fill={COLOR_B.fill} stroke="none" />
          <polygon points={polyPts(valsB)} fill="none" stroke={COLOR_B.stroke}
            strokeWidth={1.5} strokeLinejoin="round" strokeDasharray="5 2.5" />
          {valsB.map((d, i) => {
            const a = start + i * step;
            return d.raw > 0
              ? <circle key={i} cx={cx + d.norm * R * Math.cos(a)} cy={cy + d.norm * R * Math.sin(a)} r={2.5} fill={COLOR_B.stroke} />
              : null;
          })}
        </>}

        {/* Polígono A */}
        <polygon points={polyPts(valsA)} fill={COLOR_A.fill} stroke="none" />
        <polygon points={polyPts(valsA)} fill="none" stroke={COLOR_A.stroke} strokeWidth={2} strokeLinejoin="round" />
        {valsA.map((d, i) => {
          const a = start + i * step;
          return d.raw > 0
            ? <circle key={i} cx={cx + d.norm * R * Math.cos(a)} cy={cy + d.norm * R * Math.sin(a)} r={3} fill={COLOR_A.stroke} />
            : null;
        })}

        {/* Badges de valor + etiquetas de atributo por radio */}
        {area.attrs.map((attr, i) => {
          const a    = start + i * step;
          const bp   = pt(a, BADGE_R);
          const lp   = pt(a, LABEL_R);
          const ta   = anch(a);
          const words = attr.label.split(' ');
          const multi = words.length > 1;
          const valA = valsA[i].raw;
          const valB = valsB?.[i]?.raw;
          const BW = 22, BH = 13;
          return (
            <g key={i}>
              {/* Badge jugador A */}
              <rect x={bp.x - BW / 2} y={bp.y - (valsB ? BH + 1 : BH / 2)} width={BW} height={BH} rx={4}
                fill={COLOR_A.badge} opacity={valA > 0 ? 1 : 0.3} />
              <text x={bp.x} y={bp.y - (valsB ? BH + 1 : BH / 2) + BH * 0.72}
                textAnchor="middle" fill={COLOR_A.text} fontSize={9} fontWeight="900" fontFamily="system-ui,sans-serif">
                {valA || '–'}
              </text>
              {/* Badge jugador B */}
              {valsB && <>
                <rect x={bp.x - BW / 2} y={bp.y + 1} width={BW} height={BH} rx={4}
                  fill={COLOR_B.badge} opacity={(valB ?? 0) > 0 ? 1 : 0.3} />
                <text x={bp.x} y={bp.y + 1 + BH * 0.72}
                  textAnchor="middle" fill={COLOR_B.text} fontSize={9} fontWeight="900" fontFamily="system-ui,sans-serif">
                  {(valB ?? 0) > 0 ? valB : '–'}
                </text>
              </>}
              {/* Etiqueta atributo */}
              <text x={lp.x} y={lp.y} textAnchor={ta}
                fill="#94a3b8" fontSize={10} fontWeight="700" fontFamily="system-ui,sans-serif">
                {multi ? (
                  <>
                    <tspan x={lp.x} dy={dy0(a, true)}>{words[0]}</tspan>
                    <tspan x={lp.x} dy="1.15em">{words.slice(1).join(' ')}</tspan>
                  </>
                ) : (
                  <tspan dy={dy0(a, false)}>{attr.label}</tspan>
                )}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── Barra de duelo por atributo ──────────────────────────────────────────────

function DuelBar({ label, valA, valB }: { label: string; valA: number; valB: number; key?: string }) {
  const pctA = Math.round((valA / 5) * 100);
  const pctB = Math.round((valB / 5) * 100);
  const winA = pctA > pctB;
  const winB = pctB > pctA;

  return (
    <div className="grid grid-cols-[1fr_110px_1fr] items-center gap-2 py-1">
      {/* Lado A */}
      <div className="flex items-center gap-2 justify-end">
        <span className={cn('text-[11px] font-black tabular-nums w-7 text-right', winA ? 'text-blue-400' : 'text-slate-500')}>
          {pctA}
        </span>
        <div className="w-full max-w-[140px] h-2.5 bg-slate-800/80 rounded-full overflow-hidden flex justify-end">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pctA}%`,
              background: winA
                ? `linear-gradient(to left, ${COLOR_A.stroke}, #3b82f6)`
                : `rgba(96,165,250,0.20)`,
              boxShadow: winA ? `0 0 10px ${COLOR_A.stroke}50` : 'none',
            }}
          />
        </div>
      </div>

      {/* Etiqueta central */}
      <span className="text-[9px] font-black text-slate-500 uppercase tracking-wide text-center leading-tight px-1">
        {label}
      </span>

      {/* Lado B */}
      <div className="flex items-center gap-2">
        <div className="w-full max-w-[140px] h-2.5 bg-slate-800/80 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pctB}%`,
              background: winB
                ? `linear-gradient(to right, ${COLOR_B.stroke}, #f43f5e)`
                : `rgba(251,113,133,0.20)`,
              boxShadow: winB ? `0 0 10px ${COLOR_B.stroke}50` : 'none',
            }}
          />
        </div>
        <span className={cn('text-[11px] font-black tabular-nums w-7', winB ? 'text-rose-400' : 'text-slate-500')}>
          {pctB}
        </span>
      </div>
    </div>
  );
}

// ── Sección de duelo por área ────────────────────────────────────────────────

function DuelSection({ area, playerA, playerB }: { area: GenericArea; playerA: Player; playerB: Player; key?: string }) {
  const getVal = (p: Player, field: string) =>
    Number((p as unknown as Record<string, unknown>)[field]) || 0;

  const winsA = area.attrs.filter(a => getVal(playerA, a.field) > getVal(playerB, a.field)).length;
  const winsB = area.attrs.filter(a => getVal(playerB, a.field) > getVal(playerA, a.field)).length;

  return (
    <div className="rounded-2xl border border-slate-800/50 overflow-hidden" style={{ background: '#0d1117' }}>
      {/* Header del área */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800/50"
        style={{ background: `${area.color}10` }}>
        <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: area.color }}>
          {area.label}
        </span>
        <div className="flex items-center gap-2 text-[10px] font-black">
          <span style={{ color: COLOR_A.stroke }}>{winsA}W</span>
          <span className="text-slate-600">·</span>
          <span style={{ color: COLOR_B.stroke }}>{winsB}W</span>
        </div>
      </div>

      {/* Barras */}
      <div className="px-4 py-2 space-y-0.5">
        {area.attrs.map(attr => (
          <DuelBar
            key={attr.field}
            label={attr.label}
            valA={getVal(playerA, attr.field)}
            valB={getVal(playerB, attr.field)}
          />
        ))}
      </div>
    </div>
  );
}

// ── Comparativa de perfil ────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  NEW: 'Nuevo',
  PENDING_VALIDATION: 'Pendiente',
  VALIDATED: 'Validado',
  TRACKING: 'Seguimiento',
  INTERESTING: 'Interesante',
  VERY_INTERESTING: 'Muy interesante',
  PRIORITY: 'Prioritario',
  CONTACTED: 'Contactado',
  ON_TRIAL: 'A prueba',
  SIGNED: 'Fichado',
  DISCARDED: 'Descartado',
};

type ProfileFieldDef = {
  label: string;
  valA: string | number | undefined | null;
  valB: string | number | undefined | null;
  unit?: string;
  compareAs?: 'higher' | 'lower' | 'none';
  isRating?: boolean;
};

function ProfileRow({ label, valA, valB, unit = '', compareAs = 'none', isRating = false }: ProfileFieldDef & { key?: string }) {
  const numA = typeof valA === 'number' ? valA : undefined;
  const numB = typeof valB === 'number' ? valB : undefined;

  const winA =
    compareAs !== 'none' && numA !== undefined && numB !== undefined
      ? compareAs === 'higher' ? numA > numB : numA < numB
      : false;
  const winB =
    compareAs !== 'none' && numA !== undefined && numB !== undefined
      ? compareAs === 'higher' ? numB > numA : numB < numA
      : false;

  const fmt = (v: string | number | undefined | null) =>
    v !== undefined && v !== null && v !== '' ? `${v}${unit ? ` ${unit}` : ''}` : '—';

  const pctA = isRating && numA !== undefined ? Math.round((numA / 5) * 100) : 0;
  const pctB = isRating && numB !== undefined ? Math.round((numB / 5) * 100) : 0;

  return (
    <div className="grid grid-cols-[1fr_100px_1fr] items-center gap-2 py-1.5 border-b border-slate-800/25 last:border-0">
      {/* Valor A */}
      <div className="flex items-center gap-2 justify-end">
        {isRating && numA !== undefined && (
          <div className="w-14 h-1.5 bg-slate-800 rounded-full overflow-hidden flex justify-end">
            <div className="h-full rounded-full"
              style={{ width: `${pctA}%`, background: winA ? COLOR_A.stroke : 'rgba(96,165,250,0.25)' }} />
          </div>
        )}
        <span className={cn('text-[11px] font-black text-right', winA ? 'text-blue-400' : 'text-slate-400')}>
          {fmt(valA)}
        </span>
      </div>

      {/* Etiqueta */}
      <span className="text-[9px] font-black text-slate-500 uppercase tracking-wide text-center leading-tight">
        {label}
      </span>

      {/* Valor B */}
      <div className="flex items-center gap-2">
        <span className={cn('text-[11px] font-black', winB ? 'text-rose-400' : 'text-slate-400')}>
          {fmt(valB)}
        </span>
        {isRating && numB !== undefined && (
          <div className="w-14 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full rounded-full"
              style={{ width: `${pctB}%`, background: winB ? COLOR_B.stroke : 'rgba(251,113,133,0.25)' }} />
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileCompare({ playerA, playerB }: { playerA: Player; playerB: Player }) {
  const rows: ProfileFieldDef[] = [
    { label: 'Edad',         valA: playerA.calculated_age,                       valB: playerB.calculated_age,                       unit: 'años', compareAs: 'none' },
    { label: 'Año nac.',     valA: playerA.birth_year,                            valB: playerB.birth_year,                            compareAs: 'none' },
    { label: 'Estatura',     valA: playerA.approximate_height,                   valB: playerB.approximate_height,                   unit: 'cm',   compareAs: 'higher' },
    { label: 'Peso',         valA: playerA.approximate_weight ?? playerA.weight_kg, valB: playerB.approximate_weight ?? playerB.weight_kg, unit: 'kg', compareAs: 'none' },
    { label: 'Estado',       valA: STATUS_LABELS[playerA.status] ?? playerA.status, valB: STATUS_LABELS[playerB.status] ?? playerB.status, compareAs: 'none' },
    { label: 'Liga',         valA: playerA.league,                                valB: playerB.league,                                compareAs: 'none' },
    { label: 'Val. global',  valA: playerA.global_rating,                         valB: playerB.global_rating,                         compareAs: 'higher', isRating: true },
    { label: 'Potencial',    valA: playerA.potential_rating,                      valB: playerB.potential_rating,                      compareAs: 'higher', isRating: true },
    { label: 'Encaje club',  valA: playerA.rating_club_fit,                       valB: playerB.rating_club_fit,                       compareAs: 'higher', isRating: true },
  ];

  return (
    <div className="rounded-2xl border border-slate-800/50 overflow-hidden" style={{ background: '#0d1117' }}>
      <div className="px-5 py-3 border-b border-slate-800/50" style={{ background: 'rgba(255,255,255,0.03)' }}>
        <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">PERFIL</span>
      </div>
      <div className="px-5 py-2">
        {rows.map(row => <ProfileRow key={row.label} {...row} />)}
      </div>
    </div>
  );
}

// ── Dropdown selector de jugador ─────────────────────────────────────────────

function PlayerDropdown({
  label,
  color,
  players,
  selectedId,
  onSelect,
  excludeId,
}: {
  label: string;
  color: string;
  players: Player[];
  selectedId: string;
  onSelect: (id: string) => void;
  excludeId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(
    () => players.filter(p =>
      p.id !== excludeId &&
      p.full_name.toLowerCase().includes(search.toLowerCase())
    ),
    [players, search, excludeId],
  );
  const selected = players.find(p => p.id === selectedId);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Focus en search al abrir
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    else setSearch('');
  }, [open]);

  return (
    <div className="flex-1 min-w-0 space-y-1.5" ref={ref}>
      {/* Label */}
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
        <p className="text-[9px] font-black uppercase tracking-widest" style={{ color }}>{label}</p>
      </div>

      {/* Trigger */}
      <button
        onClick={() => setOpen(v => !v)}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-left',
          open
            ? 'border-slate-600 bg-slate-900'
            : 'border-slate-800 bg-slate-900/60 hover:border-slate-700',
        )}
        style={open ? { borderColor: `${color}50` } : {}}
      >
        {selected ? (
          <>
            {selected.avatar_url ? (
              <img src={selected.avatar_url} className="w-8 h-8 rounded-lg object-cover object-[center_20%] flex-shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm italic flex-shrink-0"
                style={{ background: `${color}22`, color }}>
                {selected.full_name[0]}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-white truncate leading-tight">{selected.full_name}</p>
              <p className="text-[9px] text-slate-500 font-bold leading-tight mt-0.5">
                {selected.main_position}{selected.club_name ? ` · ${selected.club_name}` : ''}
              </p>
            </div>
          </>
        ) : (
          <p className="flex-1 text-[11px] text-slate-500 italic">Seleccionar jugador…</p>
        )}
        <div className="flex items-center gap-1 flex-shrink-0">
          {selected && (
            <span
              className="p-0.5 rounded text-slate-600 hover:text-slate-400 transition-colors"
              onClick={e => { e.stopPropagation(); onSelect(''); }}
            >
              <X size={11} />
            </span>
          )}
          <ChevronDown size={14} className={cn('text-slate-500 transition-transform', open && 'rotate-180')} />
        </div>
      </button>

      {/* Panel desplegable */}
      {open && (
        <div className="relative z-50">
          <div className="absolute top-1 left-0 right-0 rounded-xl border border-slate-700 shadow-2xl overflow-hidden"
            style={{ background: '#0f1623' }}>
            {/* Search */}
            <div className="p-2 border-b border-slate-800">
              <div className="relative">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input
                  ref={inputRef}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar jugador…"
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-800/80 rounded-lg text-[11px] text-white placeholder-slate-600 outline-none border border-transparent focus:border-slate-600 transition-colors"
                />
              </div>
            </div>

            {/* Lista */}
            <div className="max-h-52 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="text-center text-[11px] text-slate-600 italic py-4">Sin resultados</p>
              ) : (
                filtered.map(p => (
                  <button
                    key={p.id}
                    onClick={() => { onSelect(p.id); setOpen(false); }}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all border-b border-slate-800/50 last:border-0',
                      selectedId === p.id
                        ? 'bg-slate-800'
                        : 'hover:bg-slate-800/60',
                    )}
                  >
                    {p.avatar_url ? (
                      <img src={p.avatar_url} className="w-7 h-7 rounded-lg object-cover object-[center_20%] flex-shrink-0" />
                    ) : (
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs italic flex-shrink-0"
                        style={{ background: `${color}22`, color }}>
                        {p.full_name[0]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-[11px] font-bold truncate leading-tight', selectedId === p.id ? 'text-white' : 'text-slate-300')}>
                        {p.full_name}
                      </p>
                      <p className="text-[9px] text-slate-500 truncate leading-tight">
                        {p.main_position}{p.club_name ? ` · ${p.club_name}` : ''}{p.calculated_age ? ` · ${p.calculated_age}a` : ''}
                      </p>
                    </div>
                    {selectedId === p.id && (
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tarjeta de jugador VS ────────────────────────────────────────────────────

function VSPlayerCard({ player, color, side }: { player: Player | null; color: string; side: 'left' | 'right' }) {
  if (!player) {
    return (
      <div className={cn('w-full flex-1 flex flex-col items-center justify-center py-6 rounded-2xl border border-dashed border-slate-800', side === 'right' && 'items-center')}>
        <p className="text-slate-600 text-xs font-bold italic">Sin jugador</p>
      </div>
    );
  }

  return (
    <div className={cn(
      'w-full flex-1 flex items-center justify-between gap-4 px-4 sm:px-5 py-4 rounded-2xl border transition-all',
      side === 'left' ? 'flex-row-reverse sm:flex-row-reverse' : 'flex-row',
    )}
      style={{ borderColor: `${color}30`, background: `${color}08` }}>
      {player.avatar_url ? (
        <img src={player.avatar_url}
          className="w-16 h-16 rounded-xl object-cover object-[center_20%] border-2 flex-shrink-0"
          style={{ borderColor: `${color}50` }}
        />
      ) : (
        <div className="w-16 h-16 rounded-xl flex items-center justify-center font-black text-2xl italic flex-shrink-0"
          style={{ background: `${color}18`, color, border: `2px solid ${color}40` }}>
          {player.full_name[0]}
        </div>
      )}
      <div className={cn(
        'min-w-0 flex-1 flex flex-col',
        side === 'left'
          ? 'text-right items-end pr-2 sm:pr-6 md:pr-8'
          : 'text-left items-start pl-2 sm:pl-6 md:pl-8',
      )}>
        <p className="max-w-full text-base md:text-lg font-black text-white uppercase italic tracking-tight leading-tight whitespace-normal break-words">
          {player.full_name}
        </p>
        <p className="text-[10px] font-black uppercase tracking-widest mt-0.5" style={{ color }}>
          {player.main_position}
        </p>
        {player.club_name && (
          <p className="max-w-full text-[10px] text-slate-500 font-semibold leading-tight whitespace-normal break-words">
            {player.club_name}
            {player.calculated_age ? ` · ${player.calculated_age} años` : ''}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Marcador global de victorias ─────────────────────────────────────────────

function GlobalScore({ playerA: pA, playerB: pB }: { playerA: Player; playerB: Player }) {
  let winsA = 0, winsB = 0;
  for (const area of Object.values(AREAS)) {
    for (const attr of area.attrs) {
      const vA = Number((pA as unknown as Record<string, unknown>)[attr.field]) || 0;
      const vB = Number((pB as unknown as Record<string, unknown>)[attr.field]) || 0;
      if (vA > vB) winsA++;
      else if (vB > vA) winsB++;
    }
  }
  const total = winsA + winsB;
  const pctA  = total ? Math.round((winsA / total) * 100) : 50;

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl px-5 py-4 space-y-3">
      <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-500">
        <span style={{ color: COLOR_A.stroke }}>{pA.full_name.split(' ')[0]}</span>
        <span>Dominio global · {winsA + winsB} atributos comparados</span>
        <span style={{ color: COLOR_B.stroke }}>{pB.full_name.split(' ')[0]}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xl font-black tabular-nums" style={{ color: COLOR_A.stroke }}>{pctA}%</span>
        <div className="flex-1 h-3 rounded-full overflow-hidden bg-slate-800 flex">
          <div className="h-full transition-all duration-700 rounded-l-full"
            style={{ width: `${pctA}%`, background: `linear-gradient(to right, #3b82f6, ${COLOR_A.stroke})` }} />
          <div className="h-full flex-1 transition-all duration-700 rounded-r-full"
            style={{ background: `linear-gradient(to right, ${COLOR_B.stroke}, #f43f5e)` }} />
        </div>
        <span className="text-xl font-black tabular-nums" style={{ color: COLOR_B.stroke }}>{100 - pctA}%</span>
      </div>
      <div className="flex justify-between text-[9px] font-black text-slate-600 uppercase">
        <span>{winsA} atrib. ganados</span>
        <span>{winsB} atrib. ganados</span>
      </div>
    </div>
  );
}

// ── Componentes de impresión ─────────────────────────────────────────────────

function PrintRadar({ area, playerA, playerB }: { area: GenericArea; playerA: Player; playerB: Player }) {
  const W = 340, H = 300, cx = 170, cy = 148, R = 88, RINGS = 5;
  const BADGE_R = R + 18, LABEL_R = R + 44;
  const n = area.attrs.length;
  const step = (2 * Math.PI) / n;
  const start = -Math.PI / 2;
  const pt = (a: number, r: number) => ({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
  const getVals = (p: Player) =>
    area.attrs.map(attr => {
      const raw = Number((p as unknown as Record<string, unknown>)[attr.field]) || 0;
      return { raw, norm: raw / 5 };
    });
  const valsA = getVals(playerA);
  const valsB = getVals(playerB);
  const polyPts = (vals: typeof valsA) =>
    vals.map((d, i) => {
      const a = start + i * step;
      return `${cx + d.norm * R * Math.cos(a)},${cy + d.norm * R * Math.sin(a)}`;
    }).join(' ');
  const anch = (a: number) => Math.cos(a) > 0.2 ? 'start' : Math.cos(a) < -0.2 ? 'end' : 'middle';

  return (
    <div className="cpdf-radar-card">
      <div className="cpdf-radar-header" style={{ borderLeft: `3px solid ${area.color}` }}>
        <span style={{ color: area.color }}>{area.label}</span>
        <div className="cpdf-radar-legend">
          <span style={{ color: '#60a5fa' }}>— {playerA.short_name || playerA.full_name.split(' ')[0]}</span>
          <span style={{ color: '#fb7185', marginLeft: '4mm' }}>- - {playerB.short_name || playerB.full_name.split(' ')[0]}</span>
        </div>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
        {Array.from({ length: RINGS }).map((_, ri) => (
          <circle key={ri} cx={cx} cy={cy} r={R * ((ri + 1) / RINGS)}
            fill={ri % 2 === 0 ? '#f0f4f2' : 'transparent'}
            stroke="#cdd9d5" strokeWidth={ri === RINGS - 1 ? 1.2 : 0.6} />
        ))}
        {area.attrs.map((_, i) => {
          const a = start + i * step, o = pt(a, R);
          return <line key={i} x1={cx} y1={cy} x2={o.x} y2={o.y} stroke="#cdd9d5" strokeWidth={0.8} />;
        })}
        {/* Polígono B */}
        <polygon points={polyPts(valsB)} fill="rgba(251,113,133,0.12)" stroke="#fb7185" strokeWidth={1.5} strokeDasharray="4 2" strokeLinejoin="round" />
        {/* Polígono A */}
        <polygon points={polyPts(valsA)} fill="rgba(96,165,250,0.15)" stroke="#60a5fa" strokeWidth={2} strokeLinejoin="round" />
        {/* Badges y etiquetas */}
        {area.attrs.map((attr, i) => {
          const a = start + i * step;
          const bp = pt(a, BADGE_R), lp = pt(a, LABEL_R);
          const ta = anch(a);
          const valA = valsA[i].raw, valB = valsB[i].raw;
          const BW = 18, BH = 10;
          return (
            <g key={i}>
              <rect x={bp.x - BW / 2} y={bp.y - BH - 1} width={BW} height={BH} rx={2} fill="#dbeafe" />
              <text x={bp.x} y={bp.y - 1 - BH * 0.25} textAnchor="middle" fill="#1d4ed8" fontSize={7} fontWeight="900">{valA || '–'}</text>
              <rect x={bp.x - BW / 2} y={bp.y + 1} width={BW} height={BH} rx={2} fill="#ffe4e6" />
              <text x={bp.x} y={bp.y + 1 + BH * 0.75} textAnchor="middle" fill="#be123c" fontSize={7} fontWeight="900">{valB || '–'}</text>
              <text x={lp.x} y={lp.y} textAnchor={ta} fill="#374151" fontSize={7.5} fontWeight="700">
                {attr.label.split(' ').length > 1 ? (
                  <>
                    <tspan x={lp.x} dy={Math.sin(a) < -0.3 ? '-0.6em' : '0em'}>{attr.label.split(' ')[0]}</tspan>
                    <tspan x={lp.x} dy="1.1em">{attr.label.split(' ').slice(1).join(' ')}</tspan>
                  </>
                ) : (
                  <tspan dy="-0.3em">{attr.label}</tspan>
                )}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function PrintDuelSection({ area, playerA, playerB }: { area: GenericArea; playerA: Player; playerB: Player }) {
  const getVal = (p: Player, field: string) =>
    Number((p as unknown as Record<string, unknown>)[field]) || 0;
  return (
    <div className="cpdf-duel-section">
      <div className="cpdf-duel-header" style={{ background: `${area.color}18`, borderLeft: `3px solid ${area.color}` }}>
        <span style={{ color: area.color, fontWeight: 900, fontSize: '7pt', letterSpacing: '0.15em', textTransform: 'uppercase' }}>{area.label}</span>
      </div>
      {area.attrs.map(attr => {
        const vA = getVal(playerA, attr.field);
        const vB = getVal(playerB, attr.field);
        const pA = Math.round((vA / 5) * 100);
        const pB = Math.round((vB / 5) * 100);
        const winA = pA > pB, winB = pB > pA;
        return (
          <div key={attr.field} className="cpdf-duel-row">
            <div className="cpdf-duel-a">
              <span style={{ color: winA ? '#1d4ed8' : '#6b7280', fontWeight: 900, fontSize: '7pt', minWidth: '18pt', textAlign: 'right' }}>{pA}</span>
              <div className="cpdf-bar-track" style={{ direction: 'rtl' }}>
                <div className="cpdf-bar-fill" style={{ width: `${pA}%`, background: winA ? '#60a5fa' : '#dbeafe' }} />
              </div>
            </div>
            <span className="cpdf-attr-label">{attr.label}</span>
            <div className="cpdf-duel-b">
              <div className="cpdf-bar-track">
                <div className="cpdf-bar-fill" style={{ width: `${pB}%`, background: winB ? '#fb7185' : '#ffe4e6' }} />
              </div>
              <span style={{ color: winB ? '#be123c' : '#6b7280', fontWeight: 900, fontSize: '7pt', minWidth: '18pt' }}>{pB}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface ComparePrintArticleProps {
  playerA: Player;
  playerB: Player;
  printType: 'barras' | 'radares';
  isGK: boolean;
}

function ComparePrintArticle({ playerA, playerB, printType, isGK }: ComparePrintArticleProps) {
  const date = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
  const nameA = playerA.short_name || playerA.full_name;
  const nameB = playerB.short_name || playerB.full_name;

  const allAreas = isGK
    ? [...Object.values(AREAS), ...Object.values(GK_AREAS)]
    : Object.values(AREAS);

  // Dominio global (todas las áreas relevantes)
  let winsA = 0, winsB = 0;
  for (const area of allAreas) {
    for (const attr of area.attrs) {
      const vA = Number((playerA as unknown as Record<string, unknown>)[attr.field]) || 0;
      const vB = Number((playerB as unknown as Record<string, unknown>)[attr.field]) || 0;
      if (vA > vB) winsA++;
      else if (vB > vA) winsB++;
    }
  }
  const total = winsA + winsB;
  const pctA = total ? Math.round((winsA / total) * 100) : 50;

  const STATUS_LABELS: Record<string, string> = {
    NEW: 'Nuevo', PENDING_VALIDATION: 'Pend. Validación', VALIDATED: 'Validado',
    TRACKING: 'Seguimiento', INTERESTING: 'Interesante', VERY_INTERESTING: 'Muy Interesante',
    PRIORITY: 'Prioritario', CONTACTED: 'Contactado', ON_TRIAL: 'A prueba',
    SIGNED: 'Fichado', DISCARDED: 'Descartado',
  };

  const profileRows = [
    { label: 'Edad',         vA: playerA.calculated_age ? `${playerA.calculated_age} años` : '—', vB: playerB.calculated_age ? `${playerB.calculated_age} años` : '—' },
    { label: 'Año Nac.',     vA: playerA.birth_year ?? '—', vB: playerB.birth_year ?? '—' },
    { label: 'Posición',     vA: playerA.main_position ?? '—', vB: playerB.main_position ?? '—' },
    { label: 'Club',         vA: playerA.club_name ?? '—', vB: playerB.club_name ?? '—' },
    { label: 'Liga',         vA: playerA.league ?? '—', vB: playerB.league ?? '—' },
    { label: 'Estado',       vA: STATUS_LABELS[playerA.status] ?? playerA.status ?? '—', vB: STATUS_LABELS[playerB.status] ?? playerB.status ?? '—' },
    { label: 'Val. Global',  vA: playerA.global_rating ?? '—', vB: playerB.global_rating ?? '—', highlight: true },
    { label: 'Potencial',    vA: playerA.potential_rating ?? '—', vB: playerB.potential_rating ?? '—', highlight: true },
  ];

  return (
    <article className="compare-pdf-report" aria-hidden="true">
      {/* Header */}
      <header className="cpdf-header">
        <div>
          <p className="cpdf-kicker">U.D. Santa Mariña · Análisis Comparativo</p>
          <h1 className="cpdf-title">INFORME DE ENFRENTAMIENTO</h1>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p className="cpdf-date">{date}</p>
          <span className="cpdf-confidential">CONFIDENCIAL</span>
        </div>
      </header>

      {/* VS Hero */}
      <div className="cpdf-vs-hero">
        {/* Jugador A */}
        <div className="cpdf-vs-player cpdf-vs-player-a">
          <div className="cpdf-vs-photo" style={{ borderColor: '#60a5fa' }}>
            {playerA.avatar_url
              ? <img src={playerA.avatar_url} alt={nameA} />
              : <span style={{ color: '#60a5fa', fontWeight: 900, fontSize: '18pt', fontStyle: 'italic' }}>{playerA.full_name[0]}</span>
            }
          </div>
          <div className="cpdf-vs-info cpdf-vs-info-a">
            <p className="cpdf-vs-pos" style={{ color: '#60a5fa' }}>{playerA.main_position}</p>
            <h2 className="cpdf-vs-name" style={{ color: '#1e3a8a' }}>{nameA.toUpperCase()}</h2>
            {playerA.club_name && <p className="cpdf-vs-club">{playerA.club_name}{playerA.calculated_age ? ` · ${playerA.calculated_age}a` : ''}</p>}
            {playerA.global_rating && (
              <div className="cpdf-vs-rating" style={{ background: '#1d4ed820', borderColor: '#60a5fa' }}>
                <span style={{ color: '#60a5fa' }}>GLOBAL</span>
                <strong style={{ color: '#1d4ed8' }}>{playerA.global_rating}</strong>
              </div>
            )}
          </div>
        </div>

        {/* VS central */}
        <div className="cpdf-vs-badge">VS</div>

        {/* Jugador B */}
        <div className="cpdf-vs-player cpdf-vs-player-b">
          <div className="cpdf-vs-info cpdf-vs-info-b">
            <p className="cpdf-vs-pos" style={{ color: '#fb7185' }}>{playerB.main_position}</p>
            <h2 className="cpdf-vs-name" style={{ color: '#881337' }}>{nameB.toUpperCase()}</h2>
            {playerB.club_name && <p className="cpdf-vs-club">{playerB.club_name}{playerB.calculated_age ? ` · ${playerB.calculated_age}a` : ''}</p>}
            {playerB.global_rating && (
              <div className="cpdf-vs-rating" style={{ background: '#be123c20', borderColor: '#fb7185' }}>
                <span style={{ color: '#fb7185' }}>GLOBAL</span>
                <strong style={{ color: '#be123c' }}>{playerB.global_rating}</strong>
              </div>
            )}
          </div>
          <div className="cpdf-vs-photo" style={{ borderColor: '#fb7185' }}>
            {playerB.avatar_url
              ? <img src={playerB.avatar_url} alt={nameB} />
              : <span style={{ color: '#fb7185', fontWeight: 900, fontSize: '18pt', fontStyle: 'italic' }}>{playerB.full_name[0]}</span>
            }
          </div>
        </div>
      </div>

      {/* Dominio global */}
      <div className="cpdf-dominio">
        <div className="cpdf-dominio-labels">
          <span style={{ color: '#1d4ed8' }}>{nameA.split(' ')[0]} · {winsA} victorias · {pctA}%</span>
          <span className="cpdf-dominio-title">DOMINIO GLOBAL · {total} ATRIBUTOS</span>
          <span style={{ color: '#be123c' }}>{100 - pctA}% · {winsB} victorias · {nameB.split(' ')[0]}</span>
        </div>
        <div className="cpdf-dominio-bar">
          <div style={{ width: `${pctA}%`, background: 'linear-gradient(to right, #3b82f6, #60a5fa)', height: '100%', borderRadius: '99px 0 0 99px' }} />
          <div style={{ flex: 1, background: 'linear-gradient(to right, #fb7185, #f43f5e)', height: '100%', borderRadius: '0 99px 99px 0' }} />
        </div>
      </div>

      {/* Tabla de perfil */}
      <div className="cpdf-profile">
        <div className="cpdf-profile-header">
          <span>PERFIL COMPARADO</span>
          <span style={{ color: '#60a5fa' }}>{nameA.split(' ')[0]}</span>
          <span style={{ color: '#be123c' }}>{nameB.split(' ')[0]}</span>
        </div>
        {profileRows.map(row => (
          <div key={row.label} className="cpdf-profile-row">
            <span className="cpdf-profile-label">{row.label}</span>
            <span className={`cpdf-profile-val ${row.highlight ? 'cpdf-val-highlight-a' : ''}`}>{String(row.vA)}</span>
            <span className={`cpdf-profile-val ${row.highlight ? 'cpdf-val-highlight-b' : ''}`}>{String(row.vB)}</span>
          </div>
        ))}
      </div>

      {/* Contenido: barras o radares */}
      {printType === 'barras' ? (
        <div className="cpdf-content">
          <div className="cpdf-content-title">
            <span>COMPARATIVA POR ÁREAS</span>
            <div className="cpdf-legend">
              <span style={{ color: '#1d4ed8' }}>■ {nameA.split(' ')[0]}</span>
              <span style={{ color: '#be123c', marginLeft: '5mm' }}>■ {nameB.split(' ')[0]}</span>
            </div>
          </div>
          <div className="cpdf-duel-grid">
            {Object.values(AREAS).map((area, i) => (
              <PrintDuelSection key={String(i)} area={area} playerA={playerA} playerB={playerB} />
            ))}
          </div>
          {isGK && (
            <>
              <div className="cpdf-content-title" style={{ marginTop: '4mm' }}>
                <span>ANÁLISIS ESPECÍFICO PORTERO</span>
                <div className="cpdf-legend">
                  <span style={{ color: '#1d4ed8' }}>■ {nameA.split(' ')[0]}</span>
                  <span style={{ color: '#be123c', marginLeft: '5mm' }}>■ {nameB.split(' ')[0]}</span>
                </div>
              </div>
              <div className="cpdf-duel-grid">
                {Object.values(GK_AREAS).map((area, i) => (
                  <PrintDuelSection key={String(i)} area={area} playerA={playerA} playerB={playerB} />
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="cpdf-content">
          <div className="cpdf-content-title">
            <span>RADARES COMPARATIVOS</span>
            <div className="cpdf-legend">
              <span style={{ color: '#1d4ed8' }}>— {nameA.split(' ')[0]}</span>
              <span style={{ color: '#be123c', marginLeft: '5mm' }}>- - {nameB.split(' ')[0]}</span>
            </div>
          </div>
          <div className="cpdf-radar-grid">
            {Object.values(AREAS).map((area, i) => (
              <PrintRadar key={String(i)} area={area} playerA={playerA} playerB={playerB} />
            ))}
          </div>
          {isGK && (
            <>
              <div className="cpdf-content-title" style={{ marginTop: '4mm' }}>
                <span>ANÁLISIS ESPECÍFICO PORTERO</span>
                <div className="cpdf-legend">
                  <span style={{ color: '#1d4ed8' }}>— {nameA.split(' ')[0]}</span>
                  <span style={{ color: '#be123c', marginLeft: '5mm' }}>- - {nameB.split(' ')[0]}</span>
                </div>
              </div>
              <div className="cpdf-radar-grid">
                {Object.values(GK_AREAS).map((area, i) => (
                  <PrintRadar key={String(i)} area={area} playerA={playerA} playerB={playerB} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <footer className="cpdf-footer">
        <span>U.D. Santa Mariña · Dpto. de Scouting</span>
        <span>Documento confidencial · {date}</span>
      </footer>
    </article>
  );
}

// ── Vista principal Comparativas VS ─────────────────────────────────────────

type Tab = 'radares' | 'duelo';

interface ComparativasProps {
  players: Player[];
  userRole?: string;
}

export function Comparativas({ players, userRole }: ComparativasProps) {
  const [idA, setIdA] = useState<string>(players[0]?.id ?? '');
  const [idB, setIdB] = useState<string>(players[1]?.id ?? '');
  const [tab, setTab] = useState<Tab>('duelo');
  const [filterCats, setFilterCats] = useState<string[]>([]);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [printType, setPrintType] = useState<'barras' | 'radares'>('barras');
  const [printReady, setPrintReady] = useState(false);
  const [gkOverride, setGkOverride] = useState(false);

  const canPrint = ['ADMIN', 'SUPERADMIN', 'COORD', 'COORD_F11', 'COORD_F8', 'PRESID'].includes(userRole || '');

  const handlePrint = () => {
    setShowPrintDialog(false);
    setPrintReady(true);
    requestAnimationFrame(() => {
      document.body.classList.add('printing-compare-report');
      window.print();
      document.body.classList.remove('printing-compare-report');
      setPrintReady(false);
    });
  };
  const getPlayerCategory = (player: Player) => calculateCategory(player.birth_year, player.birth_date);

  // Categorías únicas extraídas de los jugadores
  const categories = useMemo(() => {
    const cats = sortCategories([...new Set(players.map(getPlayerCategory).filter(Boolean))]);
    return cats as string[];
  }, [players]);

  // Jugadores filtrados por categoría
  const filteredPlayers = useMemo(
    () => filterCats.length ? players.filter(p => filterCats.includes(getPlayerCategory(p))) : players,
    [players, filterCats],
  );

  const playerA = useMemo(() => players.find(p => p.id === idA) ?? null, [players, idA]);
  const playerB = useMemo(() => players.find(p => p.id === idB) ?? null, [players, idB]);

  const isGKPlayer = (p: Player | null) => {
    const pos = (p?.main_position || '').toUpperCase().trim();
    return pos === 'POR' || pos === 'GK' || pos.startsWith('POR');
  };
  const autoIsGK = isGKPlayer(playerA) && isGKPlayer(playerB);
  const eitherIsGK = isGKPlayer(playerA) || isGKPlayer(playerB);
  const isGK = autoIsGK || gkOverride;

  // Si el jugador seleccionado no está en la categoría filtrada, deseleccionar
  const handleFilterCat = (cat: string) => {
    const nextCats = !cat
      ? []
      : filterCats.includes(cat)
        ? filterCats.filter(c => c !== cat)
        : filterCats.length < 2
          ? [...filterCats, cat]
          : [filterCats[1], cat];
    setFilterCats(nextCats);
    const fp = nextCats.length ? players.filter(p => nextCats.includes(getPlayerCategory(p))) : players;
    if (idA && !fp.find(p => p.id === idA)) setIdA('');
    if (idB && !fp.find(p => p.id === idB)) setIdB('');
  };

  if (!players.length) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-600 italic text-sm">No hay jugadores registrados.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Encabezado */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest italic">Análisis Visual</p>
          <h1 className="text-3xl md:text-4xl font-black text-white uppercase italic tracking-tighter leading-none mt-1">COMPARATIVAS</h1>
          <p className="text-[11px] text-slate-500 font-semibold mt-1">
            Selecciona dos jugadores y compara sus atributos en modo duelo.
          </p>
        </div>
        {canPrint && playerA && playerB && (
          <button
            onClick={() => setShowPrintDialog(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-emerald-500/40 text-slate-300 hover:text-white rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shrink-0"
          >
            <Printer size={14} />
            Imprimir
          </button>
        )}
      </div>

      {/* Panel de selección */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 space-y-4">

        {/* Filtro de categoría */}
        {categories.length > 0 && (
          <div className="space-y-2">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
              Filtrar por categoría
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleFilterCat('')}
                className={cn(
                  'px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all',
                  filterCats.length === 0
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700',
                )}
              >
                Todas
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => handleFilterCat(cat)}
                  className={cn(
                    'px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all',
                    filterCats.includes(cat)
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700',
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
            {filterCats.length > 0 && (
              <p className="text-[9px] text-slate-600 font-semibold">
                {filteredPlayers.length} jugador{filteredPlayers.length !== 1 ? 'es' : ''} en <span className="text-emerald-600">{filterCats.join(' + ')}</span>
              </p>
            )}
          </div>
        )}

        {/* Separador */}
        {categories.length > 0 && <div className="border-t border-slate-800/60" />}

        {/* Dropdowns de jugadores */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <PlayerDropdown
            label="Jugador A"
            color={COLOR_A.stroke}
            players={filteredPlayers}
            selectedId={idA}
            onSelect={setIdA}
            excludeId={idB}
          />
          <PlayerDropdown
            label="Jugador B"
            color={COLOR_B.stroke}
            players={filteredPlayers}
            selectedId={idB}
            onSelect={setIdB}
            excludeId={idA}
          />
        </div>
      </div>

      {/* Banner VS */}
      {playerA && playerB && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <VSPlayerCard player={playerA} color={COLOR_A.stroke} side="left" />

          {/* Escudo VS central */}
          <div className="flex flex-col items-center justify-center gap-1 flex-shrink-0 self-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center font-black text-lg italic text-white"
              style={{
                background: 'linear-gradient(135deg, #1e3a5f 0%, #4c0519 100%)',
                border: '2px solid #334155',
                boxShadow: '0 0 24px rgba(96,165,250,0.15), 0 0 24px rgba(251,113,133,0.15)',
              }}>
              VS
            </div>
          </div>

          <VSPlayerCard player={playerB} color={COLOR_B.stroke} side="right" />
        </div>
      )}

      {/* Marcador global */}
      {playerA && playerB && <GlobalScore playerA={playerA} playerB={playerB} />}

      {/* Tabs */}
      {playerA && playerB && (
        <>
          <div className="flex flex-wrap justify-center items-center gap-3">
            <div className="flex gap-2">
              <button
                onClick={() => setTab('duelo')}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all',
                  tab === 'duelo'
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-800 text-slate-400 hover:text-white',
                )}
              >
                <Swords size={13} />
                Duelo
              </button>
              <button
                onClick={() => setTab('radares')}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all',
                  tab === 'radares'
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-800 text-slate-400 hover:text-white',
                )}
              >
                <BarChart2 size={13} />
                Radares
              </button>
            </div>

            {/* Botón portero: auto-activo si ambos son POR, manual si no */}
            {(eitherIsGK || gkOverride) && (
              <button
                onClick={() => !autoIsGK && setGkOverride(v => !v)}
                title={autoIsGK ? 'Ambos jugadores son porteros — análisis GK activado' : (gkOverride ? 'Desactivar análisis de portero' : 'Activar análisis de portero')}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all border',
                  isGK
                    ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400 cursor-default'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-cyan-500/40 hover:text-cyan-400',
                  autoIsGK && 'cursor-default',
                )}
              >
                <span className={cn('w-2 h-2 rounded-full', isGK ? 'bg-cyan-400 animate-pulse' : 'bg-slate-600')} />
                {autoIsGK ? '● Porteros detectados' : (gkOverride ? '● Modo portero ON' : 'Activar portero')}
              </button>
            )}
            {/* Botón visible aunque ninguno sea GK, para activación manual */}
            {!eitherIsGK && (
              <button
                onClick={() => setGkOverride(v => !v)}
                title={gkOverride ? 'Desactivar análisis de portero' : 'Activar análisis específico de portero'}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all border',
                  gkOverride
                    ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400'
                    : 'bg-slate-800/50 border-slate-700/50 text-slate-600 hover:border-cyan-500/30 hover:text-slate-400',
                )}
              >
                <span className={cn('w-2 h-2 rounded-full', gkOverride ? 'bg-cyan-400 animate-pulse' : 'bg-slate-700')} />
                {gkOverride ? '● Modo portero ON' : 'Modo portero'}
              </button>
            )}
          </div>

          {/* Tab: Duelo por atributos */}
          {tab === 'duelo' && (
            <div className="space-y-4">
              {/* Leyenda */}
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                <div className="flex items-center justify-end gap-2 pr-4">
                  <div className="w-8 h-2.5 rounded-full" style={{ background: COLOR_A.stroke }} />
                  <span className="text-[11px] font-black text-slate-300">{playerA.full_name}</span>
                </div>
                <div className="w-14" />
                <div className="flex items-center justify-start gap-2 pl-4">
                  <div className="w-8 h-2.5 rounded-full" style={{ background: COLOR_B.stroke }} />
                  <span className="text-[11px] font-black text-slate-300">{playerB.full_name}</span>
                </div>
              </div>

              {/* Comparativa de perfil */}
              <ProfileCompare playerA={playerA} playerB={playerB} />

              {/* Columna encabezado fijo */}
              <div className="grid grid-cols-[1fr_110px_1fr] text-center mb-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-right pr-4" style={{ color: COLOR_A.stroke }}>
                  {playerA.full_name.split(' ')[0]}
                </span>
                <span />
                <span className="text-[9px] font-black uppercase tracking-widest text-left pl-4" style={{ color: COLOR_B.stroke }}>
                  {playerB.full_name.split(' ')[0]}
                </span>
              </div>

              {Object.values(AREAS).map((area, i) => (
                <DuelSection key={String(i)} area={area} playerA={playerA} playerB={playerB} />
              ))}
              {isGK && (
                <>
                  <div className="flex items-center gap-3 pt-2">
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full">
                      <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                      <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.25em]">Análisis específico de portero</span>
                    </div>
                  </div>
                  {Object.values(GK_AREAS).map((area, i) => (
                    <DuelSection key={`gk-${i}`} area={area} playerA={playerA} playerB={playerB} />
                  ))}
                </>
              )}
            </div>
          )}

          {/* Tab: Radares superpuestos */}
          {tab === 'radares' && (
            <div className="space-y-4">
              {/* Leyenda */}
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                <div className="flex items-center justify-end gap-2 pr-4">
                  <div className="w-8 h-[3px] rounded-full" style={{ background: COLOR_A.stroke }} />
                  <span className="text-[11px] font-black text-slate-300">{playerA.full_name}</span>
                </div>
                <div className="w-14" />
                <div className="flex items-center justify-start gap-2 pl-4">
                  <div className="w-8 h-0 border-t-2 border-dashed" style={{ borderColor: COLOR_B.stroke }} />
                  <span className="text-[11px] font-black text-slate-300">{playerB.full_name}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {Object.values(AREAS).map((area, i) => (
                  <CompareRadar key={String(i)} area={area} playerA={playerA} playerB={playerB} />
                ))}
              </div>
              {isGK && (
                <>
                  <div className="flex items-center gap-3 pt-2">
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full">
                      <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                      <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.25em]">Análisis específico de portero</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {Object.values(GK_AREAS).map((area, i) => (
                      <CompareRadar key={`gk-${i}`} area={area} playerA={playerA} playerB={playerB} />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* Estado: solo un jugador seleccionado */}
      {playerA && !playerB && (
        <div className="flex items-center justify-center py-12 rounded-2xl border border-dashed border-slate-800">
          <p className="text-slate-600 italic text-sm">Selecciona un segundo jugador para comparar.</p>
        </div>
      )}

      {/* Dialog de selección de tipo de impresión */}
      {showPrintDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowPrintDialog(false)} />
          <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Informe PDF</p>
                <h3 className="text-base font-black text-white mt-0.5">Tipo de gráfico</h3>
              </div>
              <button onClick={() => setShowPrintDialog(false)} className="text-slate-500 hover:text-white p-1.5 rounded-lg bg-slate-800 transition-colors">
                <X size={14} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-5">
              <button
                onClick={() => setPrintType('barras')}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-xl border transition-all',
                  printType === 'barras'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                    : 'border-slate-700 bg-slate-800/60 text-slate-400 hover:border-slate-600 hover:text-white',
                )}
              >
                <Swords size={22} />
                <span className="text-[10px] font-black uppercase tracking-wider">Barras</span>
                <span className="text-[8px] text-center opacity-60">Duelo atributo a atributo</span>
              </button>
              <button
                onClick={() => setPrintType('radares')}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-xl border transition-all',
                  printType === 'radares'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                    : 'border-slate-700 bg-slate-800/60 text-slate-400 hover:border-slate-600 hover:text-white',
                )}
              >
                <BarChart2 size={22} />
                <span className="text-[10px] font-black uppercase tracking-wider">Radares</span>
                <span className="text-[8px] text-center opacity-60">4 radares superpuestos</span>
              </button>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowPrintDialog(false)} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[11px] font-bold transition-colors">
                Cancelar
              </button>
              <button
                onClick={handlePrint}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[11px] font-black transition-all active:scale-95"
              >
                <Printer size={13} />
                Imprimir PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Artículo imprimible */}
      {canPrint && playerA && playerB && printReady && createPortal(
        <ComparePrintArticle playerA={playerA} playerB={playerB} printType={printType} isGK={isGK} />,
        document.body
      )}
    </div>
  );
}
