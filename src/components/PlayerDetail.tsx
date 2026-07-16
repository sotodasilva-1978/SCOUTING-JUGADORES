import {
  ArrowLeft, User, Star, Video, ClipboardList, Shield, Edit3, Trash2,
  Calendar, Target, Zap, AlertCircle, ChevronRight, Plus, Trophy, Check,
  History, Settings, Fingerprint, Image as ImageIcon, CheckCircle2,
  TrendingUp, XCircle, Info, Ruler, Footprints, Hash, Eye, FastForward,
  MapPin, Briefcase, FileText, Scale, Gavel, MousePointer2, Loader2,
  LayoutDashboard, Smartphone, Monitor, Mic, Play, ExternalLink, Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Player, Report, Match, Video as VideoType, TrajectoryEntry, HistoryLog, ContactEntry } from '../types';
import { cn, formatRating, getStatusColor, calculateCategory, computeAge, getSportName } from '../lib/utils';
import React, { useMemo, useState, useRef, useEffect, ChangeEvent, FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { supabase, uploadPlayerPhoto } from '../lib/supabase';
import { findOrCreateClub } from '../lib/clubs';
import { formatClubFitDisplay } from '../lib/clubModel';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, 
  Radar, BarChart, Bar, XAxis, YAxis, Cell, Tooltip 
} from 'recharts';

function parseVideoEmbed(url: string): { embedUrl: string | null; platform: 'youtube' | 'vimeo' | 'other'; videoId: string | null } {
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return { embedUrl: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?rel=0`, platform: 'youtube', videoId: ytMatch[1] };
  const vimeoMatch = url.match(/(?:vimeo\.com\/(?:video\/)?|player\.vimeo\.com\/video\/)(\d+)/);
  if (vimeoMatch) return { embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}?dnt=1`, platform: 'vimeo', videoId: vimeoMatch[1] };
  return { embedUrl: null, platform: 'other', videoId: null };
}

function getVideoThumbnail(url: string): string | null {
  const { platform, videoId } = parseVideoEmbed(url);
  if (platform === 'youtube' && videoId) return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  return null;
}

const RATING_CATEGORIES = {
  fisicas: [
    { label: 'Velocid. desplazam.', field: 'rating_velo_despl', tooltip: 'Pura velocidad de carrera en distancias largas.' },
    { label: 'Aceleración', field: 'rating_acel', tooltip: 'Capacidad de alcanzar velocidad máxima en pocos metros.' },
    { label: 'Fuerza', field: 'rating_fuerza', tooltip: 'Poder muscular en choques y disputas.' },
    { label: 'Resistencia', field: 'rating_resis', tooltip: 'Capacidad de mantener intensidad los 90 min.' },
    { label: 'Agilidad', field: 'rating_agil', tooltip: 'Facilidad para cambios de dirección y giros.' },
    { label: 'Coordinación', field: 'rating_coord', tooltip: 'Armonía en movimientos complejos.' },
    { label: 'Velocid. reacción', field: 'rating_velo_reac', tooltip: 'Tiempo de respuesta ante estímulos externos.' },
    { label: 'Potencia', field: 'rating_poten', tooltip: 'Explosividad en salto o arrancada.' },
    { label: 'Recup. fatiga', field: 'rating_recup_fatiga', tooltip: 'Capacidad de volver al 100% tras esfuerzo.' },
    { label: 'Tendenc. lesiones', field: 'rating_tenden_lesion', tooltip: 'Historial o fragilidad física aparente.' },
  ],
  tecnicas: [
    { label: 'Pase corto', field: 'rating_pase_corto', tooltip: 'Precisión y tensión en pases cercanos.' },
    { label: 'Pase largo', field: 'rating_pase_largo', tooltip: 'Envío a distancia con precisión.' },
    { label: 'Control balón', field: 'rating_ctrl_balon', tooltip: 'Calidad del primer contacto.' },
    { label: 'Tiro', field: 'rating_tiro', tooltip: 'Finalización y golpeo a puerta.' },
    { label: 'Regate', field: 'rating_regate', tooltip: 'Habilidad para desbordar en 1vs1.' },
    { label: 'Conducción', field: 'rating_conduc', tooltip: 'Progresión con balón pegado al pie.' },
    { label: 'Superf. contacto', field: 'rating_superf_cont', tooltip: 'Uso de diferentes partes del pie.' },
    { label: 'Despeje', field: 'rating_despeje', tooltip: 'Capacidad de alejar peligro de zona crítica.' },
    { label: 'Entrada', field: 'rating_entrada', tooltip: 'Robo de balón mediante tackle o carga.' },
    { label: 'Pierna menos dom.', field: 'rating_pierna_menos', tooltip: 'Nivel con la pierna no natural.' },
  ],
  tacticas: [
    { label: 'Posicionamiento', field: 'rating_posic', tooltip: 'Ubicación correcta según fase del juego.' },
    { label: 'Cobertura', field: 'rating_cobertura', tooltip: 'Apoyo a compañeros desbordados.' },
    { label: 'Repliegue', field: 'rating_repliegue', tooltip: 'Velocidad en vuelta a fase defensiva.' },
    { label: 'Ayudas defens.', field: 'rating_ayuda_def', tooltip: 'Compromiso en tareas de recuperación.' },
    { label: 'Marcajes', field: 'rating_marcajes', tooltip: 'Control del rival directo asignado.' },
    { label: 'Dominio espacios', field: 'rating_dom_espacios', tooltip: 'Lectura de huecos libres.' },
    { label: 'Vigilancias', field: 'rating_vigilancias', tooltip: 'Atención a rivales alejados del balón.' },
    { label: 'Apoyos ofensivos', field: 'rating_apoyos_off', tooltip: 'Facilitar líneas de pase al poseedor.' },
    { label: 'Desmarques', field: 'rating_desmarques', tooltip: 'Ruptura o apoyo para recibir con ventaja.' },
    { label: 'Temporizaciones', field: 'rating_temporiz', tooltip: 'Aguantar al rival para permitir ayudas.' },
  ],
  cognitivas: [
    { label: 'Liderazgo', field: 'rating_liderazgo', tooltip: 'Influencia positiva sobre el grupo.' },
    { label: 'Carácter', field: 'rating_caracter', tooltip: 'Personalidad ante la adversidad.' },
    { label: 'Competitividad', field: 'rating_competitiv', tooltip: 'Deseo de ganar cada duelo.' },
    { label: 'Compañerismo', field: 'rating_companerismo', tooltip: 'Sacrificio por el bien común.' },
    { label: 'Mentalidad', field: 'rating_mentalidad', tooltip: 'Concentración y enfoque continuo.' },
    { label: 'Agresividad', field: 'rating_agresividad', tooltip: 'Intensidad física y mental legal.' },
    { label: 'Polivalencia', field: 'rating_polivalencia', tooltip: 'Adaptación a diferentes roles.' },
    { label: 'Inteligencia', field: 'rating_inteligencia', tooltip: 'Toma de decisiones acertadas.' },
    { label: 'Comunicación', field: 'rating_comunicacion', tooltip: 'Órdenes e información verbal al equipo.' },
    { label: 'Personalidad', field: 'rating_personalidad', tooltip: 'Atrevimiento y seguridad en sí mismo.' },
  ],
  especificas: [
    { label: 'Juego aéreo', field: 'rating_juego_aereo', tooltip: 'Dominio en duelos por alto.' }
  ]
};

