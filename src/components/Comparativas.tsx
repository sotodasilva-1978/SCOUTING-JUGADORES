/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Swords, BarChart2, ChevronDown, X } from 'lucide-react';
import { Player } from '../types';
import { cn } from '../lib/utils';

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

type AreaKey = keyof typeof AREAS;

const COLOR_A = { stroke: '#60a5fa', fill: 'rgba(96,165,250,0.28)',  badge: '#1e3a5f', text: '#93c5fd' };
const COLOR_B = { stroke: '#fb7185', fill: 'rgba(251,113,133,0.25)', badge: '#4c0519', text: '#fda4af' };

// ── Radar superpuesto ────────────────────────────────────────────────────────

function CompareRadar({ areaKey, playerA, playerB }: { areaKey: AreaKey; playerA: Player; playerB: Player | null; key?: string }) {
  const area = AREAS[areaKey];
  const W = 480, H = 520;
  const cx = W / 2, cy = H / 2 + 10;
  const R = 140, RINGS = 5;
  const n = area.attrs.length;
  const step  = (2 * Math.PI) / n;
  const start = -Math.PI / 2;

  const pt = (a: number, r: number) => ({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });

  const getVals = (p: Player) =>
    area.attrs.map(attr => {
      const raw = Number((p as unknown as Record<string, unknown>)[attr.field]) || 0;
      return { label: attr.label, norm: raw / 5, pct: Math.round((raw / 5) * 100) };
    });

  const valsA = getVals(playerA);
  const valsB = playerB ? getVals(playerB) : null;

  const polygon = (vals: typeof valsA) =>
    vals.map((d, i) => {
      const a = start + i * step;
      return `${cx + d.norm * R * Math.cos(a)},${cy + d.norm * R * Math.sin(a)}`;
    }).join(' ');

  const anchor = (a: number) =>
    Math.cos(a) > 0.25 ? 'start' : Math.cos(a) < -0.25 ? 'end' : 'middle';

  const labelRot = (a: number) => {
    let d = (a * 180) / Math.PI + 90;
    while (d > 180) d -= 360;
    while (d < -180) d += 360;
    if (d > 90) d -= 180;
    if (d < -90) d += 180;
    return d;
  };

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-800/30 shadow-2xl" style={{ background: '#0d1117' }}>
      <div className="text-center pt-5 pb-0 px-4">
        <p className="text-[9px] font-black uppercase tracking-[0.3em] italic mb-0.5" style={{ color: area.color }}>
          Radar de Atributos
        </p>
        <h5 className="text-lg font-black text-white uppercase italic tracking-tighter leading-none">
          {area.label}
        </h5>
      </div>

      <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="block">
        {Array.from({ length: RINGS }).map((_, ri) => (
          <circle key={ri} cx={cx} cy={cy} r={R * ((RINGS - ri) / RINGS)}
            fill={ri % 2 === 0 ? '#111827' : '#0d1117'} />
        ))}
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="#1f2937" strokeWidth={1} />
        {Array.from({ length: RINGS - 1 }).map((_, ri) => (
          <circle key={ri} cx={cx} cy={cy} r={R * ((ri + 1) / RINGS)}
            fill="none" stroke="#1f2937" strokeWidth={0.5} />
        ))}
        {valsA.map((_, i) => {
          const a = start + i * step, o = pt(a, R);
          return <line key={i} x1={cx} y1={cy} x2={o.x} y2={o.y} stroke="#374151" strokeWidth={1} />;
        })}

        {valsB && (
          <polygon points={polygon(valsB)}
            fill={COLOR_B.fill} stroke={COLOR_B.stroke}
            strokeWidth={2.5} strokeLinejoin="round" strokeDasharray="6 3"
          />
        )}
        <polygon points={polygon(valsA)}
          fill={COLOR_A.fill} stroke={COLOR_A.stroke}
          strokeWidth={2.5} strokeLinejoin="round"
        />

        {valsA.map((dA, i) => {
          const a    = start + i * step;
          const dB   = valsB?.[i];
          const rot  = labelRot(a);
          const anch = anchor(a);
          const bpA  = pt(a, R + 16);
          const bpB  = pt(a, R + 34);
          const lp   = pt(a, valsB ? R + 56 : R + 44);
          const ws   = dA.label.split(' ');

          return (
            <g key={i}>
              <rect x={bpA.x - 13} y={bpA.y - 10} width={26} height={20} rx={3} fill={COLOR_A.badge} />
              <text x={bpA.x} y={bpA.y + 4} textAnchor="middle"
                fill={COLOR_A.text} fontSize={10} fontWeight="900" fontFamily="system-ui,sans-serif">
                {dA.pct}
              </text>
              {dB && (
                <>
                  <rect x={bpB.x - 13} y={bpB.y - 10} width={26} height={20} rx={3} fill={COLOR_B.badge} />
                  <text x={bpB.x} y={bpB.y + 4} textAnchor="middle"
                    fill={COLOR_B.text} fontSize={10} fontWeight="900" fontFamily="system-ui,sans-serif">
                    {dB.pct}
                  </text>
                </>
              )}
              {ws.length === 1 ? (
                <text x={lp.x} y={lp.y} textAnchor={anch} dominantBaseline="middle"
                  fill="#94a3b8" fontSize={9} fontWeight="700" fontFamily="system-ui,sans-serif"
                  transform={`rotate(${rot},${lp.x},${lp.y})`}>
                  {dA.label}
                </text>
              ) : (
                <text x={lp.x} y={lp.y} textAnchor={anch}
                  fill="#94a3b8" fontSize={9} fontWeight="700" fontFamily="system-ui,sans-serif"
                  transform={`rotate(${rot},${lp.x},${lp.y})`}>
                  <tspan x={lp.x} dy="-0.55em">{ws[0]}</tspan>
                  <tspan x={lp.x} dy="1.2em">{ws.slice(1).join(' ')}</tspan>
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <p className="text-center text-[8px] font-black text-slate-700 uppercase tracking-[0.2em] pb-4">
        Scouting Club · Escala 1-5
      </p>
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

function DuelSection({ areaKey, playerA, playerB }: { areaKey: AreaKey; playerA: Player; playerB: Player; key?: string }) {
  const area = AREAS[areaKey];

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
    { label: 'Encaje club',  valA: playerA.club_fit,                              valB: playerB.club_fit,                              compareAs: 'none' },
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
              <img src={selected.avatar_url} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
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
                      <img src={p.avatar_url} className="w-7 h-7 rounded-lg object-cover flex-shrink-0" />
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
      <div className={cn('flex-1 flex flex-col items-center justify-center py-6 rounded-2xl border border-dashed border-slate-800', side === 'right' && 'items-center')}>
        <p className="text-slate-600 text-xs font-bold italic">Sin jugador</p>
      </div>
    );
  }

  return (
    <div className={cn(
      'flex-1 flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all',
      side === 'right' && 'flex-row-reverse',
    )}
      style={{ borderColor: `${color}30`, background: `${color}08` }}>
      {player.avatar_url ? (
        <img src={player.avatar_url}
          className="w-16 h-16 rounded-xl object-cover border-2 flex-shrink-0"
          style={{ borderColor: `${color}50` }}
        />
      ) : (
        <div className="w-16 h-16 rounded-xl flex items-center justify-center font-black text-2xl italic flex-shrink-0"
          style={{ background: `${color}18`, color, border: `2px solid ${color}40` }}>
          {player.full_name[0]}
        </div>
      )}
      <div className={cn('min-w-0', side === 'right' && 'text-right')}>
        <p className="text-lg font-black text-white uppercase italic tracking-tight truncate leading-tight">
          {player.full_name}
        </p>
        <p className="text-[10px] font-black uppercase tracking-widest mt-0.5" style={{ color }}>
          {player.main_position}
        </p>
        {player.club_name && (
          <p className="text-[10px] text-slate-500 font-semibold truncate">
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

// ── Vista principal Comparativas VS ─────────────────────────────────────────

type Tab = 'radares' | 'duelo';

interface ComparativasProps {
  players: Player[];
}

export function Comparativas({ players }: ComparativasProps) {
  const [idA, setIdA] = useState<string>(players[0]?.id ?? '');
  const [idB, setIdB] = useState<string>(players[1]?.id ?? '');
  const [tab, setTab] = useState<Tab>('duelo');
  const [filterCat, setFilterCat] = useState<string>('');

  // Categorías únicas extraídas de los jugadores
  const categories = useMemo(() => {
    const cats = [...new Set(players.map(p => p.category_id).filter(Boolean))].sort();
    return cats as string[];
  }, [players]);

  // Jugadores filtrados por categoría
  const filteredPlayers = useMemo(
    () => filterCat ? players.filter(p => p.category_id === filterCat) : players,
    [players, filterCat],
  );

  const playerA = useMemo(() => players.find(p => p.id === idA) ?? null, [players, idA]);
  const playerB = useMemo(() => players.find(p => p.id === idB) ?? null, [players, idB]);

  // Si el jugador seleccionado no está en la categoría filtrada, deseleccionar
  const handleFilterCat = (cat: string) => {
    setFilterCat(cat);
    const fp = cat ? players.filter(p => p.category_id === cat) : players;
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
      <div>
        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest italic">Análisis Visual</p>
        <h1 className="text-3xl md:text-4xl font-black text-white uppercase italic tracking-tighter leading-none mt-1">COMPARATIVAS</h1>
        <p className="text-[11px] text-slate-500 font-semibold mt-1">
          Selecciona dos jugadores y compara sus atributos en modo duelo.
        </p>
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
                  filterCat === ''
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
                    filterCat === cat
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700',
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
            {filterCat && (
              <p className="text-[9px] text-slate-600 font-semibold">
                {filteredPlayers.length} jugador{filteredPlayers.length !== 1 ? 'es' : ''} en <span className="text-emerald-600">{filterCat}</span>
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
        <div className="flex items-stretch gap-3">
          <VSPlayerCard player={playerA} color={COLOR_A.stroke} side="left" />

          {/* Escudo VS central */}
          <div className="flex flex-col items-center justify-center gap-1 flex-shrink-0">
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

          {/* Tab: Duelo por atributos */}
          {tab === 'duelo' && (
            <div className="space-y-4">
              {/* Leyenda */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-2.5 rounded-full" style={{ background: COLOR_A.stroke }} />
                  <span className="text-[11px] font-black text-slate-300">{playerA.full_name}</span>
                </div>
                <div className="flex items-center gap-2">
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

              {(Object.keys(AREAS) as AreaKey[]).map(areaKey => (
                <DuelSection key={areaKey} areaKey={areaKey} playerA={playerA} playerB={playerB} />
              ))}
            </div>
          )}

          {/* Tab: Radares superpuestos */}
          {tab === 'radares' && (
            <div className="space-y-4">
              {/* Leyenda */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-[3px] rounded-full" style={{ background: COLOR_A.stroke }} />
                  <span className="text-[11px] font-black text-slate-300">{playerA.full_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-0 border-t-2 border-dashed" style={{ borderColor: COLOR_B.stroke }} />
                  <span className="text-[11px] font-black text-slate-300">{playerB.full_name}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {(Object.keys(AREAS) as AreaKey[]).map(areaKey => (
                  <CompareRadar key={areaKey} areaKey={areaKey} playerA={playerA} playerB={playerB} />
                ))}
              </div>
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
    </div>
  );
}