// ── Atributos específicos de PORTERO (reusan campos existentes con etiqueta GK) ──
const GK_RATING_CATEGORIES = {
  bajo_palos: {
    label: 'BAJO PALOS',
    color: { header: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400', bar: 'bg-cyan-500', text: 'text-cyan-400' },
    attrs: [
      { label: 'Reflejos',            field: 'rating_velo_reac',  tooltip: 'Velocidad de reacción ante el disparo.' },
      { label: 'Agilidad bajo palos', field: 'rating_agil',       tooltip: 'Capacidad de desplazarse y cubrir el ángulo.' },
      { label: 'Colocación / posición', field: 'rating_posic',    tooltip: 'Posicionamiento óptimo según el peligro.' },
      { label: 'Potencia de salto',   field: 'rating_poten',      tooltip: 'Explosividad en el salto para cubrir el arco.' },
      { label: 'Coordinación',        field: 'rating_coord',      tooltip: 'Sincronía de cuerpo y manos en la parada.' },
    ],
  },
  con_balon: {
    label: 'CON EL BALÓN',
    color: { header: 'bg-blue-500/10 border-blue-500/20 text-blue-400', bar: 'bg-blue-500', text: 'text-blue-400' },
    attrs: [
      { label: 'Juego pie (corto)',     field: 'rating_pase_corto',    tooltip: 'Construcción en corto con el pie.' },
      { label: 'Saque largo / distrib.', field: 'rating_pase_largo',  tooltip: 'Precisión en envíos largos para iniciar jugada.' },
      { label: 'Control / amortiguación', field: 'rating_ctrl_balon', tooltip: 'Calidad del primer toque en balones en juego.' },
      { label: 'Despeje / puñetazo',   field: 'rating_despeje',       tooltip: 'Calidad del despeje bajo presión.' },
      { label: 'Pierna no dominante',  field: 'rating_pierna_menos',  tooltip: 'Pie contrario en situaciones de construcción.' },
    ],
  },
  salidas_aereo: {
    label: 'SALIDAS Y AÉREO',
    color: { header: 'bg-violet-500/10 border-violet-500/20 text-violet-400', bar: 'bg-violet-500', text: 'text-violet-400' },
    attrs: [
      { label: 'Dominio del área',    field: 'rating_juego_aereo',   tooltip: 'Reclamación segura de centros y balones divididos.' },
      { label: 'Lectura de salidas',  field: 'rating_dom_espacios',  tooltip: 'Capacidad de leer cuándo salir o quedarse.' },
      { label: 'Posición en 1vs1',    field: 'rating_marcajes',      tooltip: 'Posicionamiento ante remates en mano a mano.' },
      { label: 'Fortaleza en choques', field: 'rating_fuerza',       tooltip: 'Resistencia física en salidas con contacto.' },
      { label: 'Resistencia / concentración', field: 'rating_resis', tooltip: 'Mantener el nivel y foco los 90 minutos.' },
    ],
  },
  mental_liderazgo: {
    label: 'MENTAL Y LIDERAZGO',
    color: { header: 'bg-amber-500/10 border-amber-500/20 text-amber-400', bar: 'bg-amber-500', text: 'text-amber-400' },
    attrs: [
      { label: 'Liderazgo defensivo', field: 'rating_liderazgo',    tooltip: 'Capacidad de organizar y dirigir la línea defensiva.' },
      { label: 'Comunicación',        field: 'rating_comunicacion', tooltip: 'Órdenes verbales claras y constantes a la defensa.' },
      { label: 'Mentalidad / foco',   field: 'rating_mentalidad',   tooltip: 'Concentración y respuesta tras encajar un gol.' },
      { label: 'Competitividad',      field: 'rating_competitiv',   tooltip: 'Actitud ante la adversidad y situaciones de tensión.' },
      { label: 'Personalidad',        field: 'rating_personalidad', tooltip: 'Seguridad en sí mismo y presencia en el campo.' },
    ],
  },
} as const;

const POSITION_OPTIONS = [
  { value: 'POR', label: 'POR - Portero' },
  { value: 'DFC', label: 'DFC - Defensa Central' },
  { value: 'LD', label: 'LD - Lateral Derecho' },
  { value: 'LI', label: 'LI - Lateral Izquierdo' },
  { value: 'MCD', label: 'MCD - Mediocentro Defensivo' },
  { value: 'MC', label: 'MC - Mediocentro' },
  { value: 'MCO', label: 'MCO - Mediapunta' },
  { value: 'ED', label: 'ED - Extremo Derecho' },
  { value: 'EI', label: 'EI - Extremo Izquierdo' },
  { value: 'SD', label: 'SD - Segunda Delantero' },
  { value: 'DC', label: 'DC - Delantero Centro' },
];

const PLAYER_STATUS_OPTIONS = [
  { value: 'NEW', label: 'Nuevo' },
  { value: 'PENDING_VALIDATION', label: 'Pendiente Validación' },
  { value: 'VALIDATED', label: 'Validado' },
  { value: 'TRACKING', label: 'En Seguimiento' },
  { value: 'INTERESTING', label: 'Interesante' },
  { value: 'VERY_INTERESTING', label: 'Muy Interesante' },
  { value: 'PRIORITY', label: 'Prioridad' },
  { value: 'CONTACTED', label: 'Contactado' },
  { value: 'ON_TRIAL', label: 'En Prueba' },
  { value: 'SIGNED', label: 'Fichado' },
  { value: 'DISCARDED', label: 'Descartado' },
];

const CAREER_CATEGORY_OPTIONS = [
  'SENIOR',
  'JUVENIL',
  'CADETE',
  'INFANTIL',
  'ALEVIN',
  'BENJAMIN',
  'PRE-BENJAMIN',
];

type CareerFormData = {
  id?: string;
  club_id: string;
  new_club_name: string;
  season: string;
  team: string;
  category: string;
  competition: string;
  matches_played: number;
  minutes_played: number;
  goals: number;
  yellow_cards: number;
  red_cards: number;
};

const emptyCareerForm = (): CareerFormData => ({
  club_id: '', new_club_name: '', season: '', team: '', category: '', competition: '',
  matches_played: 0, minutes_played: 0, goals: 0, yellow_cards: 0, red_cards: 0,
});

type PosData = {
  top?: string; bottom?: string;
  left?: string; right?: string;
  centerX?: boolean; centerY?: boolean;
};

const POSITION_DATA: Record<string, PosData> = {
  DC:  { top: '13%',   left: '50%',  centerX: true               },
  ED:  { top: '23%',   right: '12%'                              },
  EI:  { top: '23%',   left: '12%'                               },
  SD:  { top: '28%',   left: '50%',  centerX: true               },
  MCO: { top: '38%',   left: '50%',  centerX: true               },
  MC:  { top: '50%',   left: '50%',  centerX: true, centerY: true },
  MCD: { top: '58%',   left: '50%',  centerX: true               },
  LD:  { bottom: '28%', right: '12%'                             },
  LI:  { bottom: '28%', left: '12%'                              },
  DFC: { bottom: '16%', left: '50%', centerX: true               },
  POR: { bottom: '5%',  left: '50%', centerX: true               },
};

const makeDotStyle = (pos: string) => {
  const p = POSITION_DATA[pos];
  if (!p) return {};
  const tx = p.centerX ? '-50%' : undefined;
  const ty = p.centerY ? '-50%' : undefined;
  const transform = [tx && `translateX(${tx})`, ty && `translateY(${ty})`]
    .filter(Boolean).join(' ') || undefined;
  return { top: p.top, bottom: p.bottom, left: p.left, right: p.right, transform };
};

function PitchMap({ position, secondaryPositions = [], className }: { position: string; secondaryPositions?: string[]; className?: string }) {
  return (
  <div
    className={cn("relative w-full max-w-[260px] mx-auto aspect-[68/100] overflow-hidden rounded-xl border border-emerald-400/25", className)}
    style={{ background: '#062d27', boxShadow: '0 24px 60px rgba(0,0,0,0.35), inset 0 0 35px rgba(16,185,129,0.08)' }}
  >
    <svg
      viewBox="0 0 680 1000"
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
      style={{ background: 'linear-gradient(to bottom, #0b4a3c 0%, #052b26 100%)' }}
    >
      {/* rayas de césped */}
      <rect width="68" height="1000" x="0"   fill="#ffffff" fillOpacity="0.025" />
      <rect width="68" height="1000" x="136" fill="#ffffff" fillOpacity="0.025" />
      <rect width="68" height="1000" x="272" fill="#ffffff" fillOpacity="0.025" />
      <rect width="68" height="1000" x="408" fill="#ffffff" fillOpacity="0.025" />
      <rect width="68" height="1000" x="544" fill="#ffffff" fillOpacity="0.025" />
      <g fill="none" stroke="#d9fff2" strokeOpacity="0.42" strokeWidth="4">
        <rect x="38" y="38" width="604" height="924" rx="10" />
        <path d="M38 500h604" />
        <circle cx="340" cy="500" r="92" />
        <circle cx="340" cy="500" r="5" fill="#d9fff2" />
        <path d="M205 38v150h270V38M265 38v62h150V38" />
        <path d="M205 962V812h270v150M265 962v-62h150v62" />
        <path d="M279 188a76 76 0 0 0 122 0M279 812a76 76 0 0 1 122 0" />
        <circle cx="340" cy="130" r="5" fill="#d9fff2" />
        <circle cx="340" cy="870" r="5" fill="#d9fff2" />
        <path d="M285 38V22h110v16M285 962v16h110v-16" />
      </g>
    </svg>

    {(secondaryPositions || []).filter(Boolean).map((pos, i) => (
      <div key={`${pos}-${i}`} className="absolute transition-all duration-500" style={makeDotStyle(pos)}>
        <div className="flex h-6 min-w-6 items-center justify-center rounded-full border border-amber-100 bg-amber-400 px-1 text-[8px] font-black leading-none text-slate-950 shadow-[0_0_12px_rgba(251,191,36,0.55)]">
          {pos}
        </div>
      </div>
    ))}

    <div className="absolute transition-all duration-500" style={makeDotStyle(position)}>
      <div className="relative flex h-8 min-w-8 items-center justify-center rounded-full border-2 border-white bg-rose-500 px-1.5 text-[8px] font-black leading-none text-white shadow-[0_0_0_3px_rgba(244,63,94,0.14),0_0_16px_rgba(244,63,94,0.7)]">
        {position}
        <span className="absolute inset-0 animate-ping rounded-full border border-rose-300 opacity-30" />
      </div>
    </div>
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-slate-950/35 to-transparent" />
  </div>
  );
}

function PrintableRadar({ title, attributes, player, color }: {
  title: string;
  attributes: readonly { label: string; field: string }[];
  player: Player;
  color: string;
}) {
  const cx = 150, cy = 148;
  const radius = 78;
  const labelR = 116;
  const n = attributes.length;
  const angle = (i: number) => -Math.PI / 2 + i * (Math.PI * 2 / n);
  const px = (i: number, r: number) => cx + Math.cos(angle(i)) * r;
  const py = (i: number, r: number) => cy + Math.sin(angle(i)) * r;
  const ring = (r: number) => attributes.map((_, i) => `${px(i,r)},${py(i,r)}`).join(' ');
  const values = attributes.map(a => Number(player[a.field as keyof Player]) || 0);
  const dataPolygon = values.map((v, i) => `${px(i, radius * v / 5)},${py(i, radius * v / 5)}`).join(' ');

  return (
    <div className="pdf-radar-card">
      <h4 style={{ color }}>{title}</h4>
      <div className="pdf-radar-body">
        <svg viewBox="0 0 300 300" aria-label={`Radar ${title}`}>
          {/* Rings */}
          {[1,2,3,4,5].map(lvl => (
            <polygon key={lvl} points={ring(radius * lvl / 5)}
              fill={lvl % 2 ? '#f5f9f7' : '#ffffff'} stroke="#dce8e3" strokeWidth="0.8" />
          ))}
          {/* Axis lines */}
          {attributes.map((_, i) => (
            <line key={i} x1={cx} y1={cy} x2={px(i,radius)} y2={py(i,radius)} stroke="#dce8e3" strokeWidth="0.8" />
          ))}
          {/* Data polygon */}
          <polygon points={dataPolygon} fill={`${color}28`} stroke={color} strokeWidth="2" />
          {/* Dots */}
          {values.map((v, i) => v
            ? <circle key={i} cx={px(i, radius*v/5)} cy={py(i, radius*v/5)} r="3.5" fill={color} />
            : null
          )}
          {/* Vertex labels: name above, value below (both anchored to vertex point) */}
          {attributes.map((attr, i) => {
            const a = angle(i);
            const lx = cx + Math.cos(a) * labelR;
            const ly = cy + Math.sin(a) * labelR;
            const cosA = Math.cos(a);
            const sinA = Math.sin(a);
            const anchor: 'start'|'end'|'middle' = cosA > 0.25 ? 'start' : cosA < -0.25 ? 'end' : 'middle';
            // push value away from center
            const valueOffset = sinA > 0.2 ? 9 : -9;
            return (
              <g key={attr.field}>
                <text x={lx} y={ly} textAnchor={anchor} fontSize="5.8" fontWeight="750" fill="#485650"
                  style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {attr.label}
                </text>
                <text x={lx} y={ly + valueOffset} textAnchor={anchor} fontSize="8.5" fontWeight="900" fill={color}>
                  {values[i] || '—'}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

interface PlayerDetailProps {
  player: Player;
  reports: Report[];
  matches: Match[];
  videos: VideoType[];
  history: HistoryLog[];
  onBack: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onCreateReport: (mode: 'RAPID' | 'COMPLETE') => void;
  onEditReport?: (report: Report) => void;
  onAddVideo: (video: { url: string; title: string; description?: string; is_key?: boolean }) => void;
  onDeleteVideo?: (videoId: string) => void;
  onUpdatePlayer?: (player: Player) => void;
  onAddFieldNote?: (text: string, score?: number) => void;
  onUpdateFieldNote?: (reportId: string, text: string, score?: number) => void;
  onDeleteFieldNote?: (reportId: string) => void;
  initialTab?: string;
  userRole?: string;
  userId?: string;
}

function SpeechToTextButton({ onTranscript, className }: { onTranscript: (text: string) => void; className?: string }) {
  const [isListening, setIsListening] = useState(false);

  const start = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert('Tu navegador no soporta reconocimiento de voz.'); return; }
    try {
      const r = new SR();
      r.lang = 'es-ES'; r.continuous = false; r.interimResults = false;
      r.onstart  = () => setIsListening(true);
      r.onend    = () => setIsListening(false);
      r.onerror  = () => setIsListening(false);
      r.onresult = (e: any) => onTranscript(e.results[0][0].transcript);
      r.start();
    } catch { setIsListening(false); }
  };

  return (
    <button type="button" onClick={start} title="Dictado por voz"
      className={cn(
        'p-2 rounded-lg transition-all flex items-center justify-center',
        isListening ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700',
        className
      )}>
      <Mic size={13} className={cn(isListening && 'animate-bounce')} />
    </button>
  );
}

interface ActionItem {
  id: string;
  date: string;
  typeLabel: string;
  note?: string;
  dotColor: string;
  badgeColor: string;
  deletable?: boolean;
  contactRef?: ContactEntry;
}

const CONTACT_TYPE_CONFIG: Record<string, { dot: string; badge: string }> = {
  'Primer contacto':     { dot: 'bg-blue-500',    badge: 'bg-blue-500/15 border-blue-500/30 text-blue-300' },
  'Segundo contacto':    { dot: 'bg-blue-400',    badge: 'bg-blue-500/15 border-blue-500/30 text-blue-300' },
  'Contacto con tutor':  { dot: 'bg-amber-500',   badge: 'bg-amber-500/15 border-amber-500/30 text-amber-300' },
  'Contacto con agente': { dot: 'bg-amber-400',   badge: 'bg-amber-500/15 border-amber-500/30 text-amber-300' },
  'Oferta formal':       { dot: 'bg-orange-500',  badge: 'bg-orange-500/15 border-orange-500/30 text-orange-300' },
  'Negociación':         { dot: 'bg-orange-400',  badge: 'bg-orange-500/15 border-orange-500/30 text-orange-300' },
  'Acuerdo':             { dot: 'bg-emerald-500', badge: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' },
  'Otro':                { dot: 'bg-slate-500',   badge: 'bg-slate-500/15 border-slate-500/30 text-slate-300' },
  'Cambio de decisión':  { dot: 'bg-violet-500',  badge: 'bg-violet-500/15 border-violet-500/30 text-violet-300' },
};

export function PlayerDetail({
  player,
  reports, 
  matches, 
  videos, 
  history, 
  onBack, 
  onDelete, 
  onEdit, 
  onCreateReport,
  onEditReport,
  onAddVideo,
  onDeleteVideo,
  onUpdatePlayer,
  onAddFieldNote,
  onUpdateFieldNote,
  onDeleteFieldNote,
  initialTab = 'resumen',
  userRole
}: PlayerDetailProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<Player>>({ ...player });
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAddVideoModal, setShowAddVideoModal] = useState(false);
  const [showCareerModal, setShowCareerModal] = useState(false);
  const [careerEntries, setCareerEntries] = useState<TrajectoryEntry[]>(player.trajectory || []);
  const [careerForm, setCareerForm] = useState<CareerFormData>(emptyCareerForm());
  const [careerClubs, setCareerClubs] = useState<{ id: string; name: string }[]>([]);
  const [savingCareer, setSavingCareer] = useState(false);
  const [careerError, setCareerError] = useState('');
  const [contacts, setContacts] = useState<ContactEntry[]>(player.contacts || []);
  const [newContactType, setNewContactType] = useState('Primer contacto');
  const [newContactNote, setNewContactNote] = useState('');
  const [savingContact, setSavingContact] = useState(false);
  const [contactError, setContactError] = useState('');
  const [showPrintSelector, setShowPrintSelector] = useState(false);
  const [printMode, setPrintMode] = useState<'summary' | 'scouting' | 'data' | 'profile' | 'complete'>('scouting');
  const [lightboxVideo, setLightboxVideo] = useState<VideoType | null>(null);
  const videoPlayerRef = useRef<HTMLDivElement>(null);
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [newVideoDesc, setNewVideoDesc] = useState('');
  const [newVideoIsKey, setNewVideoIsKey] = useState(false);
  const [videoUrlError, setVideoUrlError] = useState('');
  const [uploadPhase, setUploadPhase] = useState<'idle' | 'compressing' | 'uploading' | 'done' | 'error'>('idle');
  const [uploadError, setUploadError] = useState<string>('');
  const [riskSaving, setRiskSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const tabsScrollRef = useRef<HTMLDivElement>(null);

  // Scroll the active tab into view whenever it changes
  useEffect(() => {
    const el = tabsScrollRef.current;
    if (!el) return;
    const activeEl = el.querySelector<HTMLElement>('[data-active="true"]');
    if (activeEl) {
      const center = activeEl.offsetLeft - el.offsetWidth / 2 + activeEl.offsetWidth / 2;
      el.scrollTo({ left: center, behavior: 'smooth' });
    }
  }, [activeTab]);

  useEffect(() => {
    let cancelled = false;
    const loadCareerData = async () => {
      const [entriesResult, clubsResult, contactsResult] = await Promise.all([
        supabase.from('player_career_entries').select('*').eq('player_id', player.id).order('season', { ascending: false }),
        supabase.from('clubs').select('id,name').order('name'),
        supabase.from('player_contacts').select('*').eq('player_id', player.id).order('created_at', { ascending: true }),
      ]);
      if (cancelled) return;
      if (!entriesResult.error && entriesResult.data) {
        setCareerEntries(entriesResult.data.map((entry: any) => ({
          id: entry.id,
          player_id: entry.player_id,
          club_id: entry.club_id,
          club_name_snapshot: entry.club_name_snapshot,
          season: entry.season,
          team: entry.team_name,
          category: entry.category,
          competition: entry.competition,
          matches_played: entry.matches_played,
          minutes_played: entry.minutes_played,
          goals: entry.goals,
          yellow_cards: entry.yellow_cards,
          red_cards: entry.red_cards,
          created_at: entry.created_at,
          updated_at: entry.updated_at,
        })));
      }
      if (!clubsResult.error && clubsResult.data) setCareerClubs(clubsResult.data);
      if (!contactsResult.error && contactsResult.data) setContacts(contactsResult.data);
    };
    loadCareerData();
    return () => { cancelled = true; };
  }, [player.id]);

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    // Reset input para permitir subir la misma imagen de nuevo
    event.target.value = '';
    setUploadError('');

    setUploadPhase('compressing');
    try {
      const publicUrl = await uploadPlayerPhoto(
        player.id,
        file,
        (phase, detail) => {
          setUploadPhase(phase);
          if (phase === 'error' && detail) setUploadError(detail);
        },
        player.owner_club_id
      );

      if (publicUrl && onUpdatePlayer) {
        onUpdatePlayer({ ...player, avatar_url: publicUrl });
        setTimeout(() => setUploadPhase('idle'), 2000);
      } else if (!publicUrl) {
        setUploadPhase('error');
        setTimeout(() => setUploadPhase('idle'), 4000);
      }
    } catch (err: any) {
      const msg = err?.message || String(err);
      console.error('Error al subir foto:', msg);
      setUploadError(msg);
      setUploadPhase('error');
      setTimeout(() => setUploadPhase('idle'), 4000);
    }
  };

  const getTrafficLightColor = (status: string) => {
    switch (status) {
      case 'PRIORITY': return 'bg-emerald-500';
      case 'VERY_INTERESTING': return 'bg-emerald-400';
      case 'INTERESTING': return 'bg-amber-400';
      case 'TRACKING': return 'bg-amber-500';
      case 'VALIDATED': return 'bg-blue-500';
      case 'CONTACTED': return 'bg-purple-500';
      case 'ON_TRIAL': return 'bg-purple-600';
      case 'SIGNED': return 'bg-green-600';
      case 'DISCARDED': return 'bg-rose-500';
      case 'PENDING_VALIDATION': return 'bg-slate-600';
      case 'NEW': return 'bg-slate-500';
      default: return 'bg-slate-500';
    }
  };

  const getVerificationColor = (status?: string) => {
    switch (status) {
      case 'CONFIRMED': return 'text-emerald-500 bg-emerald-500/10';
      case 'APPROXIMATE': return 'text-amber-500 bg-amber-500/10';
      case 'PENDING': return 'text-blue-500 bg-blue-500/10';
      default: return 'text-slate-500 bg-slate-500/10';
    }
  };

  const getVerificationLabel = (status?: string) => {
    switch (status) {
      case 'CONFIRMED': return 'Confirmado';
      case 'APPROXIMATE': return 'Aproximado';
      case 'PENDING': return 'Pendiente';
      default: return 'No registrado';
    }
  };

  // Calcula la media de un grupo de campos (solo los que tienen valor > 0)
  const avgFields = (data: Partial<Player>, fields: (keyof Player)[]): number | undefined => {
    const vals = fields.map(f => Number(data[f]) || 0).filter(v => v > 0);
    if (vals.length === 0) return undefined;
    return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
  };

  // Las 4 áreas calculadas automáticamente desde los ratings de la Ficha Scouting
  const AREA_FIELDS = {
    physical:  ['rating_velo_despl','rating_acel','rating_fuerza','rating_resis','rating_agil','rating_coord','rating_velo_reac','rating_poten','rating_recup_fatiga','rating_tenden_lesion'] as (keyof Player)[],
    technical: ['rating_pase_corto','rating_pase_largo','rating_ctrl_balon','rating_tiro','rating_regate','rating_conduc','rating_superf_cont','rating_despeje','rating_entrada','rating_pierna_menos'] as (keyof Player)[],
    tactical:  ['rating_posic','rating_cobertura','rating_repliegue','rating_ayuda_def','rating_marcajes','rating_dom_espacios','rating_vigilancias','rating_apoyos_off','rating_desmarques','rating_temporiz'] as (keyof Player)[],
    mental:    ['rating_liderazgo','rating_caracter','rating_competitiv','rating_companerismo','rating_mentalidad','rating_agresividad','rating_polivalencia','rating_inteligencia','rating_comunicacion','rating_personalidad'] as (keyof Player)[],
  };

  // Valoración Global = media de las 4 áreas auto + 4 campos manuales
  const computeGlobalRating = (data: Partial<Player>): number | undefined => {
    const autoVals = [
      avgFields(data, AREA_FIELDS.physical),
      avgFields(data, AREA_FIELDS.technical),
      avgFields(data, AREA_FIELDS.tactical),
      avgFields(data, AREA_FIELDS.mental),
    ].filter((v): v is number => v !== undefined);
    const manualVals = (['rating_competitive','rating_decision_making','rating_pace','rating_intelligence'] as (keyof Player)[])
      .map(f => Number(data[f]) || 0).filter(v => v > 0);
    const all = [...autoVals, ...manualVals];
    if (all.length === 0) return undefined;
    return Math.round((all.reduce((a, b) => a + b, 0) / all.length) * 10) / 10;
  };

  const handleStatusChange = async (newStatus: string) => {
    setFormData(prev => ({ ...prev, status: newStatus as any }));
    if (!onUpdatePlayer) return;
    try {
      await onUpdatePlayer({ ...player, ...formData, status: newStatus as any });
    } catch {
      // revert on error
      setFormData(prev => ({ ...prev, status: player.status }));
    }
  };

  const handleSave = async () => {
    if (!onUpdatePlayer) return;
    setSaving(true);
    try {
      const computedGlobal = computeGlobalRating(formData);
      await onUpdatePlayer({
        ...player,
        ...formData,
        rating_physical:  avgFields(formData, AREA_FIELDS.physical)  ?? player.rating_physical,
        rating_technical: avgFields(formData, AREA_FIELDS.technical) ?? player.rating_technical,
        rating_tactical:  avgFields(formData, AREA_FIELDS.tactical)  ?? player.rating_tactical,
        rating_mental:    avgFields(formData, AREA_FIELDS.mental)    ?? player.rating_mental,
        global_rating:    computedGlobal ?? player.global_rating,
      });
      setEditMode(false);
    } finally {
      setSaving(false);
    }
  };

  const verificationOptions = [
    { value: 'CONFIRMED', label: 'Confirmado' },
    { value: 'APPROXIMATE', label: 'Aproximado' },
    { value: 'PENDING', label: 'Pendiente validar' },
    { value: 'NOT_REGISTERED', label: 'No registrado' },
  ];

  const renderDataField = (label: string, field: keyof Player, type: 'text' | 'number' | 'date' | 'select' = 'text', options?: {value: string, label: string}[], isArray = false) => {
    const value = formData[field];
    const status = formData.verification_status?.[field as string] || 'NOT_REGISTERED';
    
    return (
      <div className="bg-slate-900/30 border border-slate-800/50 rounded-2xl p-4 space-y-3 relative group">
        <div className="flex items-center justify-between">
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</label>
          {editMode ? (
            <select 
              value={status}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                verification_status: { 
                  ...(prev.verification_status || {}), 
                  [field as string]: e.target.value as any 
                }
              }))}
              className="text-[8px] font-black uppercase bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 outline-none focus:border-emerald-500/50"
            >
              {verificationOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          ) : (
            status !== 'NOT_REGISTERED' && (
              <span className={cn("text-[8px] font-black uppercase px-2 py-0.5 rounded", getVerificationColor(status))}>
                {getVerificationLabel(status)}
              </span>
            )
          )}
        </div>

        {editMode ? (
          type === 'select' ? (
            <select
              value={(value as string) || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, [field]: e.target.value }))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-500/50 appearance-none"
            >
              <option value="">Seleccionar...</option>
              {options?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          ) : (
            <input 
              type={type}
              value={isArray ? (value as string[] || []).join(', ') : (typeof value === 'string' || typeof value === 'number' ? value : '')}
              onChange={(e) => {
                const val = type === 'number' ? Number(e.target.value) : isArray ? e.target.value.split(',').map(s => s.trim()) : e.target.value;
                setFormData(prev => ({ ...prev, [field]: val }));
              }}
              placeholder="..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-500/50"
            />
          )
        ) : (
          <p className="text-sm font-bold text-slate-200 leading-snug break-words line-clamp-2">
            {isArray
              ? (value as string[] || []).join(', ') || '—'
              : type === 'select'
                ? (options?.find(o => o.value === (value as string))?.label ?? (value as string) ?? '—')
                : (value as string) || '—'}
          </p>
        )}
      </div>
    );
  };

  const renderRatingField = (label: string, field: keyof Player) => {
    const value = (formData[field] as number) || 0;
    return (
      <div className="bg-slate-900/30 border border-slate-800/50 rounded-2xl p-4 flex flex-col justify-between group">
        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">{label}</label>
        {editMode ? (
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setFormData(prev => ({ ...prev, [field]: star }))}
                className={cn(
                  "p-1 transition-all hover:scale-125",
                  star <= value ? "text-emerald-500" : "text-slate-700"
                )}
              >
                <Star size={16} fill={star <= value ? "currentColor" : "none"} />
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star 
                key={star} 
                size={14} 
                className={cn(star <= value ? "text-emerald-500 fill-current" : "text-slate-800")}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderPositionSelectField = (label: string, index: number) => {
    const value = (formData.secondary_positions || [])[index] || '';
    return (
      <div className="bg-slate-900/30 border border-slate-800/50 rounded-2xl p-4 space-y-3 relative group">
        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</label>
        {editMode ? (
          <select
            value={value}
            onChange={(e) => {
              const newPositions = [...(formData.secondary_positions || [])];
              newPositions[index] = e.target.value;
              while (newPositions.length > 0 && !newPositions[newPositions.length - 1]) newPositions.pop();
              setFormData(prev => ({ ...prev, secondary_positions: newPositions }));
            }}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-500/50 appearance-none"
          >
            <option value="">— Sin posición —</option>
            {POSITION_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        ) : (
          <p className="text-sm font-bold text-slate-200 truncate">{value || 'No registrado'}</p>
        )}
      </div>
    );
  };

  const renderTextAreaField = (label: string, field: keyof Player, placeholder?: string) => {
    const value = formData[field] as string;
    return (
      <div className="bg-slate-900/30 border border-slate-800/50 rounded-2xl p-6 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</label>
          {editMode && (
            <SpeechToTextButton
              onTranscript={(text) =>
                setFormData(prev => ({
                  ...prev,
                  [field]: prev[field] ? `${prev[field]} ${text}` : text,
                }))
              }
            />
          )}
        </div>
        {editMode ? (
          <textarea
            value={value || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, [field]: e.target.value }))}
            placeholder={placeholder || 'Completar análisis...'}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-emerald-500/50 min-h-[90px] resize-y"
          />
        ) : (
          <p className="text-sm text-slate-300 leading-relaxed italic">
            {value || 'Análisis pendiente de completar.'}
          </p>
        )}
      </div>
    );
  };

  const [tagDrafts, setTagDrafts] = useState<Record<string, string>>({});

  const renderTagListField = (label: string, field: 'strengths' | 'weaknesses', accentClass: string) => {
    const items = (formData[field] as string[]) || [];
    const draft = tagDrafts[field] || '';

    const addTag = () => {
      const value = draft.trim();
      if (!value) return;
      setFormData(prev => ({ ...prev, [field]: [...((prev[field] as string[]) || []), value] }));
      setTagDrafts(prev => ({ ...prev, [field]: '' }));
    };

    const removeTag = (index: number) => {
      setFormData(prev => ({ ...prev, [field]: ((prev[field] as string[]) || []).filter((_, i) => i !== index) }));
    };

    return (
      <div className="bg-slate-900/30 border border-slate-800/50 rounded-2xl p-6 space-y-3">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</label>
        {items.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {items.map((item, index) => (
              <div key={`${item}-${index}`} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold", accentClass)}>
                <span>{item}</span>
                {editMode && (
                  <button type="button" onClick={() => removeTag(index)} className="text-current opacity-60 hover:opacity-100 transition-opacity">
                    <XCircle size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500 italic">Sin registros todavía.</p>
        )}
        {editMode && (
          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={draft}
              onChange={(e) => setTagDrafts(prev => ({ ...prev, [field]: e.target.value }))}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
              placeholder="Añadir y pulsar Enter..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-500/50"
            />
            <button type="button" onClick={addTag} className="p-2 bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-all">
              <Plus size={14} />
            </button>
          </div>
        )}
      </div>
    );
  };

  const getRiskLabel = (risk?: string) => {
    switch (risk) {
      case 'HIGH': return { label: 'ALTO', color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' };
      case 'MEDIUM': return { label: 'MEDIO', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' };
      case 'LOW': return { label: 'BAJO', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' };
      default: return { label: 'N/A', color: 'text-slate-500 bg-slate-500/10 border-slate-500/20' };
    }
  };

  const tabs = [
    { id: 'resumen',    label: 'Resumen',          icon: Target },
    { id: 'ficha',      label: 'Ficha Scouting',   icon: LayoutDashboard },
    { id: 'datos',      label: 'Datos',             icon: Info },
    { id: 'perfil',     label: 'Perfil Futbol.',    icon: Zap },
    { id: 'informes',   label: 'Informes',          icon: ClipboardList },
    { id: 'partidos',   label: 'Partidos',          icon: Trophy },
    { id: 'multimedia', label: 'Multimedia',        icon: Video },
    { id: 'actividad',  label: 'Actividad',         icon: TrendingUp },
  ];

  const currentStatus = formData.status || player.status || 'TRACKING';
  const currentMainPosition = formData.main_position || player.main_position;
  const currentSecondaryPositions = formData.secondary_positions || player.secondary_positions || [];
  const printablePlayer = { ...player, ...formData } as Player;
  // Nombre deportivo: si short_name está relleno, usa ese. Si no, usa first_name + primer apellido.
  const displaySportName = getSportName(
    printablePlayer.first_name || '',
    printablePlayer.last_name || '',
    printablePlayer.short_name || ''
  ).toUpperCase();
  const canPrintReport = ['ADMIN', 'PRESID', 'COORD', 'COORD_F11', 'COORD_F8'].includes(userRole || '');
  const sortedReports = useMemo(() => (
    [...reports].sort((a, b) => {
      const aTime = new Date(a.report_date || a.created_at || 0).getTime();
      const bTime = new Date(b.report_date || b.created_at || 0).getTime();
      return bTime - aTime;
    })
  ), [reports]);

  const actionTimeline = useMemo<ActionItem[]>(() => {
    const events: ActionItem[] = [];
    reports.forEach(r => {
      const note = r.technical_comment || r.tactical_comment || r.physical_comment || r.mental_comment || r.recommendation || '';
      events.push({
        id: `report-${r.id}`,
        date: r.report_date || r.created_at || '',
        typeLabel: 'INFORME',
        note: note.length > 160 ? note.slice(0, 160) + '…' : note,
        dotColor: 'bg-emerald-500',
        badgeColor: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
      });
    });
    matches.forEach(m => {
      events.push({
        id: `match-${m.id}`,
        date: m.date || m.created_at || '',
        typeLabel: 'PARTIDO OBSERVADO',
        note: `${m.home_team} vs ${m.away_team}` + (m.competition ? ` · ${m.competition}` : '') + (m.score ? ` (${m.score})` : ''),
        dotColor: 'bg-blue-500',
        badgeColor: 'bg-blue-500/15 border-blue-500/30 text-blue-300',
      });
    });
    contacts.forEach(c => {
      const cfg = CONTACT_TYPE_CONFIG[c.contact_type] ?? CONTACT_TYPE_CONFIG['Otro'];
      events.push({
        id: `contact-${c.id}`,
        date: c.created_at || '',
        typeLabel: c.contact_type,
        note: c.note,
        dotColor: cfg.dot,
        badgeColor: cfg.badge,
        deletable: true,
        contactRef: c,
      });
    });
    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [reports, matches, contacts]);
  const latestReport = sortedReports[0];
  const reportStrengths = useMemo(() => (
    Array.from(new Set(sortedReports.flatMap((report) => report.strengths || []).map((item) => item.trim()).filter(Boolean)))
  ), [sortedReports]);
  const reportWeaknesses = useMemo(() => (
    Array.from(new Set(sortedReports.flatMap((report) => report.weaknesses || []).map((item) => item.trim()).filter(Boolean)))
  ), [sortedReports]);
  const latestReportNarrative = latestReport
    ? [
        latestReport.technical_comment,
        latestReport.tactical_comment,
        latestReport.physical_comment,
        latestReport.mental_comment,
      ].find((value) => value && value.trim())
    : undefined;
  const whyInterestedItems = useMemo(() => (
    [...sortedReports]
      .reverse()
      .map((report) => [
        report.technical_comment,
        report.tactical_comment,
        report.physical_comment,
        report.mental_comment,
      ].find((value) => value && value.trim())?.trim() || null)
      .filter(Boolean) as string[]
  ), [sortedReports]);
  const differentialTalentItems = useMemo(() => (
    [...sortedReports]
      .reverse()
      .map((report) => report.key_actions?.trim() || null)
      .filter(Boolean) as string[]
  ), [sortedReports]);
  const latestReportSummary = {
    whyInterested: printablePlayer.why_interested?.trim() || latestReport?.key_actions || undefined,
    mainStrength: (printablePlayer.strengths && printablePlayer.strengths.length > 0) ? printablePlayer.strengths.join(' · ') : undefined,
    mainDoubt: (printablePlayer.weaknesses && printablePlayer.weaknesses.length > 0) ? printablePlayer.weaknesses.join(' · ') : undefined,
    strengthsList: printablePlayer.strengths || [],
    weaknessesList: printablePlayer.weaknesses || [],
    differentialTalent: printablePlayer.differential_talent?.trim() || latestReport?.key_actions || undefined,
    nextStep: printablePlayer.next_step?.trim() || latestReport?.next_step || undefined,
  };
  const whyInterestedDisplayItems = latestReportSummary.whyInterested
    ? [latestReportSummary.whyInterested]
    : whyInterestedItems;
  const differentialTalentDisplayItems = latestReportSummary.differentialTalent
    ? [latestReportSummary.differentialTalent]
    : differentialTalentItems;
  const [newFieldNote, setNewFieldNote] = useState('');
  const [newFieldNoteScore, setNewFieldNoteScore] = useState(3);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState('');
  const [editingNoteScore, setEditingNoteScore] = useState(3);

  const handleSaveNewFieldNote = () => {
    const text = newFieldNote.trim();
    if (!text || !onAddFieldNote) return;
    onAddFieldNote(text, newFieldNoteScore);
    setNewFieldNote('');
    setNewFieldNoteScore(3);
  };

  const startEditingNote = (noteId: string, currentText: string, currentScore?: number) => {
    setEditingNoteId(noteId);
    setEditingNoteText(currentText);
    setEditingNoteScore(currentScore || 3);
  };

  const saveEditingNote = () => {
    if (!editingNoteId || !onUpdateFieldNote) return;
    onUpdateFieldNote(editingNoteId, editingNoteText, editingNoteScore);
    setEditingNoteId(null);
    setEditingNoteText('');
  };

  const fieldNotes = useMemo(() => (
    sortedReports
      .filter((report) => report.technical_comment?.trim())
      .map((report) => ({
        id: report.id,
        text: report.technical_comment!.trim(),
        score: report.match_rating,
        date: report.report_date || report.created_at,
      }))
  ), [sortedReports]);
  const renderSummaryTextStack = (
    items: string[],
    accentClass: string,
    emptyText: string,
    compact = false,
  ) => {
    if (!items.length) {
      return <p className="text-slate-400 text-sm italic">{emptyText}</p>;
    }

    return (
      <div className={cn("space-y-3", compact && "space-y-2")}>
        {items.map((item, index) => (
          <div
            key={`${index}-${item.slice(0, 20)}`}
            className={cn(
              "rounded-2xl border border-slate-800/70 bg-slate-950/35 px-4 py-3",
              compact ? "text-sm" : "text-[15px]"
            )}
          >
            <div className="flex items-start gap-3">
              <span className={cn("mt-1 h-8 w-1 rounded-full shrink-0", accentClass)} />
              <p className="text-slate-200 font-medium leading-relaxed">{item}</p>
            </div>
          </div>
        ))}
      </div>
    );
  };
  const handleRiskLevelChange = async (newRisk: Player['risk_level']) => {
    if (!onUpdatePlayer || !newRisk) return;
    setRiskSaving(true);
    setFormData((prev) => ({ ...prev, risk_level: newRisk }));
    try {
      await onUpdatePlayer({ ...player, ...formData, risk_level: newRisk });
    } catch {
      setFormData((prev) => ({ ...prev, risk_level: player.risk_level }));
    } finally {
      setRiskSaving(false);
    }
  };

  const handlePrintReport = (mode: 'summary' | 'scouting' | 'data' | 'profile' | 'complete') => {
    const cleanup = () => document.body.classList.remove('printing-player-report');
    setPrintMode(mode);
    setShowPrintSelector(false);
    document.body.classList.add('printing-player-report');
    window.addEventListener('afterprint', cleanup, { once: true });
    window.setTimeout(() => window.print(), 150);
  };

  const openCareerModal = (entry?: TrajectoryEntry) => {
    setCareerError('');
    setCareerForm(entry ? {
      id: entry.id,
      club_id: entry.club_id || '',
      new_club_name: '',
      season: entry.season,
      team: entry.team,
      category: entry.category,
      competition: entry.competition || '',
      matches_played: entry.matches_played || 0,
      minutes_played: entry.minutes_played ?? entry.minutes ?? 0,
      goals: entry.goals || 0,
      yellow_cards: entry.yellow_cards || 0,
      red_cards: entry.red_cards || 0,
    } : emptyCareerForm());
    setShowCareerModal(true);
  };

  const saveCareerEntry = async () => {
    if (!careerForm.season.trim() || !careerForm.team.trim() || !careerForm.category.trim() || !careerForm.competition.trim()) {
      setCareerError('Completa temporada, equipo, categoría y competición.');
      return;
    }
    if (!careerForm.club_id && !careerForm.new_club_name.trim()) {
      setCareerError('Selecciona un club o introduce uno nuevo.');
      return;
    }

    setSavingCareer(true);
    setCareerError('');
    try {
      let clubId = careerForm.club_id;
      let clubName = careerClubs.find(club => club.id === clubId)?.name || careerForm.new_club_name.trim();

      if (!clubId) {
        // Catálogo GLOBAL de clubes: busca (ignorando acentos/mayusculas/
        // puntuación) antes de crear, para no duplicar un club que ya exista
        // dado de alta por otro cliente.
        const club = await findOrCreateClub(clubName);
        if (!club) throw new Error('No se pudo crear el club.');
        clubId = club.id;
        clubName = club.name;
        if (!careerClubs.some(existing => existing.id === club.id)) {
          setCareerClubs(prev => [...prev, club as { id: string; name: string }].sort((a, b) => a.name.localeCompare(b.name)));
        }
      }

      const payload = {
        player_id: player.id,
        club_id: clubId,
        club_name_snapshot: clubName,
        season: careerForm.season.trim(),
        team_name: careerForm.team.trim(),
        category: careerForm.category.trim(),
        competition: careerForm.competition.trim(),
        matches_played: Number(careerForm.matches_played) || 0,
        minutes_played: Number(careerForm.minutes_played) || 0,
        goals: Number(careerForm.goals) || 0,
        yellow_cards: Number(careerForm.yellow_cards) || 0,
        red_cards: Number(careerForm.red_cards) || 0,
      };

      const query = careerForm.id
        ? supabase.from('player_career_entries').update(payload).eq('id', careerForm.id).select('*').single()
        : supabase.from('player_career_entries').insert(payload).select('*').single();
      const { data, error } = await query;
      if (error) throw error;

      const saved: TrajectoryEntry = {
        id: data.id, player_id: data.player_id, club_id: data.club_id, season: data.season,
        club_name_snapshot: data.club_name_snapshot,
        team: data.team_name, category: data.category, competition: data.competition,
        matches_played: data.matches_played, minutes_played: data.minutes_played, goals: data.goals,
        yellow_cards: data.yellow_cards, red_cards: data.red_cards,
      };
      setCareerEntries(prev => careerForm.id
        ? prev.map(entry => entry.id === careerForm.id ? saved : entry)
        : [saved, ...prev]);
      setShowCareerModal(false);
    } catch (error: any) {
      setCareerError(error?.message?.includes('player_career_entries')
        ? 'Falta crear la tabla en Supabase. Ejecuta player_career_entries_migration.sql.'
        : error?.message || 'No se pudo guardar la trayectoria.');
    } finally {
      setSavingCareer(false);
    }
  };

  const deleteCareerEntry = async (entry: TrajectoryEntry) => {
    if (!entry.id || !window.confirm(`¿Eliminar la temporada ${entry.season} de ${entry.team}?`)) return;
    const { error } = await supabase.from('player_career_entries').delete().eq('id', entry.id);
    if (!error) setCareerEntries(prev => prev.filter(item => item.id !== entry.id));
  };

  const saveContact = async () => {
    if (!newContactNote.trim()) {
      setContactError('La nota de contacto no puede estar vacía.');
      return;
    }
    setSavingContact(true);
    setContactError('');
    try {
      const payload = {
        player_id: player.id,
        contact_type: newContactType,
        note: newContactNote.trim(),
      };
      const { data, error } = await supabase.from('player_contacts').insert(payload).select('*').single();
      if (error) throw error;
      setContacts(prev => [data, ...prev]);
      setNewContactNote('');
      setNewContactType('Primer contacto');
    } catch (error: any) {
      setContactError(error?.message?.includes('player_contacts')
        ? 'Falta crear la tabla en Supabase. Ejecuta player_contacts_migration.sql.'
        : error?.message || 'No se pudo guardar el contacto.');
    } finally {
      setSavingContact(false);
    }
  };

  const deleteContact = async (contact: ContactEntry) => {
    if (!contact.id || !window.confirm(`¿Eliminar este contacto?`)) return;
    const { error } = await supabase.from('player_contacts').delete().eq('id', contact.id);
    if (!error) setContacts(prev => prev.filter(item => item.id !== contact.id));
  };

  const handleSaveDecision = async (value: string) => {
    if ((formData.decision_final ?? player.decision_final) === value) return;
    try {
      await supabase.from('players').update({ decision_final: value }).eq('id', player.id);
      setFormData(prev => ({ ...prev, decision_final: value }));
      const { data } = await supabase
        .from('player_contacts')
        .insert({ player_id: player.id, contact_type: 'Cambio de decisión', note: `Decisión del club marcada como: ${value}` })
        .select('*')
        .single();
      if (data) setContacts(prev => [...prev, data]);
    } catch (err) {
      console.error('Error saving decision:', err);
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* HEADER FIJO */}
      <div className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-xl border border-slate-800 rounded-3xl md:rounded-[2.5rem] p-4 md:p-6 shadow-2xl">
        <div className="flex flex-col xl:flex-row gap-6 items-start">
          <div className="flex items-center gap-4 md:gap-6 flex-1 min-w-0">
            <button 
              onClick={onBack}
              className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-slate-500 hover:text-white transition-all shadow-inner shrink-0"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="relative group/avatar shrink-0">
              <div
                className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-slate-800 border-2 border-slate-700 flex items-center justify-center font-black text-2xl md:text-3xl text-emerald-500 shadow-2xl overflow-hidden cursor-pointer"
                onClick={() => uploadPhase === 'idle' && fileInputRef.current?.click()}
                title="Haz clic para cambiar la foto"
              >
                {player.avatar_url ? (
                  <img src={player.avatar_url} alt={player.full_name} className="w-full h-full object-cover object-[center_20%]" />
                ) : (
                  <span>{player.full_name[0]}</span>
                )}
                {/* Overlay al hover */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center">
                  <ImageIcon size={20} className="text-white" />
                </div>
              </div>
              <div className={cn("absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-slate-950 shadow-lg", getTrafficLightColor(currentStatus))} />
            </div>
            <div className="space-y-1 min-w-0 flex-1 overflow-hidden">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex flex-col items-start gap-0.5">
                  <h1 className="text-base sm:text-xl md:text-2xl font-black text-white uppercase tracking-tight truncate max-w-full">
                    {getSportName(player.first_name, player.last_name, player.short_name)}
                  </h1>
                  <p className="text-xs sm:text-sm font-light text-slate-400 italic truncate max-w-full">
                    {player.full_name}
                  </p>
                </div>
                <div className={cn("px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-[0.15em] shadow-sm shrink-0 transition-colors", getStatusColor(currentStatus))}>
                   {PLAYER_STATUS_OPTIONS.find(o => o.value === currentStatus)?.label || currentStatus}
                </div>
              </div>
              <p className="text-xs sm:text-sm font-bold text-slate-400 truncate">
                <span className="text-emerald-500">{player.club_name}</span>
                <span className="mx-2 text-slate-700">·</span>
                <span className="uppercase text-slate-300">{calculateCategory(player.birth_year, player.birth_date)}</span>
                <span className="mx-2 text-slate-700">·</span>
                <span>{player.birth_year} ({player.calculated_age} años)</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-4 sm:flex sm:flex-wrap items-center gap-2 w-full xl:w-auto">
             {canPrintReport && (
               <button
                 onClick={() => setShowPrintSelector(true)}
                 title="Elegir contenido para imprimir o guardar como PDF"
                 className="col-span-2 sm:col-span-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-2.5 rounded-xl text-[9px] font-black hover:bg-emerald-500 hover:text-slate-950 transition-all flex items-center justify-center gap-1.5"
               >
                 <Printer size={14} /> IMPRIMIR
               </button>
             )}
             <button onClick={onEdit} className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-all flex items-center justify-center"><Edit3 size={16} /></button>
             
             {showDeleteConfirm ? (
                <div className="flex items-center gap-1 bg-rose-500 rounded-xl overflow-hidden shadow-lg animate-in zoom-in-95 duration-200">
                   <span className="px-3 py-2 text-[10px] font-black text-white uppercase tracking-widest whitespace-nowrap">¿Confirmar?</span>
                   <button 
                     onClick={onDelete}
                     className="px-4 py-2.5 bg-rose-700 text-white text-[10px] font-black hover:bg-rose-800 transition-all border-l border-rose-600/50"
                   >
                     SÍ, BORRAR
                   </button>
                   <button 
                     onClick={() => setShowDeleteConfirm(false)}
                     className="px-4 py-2.5 bg-slate-900 text-slate-400 text-[10px] font-black hover:text-white transition-all border-l border-rose-600/50"
                   >
                     NO
                   </button>
                </div>
             ) : (
                <button 
                  onClick={() => setShowDeleteConfirm(true)} 
                  className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-rose-500 hover:border-rose-500/30 transition-all"
                  title="Eliminar Jugador"
                >
                  <Trash2 size={16} />
                </button>
             )}

             <button onClick={() => onCreateReport('RAPID')} title="Informe Rápido de Campo" className="bg-slate-100 text-slate-950 px-3 py-2.5 rounded-xl text-[9px] font-black hover:bg-white transition-all flex items-center gap-1.5 shadow-lg">
                <Smartphone size={14} /> CAMPO
             </button>
             <button onClick={() => onCreateReport('COMPLETE')} title="Informe Detallado posteriori" className="bg-blue-600 text-white px-3 py-2.5 rounded-xl text-[9px] font-black hover:bg-blue-500 transition-all flex items-center gap-1.5 shadow-lg shadow-blue-900/20">
                <Monitor size={14} /> MÉTODO
             </button>
             <button onClick={() => setShowAddVideoModal(true)} className="bg-slate-900 border border-slate-800 text-purple-400 px-4 py-2.5 rounded-xl text-[10px] font-black hover:bg-purple-400/10 transition-all">
                VÍDEO
             </button>
             <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
             <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadPhase !== 'idle'}
                title="Subir foto del jugador (se comprime automáticamente)"
                className={cn(
                  "px-4 py-2.5 rounded-xl text-[10px] font-black transition-all flex items-center gap-2 border",
                  uploadPhase === 'idle' && "bg-slate-900 border-slate-800 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30",
                  (uploadPhase === 'compressing' || uploadPhase === 'uploading') && "bg-slate-900 border-slate-700 text-emerald-400 opacity-80 cursor-not-allowed",
                  uploadPhase === 'done' && "bg-emerald-500/10 border-emerald-500/40 text-emerald-400",
                  uploadPhase === 'error' && "bg-rose-500/10 border-rose-500/40 text-rose-400"
                )}
              >
                {uploadPhase === 'compressing' && (<><Loader2 className="w-3 h-3 animate-spin" />COMPRIMIENDO...</>)}
                {uploadPhase === 'uploading'   && (<><Loader2 className="w-3 h-3 animate-spin" />SUBIENDO...</>)}
                {uploadPhase === 'done'        && (<><CheckCircle2 className="w-3 h-3" />FOTO SUBIDA</>)}
                {uploadPhase === 'error'       && (<><XCircle className="w-3 h-3" /><span className="max-w-[160px] truncate" title={uploadError}>ERROR{uploadError ? `: ${uploadError}` : ''}</span></>)}
                {uploadPhase === 'idle'        && (<><ImageIcon className="w-3 h-3" />SUBIR FOTO</>)}
              </button>
          </div>
        </div>
      </div>

      {/* NAVEGACIÓN POR PESTAÑAS */}
      <div
        ref={tabsScrollRef}
        className="flex items-center gap-1 bg-slate-900/50 p-1.5 rounded-[1.5rem] border border-slate-800/50 overflow-x-auto"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent' }}
      >
        {tabs.map(tab => (
          <button
            key={tab.id}
            data-active={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-5 py-3 rounded-xl text-[10px] font-black transition-all whitespace-nowrap uppercase tracking-widest flex-shrink-0",
              activeTab === tab.id
                ? "bg-slate-800 text-emerald-500 shadow-md border border-slate-700"
                : "text-slate-500 hover:text-slate-300"
            )}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* CONTENIDO DINÁMICO */}
      <div className="min-h-[500px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'resumen' && (
              <div className="space-y-8">
                {/* Cabecera Resumen Ejecutivo */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] p-8 relative overflow-hidden shadow-xl">
                  <div className="hidden absolute top-0 right-0 p-8">
                     <div className="flex flex-col items-end gap-2">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Riesgo Captación</span>
                        <div className="flex items-center gap-2">
                          <select
                            value={formData.risk_level || player.risk_level || ''}
                            onChange={(e) => handleRiskLevelChange((e.target.value || undefined) as Player['risk_level'])}
                            disabled={!onUpdatePlayer || riskSaving}
                            className={cn(
                              "px-4 py-1.5 rounded-full text-xs font-black border bg-slate-950 outline-none transition-all",
                              getRiskLabel(formData.risk_level || player.risk_level).color,
                              (!onUpdatePlayer || riskSaving) && "opacity-70 cursor-not-allowed"
                            )}
                          >
                            <option value="">N/A</option>
                            <option value="LOW">BAJO</option>
                            <option value="MEDIUM">MEDIO</option>
                            <option value="HIGH">ALTO</option>
                          </select>
                          {riskSaving && <Loader2 size={14} className="text-emerald-400 animate-spin" />}
                        </div>
                     </div>
                  </div>
                  <div className="flex items-center gap-3 mb-8">
                     <Target size={24} className="text-emerald-500" />
                     <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Resumen</h2>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-8">
                     <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                           <div>
                              <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1 flex items-center gap-1"><Zap size={10}/> Fortaleza</p>
                              {latestReportSummary.strengthsList.length > 0 ? (
                                <ul className="space-y-1">
                                  {latestReportSummary.strengthsList.map((item, index) => (
                                    <li key={index} className="text-sm font-bold text-white flex items-start gap-2">
                                      <span className="text-emerald-500 mt-1.5 w-1 h-1 rounded-full bg-emerald-500 shrink-0" />
                                      <span>{item}</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-sm font-bold text-white">---</p>
                              )}
                           </div>
                           <div>
                              <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-1 flex items-center gap-1"><AlertCircle size={10}/> Duda</p>
                              {latestReportSummary.weaknessesList.length > 0 ? (
                                <ul className="space-y-1">
                                  {latestReportSummary.weaknessesList.map((item, index) => (
                                    <li key={index} className="text-sm font-bold text-white flex items-start gap-2">
                                      <span className="text-rose-500 mt-1.5 w-1 h-1 rounded-full bg-rose-500 shrink-0" />
                                      <span>{item}</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-sm font-bold text-white">---</p>
                              )}
                           </div>
                        </div>
                        <div>
                          <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-3">¿Por qué nos interesa?</h3>
                          {renderSummaryTextStack(
                            whyInterestedDisplayItems,
                            'bg-emerald-400',
                            'Sin texto vinculado en informes todavía.'
                          )}
                        </div>
                        <div className="pt-6 border-t border-slate-800/70">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-1.5 h-5 bg-amber-500 rounded-full" />
                            <h3 className="text-base font-black text-slate-100 italic tracking-tight uppercase">Notas de campo</h3>
                          </div>

                          {fieldNotes.length > 0 ? (
                            <div className="space-y-4">
                              {fieldNotes.map((note) => (
                                <div
                                  key={note.id}
                                  className="w-full bg-slate-950/35 border border-slate-800/80 p-5 rounded-[2rem] transition-all shadow-lg"
                                >
                                  <p className="text-[12px] text-slate-300 italic leading-relaxed mb-5">
                                    "{note.text}"
                                  </p>
                                  <div className="flex items-center justify-between">
                                    <div className="px-2 py-0.5 bg-slate-950 text-[9px] font-black text-amber-500 rounded-lg border border-slate-800 italic">
                                      SCORE: {note.score || 'N/A'}
                                    </div>
                                    <span className="text-[9px] font-black text-slate-600 uppercase tabular-nums">
                                      {note.date ? format(new Date(note.date), 'dd MMM yy', { locale: es }) : 'S/F'}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="rounded-[2rem] border border-dashed border-slate-800 bg-slate-950/20 p-6 text-center">
                              <p className="text-sm font-bold text-slate-500">Sin notas de campo registradas aún.</p>
                            </div>
                          )}
                        </div>
                     </div>
                     <div className="bg-blue-500/10 rounded-[2rem] p-7 border border-blue-500/20 space-y-6">
                        <div className="rounded-[1.75rem] border border-amber-400/20 bg-slate-950/35 p-6">
                           <div className="flex items-center gap-3 mb-4">
                             <div className="p-3 bg-amber-500/15 rounded-2xl text-amber-400 shrink-0"><Star size={20} /></div>
                             <p className="text-[10px] font-black text-amber-300 uppercase tracking-[0.22em]">Talento Diferencial</p>
                           </div>
                           <div>
                             {renderSummaryTextStack(
                               differentialTalentDisplayItems,
                               'bg-amber-400',
                               'Sin evidencia registrada en informes.',
                               true
                             )}
                           </div>
                        </div>
                        <div className="rounded-[1.75rem] border border-blue-400/20 bg-slate-950/30 p-6">
                           <div className="flex items-start gap-4">
                           <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400 shrink-0"><Shield size={20} /></div>
                           <div className="flex-1">
                              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Encaje en el Club</p>
                              <div className="mt-3 flex items-end gap-2">
                                <p className="text-[56px] leading-none font-black italic text-blue-400">
                                  {player.rating_club_fit != null ? formatRating(player.rating_club_fit) : '—'}
                                </p>
                                <p className="text-base font-black text-blue-200/50 mb-1">/5.0</p>
                              </div>
                              <p className="text-sm text-slate-200 font-bold mt-3">{formatClubFitDisplay(player)}</p>
                              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                                <div
                                  className="h-full rounded-full bg-blue-400"
                                  style={{ width: `${Math.max(0, Math.min(100, (Number(player.rating_club_fit) || 0) * 20))}%` }}
                                />
                              </div>
                           </div>
                           </div>
                        </div>
                        <div className="hidden pt-6 border-t border-blue-500/10">
                          <div className="rounded-[1.75rem] border border-slate-800/80 bg-slate-950/25 p-6 space-y-5">
                            <div>
                              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Riesgo Captación</p>
                              <div className="mt-3 flex items-center gap-2">
                                <select
                                  value={formData.risk_level || player.risk_level || ''}
                                  onChange={(e) => handleRiskLevelChange((e.target.value || undefined) as Player['risk_level'])}
                                  disabled={!onUpdatePlayer || riskSaving}
                                  className={cn(
                                    "px-4 py-1.5 rounded-full text-xs font-black border bg-slate-950 outline-none transition-all",
                                    getRiskLabel(formData.risk_level || player.risk_level).color,
                                    (!onUpdatePlayer || riskSaving) && "opacity-70 cursor-not-allowed"
                                  )}
                                >
                                  <option value="">N/A</option>
                                  <option value="LOW">BAJO</option>
                                  <option value="MEDIUM">MEDIO</option>
                                  <option value="HIGH">ALTO</option>
                                </select>
                                {riskSaving && <Loader2 size={14} className="text-emerald-400 animate-spin" />}
                              </div>
                            </div>
                            <div className="pt-5 border-t border-slate-800/70">
                              <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Próximo Paso</p>
                              <p className="text-lg font-black text-white italic mt-2 uppercase leading-snug break-words">{latestReportSummary.nextStep || 'OBSERVACIÓN'}</p>
                            </div>
                          </div>
                        </div>
                     </div>
                  </div>

                  <div className="mt-8 rounded-[2rem] border border-slate-800/80 bg-slate-950/25 p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6 items-start">
                      <div>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Riesgo Captación</p>
                        <div className="mt-3 flex items-center gap-2">
                          <select
                            value={formData.risk_level || player.risk_level || ''}
                            onChange={(e) => handleRiskLevelChange((e.target.value || undefined) as Player['risk_level'])}
                            disabled={!onUpdatePlayer || riskSaving}
                            className={cn(
                              "px-4 py-1.5 rounded-full text-xs font-black border bg-slate-950 outline-none transition-all",
                              getRiskLabel(formData.risk_level || player.risk_level).color,
                              (!onUpdatePlayer || riskSaving) && "opacity-70 cursor-not-allowed"
                            )}
                          >
                            <option value="">N/A</option>
                            <option value="LOW">BAJO</option>
                            <option value="MEDIUM">MEDIO</option>
                            <option value="HIGH">ALTO</option>
                          </select>
                          {riskSaving && <Loader2 size={14} className="text-emerald-400 animate-spin" />}
                        </div>
                      </div>
                      <div className="lg:border-l lg:border-slate-800/70 lg:pl-6">
                        <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Próximo Paso</p>
                        <p className="text-lg font-black text-white italic mt-2 uppercase leading-snug break-words">{latestReportSummary.nextStep || 'OBSERVACIÓN'}</p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {activeTab === 'ficha' && (
              <div className="space-y-8 animate-in fade-in duration-700">
                {/* BLOQUE SUPERIOR (Image 2 style) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                   {/* Columna Izquierda: Foto y Datos Generales */}
                   <div className="lg:col-span-2 space-y-6">
                      <div className="bg-slate-900/40 border border-slate-800/80 rounded-[2.5rem] p-8 flex flex-col md:flex-row gap-8 items-center md:items-start shadow-xl backdrop-blur-sm">
                         <div className="w-48 h-48 rounded-[2rem] bg-slate-800/50 border border-slate-700/50 overflow-hidden shrink-0 shadow-2xl group relative">
                            {player.avatar_url ? (
                              <img src={player.avatar_url} alt="" className="w-full h-full object-cover object-[center_20%] group-hover:scale-110 transition-transform duration-700" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-6xl font-black text-slate-700">{player.full_name[0]}</div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-4">
                               <span className="text-[10px] font-black text-white italic tracking-widest uppercase">PERFIL SCOUTING</span>
                            </div>
                         </div>
                         
                         <div className="flex-1 grid grid-cols-2 gap-x-8 gap-y-4 w-full">
                            {[
                              { label: 'NOMBRE DEPORTIVO', value: getSportName(player.first_name, player.last_name, player.short_name).toUpperCase() },
                              { label: 'CLUB', value: player.club_name },
                              { label: 'COMPETICIÓN', value: player.league || player.competition || 'No reg.' },
                              { label: 'POSICIÓN', value: player.main_position },
                              { label: 'LATERALIDAD', value: player.lateralidad || (player.dominant_foot === 'RIGHT' ? 'Diestro' : player.dominant_foot === 'LEFT' ? 'Zurdo' : player.dominant_foot === 'BOTH' ? 'Ambidiestro' : 'Desconocido') },
                              { label: 'NACIONALIDAD', value: player.nationality },
                              { label: 'FECHA NACIMIENTO', value: player.birth_date ? (() => { try { const d = new Date(player.birth_date!); return isNaN(d.getTime()) ? player.birth_date : format(d, 'dd/MM/yyyy'); } catch { return player.birth_date; } })() : player.birth_year },
                              { label: 'ALTURA', value: player.approximate_height ? `${player.approximate_height} CM` : '---' },
                              { label: 'PESO', value: player.weight_kg ? `${player.weight_kg} KG` : '---' },
                            ].map((item, i) => (
                              <div key={i} className="flex flex-col gap-1 border-b border-slate-800/50 pb-2 hover:border-emerald-500/30 transition-colors">
                                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest leading-none">{item.label}</span>
                                <span className="text-xs font-bold text-slate-200 uppercase leading-snug break-words line-clamp-2">{item.value || '---'}</span>
                              </div>
                            ))}
                         </div>
                      </div>

                      {/* ESTADO DEL JUGADOR */}
                      <div className="bg-slate-900/40 border border-slate-800/80 rounded-[2.5rem] p-8 shadow-xl backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-6">
                           <h3 className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.3em] italic">Estado Actual</h3>
                           <Target size={18} className="text-emerald-500/50" />
                        </div>
                        <select
                          value={currentStatus}
                          onChange={(e) => handleStatusChange(e.target.value)}
                          className="w-full bg-slate-950 border-2 border-slate-700 rounded-2xl px-4 py-4 text-sm font-bold text-white outline-none focus:border-emerald-500 appearance-none cursor-pointer hover:border-slate-600 transition-all"
                          style={{
                            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%2310b981' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 0.75rem center',
                            backgroundSize: '16px 12px',
                            paddingRight: '2.5rem'
                          }}
                        >
                          {PLAYER_STATUS_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>

                      {/* TRAYECTORIA TABLE (Image 2 style) */}
                      <div className="bg-slate-900/40 border border-slate-800/80 rounded-[2.5rem] p-8 shadow-xl backdrop-blur-sm overflow-hidden min-h-[300px]">
                        <div className="mb-8 flex items-start justify-between gap-3">
                           <div className="space-y-2">
                             <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em] bg-slate-950/80 px-6 py-2.5 rounded-full italic border border-slate-800">TRAYECTORIA</h3>
                             <p className="pl-1 text-[10px] uppercase tracking-[0.22em] text-slate-500">Haz clic en una fila para editarla</p>
                           </div>
                           <button onClick={() => openCareerModal()} className="flex items-center gap-2 rounded-xl bg-emerald-500 px-3 py-2 text-[9px] font-black uppercase text-slate-950 hover:bg-emerald-400"><Plus size={14} /> Añadir temporada</button>
                        </div>
                        <div className="overflow-x-auto no-scrollbar">
                           <table className="w-full text-[10px] font-bold text-slate-400">
                             <thead>
                               <tr className="bg-slate-950/60 text-emerald-500 border border-slate-800">
                                 <th className="px-3 py-3 text-left first:rounded-l-xl">TEMP</th>
                                 <th className="px-3 py-3 text-left">CLUB</th>
                                 <th className="px-3 py-3 text-left">EQUIPO</th>
                                 <th className="px-3 py-3 text-left">CATEG</th>
                                  <th className="px-3 py-3 text-left">COMPETICIÓN</th>
                                  <th className="px-3 py-3 text-center">PJ</th>
                                  <th className="px-3 py-3 text-center">MIN</th>
                                  <th className="px-3 py-3 text-center">GOL</th>
                                  <th className="px-3 py-3 text-center">TA</th>
                                  <th className="px-3 py-3 text-center">TR</th>
                                  <th className="px-3 py-3 text-center last:rounded-r-xl">ACCIONES</th>
                               </tr>
                             </thead>
                             <tbody className="divide-y divide-slate-800/50">
                               {careerEntries.length > 0 ? (
                                  careerEntries.map((t, i) => (
                                    <tr
                                      key={t.id || i}
                                      onClick={() => openCareerModal(t)}
                                      className="hover:bg-slate-800/20 transition-colors cursor-pointer"
                                    >
                                     <td className="px-3 py-3 whitespace-nowrap">{t.season}</td>
                                     <td className="px-3 py-3 text-white truncate max-w-[130px]">{t.club_name_snapshot || careerClubs.find(club => club.id === t.club_id)?.name || '—'}</td>
                                     <td className="px-3 py-3 text-white truncate max-w-[120px]">{t.team}</td>
                                     <td className="px-3 py-3 truncate max-w-[80px]">{t.category}</td>
                                      <td className="px-3 py-3 truncate max-w-[110px]">{t.competition || '—'}</td>
                                      <td className="px-3 py-3 text-center">{t.matches_played}</td>
                                      <td className="px-3 py-3 text-center">{t.minutes_played ?? t.minutes ?? 0}</td>
                                      <td className="px-3 py-3 text-center text-emerald-500">{t.goals}</td>
                                      <td className="px-3 py-3 text-center text-amber-500">{t.yellow_cards}</td>
                                      <td className="px-3 py-3 text-center text-red-500">{t.red_cards}</td>
                                      <td className="px-3 py-3">
                                        <div className="flex justify-center gap-1">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              openCareerModal(t);
                                            }}
                                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-800 hover:text-emerald-400"
                                            title="Editar"
                                          >
                                            <Edit3 size={13} />
                                          </button>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              deleteCareerEntry(t);
                                            }}
                                            className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-500/10 hover:text-rose-400"
                                            title="Eliminar"
                                          >
                                            <Trash2 size={13} />
                                          </button>
                                        </div>
                                      </td>
                                   </tr>
                                 ))
                               ) : (
                                 <tr>
                                    <td colSpan={11} className="px-3 py-16 text-center text-slate-600 italic tracking-widest uppercase text-[9px] font-black">Sin historial registrado</td>
                                 </tr>
                               )}
                             </tbody>
                           </table>
                        </div>
                      </div>
                   </div>

                   {/* Columna Derecha: Mapa del Campo (Image 2 style) */}
                   <div className="bg-slate-900/40 border border-slate-800/80 rounded-[1.75rem] p-6 md:p-8 shadow-xl backdrop-blur-sm flex flex-col gap-6 lg:sticky lg:top-[190px]">
                      <div className="flex items-center justify-between">
                         <h3 className="text-[11px] font-black text-emerald-500 uppercase tracking-widest italic font-sans">DEMARCACIÓN</h3>
                         <div className="p-2 bg-slate-950 rounded-lg border border-slate-800"><MapPin size={16} className="text-emerald-500" /></div>
                      </div>
                       <PitchMap position={currentMainPosition} secondaryPositions={currentSecondaryPositions} />
                       <div className="grid grid-cols-2 gap-2.5">
                          <div className="col-span-2 p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl shadow-inner flex flex-col items-center justify-center gap-1 text-center">
                            <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.7)] shrink-0" />
                            <div className="text-center">
                               <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest opacity-70">Principal</p>
                                <p className="text-sm font-black text-white italic tracking-tight">{currentMainPosition}</p>
                            </div>
                         </div>
                          {[0, 1].map((index) => {
                            const pos = currentSecondaryPositions.filter(Boolean)[index];
                            return (
                              <div key={index} className="min-w-0 p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl shadow-inner flex flex-col items-center justify-center gap-1 text-center">
                                <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", pos ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.7)]" : "bg-slate-700")} />
                                <div className="min-w-0 text-center">
                                  <p className={cn("text-[8px] font-black uppercase tracking-wider whitespace-nowrap", pos ? "text-amber-400" : "text-slate-600")}>{index + 2}ª Posición</p>
                                  <p className={cn("text-xs font-black italic tracking-tight truncate", pos ? "text-amber-300" : "text-slate-600")}>{pos || '—'}</p>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                   </div>
                </div>

                {/* BLOQUE INFERIOR (Image 1 style) */}
                <div className="bg-slate-900/40 border border-slate-800/80 rounded-[2.5rem] p-8 md:p-12 shadow-xl backdrop-blur-sm space-y-12">
                   <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="bg-slate-950/80 inline-flex px-10 py-3.5 rounded-full border border-slate-800 shadow-xl">
                         <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter italic font-sans flex items-center gap-4">
                            VALORACIÓN DE CARACTERÍSTICAS
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                         </h2>
                      </div>
                      <div className="flex items-center gap-4">
                         <div className="flex items-center gap-2 px-4 py-2 bg-slate-950 rounded-full border border-slate-800 shadow-inner">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Escala 1-5</span>
                         </div>
                      </div>
                   </div>

                   {/* ── BLOQUE ESPECÍFICO DE PORTERO ─────────────────── */}
                   {player.main_position === 'POR' && (
                     <div className="space-y-4">
                       <div className="flex items-center gap-3">
                         <div className="flex items-center gap-2 px-4 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full">
                           <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                           <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.25em]">Análisis específico de portero</span>
                         </div>
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                         {Object.entries(GK_RATING_CATEGORIES).map(([catId, cat]) => (
                           <div key={catId} className="bg-slate-950/60 rounded-3xl border border-slate-800/60 overflow-hidden">
                             <div className={cn('px-5 py-4 border-b', cat.color.header)}>
                               <h4 className={cn('text-[11px] font-black uppercase tracking-[0.25em] italic', cat.color.text)}>
                                 {cat.label}
                               </h4>
                             </div>
                             <div className="p-4 space-y-3">
                               {cat.attrs.map((attr, i) => {
                                 const val = Number(formData[attr.field as keyof Player]) || 0;
                                 return (
                                   <div key={i} className="space-y-1 group/row">
                                     <div className="flex items-start justify-between gap-2">
                                       <div className="relative group/tip flex-1 min-w-0 cursor-help">
                                         <span className="text-[10px] font-semibold text-slate-400 uppercase leading-tight group-hover/row:text-slate-200 transition-colors" style={{ wordBreak: 'break-word', hyphens: 'auto' }}>
                                           {attr.label}
                                         </span>
                                         <div className="absolute left-0 bottom-full mb-2 w-52 p-3 bg-slate-900 border border-slate-700 rounded-xl text-[9px] text-slate-300 invisible group-hover/tip:visible z-50 shadow-2xl leading-relaxed pointer-events-none">
                                           <div className={cn('font-black mb-1 uppercase tracking-widest text-[9px]', cat.color.text)}>{attr.label}</div>
                                           {attr.tooltip}
                                         </div>
                                       </div>
                                       <span className={cn(
                                         'text-sm font-black shrink-0 w-6 text-right tabular-nums',
                                         val === 0 ? 'text-slate-700' : val >= 4 ? cat.color.text : val >= 2 ? 'text-slate-300' : 'text-slate-500'
                                       )}>
                                         {val === 0 ? '—' : val}
                                       </span>
                                     </div>
                                     <div className="flex gap-0.5">
                                       {[1,2,3,4,5].map(v => (
                                         <div key={v} className={cn(
                                           'flex-1 h-1.5 rounded-full transition-all',
                                           val >= v ? cat.color.bar : 'bg-slate-800'
                                         )} />
                                       ))}
                                     </div>
                                   </div>
                                 );
                               })}
                             </div>
                           </div>
                         ))}
                       </div>
                     </div>
                   )}

                   <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
                      {Object.entries(RATING_CATEGORIES).map(([catId, attributes]) => {
                        const catColors: Record<string, { header: string; bar: string; text: string }> = {
                          fisicas:   { header: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400', bar: 'bg-emerald-500', text: 'text-emerald-400' },
                          tecnicas:  { header: 'bg-blue-500/10 border-blue-500/20 text-blue-400',         bar: 'bg-blue-500',    text: 'text-blue-400' },
                          tacticas:  { header: 'bg-violet-500/10 border-violet-500/20 text-violet-400',   bar: 'bg-violet-500',  text: 'text-violet-400' },
                          cognitivas:{ header: 'bg-amber-500/10 border-amber-500/20 text-amber-400',      bar: 'bg-amber-500',   text: 'text-amber-400' },
                          especificas:{ header: 'bg-rose-500/10 border-rose-500/20 text-rose-400',        bar: 'bg-rose-500',    text: 'text-rose-400' },
                        };
                        const c = catColors[catId] || catColors.fisicas;
                        return (
                        <div key={catId} className="bg-slate-950/60 rounded-3xl border border-slate-800/60 overflow-hidden">
                           <div className={cn("px-5 py-4 border-b", c.header)}>
                              <h4 className={cn("text-[11px] font-black uppercase tracking-[0.25em] italic", c.text)}>{catId}</h4>
                           </div>
                           <div className="p-4 space-y-3">
                              {attributes.map((attr, i) => {
                                const val = Number(formData[attr.field as keyof Player]) || 0;
                                return (
                                  <div key={i} className="space-y-1 group/row">
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="relative group/tip flex-1 min-w-0 cursor-help">
                                        <span className="text-[10px] font-semibold text-slate-400 uppercase leading-tight group-hover/row:text-slate-200 transition-colors" style={{ wordBreak: 'break-word', hyphens: 'auto' }}>
                                          {attr.label}
                                        </span>
                                        <div className="absolute left-0 bottom-full mb-2 w-52 p-3 bg-slate-900 border border-slate-700 rounded-xl text-[9px] text-slate-300 invisible group-hover/tip:visible z-50 shadow-2xl leading-relaxed pointer-events-none">
                                          <div className="text-white font-black mb-1 uppercase tracking-widest text-[9px]">{attr.label}</div>
                                          {(attr as any).tooltip}
                                        </div>
                                      </div>
                                      <span className={cn(
                                        "text-sm font-black shrink-0 w-6 text-right tabular-nums",
                                        val === 0 ? "text-slate-700" : val >= 4 ? c.text : val >= 2 ? "text-slate-300" : "text-slate-500"
                                      )}>
                                        {val === 0 ? '—' : val}
                                      </span>
                                    </div>
                                    <div className="flex gap-0.5">
                                      {[1,2,3,4,5].map(v => (
                                        <div key={v} className={cn(
                                          "flex-1 h-1.5 rounded-full transition-all",
                                          val >= v ? c.bar : "bg-slate-800"
                                        )} />
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}

                              {catId === 'especificas' && (player.custom_ratings || []).map((cr, idx) => (
                                <div key={`custom-${idx}`} className="space-y-1 group/row">
                                  <div className="flex items-start justify-between gap-2">
                                    <span className="text-[10px] font-semibold text-amber-400 uppercase leading-tight flex-1">{cr.label}</span>
                                    <span className="text-sm font-black shrink-0 w-6 text-right text-amber-400 tabular-nums">
                                      {cr.value === 0 ? '—' : cr.value}
                                    </span>
                                  </div>
                                  <div className="flex gap-0.5">
                                    {[1,2,3,4,5].map(v => (
                                      <div key={v} className={cn("flex-1 h-1.5 rounded-full transition-all", cr.value >= v ? "bg-amber-500" : "bg-slate-800")} />
                                    ))}
                                  </div>
                                </div>
                              ))}
                           </div>
                        </div>
                        );
                      })}
                   </div>

                   {/* ── Radares FBref por área ─────────────────────── */}
                   <div className="pt-16 border-t border-slate-800/50 space-y-6">
                     <div>
                       <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest italic">Radar de Atributos</p>
                       <h4 className="text-xl font-black text-white italic tracking-tighter uppercase">Perfil por Áreas</h4>
                     </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                       {(['fisicas','tecnicas','tacticas','cognitivas'] as const).map(catId => {
                         const areaMap = {
                           fisicas:    { label:'FÍSICAS',    color:'#10b981', fill:'rgba(16,185,129,0.20)',  badge:'#052e1e', text:'#6ee7b7' },
                           tecnicas:   { label:'TÉCNICAS',   color:'#60a5fa', fill:'rgba(96,165,250,0.20)',  badge:'#1e3a5f', text:'#93c5fd' },
                           tacticas:   { label:'TÁCTICAS',   color:'#a78bfa', fill:'rgba(167,139,250,0.20)', badge:'#2e1e5f', text:'#c4b5fd' },
                           cognitivas: { label:'COGNITIVAS', color:'#fbbf24', fill:'rgba(251,191,36,0.18)',  badge:'#3d2800', text:'#fde68a' },
                         } as const;
                         const area = areaMap[catId];
                         const attrs = RATING_CATEGORIES[catId];
                         const W=460, H=400, rcx=230, rcy=200, R=108, RINGS=5;
                         const BADGE_R=R+20, LABEL_R=R+52;
                         const n=attrs.length, step=(2*Math.PI)/n, start=-Math.PI/2;
                         const pt=(a:number,r:number)=>({x:rcx+r*Math.cos(a),y:rcy+r*Math.sin(a)});
                         const anch=(a:number)=>Math.cos(a)>0.2?'start':Math.cos(a)<-0.2?'end':'middle';
                         const dy0=(a:number,multi:boolean)=>multi?(Math.sin(a)<-0.3?'-0.6em':'0em'):'-0.35em';
                         const vals=attrs.map(attr=>{
                           const raw=Number(formData[attr.field as keyof Player])||0;
                           return {label:attr.label, raw, norm:raw/5};
                         });
                         const polygon=vals.map((d,i)=>{
                           const a=start+i*step;
                           return `${rcx+d.norm*R*Math.cos(a)},${rcy+d.norm*R*Math.sin(a)}`;
                         }).join(' ');
                         const BW=22, BH=13;
                         return (
                           <div key={catId} className="rounded-2xl border border-slate-700/30 shadow-xl" style={{background:'#080c14'}}>
                             <div className="px-5 pt-4 pb-2 flex items-center gap-2">
                               <div className="w-2 h-2 rounded-full" style={{background:area.color}}/>
                               <p className="text-[10px] font-black uppercase tracking-[0.3em]" style={{color:area.color}}>{area.label}</p>
                             </div>
                             <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="block">
                               {Array.from({length:RINGS}).map((_,ri)=>(
                                 <circle key={ri} cx={rcx} cy={rcy} r={R*((ri+1)/RINGS)}
                                   fill={ri%2===0?'#0b1422':'transparent'}
                                   stroke={ri===RINGS-1?'#1e3a5f':'#0e1e30'}
                                   strokeWidth={ri===RINGS-1?1.5:0.75}/>
                               ))}
                               {[1,2,3,4,5].map(v=>(
                                 <text key={v} x={rcx+3} y={rcy-R*(v/5)+3}
                                   fill="#1e3a5f" fontSize={7} fontWeight="900" fontFamily="system-ui,sans-serif">{v}</text>
                               ))}
                               {vals.map((_,i)=>{const a=start+i*step,o=pt(a,R);return<line key={i} x1={rcx} y1={rcy} x2={o.x} y2={o.y} stroke="#0e1e30" strokeWidth={1}/>;}) }
                               <polygon points={polygon} fill={area.fill} stroke="none"/>
                               <polygon points={polygon} fill="none" stroke={area.color} strokeWidth={2} strokeLinejoin="round"/>
                               {vals.map((d,i)=>{
                                 const a=start+i*step;
                                 return <circle key={i} cx={rcx+d.norm*R*Math.cos(a)} cy={rcy+d.norm*R*Math.sin(a)}
                                   r={3} fill={area.color} opacity={d.raw>0?1:0}/>;
                               })}
                               {/* Badge de valor + etiqueta por radio */}
                               {vals.map((d,i)=>{
                                 const a=start+i*step;
                                 const bp=pt(a,BADGE_R), lp=pt(a,LABEL_R);
                                 const ta=anch(a);
                                 const words=d.label.split(' '), multi=words.length>1;
                                 return (
                                   <g key={i}>
                                     <rect x={bp.x-BW/2} y={bp.y-BH/2} width={BW} height={BH} rx={4}
                                       fill={area.badge} opacity={d.raw>0?1:0.3}/>
                                     <text x={bp.x} y={bp.y-BH/2+BH*0.72}
                                       textAnchor="middle" fill={area.text} fontSize={9} fontWeight="900" fontFamily="system-ui,sans-serif">
                                       {d.raw||'–'}
                                     </text>
                                     <text x={lp.x} y={lp.y} textAnchor={ta}
                                       fill="#94a3b8" fontSize={10} fontWeight="700" fontFamily="system-ui,sans-serif">
                                       {multi?(
                                         <><tspan x={lp.x} dy={dy0(a,true)}>{words[0]}</tspan><tspan x={lp.x} dy="1.15em">{words.slice(1).join(' ')}</tspan></>
                                       ):(
                                         <tspan dy={dy0(a,false)}>{d.label}</tspan>
                                       )}
                                     </text>
                                   </g>
                                 );
                               })}
                             </svg>
                           </div>
                         );
                       })}
                     </div>
                   </div>

                </div>
              </div>
            )}

            {activeTab === 'datos' && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex items-center justify-between bg-slate-900/50 border border-slate-800 rounded-2xl p-4">
                   <div>
                     <h3 className="text-xs font-black text-white uppercase tracking-widest">Información Completa</h3>
                     <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Gestión de datos de filiación y registro</p>
                   </div>
                   <div className="flex items-center gap-3">
                      {editMode ? (
                        <>
                          <button 
                            onClick={() => {
                              setEditMode(false);
                              setFormData({ ...player });
                            }} 
                            className="px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-[10px] font-black text-slate-400 hover:text-white transition-all"
                          >
                            CANCELAR
                          </button>
                          <button 
                            onClick={handleSave} 
                            disabled={saving}
                            className="px-6 py-2 bg-emerald-600 text-slate-950 rounded-xl text-[10px] font-black hover:bg-emerald-500 transition-all shadow-lg disabled:opacity-50"
                          >
                            {saving ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}
                          </button>
                        </>
                      ) : (
                        <button 
                          onClick={() => setEditMode(true)} 
                          className="px-6 py-2 bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-black text-emerald-500 hover:bg-emerald-500/10 transition-all shadow-inner"
                        >
                          EDITAR DATOS
                        </button>
                      )}
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {/* Bloque Identidad */}
                   <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {renderDataField('Nombre', 'first_name')}
                      {renderDataField('Apellidos', 'last_name')}
                      {renderDataField('Nombre Deportivo', 'short_name')}
                      {renderDataField('Nacionalidad', 'nationality')}
                   </div>

                   {/* Bloque Nacimiento */}
                   <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {renderDataField('Fecha Nacimiento', 'birth_date', 'date')}
                      {renderDataField('Año Nacimiento', 'birth_year', 'number')}
                      <div className="bg-slate-900/30 border border-slate-800/50 rounded-2xl p-4 space-y-3 relative group">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Edad Calculada</label>
                        <p className="text-sm font-black text-emerald-400">
                          {(() => {
                            const age = computeAge(formData.birth_date as string | undefined, formData.birth_year as number | undefined);
                            return age != null ? `${age} años` : '—';
                          })()}
                        </p>
                      </div>
                      {renderDataField('Ciudad / Zona', 'area')}
                   </div>

                   {/* Bloque Club/Competición */}
                   <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {renderDataField('Equipo Actual', 'club_name')}
                      <div className="bg-slate-900/30 border border-slate-800/50 rounded-2xl p-4 space-y-3 relative group">
                        <label className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Cat. Federativa (Auto)</label>
                        <p className="text-sm font-black text-emerald-400">
                          {calculateCategory(formData.birth_year || 0, formData.birth_date as string | undefined)}
                        </p>
                      </div>
                      {renderDataField('Liga / Competición', 'league')}
                   </div>

                   {/* Bloque Futbolístico */}
                   <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {renderDataField('Dorsal Habitual', 'usual_number')}
                      {renderDataField('Posición Ppal.', 'main_position', 'select', POSITION_OPTIONS)}
                      {renderPositionSelectField('2ª Posición', 0)}
                      {renderPositionSelectField('3ª Posición', 1)}
                   </div>

                   {/* Bloque Físico */}
                   <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {renderDataField('Altura aprox (cm)', 'approximate_height', 'number')}
                      {renderDataField('Peso aprox (kg)', 'weight_kg', 'number')}
                      {renderDataField('Pierna Dominante', 'dominant_foot', 'select', [
                        {value: 'RIGHT', label: 'Diestro'},
                        {value: 'LEFT', label: 'Zurdo'},
                        {value: 'BOTH', label: 'Ambidiestro'},
                      ])}
                      {renderDataField('Fuente Info', 'info_source', 'select', [
                        {value: 'WEB', label: 'Web'},
                        {value: 'PADRES', label: 'Padres'},
                        {value: 'CLUB', label: 'Club'},
                        {value: 'ENTRENADORES', label: 'Entrenadores'},
                        {value: 'OTROS', label: 'Otros'},
                      ])}
                   </div>

                   {/* Bloque Contactos */}
                   {(() => {
                     const ROL_OPTIONS = [
                       {value: 'PADRE',       label: 'Padre'},
                       {value: 'MADRE',       label: 'Madre'},
                       {value: 'ABUELO',      label: 'Abuelo'},
                       {value: 'ABUELA',      label: 'Abuela'},
                       {value: 'TUTOR_LEGAL', label: 'Tutor Legal'},
                       {value: 'HERMANO',     label: 'Hermano/a'},
                       {value: 'TIO',         label: 'Tío/a'},
                       {value: 'AGENTE',      label: 'Agente'},
                       {value: 'OTRO',        label: 'Otro'},
                     ];
                     const rolLabel = (val?: string) => ROL_OPTIONS.find(o => o.value === val)?.label || val || '—';
                     return (
                       <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                         {/* Contacto Propio */}
                         {renderDataField('Contacto Propio', 'contact_own')}

                         {/* Contacto Tutor */}
                         <div className="bg-slate-900/30 border border-slate-800/50 rounded-2xl p-4 space-y-3">
                           <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Contacto Tutor</label>
                           {editMode ? (
                             <>
                               <input
                                 type="text"
                                 value={formData.contact_tutor1 || ''}
                                 onChange={e => setFormData(prev => ({ ...prev, contact_tutor1: e.target.value }))}
                                 placeholder="Teléfono..."
                                 className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-500/50"
                               />
                               <select
                                 value={formData.contact_tutor1_role || ''}
                                 onChange={e => setFormData(prev => ({ ...prev, contact_tutor1_role: e.target.value }))}
                                 className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-500/50 appearance-none"
                               >
                                 <option value="">Rol...</option>
                                 {ROL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                               </select>
                             </>
                           ) : (
                             <>
                               <p className="text-sm font-bold text-slate-200">{formData.contact_tutor1 || '—'}</p>
                               {formData.contact_tutor1_role && (
                                 <span className="inline-block px-2 py-0.5 bg-slate-800 rounded text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                   {rolLabel(formData.contact_tutor1_role)}
                                 </span>
                               )}
                             </>
                           )}
                         </div>

                         {/* Otro Contacto */}
                         <div className="bg-slate-900/30 border border-slate-800/50 rounded-2xl p-4 space-y-3">
                           <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Otro Contacto</label>
                           {editMode ? (
                             <>
                               <input
                                 type="text"
                                 value={formData.contact_other || ''}
                                 onChange={e => setFormData(prev => ({ ...prev, contact_other: e.target.value }))}
                                 placeholder="Teléfono..."
                                 className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-500/50"
                               />
                               <select
                                 value={formData.contact_other_role || ''}
                                 onChange={e => setFormData(prev => ({ ...prev, contact_other_role: e.target.value }))}
                                 className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-500/50 appearance-none"
                               >
                                 <option value="">Rol...</option>
                                 {ROL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                               </select>
                             </>
                           ) : (
                             <>
                               <p className="text-sm font-bold text-slate-200">{formData.contact_other || '—'}</p>
                               {formData.contact_other_role && (
                                 <span className="inline-block px-2 py-0.5 bg-slate-800 rounded text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                   {rolLabel(formData.contact_other_role)}
                                 </span>
                               )}
                             </>
                           )}
                         </div>
                       </div>
                     );
                   })()}

                   {/* Observaciones */}
                   <div className="lg:col-span-full">
                      <div className="bg-slate-900/30 border border-slate-800/50 rounded-[2rem] p-6 space-y-4">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Observaciones Generales</label>
                        {editMode ? (
                          <textarea 
                            value={formData.general_observations || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, general_observations: e.target.value }))}
                            placeholder="Añadir observaciones sobre el seguimiento del jugador..."
                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-white outline-none focus:border-emerald-500/50 min-h-[120px]"
                          />
                        ) : (
                          <p className="text-slate-300 text-sm leading-relaxed px-2 italic">
                            {player.general_observations || 'Sin observaciones registradas.'}
                          </p>
                        )}
                      </div>
                   </div>
                </div>
              </div>
            )}

            {activeTab === 'perfil' && (
              <div className="space-y-8 animate-in fade-in duration-500">

                {/* Barra de acción edición perfil */}
                <div className="flex items-center justify-between bg-slate-900/50 border border-slate-800 rounded-2xl p-4">
                  <div>
                    <h3 className="text-xs font-black text-white uppercase tracking-widest">Perfil Futbolístico</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Análisis técnico-táctico, valoraciones y proyección</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {editMode ? (
                      <>
                        <button
                          onClick={() => { setEditMode(false); setFormData({ ...player }); }}
                          className="px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-[10px] font-black text-slate-400 hover:text-white transition-all"
                        >CANCELAR</button>
                        <button
                          onClick={handleSave}
                          disabled={saving}
                          className="px-6 py-2 bg-emerald-600 text-slate-950 rounded-xl text-[10px] font-black hover:bg-emerald-500 transition-all shadow-lg disabled:opacity-50"
                        >{saving ? 'GUARDANDO...' : 'GUARDAR'}</button>
                      </>
                    ) : (
                      <button
                        onClick={() => setEditMode(true)}
                        className="px-5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-[10px] font-black text-slate-300 hover:text-white hover:border-emerald-500/40 transition-all flex items-center gap-2"
                      >
                        <Edit3 size={13} />
                        EDITAR PERFIL
                      </button>
                    )}
                  </div>
                </div>

                {/* Notas de campo: alta, corrección y borrado */}
                <div className="bg-slate-900/30 border border-slate-800/50 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-5 bg-amber-500 rounded-full" />
                    <h3 className="text-base font-black text-slate-100 italic tracking-tight uppercase">Notas de campo</h3>
                  </div>

                  {onAddFieldNote && (
                    <div className="bg-slate-950/35 border border-slate-800/80 rounded-[1.75rem] p-4">
                      <div className="flex items-start gap-2">
                        <textarea
                          rows={2}
                          placeholder="Escribe una nota rápida de campo..."
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-[12px] text-slate-200 outline-none resize-none focus:border-amber-500/50"
                          value={newFieldNote}
                          onChange={(e) => setNewFieldNote(e.target.value)}
                        />
                        <SpeechToTextButton onTranscript={(t) => setNewFieldNote((prev) => (prev ? `${prev} ${t}` : t))} />
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mr-1">Score</span>
                          {[1, 2, 3, 4, 5].map((v) => (
                            <button
                              key={v}
                              type="button"
                              onClick={() => setNewFieldNoteScore(v)}
                              className="p-0.5"
                              title={`${v} estrella${v > 1 ? 's' : ''}`}
                            >
                              <Star size={16} className={cn(newFieldNoteScore >= v ? "text-amber-400 fill-current" : "text-slate-700")} />
                            </button>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={handleSaveNewFieldNote}
                          disabled={!newFieldNote.trim()}
                          className="px-4 py-1.5 bg-amber-500/15 text-amber-400 border border-amber-500/30 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Guardar nota
                        </button>
                      </div>
                    </div>
                  )}

                  {fieldNotes.length > 0 ? (
                    <div className="space-y-4">
                      {fieldNotes.map((note) => (
                        <div
                          key={note.id}
                          className="w-full bg-slate-950/35 border border-slate-800/80 p-5 rounded-[2rem] transition-all shadow-lg"
                        >
                          {editingNoteId === note.id ? (
                            <div className="mb-5">
                              <textarea
                                rows={3}
                                autoFocus
                                className="w-full bg-slate-950 border border-amber-500/40 rounded-xl px-3 py-2 text-[12px] text-slate-200 outline-none resize-none"
                                value={editingNoteText}
                                onChange={(e) => setEditingNoteText(e.target.value)}
                              />
                              <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center gap-1">
                                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mr-1">Score</span>
                                  {[1, 2, 3, 4, 5].map((v) => (
                                    <button
                                      key={v}
                                      type="button"
                                      onClick={() => setEditingNoteScore(v)}
                                      className="p-0.5"
                                      title={`${v} estrella${v > 1 ? 's' : ''}`}
                                    >
                                      <Star size={16} className={cn(editingNoteScore >= v ? "text-amber-400 fill-current" : "text-slate-700")} />
                                    </button>
                                  ))}
                                </div>
                                <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => { setEditingNoteId(null); setEditingNoteText(''); }}
                                  className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition-all"
                                  title="Cancelar"
                                >
                                  <XCircle size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={saveEditingNote}
                                  disabled={!editingNoteText.trim()}
                                  className="p-2 bg-emerald-500/15 border border-emerald-500/30 rounded-lg text-emerald-400 hover:bg-emerald-500/25 transition-all disabled:opacity-40"
                                  title="Guardar"
                                >
                                  <Check size={14} />
                                </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <p className="text-[12px] text-slate-300 italic leading-relaxed mb-5">
                              "{note.text}"
                            </p>
                          )}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="px-2 py-0.5 bg-slate-950 text-[9px] font-black text-amber-500 rounded-lg border border-slate-800 italic">
                                SCORE: {note.score || 'N/A'}
                              </div>
                              <span className="text-[9px] font-black text-slate-600 uppercase tabular-nums">
                                {note.date ? format(new Date(note.date), 'dd MMM yy', { locale: es }) : 'S/F'}
                              </span>
                            </div>
                            {editingNoteId !== note.id && (onUpdateFieldNote || onDeleteFieldNote) && (
                              <div className="flex items-center gap-1">
                                {onUpdateFieldNote && (
                                  <button
                                    type="button"
                                    onClick={() => startEditingNote(note.id, note.text, note.score)}
                                    className="p-1.5 text-slate-500 hover:text-amber-400 transition-all"
                                    title="Corregir nota"
                                  >
                                    <Edit3 size={13} />
                                  </button>
                                )}
                                {onDeleteFieldNote && (
                                  <button
                                    type="button"
                                    onClick={() => onDeleteFieldNote(note.id)}
                                    className="p-1.5 text-slate-500 hover:text-rose-400 transition-all"
                                    title="Borrar nota"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-[2rem] border border-dashed border-slate-800 bg-slate-950/20 p-6 text-center">
                      <p className="text-sm font-bold text-slate-500">Sin notas de campo registradas aún.</p>
                    </div>
                  )}
                </div>

                {/* Visual Indicators Summary */}
                {(() => {
                  const globalCalc = computeGlobalRating(formData);
                  const stats = [
                    {
                      label: 'Valoración Global',
                      value: globalCalc,
                      sub: globalCalc != null ? `Media de ${['rating_technical','rating_tactical','rating_physical','rating_mental','rating_competitive','rating_decision_making','rating_pace','rating_intelligence','rating_personality'].filter(f => Number((formData as any)[f]) > 0).length} ratings` : 'Sin ratings aún',
                      color: 'text-white',
                      bar: 'bg-white',
                    },
                    {
                      label: 'Potencial Estimado',
                      value: formData.rating_potential ?? formData.potential_rating,
                      sub: 'Proyección a futuro',
                      color: 'text-emerald-400',
                      bar: 'bg-emerald-400',
                    },
                    {
                      label: 'Encaje en el Club',
                      value: formData.rating_club_fit,
                      sub: 'Calculado según el modelo del club',
                      color: 'text-blue-400',
                      bar: 'bg-blue-400',
                    },
                  ];
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {stats.map((stat, i) => (
                        <div key={i} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center text-center shadow-xl">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
                          <p className="text-[9px] text-slate-600 font-bold mb-3">{stat.sub}</p>
                          <div className="flex items-end gap-1">
                            <p className={cn('text-4xl font-black italic', stat.color)}>
                              {stat.value != null ? formatRating(stat.value) : '—'}
                            </p>
                            <p className="text-xs font-black text-slate-700 mb-1">/ 5.0</p>
                          </div>
                          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(Number(stat.value) || 0) * 20}%` }}
                              className={cn('h-full rounded-full', stat.bar)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                {/* Valoraciones Detalladas */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest px-2 flex items-center gap-2">
                    <Settings size={14} className="text-emerald-500" /> Valoraciones Detalladas
                  </h3>

                  {/* 4 áreas AUTO-calculadas desde Ficha Scouting */}
                  <div>
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest px-1 mb-2">
                      Calculadas automáticamente desde Ficha Scouting
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {([
                        { label: 'Físico',      fields: AREA_FIELDS.physical,  color: 'text-emerald-400', border: 'border-emerald-900/40', count: AREA_FIELDS.physical.filter(f => Number(formData[f]) > 0).length },
                        { label: 'Técnica',     fields: AREA_FIELDS.technical, color: 'text-blue-400',    border: 'border-blue-900/40',    count: AREA_FIELDS.technical.filter(f => Number(formData[f]) > 0).length },
                        { label: 'Táctica',     fields: AREA_FIELDS.tactical,  color: 'text-cyan-400',    border: 'border-cyan-900/40',    count: AREA_FIELDS.tactical.filter(f => Number(formData[f]) > 0).length },
                        { label: 'Cognitivas',  fields: AREA_FIELDS.mental,    color: 'text-amber-400',   border: 'border-amber-900/40',   count: AREA_FIELDS.mental.filter(f => Number(formData[f]) > 0).length },
                      ] as const).map(area => {
                        const val = avgFields(formData, area.fields as unknown as (keyof Player)[]);
                        return (
                          <div key={area.label} className={cn('bg-slate-900/30 border rounded-2xl p-4 flex flex-col gap-2', area.border)}>
                            <div className="flex items-center justify-between">
                              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{area.label}</label>
                              <span className="text-[8px] font-black text-slate-600 bg-slate-800 px-1.5 py-0.5 rounded uppercase tracking-wider">AUTO</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <p className={cn('text-2xl font-black italic', area.color)}>
                                {val != null ? val.toFixed(1) : '—'}
                              </p>
                              <p className="text-[9px] text-slate-600 font-bold">/ 5.0</p>
                            </div>
                            <div className="flex gap-0.5">
                              {[1,2,3,4,5].map(s => (
                                <div key={s} className={cn('flex-1 h-1 rounded-full', (val ?? 0) >= s ? area.color.replace('text-','bg-') : 'bg-slate-800')} />
                              ))}
                            </div>
                            <p className="text-[8px] text-slate-600">{area.count} / {(area.fields as readonly string[]).length} atributos</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 4 valoraciones manuales */}
                  <div>
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest px-1 mb-2">
                      Valoración manual del observador
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {renderRatingField('Competitividad',     'rating_competitive')}
                      {renderRatingField('Toma de Decisiones', 'rating_decision_making')}
                      {renderRatingField('Ritmo de Juego',     'rating_pace')}
                      {renderRatingField('Inteligencia Táct.', 'rating_intelligence')}
                    </div>
                  </div>

                  {/* Potencial y Encaje */}
                  <div>
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest px-1 mb-2">
                      Proyección
                    </p>
                    <div className="grid grid-cols-1 gap-4 md:w-1/2">
                      {renderRatingField('Potencial Estimado', 'rating_potential')}
                    </div>
                  </div>
                </div>

                {/* Fortalezas / Debilidades como lista editable */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                   {renderTagListField('Fortalezas', 'strengths', 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400')}
                   {renderTagListField('Debilidades', 'weaknesses', 'border-rose-500/30 bg-rose-500/10 text-rose-400')}
                </div>

                {/* Analysis Text Blocks */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                   {renderTextAreaField('Por qué nos interesa', 'why_interested', 'Resumen ejecutivo editable para la hoja de resumen...')}
                   {renderTextAreaField('Fortaleza Principal', 'main_strength', 'La virtud que más pesa en la valoración...')}
                   {renderTextAreaField('Principal Duda', 'main_doubt', 'Lo que genera incertidumbre sobre el jugador...')}
                   {renderTextAreaField('Próximo Paso', 'next_step', 'Siguiente acción de seguimiento (nuevo visionado, contacto, etc.)...')}
                   {renderTextAreaField('Informe Técnico', 'technical_profile', 'Lectura técnica detallada del jugador...')}
                   {renderTextAreaField('Informe Táctico', 'tactical_profile', 'Lectura táctica y comportamiento en juego...')}
                   {renderTextAreaField('Informe Físico', 'physical_profile', 'Lectura física y atlética del jugador...')}
                   {renderTextAreaField('Informe Mental', 'mental_profile', 'Carácter, competitividad y actitud del jugador...')}
                   {renderTextAreaField('Talento Diferencial', 'differential_talent', '¿Qué lo hace único en su categoría?')}
                   {renderTextAreaField('Riesgos Detectados', 'risks_analysis', 'Posibles frenos en su evolución (lesiones, entorno, carácter)...')}
                   {renderTextAreaField('Margen de Mejora', 'improvement_margin')}
                   {renderTextAreaField('Tipo de Jugador', 'player_type', 'Perfil (ej: Extremo puro, Mediapunta creativo...)')}
                   {renderTextAreaField('Rol Ideal', 'ideal_role')}
                   {renderTextAreaField('Nivel Actual p/ Club', 'current_level_club')}
                   {renderTextAreaField('Nivel Futuro Estimado', 'future_level_estimated')}
                   {renderTextAreaField('Comparativa', 'comparison_players', 'Comparación con jugadores de nuestra plantilla actual...')}
                </div>
              </div>
            )}

            {activeTab === 'informes' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest">Informes Registrados</h3>
                  <button onClick={() => onCreateReport('COMPLETE')} className="text-[10px] font-black text-emerald-500 uppercase hover:text-emerald-400">Nuevo</button>
                </div>
                {reports.length === 0 && (
                  <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 text-center">
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Sin informes registrados</p>
                  </div>
                )}
                {reports.map((report) => (
                  <div key={report.id} onClick={() => onEditReport?.(report)} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 sm:p-5 flex items-center gap-3 justify-between group hover:border-emerald-500/30 transition-all cursor-pointer">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center font-black text-emerald-500 text-lg sm:text-xl shrink-0">{report.match_rating}</div>
                      <div className="min-w-0">
                        <p className="font-bold text-white text-xs sm:text-sm truncate">Scout Principal</p>
                        <p className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-widest">{format(new Date(report.report_date), "dd MMM yyyy", { locale: es })}</p>
                        {report.recommendation && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-slate-800 text-[8px] font-black text-slate-300 uppercase rounded">{report.recommendation}</span>
                        )}
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-700 group-hover:text-emerald-500 transition-all shrink-0" />
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'partidos' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {matches.map(m => (
                  <div key={m.id} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group hover:border-slate-700 transition-all">
                    <div className="flex justify-between items-center mb-4">
                       <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{m.competition}</span>
                       <span className="text-[10px] font-bold text-slate-400">{format(new Date(m.date), "dd/MM/yy")}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-black text-white">
                       <span className="flex-1 text-right pr-4 truncate">{m.home_team}</span>
                       <span className="px-4 py-1.5 bg-slate-950 rounded-lg border border-emerald-500/20 text-emerald-500 italic text-base">{m.score || 'vs'}</span>
                       <span className="flex-1 text-left pl-4 truncate">{m.away_team}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'multimedia' && (
              <div className="space-y-4">

                {/* PLAYER PRINCIPAL */}
                {lightboxVideo && (() => {
                  const { embedUrl } = parseVideoEmbed(lightboxVideo.url);
                  return (
                    <div ref={videoPlayerRef} style={{ position: 'sticky', top: 0, zIndex: 50 }} className="rounded-2xl overflow-hidden bg-black shadow-2xl">
                      <div style={{ position: 'relative', paddingTop: '56.25%', overflow: 'hidden' }}
                        dangerouslySetInnerHTML={{ __html: `<iframe src="${embedUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen style="position:absolute;top:0;left:0;width:100%;height:100%;display:block;border:none"></iframe>` }}
                      />
                      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900">
                        <div className="min-w-0">
                          <p className="text-xs font-black text-white truncate">{lightboxVideo.title}</p>
                          {lightboxVideo.description && <p className="text-[10px] text-slate-500 truncate mt-0.5">{lightboxVideo.description}</p>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          <a href={lightboxVideo.url} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all"><ExternalLink size={13} /></a>
                          <button onClick={() => setLightboxVideo(null)} className="p-2 bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all"><XCircle size={13} /></button>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* CARRUSEL NETFLIX */}
                {videos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                    <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center text-purple-500">
                      <Video size={28} />
                    </div>
                    <p className="text-sm font-black text-white uppercase tracking-widest">Sin vídeos</p>
                    <button onClick={() => setShowAddVideoModal(true)}
                      className="px-6 py-2.5 bg-purple-500/10 border border-purple-500/30 text-purple-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-500/20 transition-all">
                      + AÑADIR VÍDEO
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{videos.length} vídeo{videos.length !== 1 ? 's' : ''}</p>
                      <button onClick={() => setShowAddVideoModal(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all">
                        <Plus size={10} /> Añadir
                      </button>
                    </div>

                    {/* Scroll horizontal tipo Netflix */}
                    <div className="flex gap-3 overflow-x-auto pb-3" style={{ scrollSnapType: 'x mandatory', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                      {videos.map(v => {
                        const { platform } = parseVideoEmbed(v.url);
                        const thumbnail = getVideoThumbnail(v.url);
                        const isActive = lightboxVideo?.id === v.id;
                        return (
                          <div
                            key={v.id}
                            className={cn("relative flex-shrink-0 rounded-2xl overflow-hidden cursor-pointer group transition-all", isActive ? "ring-2 ring-purple-500" : "ring-1 ring-slate-700 hover:ring-purple-500/50")}
                            style={{ width: 200, scrollSnapAlign: 'start' }}
                            onClick={() => setLightboxVideo(isActive ? null : v)}
                          >
                            {/* Thumbnail */}
                            <div className="relative bg-slate-900" style={{ height: 112 }}>
                              {thumbnail ? (
                                <img src={thumbnail} alt={v.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-800">
                                  <Video size={24} className="text-slate-600" />
                                </div>
                              )}
                              <div className={cn("absolute inset-0 flex items-center justify-center transition-all", isActive ? "bg-purple-900/40" : "bg-black/30 group-hover:bg-black/10")}>
                                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center border transition-all", isActive ? "bg-purple-500 border-purple-400 scale-110" : "bg-white/20 border-white/30 group-hover:scale-110 group-hover:bg-white/30")}>
                                  <Play size={14} className="text-white ml-0.5" fill="white" />
                                </div>
                              </div>
                              {onDeleteVideo && (
                                <button
                                  onClick={e => { e.stopPropagation(); onDeleteVideo(v.id); }}
                                  className="absolute top-1.5 right-1.5 p-1.5 bg-rose-500/90 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Trash2 size={10} />
                                </button>
                              )}
                              {v.is_key && (
                                <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-amber-500 rounded text-[8px] font-black text-black uppercase">CLAVE</span>
                              )}
                            </div>
                            {/* Info */}
                            <div className="px-3 py-2 bg-slate-900">
                              <p className="text-[11px] font-bold text-slate-200 truncate">{v.title}</p>
                              <div className="flex items-center justify-between mt-1">
                                <span className={cn("text-[8px] font-black uppercase tracking-widest",
                                  platform === 'youtube' ? 'text-red-400' : platform === 'vimeo' ? 'text-blue-400' : 'text-slate-500'
                                )}>{platform === 'youtube' ? 'YouTube' : platform === 'vimeo' ? 'Vimeo' : 'Externo'}</span>
                                <a href={v.url} target="_blank" rel="noopener noreferrer"
                                  onClick={e => e.stopPropagation()}
                                  className="text-slate-600 hover:text-white transition-all">
                                  <ExternalLink size={10} />
                                </a>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Botón añadir al final del carrusel */}
                      <div
                        className="flex-shrink-0 rounded-2xl border border-dashed border-slate-700 hover:border-purple-500/50 bg-slate-900/50 hover:bg-purple-500/5 cursor-pointer flex flex-col items-center justify-center gap-2 transition-all group/add"
                        style={{ width: 200, height: 160 }}
                        onClick={() => setShowAddVideoModal(true)}
                      >
                        <div className="w-10 h-10 bg-slate-800 group-hover/add:bg-purple-500/20 rounded-xl flex items-center justify-center text-slate-600 group-hover/add:text-purple-400 transition-all">
                          <Plus size={20} />
                        </div>
                        <span className="text-[9px] font-black text-slate-600 group-hover/add:text-purple-400 uppercase tracking-widest transition-all">Añadir vídeo</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'actividad' && (
              <div className="space-y-6">

                {/* — Decisión del Club — */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 sm:p-7">
                  <div className="flex items-center gap-3 mb-4">
                    <Gavel size={16} className="text-emerald-500 shrink-0" />
                    <h3 className="text-xs font-black text-white uppercase tracking-widest">Decisión del Club</h3>
                    <span className="ml-auto text-[9px] font-bold text-slate-600 uppercase tracking-widest hidden sm:block">Cada cambio se registra con fecha en el historial</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { value: 'OBSERVACIÓN CONTINUA', border: 'border-slate-700 hover:border-slate-500', active: 'border-slate-400 bg-slate-800', text: 'text-slate-200' },
                      { value: 'POSPONER DECISIÓN',    border: 'border-amber-900/40 hover:border-amber-600/60', active: 'border-amber-500/80 bg-amber-500/10', text: 'text-amber-300' },
                      { value: 'RECOMENDAR FICHAJE',   border: 'border-emerald-900/40 hover:border-emerald-600/60', active: 'border-emerald-500/80 bg-emerald-500/10', text: 'text-emerald-300' },
                      { value: 'DESCARTAR',            border: 'border-rose-900/40 hover:border-rose-600/60', active: 'border-rose-500/80 bg-rose-500/10', text: 'text-rose-300' },
                    ] as const).map(opt => {
                      const isCurrent = (formData.decision_final ?? player.decision_final) === opt.value;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => handleSaveDecision(opt.value)}
                          className={cn(
                            'w-full py-2.5 px-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-between gap-1 active:scale-[0.99]',
                            opt.text,
                            isCurrent ? opt.active : opt.border
                          )}
                        >
                          <span className="truncate">{opt.value}</span>
                          {isCurrent && <Check size={12} className="shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* — Historial de Acciones — */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 sm:p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                      <TrendingUp size={14} className="text-emerald-500 shrink-0" /> Historial de Acciones
                    </h3>
                    <span className="text-[9px] font-black text-slate-600 bg-slate-900 border border-slate-800 rounded-full px-2.5 py-1 uppercase tracking-widest">
                      {actionTimeline.length} evento{actionTimeline.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="relative">
                    {actionTimeline.map((event) => (
                      <div key={event.id} className="flex gap-4 relative min-w-0">
                        <div className="flex flex-col items-center">
                          <div className={cn("w-3 h-3 rounded-full shrink-0 z-10 mt-1.5 ring-4 ring-slate-900", event.dotColor)} />
                          <div className="w-px flex-1 bg-slate-800 mt-1 mb-1 min-h-[1rem]" />
                        </div>
                        <div className="pb-5 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className={cn("inline-flex items-center px-2 py-0.5 rounded-lg border text-[9px] font-black uppercase tracking-widest", event.badgeColor)}>
                              {event.typeLabel}
                            </span>
                            <span className="text-[10px] font-bold text-slate-600">
                              {format(new Date(event.date), "dd MMM yyyy", { locale: es })}
                            </span>
                            {event.deletable && event.contactRef && (
                              <button
                                onClick={() => deleteContact(event.contactRef!)}
                                className="ml-auto p-1 text-slate-700 hover:text-rose-400 transition-all rounded-lg hover:bg-rose-500/10"
                                title="Eliminar"
                              >
                                <Trash2 size={11} />
                              </button>
                            )}
                          </div>
                          {event.note && <p className="text-sm text-slate-300 leading-relaxed">{event.note}</p>}
                        </div>
                      </div>
                    ))}

                    {/* Registrar nuevo contacto al final del timeline */}
                    <div className="flex gap-4 min-w-0">
                      <div className="flex flex-col items-center pt-1">
                        <div className="w-3 h-3 rounded-full bg-slate-800 border border-dashed border-slate-600 shrink-0 z-10" />
                      </div>
                      <div className="pb-1 min-w-0 flex-1">
                        {actionTimeline.length === 0 && (
                          <p className="text-[10px] font-bold text-slate-700 uppercase tracking-widest mb-3">Sin acciones — añade el primer contacto</p>
                        )}
                        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                          <div className="flex flex-col sm:flex-row gap-3">
                            <div className="sm:w-52 shrink-0 space-y-1.5">
                              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Tipo</label>
                              <select
                                value={newContactType}
                                onChange={(e) => setNewContactType(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none focus:border-amber-500 transition-all"
                              >
                                <option>Primer contacto</option>
                                <option>Segundo contacto</option>
                                <option>Contacto con tutor</option>
                                <option>Contacto con agente</option>
                                <option>Oferta formal</option>
                                <option>Negociación</option>
                                <option>Acuerdo</option>
                                <option>Otro</option>
                              </select>
                            </div>
                            <div className="flex-1 space-y-1.5">
                              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Nota</label>
                              <textarea
                                value={newContactNote}
                                onChange={(e) => setNewContactNote(e.target.value)}
                                placeholder="Qué ocurrió, opinión del entorno, acuerdos alcanzados..."
                                rows={3}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none focus:border-amber-500 transition-all resize-none"
                              />
                            </div>
                          </div>
                          {contactError && (
                            <p className="flex items-center gap-1.5 text-[10px] text-rose-400">
                              <AlertCircle size={11} className="shrink-0" /> {contactError}
                            </p>
                          )}
                          <div className="flex justify-end">
                            <button
                              onClick={saveContact}
                              disabled={savingContact || !newContactNote.trim()}
                              className="flex items-center gap-2 px-5 py-2 bg-amber-600 text-slate-900 font-black text-[11px] uppercase tracking-widest rounded-xl hover:bg-amber-500 disabled:opacity-40 transition-all active:scale-95"
                            >
                              {savingContact ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                              {savingContact ? 'Guardando...' : 'Registrar Contacto'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* — Historial de cambios — */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 sm:p-8">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                    <History size={14} className="text-slate-400 shrink-0" /> Historial de Cambios
                  </h3>
                  {history.length > 0 ? (
                    <div className="space-y-3">
                      {history.map((entry) => (
                        <div key={entry.id} className="flex items-start gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800 min-w-0">
                          <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center shrink-0">
                            <MousePointer2 size={14} className="text-slate-500" />
                          </div>
                          <div className="min-w-0 flex-1">
                            {(entry.field === 'registro creado' || entry.field === 'última edición') && (
                              <p className="text-xs font-bold text-slate-200 break-words">
                                <span className="text-emerald-400">{entry.field}</span>
                              </p>
                            )}
                            <p className={cn("text-xs font-bold text-slate-200 break-words", (entry.field === 'registro creado' || entry.field === 'última edición') && "hidden")}>
                              Se actualizó <span className="text-emerald-400">{entry.field}</span>
                            </p>
                            <p className={cn("text-[11px] text-slate-400 mt-0.5 break-words", (entry.field === 'registro creado' || entry.field === 'última edición') && "hidden")}>
                              <span className="text-slate-600">{entry.old_value || 'vacío'}</span>
                              <span className="mx-1 text-slate-600">→</span>
                              <span>{entry.new_value || 'vacío'}</span>
                            </p>
                            <p className="text-[10px] text-slate-600 mt-1 uppercase tracking-widest">
                              {format(new Date(entry.created_at), "dd MMM yyyy · HH:mm", { locale: es })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                      <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center shrink-0">
                        <MousePointer2 size={14} className="text-slate-600" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400">Todavía no hay cambios registrados</p>
                        <p className="text-[10px] text-slate-600 mt-0.5">Aparecerán aquí cuando guardes cambios del perfil</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {showCareerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-slate-700 bg-slate-900 p-6 shadow-2xl md:p-8">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div><p className="text-[9px] font-black uppercase tracking-[0.25em] text-emerald-500">Trayectoria</p><h2 className="mt-1 text-xl font-black uppercase italic text-white">{careerForm.id ? 'Editar temporada' : 'Añadir temporada'}</h2></div>
              <button onClick={() => setShowCareerModal(false)} className="rounded-xl border border-slate-700 bg-slate-950 p-2 text-slate-500 hover:text-white"><XCircle size={18} /></button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="space-y-2"><span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Club</span><select value={careerForm.club_id} onChange={event => setCareerForm(prev => ({ ...prev, club_id: event.target.value, new_club_name: event.target.value ? '' : prev.new_club_name }))} className="input-base"><option value="">+ Insertar nuevo club</option>{careerClubs.map(club => <option key={club.id} value={club.id}>{club.name}</option>)}</select></label>
              {!careerForm.club_id && <label className="space-y-2"><span className="text-[9px] font-black uppercase tracking-widest text-emerald-500">Nombre del nuevo club</span><input value={careerForm.new_club_name} onChange={event => setCareerForm(prev => ({ ...prev, new_club_name: event.target.value }))} className="input-base" placeholder="Ej. UD Santa Marina" /></label>}
              {[
                ['Temporada', 'season', 'Ej. 2025/2026'], ['Equipo', 'team', 'Ej. Juvenil A'],
              ].map(([label, field, placeholder]) => <label className="space-y-2" key={field}><span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{label}</span><input value={careerForm[field as keyof CareerFormData] as string} onChange={event => setCareerForm(prev => ({ ...prev, [field]: event.target.value }))} className="input-base" placeholder={placeholder} /></label>)}
              <label className="space-y-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Categoría</span>
                <select value={careerForm.category} onChange={event => setCareerForm(prev => ({ ...prev, category: event.target.value }))} className="input-base">
                  <option value="">Seleccionar categoría...</option>
                  {CAREER_CATEGORY_OPTIONS.map(category => <option key={category} value={category}>{category}</option>)}
                </select>
              </label>
              <label className="space-y-2"><span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Competición</span><input value={careerForm.competition} onChange={event => setCareerForm(prev => ({ ...prev, competition: event.target.value }))} className="input-base" placeholder="Ej. División de Honor" /></label>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
              {[
                ['Partidos jugados', 'matches_played'], ['Minutos jugados', 'minutes_played'], ['Goles', 'goals'],
                ['Tarjetas amarillas', 'yellow_cards'], ['Tarjetas rojas', 'red_cards'],
              ].map(([label, field]) => <label className="space-y-2" key={field}><span className="block min-h-7 text-[8px] font-black uppercase tracking-wider text-slate-500">{label}</span><input type="number" min="0" value={careerForm[field as keyof CareerFormData] as number} onChange={event => setCareerForm(prev => ({ ...prev, [field]: Math.max(0, Number(event.target.value)) }))} className="input-base text-center" /></label>)}
            </div>

            {careerError && <p className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-bold text-rose-400">{careerError}</p>}
            <div className="mt-6 flex justify-end gap-3"><button onClick={() => setShowCareerModal(false)} className="btn-ghost">Cancelar</button><button onClick={saveCareerEntry} disabled={savingCareer} className="btn-primary">{savingCareer ? 'Guardando...' : 'Guardar trayectoria'}</button></div>
          </div>
        </div>
      )}

      {showPrintSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[2rem] border border-slate-700 bg-slate-900 p-6 shadow-2xl md:p-8">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-emerald-500">Exportación PDF</p>
                <h2 className="mt-1 text-xl font-black uppercase italic text-white">¿Qué quieres imprimir?</h2>
                <p className="mt-2 text-xs text-slate-500">Selecciona el documento que quieres generar para este jugador.</p>
              </div>
              <button onClick={() => setShowPrintSelector(false)} className="rounded-xl border border-slate-700 bg-slate-950 p-2 text-slate-500 hover:text-white"><XCircle size={18} /></button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {([
                { mode: 'summary', title: 'Resumen', description: 'Resumen ejecutivo y decisión principal.', icon: Target },
                { mode: 'scouting', title: 'Ficha Scouting', description: 'Trayectoria, demarcación y todos los atributos.', icon: LayoutDashboard },
                { mode: 'data', title: 'Datos', description: 'Información completa de filiación y registro.', icon: Info },
                { mode: 'profile', title: 'Perfil Futbolístico', description: 'Valoraciones globales y análisis cualitativo.', icon: Zap },
                { mode: 'complete', title: 'Informe Completo', description: 'Resumen, Ficha, Datos y Perfil; una hoja por pestaña.', icon: ClipboardList },
              ] as const).map(option => (
                <button
                  key={option.mode}
                  onClick={() => handlePrintReport(option.mode)}
                  className="group flex min-h-[108px] items-start gap-4 rounded-2xl border border-slate-700/80 bg-slate-950/60 p-5 text-left transition-all hover:border-emerald-500/60 hover:bg-emerald-500/5"
                >
                  <span className="rounded-xl bg-emerald-500/10 p-3 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-slate-950"><option.icon size={20} /></span>
                  <span><strong className="block text-sm font-black uppercase text-white">{option.title}</strong><small className="mt-1.5 block text-[10px] leading-relaxed text-slate-500">{option.description}</small></span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {canPrintReport && createPortal((
        <article className="player-pdf-report" aria-hidden="true">
          <header className="pdf-header">
            <div>
              <p className="pdf-kicker">Departamento de Scouting</p>
              <h1>{printMode === 'summary' ? 'Resumen' : printMode === 'data' ? 'Datos del jugador' : printMode === 'scouting' ? 'Ficha Scouting' : printMode === 'profile' ? 'Perfil Futbolístico' : 'Informe completo'}</h1>
              <p className="pdf-date">Generado el {format(new Date(), 'dd/MM/yyyy')}</p>
            </div>
            <div className="pdf-confidential">Uso interno · Confidencial</div>
          </header>

          {(printMode === 'summary' || printMode === 'complete') && (
            <section className="pdf-mode-page">
              <div className="pdf-player-hero">
                <div className="pdf-player-photo">{printablePlayer.avatar_url ? <img src={printablePlayer.avatar_url} alt="" /> : <span>{printablePlayer.full_name[0]}</span>}</div>
                <div className="pdf-player-title"><span className="pdf-section-label">Resumen ejecutivo</span><h2>{getSportName(printablePlayer.first_name, printablePlayer.last_name, printablePlayer.short_name)}</h2><p className="pdf-player-full-name">{printablePlayer.full_name}</p><p>{printablePlayer.club_name || 'Club no registrado'} · {currentMainPosition}</p></div>
                <div className="pdf-status"><span>Estado actual</span><strong>{PLAYER_STATUS_OPTIONS.find(option => option.value === currentStatus)?.label || currentStatus}</strong></div>
              </div>
              <div className="pdf-summary-grid">
                {[
                  ['Por qué nos interesa', printablePlayer.why_interested],
                  ['Fortaleza principal', printablePlayer.main_strength],
                  ['Duda principal', printablePlayer.main_doubt],
                  ['Talento diferencial', printablePlayer.differential_talent],
                  ['Encaje en el club', formatClubFitDisplay(printablePlayer)],
                  ['Próximo paso', printablePlayer.next_step],
                ].map(([label, value]) => <div className="pdf-analysis" key={label as string}><span>{label}</span><p>{value || 'Sin información registrada.'}</p></div>)}
              </div>
              <div className="pdf-list-columns">
                <div><span>Fortalezas</span><ul>{(printablePlayer.strengths || []).length ? printablePlayer.strengths?.map((item, index) => <li key={index}>{item}</li>) : <li>Sin fortalezas registradas.</li>}</ul></div>
                <div><span>Debilidades</span><ul>{(printablePlayer.weaknesses || []).length ? printablePlayer.weaknesses?.map((item, index) => <li key={index}>{item}</li>) : <li>Sin debilidades registradas.</li>}</ul></div>
                <div className="pdf-risk-box"><span>Riesgo de captación</span><strong>{getRiskLabel(printablePlayer.risk_level).label}</strong></div>
              </div>
            </section>
          )}

          {printMode === 'data' && (
            <section className="pdf-mode-page">
              <div className="pdf-characteristics-title"><div><span>Registro</span><h3>Datos del jugador</h3></div><small>Información completa</small></div>
              <div className="pdf-full-data-grid">
                {[
                  ['Nombre', printablePlayer.first_name], ['Apellidos', printablePlayer.last_name], ['Nombre completo', printablePlayer.full_name], ['Nombre corto', displaySportName],
                  ['Nacionalidad', printablePlayer.nationality], ['Lugar de nacimiento', printablePlayer.birth_place], ['Fecha nacimiento', printablePlayer.birth_date], ['Año nacimiento', printablePlayer.birth_year],
                  ['Club', printablePlayer.club_name], ['Competición', printablePlayer.league || printablePlayer.competition], ['Posición principal', currentMainPosition], ['Posiciones secundarias', currentSecondaryPositions.join(', ')],
                  ['Lateralidad', printablePlayer.lateralidad || printablePlayer.dominant_foot], ['Altura', printablePlayer.approximate_height ? `${printablePlayer.approximate_height} cm` : ''], ['Peso', printablePlayer.weight_kg ? `${printablePlayer.weight_kg} kg` : ''], ['Dorsal', printablePlayer.usual_number],
                  ['Agente', printablePlayer.agent_name], ['Pasaporte', printablePlayer.passport], ['Fuente', printablePlayer.info_source || printablePlayer.source], ['Zona', printablePlayer.area],
                  ['Contacto propio', printablePlayer.contact_own], ['Contacto tutor', printablePlayer.contact_tutor1], ['Rol tutor', printablePlayer.contact_tutor1_role], ['Otro contacto', printablePlayer.contact_other],
                ].map(([label, value]) => <div key={label as string}><span>{label}</span><strong>{value || '—'}</strong></div>)}
              </div>
              <div className="pdf-analysis pdf-data-observations"><span>Observaciones generales</span><p>{printablePlayer.general_observations || 'Sin observaciones registradas.'}</p></div>
            </section>
          )}

          {(printMode === 'scouting' || printMode === 'complete') && (
          <div className={cn('pdf-mode-page pdf-scouting-page', printMode === 'complete' && 'pdf-new-page')}>
          <section className="pdf-player-hero">
            <div className="pdf-player-photo">
              {printablePlayer.avatar_url ? <img src={printablePlayer.avatar_url} alt="" /> : <span>{printablePlayer.full_name[0]}</span>}
            </div>
            <div className="pdf-player-title">
              <span className="pdf-section-label">Ficha de identificación</span>
              <h2>{getSportName(printablePlayer.first_name, printablePlayer.last_name, printablePlayer.short_name)}</h2>
              <p className="pdf-player-full-name">{printablePlayer.full_name}</p>
              <p>{printablePlayer.club_name || 'Club no registrado'} · {currentMainPosition} · {calculateCategory(printablePlayer.birth_year, printablePlayer.birth_date)}</p>
            </div>
            <div className="pdf-status">
              <span>Estado actual</span>
              <strong>{PLAYER_STATUS_OPTIONS.find(option => option.value === currentStatus)?.label || currentStatus}</strong>
            </div>
          </section>

          <section className="pdf-top-grid">
            <div className="pdf-card pdf-data-card">
              <div className="pdf-card-heading"><span>Datos principales</span><small>Perfil</small></div>
              <div className="pdf-data-grid">
                {[
                  ['Nombre corto', displaySportName],
                  ['Competición', printablePlayer.league || printablePlayer.competition],
                  ['Nacimiento', printablePlayer.birth_date || printablePlayer.birth_year],
                  ['Edad', printablePlayer.calculated_age ? `${printablePlayer.calculated_age} años` : '—'],
                  ['Nacionalidad', printablePlayer.nationality],
                  ['Lateralidad', printablePlayer.lateralidad || printablePlayer.dominant_foot],
                  ['Altura', printablePlayer.approximate_height ? `${printablePlayer.approximate_height} cm` : '—'],
                  ['Peso', printablePlayer.weight_kg ? `${printablePlayer.weight_kg} kg` : '—'],
                ].map(([label, value]) => (
                  <div key={label as string}><span>{label}</span><strong>{value || '—'}</strong></div>
                ))}
              </div>
            </div>

            <div className="pdf-card pdf-position-card">
              <div className="pdf-card-heading"><span>Demarcación</span><small>Mapa posicional</small></div>
              <PitchMap position={currentMainPosition} secondaryPositions={currentSecondaryPositions} className="pdf-print-pitch" />
              <div className="pdf-position-labels">
                <strong>Principal: {currentMainPosition}</strong>
                <span>Secundarias: {currentSecondaryPositions.filter(Boolean).join(' · ') || 'Sin registrar'}</span>
              </div>
            </div>
          </section>

          <section className="pdf-card pdf-trajectory-card">
            <div className="pdf-card-heading"><span>Trayectoria</span><small>Historial competitivo</small></div>
            {careerEntries.length > 0 ? (
              <table className="pdf-trajectory-table">
                <thead><tr><th>Temporada</th><th>Club</th><th>Equipo</th><th>Categoría</th><th>Competición</th><th>PJ</th><th>Min.</th><th>Goles</th><th>TA</th><th>TR</th></tr></thead>
                <tbody>
                  {careerEntries.map((entry, index) => (
                    <tr key={index}>
                      <td>{entry.season}</td><td>{entry.club_name_snapshot || careerClubs.find(club => club.id === entry.club_id)?.name || '—'}</td><td>{entry.team}</td><td>{entry.category}</td><td>{entry.competition || '—'}</td>
                      <td>{entry.matches_played}</td><td>{entry.minutes_played ?? entry.minutes ?? 0}</td><td>{entry.goals}</td><td>{entry.yellow_cards}</td><td>{entry.red_cards}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p className="pdf-empty">Sin trayectoria registrada.</p>}
          </section>

          <section className="pdf-characteristics">
            <div className="pdf-characteristics-title">
              <div><span>Ficha Scouting</span><h3>Valoración de características</h3></div>
              <small>Escala 1–5</small>
            </div>

            {currentMainPosition === 'POR' && (
              <div className="pdf-rating-groups pdf-gk-groups">
                {Object.entries(GK_RATING_CATEGORIES).map(([categoryId, category]) => (
                  <div className="pdf-rating-group" key={categoryId}>
                    <h4>{category.label}</h4>
                    {category.attrs.map(attribute => {
                      const value = Number(printablePlayer[attribute.field as keyof Player]) || 0;
                      return (
                        <div className="pdf-attribute" key={attribute.field}>
                          <div><span>{attribute.label}</span><strong>{value || '—'}</strong></div>
                          <div className="pdf-rating-track"><i style={{ width: `${value * 20}%` }} /></div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}

            <div className="pdf-rating-groups">
              {Object.entries(RATING_CATEGORIES).map(([categoryId, attributes]) => (
                <div className="pdf-rating-group" key={categoryId}>
                  <h4>{categoryId}</h4>
                  {attributes.map(attribute => {
                    const value = Number(printablePlayer[attribute.field as keyof Player]) || 0;
                    return (
                      <div className="pdf-attribute" key={attribute.field}>
                        <div><span>{attribute.label}</span><strong>{value || '—'}</strong></div>
                        <div className="pdf-rating-track"><i style={{ width: `${value * 20}%` }} /></div>
                      </div>
                    );
                  })}
                  {categoryId === 'especificas' && (printablePlayer.custom_ratings || []).map((rating, index) => (
                    <div className="pdf-attribute" key={`${rating.label}-${index}`}>
                      <div><span>{rating.label}</span><strong>{rating.value || '—'}</strong></div>
                      <div className="pdf-rating-track"><i style={{ width: `${rating.value * 20}%` }} /></div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </section>

          <section className="pdf-radars-page">
            <div className="pdf-characteristics-title" style={{ marginTop: '5mm' }}>
              <div><span>Ficha Scouting</span><h3>Radares de atributos</h3></div>
              <small>Perfil por áreas · Escala 1–5</small>
            </div>
            <div className="pdf-radars-grid">
              <PrintableRadar title="Físicas" attributes={RATING_CATEGORIES.fisicas} player={printablePlayer} color="#059669" />
              <PrintableRadar title="Técnicas" attributes={RATING_CATEGORIES.tecnicas} player={printablePlayer} color="#2563eb" />
              <PrintableRadar title="Tácticas" attributes={RATING_CATEGORIES.tacticas} player={printablePlayer} color="#7c3aed" />
              <PrintableRadar title="Cognitivas" attributes={RATING_CATEGORIES.cognitivas} player={printablePlayer} color="#d97706" />
            </div>
          </section>
          </div>
          )}

          {printMode === 'complete' && (
            <section className="pdf-mode-page pdf-new-page">
              <div className="pdf-characteristics-title"><div><span>Registro</span><h3>Datos del jugador</h3></div><small>Información completa</small></div>
              <div className="pdf-full-data-grid">
                {[
                  ['Nombre', printablePlayer.first_name], ['Apellidos', printablePlayer.last_name], ['Nombre completo', printablePlayer.full_name], ['Nombre corto', displaySportName],
                  ['Nacionalidad', printablePlayer.nationality], ['Lugar de nacimiento', printablePlayer.birth_place], ['Fecha nacimiento', printablePlayer.birth_date], ['Año nacimiento', printablePlayer.birth_year],
                  ['Club', printablePlayer.club_name], ['Competición', printablePlayer.league || printablePlayer.competition], ['Posición principal', currentMainPosition], ['Posiciones secundarias', currentSecondaryPositions.join(', ')],
                  ['Lateralidad', printablePlayer.lateralidad || printablePlayer.dominant_foot], ['Altura', printablePlayer.approximate_height ? `${printablePlayer.approximate_height} cm` : ''], ['Peso', printablePlayer.weight_kg ? `${printablePlayer.weight_kg} kg` : ''], ['Dorsal', printablePlayer.usual_number],
                  ['Agente', printablePlayer.agent_name], ['Pasaporte', printablePlayer.passport], ['Fuente', printablePlayer.info_source || printablePlayer.source], ['Zona', printablePlayer.area],
                  ['Contacto propio', printablePlayer.contact_own], ['Contacto tutor', printablePlayer.contact_tutor1], ['Rol tutor', printablePlayer.contact_tutor1_role], ['Otro contacto', printablePlayer.contact_other],
                ].map(([label, value]) => <div key={label as string}><span>{label}</span><strong>{value || '—'}</strong></div>)}
              </div>
              <div className="pdf-analysis pdf-data-observations"><span>Observaciones generales</span><p>{printablePlayer.general_observations || 'Sin observaciones registradas.'}</p></div>
            </section>
          )}

          {(printMode === 'profile' || printMode === 'complete') && (
            <section className={cn('pdf-mode-page', printMode === 'complete' && 'pdf-new-page')}>
              <div className="pdf-characteristics-title"><div><span>Perfil futbolístico</span><h3>Análisis del jugador</h3></div><small>Valoración global y cualitativa</small></div>
              <div className="pdf-profile-ratings">
                {[
                  ['Físico', printablePlayer.rating_physical], ['Técnica', printablePlayer.rating_technical],
                  ['Táctica', printablePlayer.rating_tactical], ['Cognitivas', printablePlayer.rating_mental],
                  ['Competitividad', printablePlayer.rating_competitive], ['Decisiones', printablePlayer.rating_decision_making],
                  ['Ritmo', printablePlayer.rating_pace], ['Inteligencia', printablePlayer.rating_intelligence],
                  ['Potencial', printablePlayer.rating_potential], ['Encaje club', printablePlayer.rating_club_fit],
                ].map(([label, raw]) => {
                  const value = Number(raw) || 0;
                  return <div className="pdf-profile-rating" key={label as string}><span>{label}</span><strong>{value ? value.toFixed(1) : '—'}</strong><div className="pdf-rating-track"><i style={{ width: `${value * 20}%` }} /></div></div>;
                })}
              </div>
              <div className="pdf-summary-grid pdf-profile-analysis">
                {[
                  ['Informe técnico', printablePlayer.technical_profile], ['Informe táctico', printablePlayer.tactical_profile],
                  ['Talento diferencial', printablePlayer.differential_talent], ['Riesgos detectados', printablePlayer.risks_analysis],
                  ['Margen de mejora', printablePlayer.improvement_margin], ['Tipo de jugador', printablePlayer.player_type],
                  ['Rol ideal', printablePlayer.ideal_role], ['Nivel actual para el club', printablePlayer.current_level_club],
                  ['Nivel futuro estimado', printablePlayer.future_level_estimated], ['Comparativa', printablePlayer.comparison_players],
                ].map(([label, value]) => <div className="pdf-analysis" key={label as string}><span>{label}</span><p>{value || 'Sin información registrada.'}</p></div>)}
              </div>
            </section>
          )}

          <footer className="pdf-footer">
            <span>{printablePlayer.full_name} · {printMode === 'complete' ? 'Informe completo' : 'Documento de scouting'}</span>
            <span>Documento confidencial</span>
          </footer>
        </article>
      ), document.body)}


      {/* MODAL AÑADIR VÍDEO */}
      {showAddVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-widest">Añadir Vídeo</h3>
                <p className="text-slate-500 text-xs mt-1 font-bold">YouTube · Vimeo · Enlace externo</p>
              </div>
              <button
                onClick={() => { setShowAddVideoModal(false); setNewVideoUrl(''); setNewVideoTitle(''); setNewVideoDesc(''); setVideoUrlError(''); }}
                className="p-2 bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all"
              >
                <XCircle size={18} />
              </button>
            </div>

            {/* Preview embed en tiempo real */}
            {(() => {
              const { embedUrl } = parseVideoEmbed(newVideoUrl);
              if (!embedUrl) return null;
              return (
                <div className="aspect-video bg-slate-950 rounded-2xl overflow-hidden mb-4 border border-slate-800">
                  <iframe src={embedUrl} className="w-full h-full" allowFullScreen title="Preview" />
                </div>
              );
            })()}

            <div className="space-y-4">
              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">URL del Vídeo *</label>
                <input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={newVideoUrl}
                  onChange={e => { setNewVideoUrl(e.target.value); setVideoUrlError(''); }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50 font-mono"
                />
                {videoUrlError && <p className="text-rose-400 text-[10px] mt-1 font-bold">{videoUrlError}</p>}
                {newVideoUrl && (() => {
                  const { platform } = parseVideoEmbed(newVideoUrl);
                  if (platform === 'youtube') return <p className="text-red-400 text-[10px] mt-1 font-black">✓ YouTube detectado</p>;
                  if (platform === 'vimeo') return <p className="text-blue-400 text-[10px] mt-1 font-black">✓ Vimeo detectado</p>;
                  return <p className="text-slate-500 text-[10px] mt-1 font-bold">Enlace externo — se mostrará como link</p>;
                })()}
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Título</label>
                <input
                  type="text"
                  placeholder="Ej: Hat-trick vs Real Madrid (10/03/2025)"
                  value={newVideoTitle}
                  onChange={e => setNewVideoTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50"
                />
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Descripción (opcional)</label>
                <textarea
                  placeholder="Acciones relevantes, minutos clave..."
                  value={newVideoDesc}
                  onChange={e => setNewVideoDesc(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50 resize-none"
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setNewVideoIsKey(!newVideoIsKey)}
                  className={cn("w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0", newVideoIsKey ? "bg-amber-500 border-amber-500" : "border-slate-700 hover:border-amber-500/50")}
                >
                  {newVideoIsKey && <CheckCircle2 size={12} className="text-white" />}
                </div>
                <span className="text-xs font-bold text-slate-300">Marcar como vídeo clave</span>
              </label>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowAddVideoModal(false); setNewVideoUrl(''); setNewVideoTitle(''); setNewVideoDesc(''); setNewVideoIsKey(false); setVideoUrlError(''); }}
                className="flex-1 py-3 bg-slate-800 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-white transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (!newVideoUrl.trim()) { setVideoUrlError('Introduce una URL válida'); return; }
                  onAddVideo({ url: newVideoUrl.trim(), title: newVideoTitle.trim() || 'Vídeo Scouting', description: newVideoDesc.trim() || undefined, is_key: newVideoIsKey });
                  setShowAddVideoModal(false);
                  setNewVideoUrl('');
                  setNewVideoTitle('');
                  setNewVideoDesc('');
                  setNewVideoIsKey(false);
                  setVideoUrlError('');
                }}
                className="flex-1 py-3 bg-purple-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-500 transition-all shadow-lg shadow-purple-900/30"
              >
                Añadir Vídeo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
