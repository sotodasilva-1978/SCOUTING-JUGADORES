import { 
  ArrowLeft, User, Star, Video, ClipboardList, Shield, Edit3, Trash2, 
  Calendar, Target, Zap, AlertCircle, ChevronRight, Plus, Trophy, 
  History, Settings, Fingerprint, Image as ImageIcon, CheckCircle2,
  TrendingUp, XCircle, Info, Ruler, Footprints, Hash, Eye, FastForward,
  MapPin, Briefcase, FileText, Scale, Gavel, MousePointer2, Loader2,
  LayoutDashboard, Smartphone, Monitor
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Player, Report, Match, Video as VideoType, TrajectoryEntry, HistoryLog } from '../types';
import { cn, formatRating, getStatusColor, calculateCategory } from '../lib/utils';
import { useMemo, useState, useRef, ChangeEvent, FormEvent } from 'react';
import { uploadPlayerPhoto } from '../lib/supabase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, 
  Radar, BarChart, Bar, XAxis, YAxis, Cell, Tooltip 
} from 'recharts';

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

const PitchMap = ({ position, secondaryPositions = [] }: { position: string; secondaryPositions?: string[] }) => (
  <div className="relative w-full max-w-[180px] mx-auto aspect-[3/4] bg-emerald-950/40 rounded-2xl border border-emerald-500/20 overflow-hidden shadow-inner group">
    {/* Field markings */}
    <div className="absolute inset-0 border-[1.5px] border-white/20 m-3 rounded-lg" />
    <div className="absolute top-1/2 left-0 right-0 h-px bg-white/20" />
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 border-[1.5px] border-white/20 rounded-full" />
    <div className="absolute top-3 left-1/2 -translate-x-1/2 w-16 h-9 border-x-[1.5px] border-b-[1.5px] border-white/20" />
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-16 h-9 border-x-[1.5px] border-t-[1.5px] border-white/20" />

    {/* Secondary position dots — yellow, smaller */}
    {(secondaryPositions || []).filter(Boolean).map((pos, i) => (
      <div
        key={i}
        className="absolute w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)] border border-white/70 transition-all duration-700"
        style={makeDotStyle(pos)}
      />
    ))}

    {/* Main position dot — red, larger */}
    <div
      className="absolute w-5 h-5 rounded-full bg-red-500 shadow-[0_0_16px_rgba(239,68,68,0.8)] border-2 border-white/60 transition-all duration-700"
      style={makeDotStyle(position)}
    />

    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 to-transparent pointer-events-none" />
  </div>
);

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
  onAddVideo: (video: { url: string; title: string }) => void;
  onUpdatePlayer?: (player: Player) => void;
  initialTab?: string;
}

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
  onAddVideo,
  onUpdatePlayer,
  initialTab = 'resumen'
}: PlayerDetailProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<Player>>({ ...player });
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [uploadPhase, setUploadPhase] = useState<'idle' | 'compressing' | 'uploading' | 'done' | 'error'>('idle');
  const [uploadError, setUploadError] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

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
        }
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

  const handleSave = async () => {
    if (!onUpdatePlayer) return;
    setSaving(true);
    try {
      await onUpdatePlayer({ ...player, ...formData });
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
              value={isArray ? (value as string[] || []).join(', ') : (value || '')}
              onChange={(e) => {
                const val = type === 'number' ? Number(e.target.value) : isArray ? e.target.value.split(',').map(s => s.trim()) : e.target.value;
                setFormData(prev => ({ ...prev, [field]: val }));
              }}
              placeholder="..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-500/50"
            />
          )
        ) : (
          <p className="text-sm font-bold text-slate-200 truncate">
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
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">{label}</label>
        {editMode ? (
          <textarea
            value={value || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, [field]: e.target.value }))}
            placeholder={placeholder || 'Completar análisis...'}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-emerald-500/50 min-h-[80px]"
          />
        ) : (
          <p className="text-sm text-slate-300 leading-relaxed italic">
            {value || 'Análisis pendiente de completar.'}
          </p>
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
    { id: 'resumen', label: 'Resumen', icon: Target },
    { id: 'ficha', label: 'Ficha Scouting', icon: LayoutDashboard },
    { id: 'datos', label: 'Datos', icon: Info },
    { id: 'perfil', label: 'Perfil Futbolístico', icon: Zap },
    { id: 'informes', label: 'Informes', icon: ClipboardList },
    { id: 'partidos', label: 'Partidos', icon: Trophy },
    { id: 'multimedia', label: 'Multimedia', icon: Video },
    { id: 'seguimiento', label: 'Seguimiento', icon: TrendingUp },
    { id: 'decision', label: 'Decisión Club', icon: Gavel },
    { id: 'historial', label: 'Historial', icon: History },
  ];

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
                  <img src={player.avatar_url} alt={player.full_name} className="w-full h-full object-cover" />
                ) : (
                  <span>{player.full_name[0]}</span>
                )}
                {/* Overlay al hover */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center">
                  <ImageIcon size={20} className="text-white" />
                </div>
              </div>
              <div className={cn("absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-slate-950 shadow-lg", getTrafficLightColor(player.status))} />
            </div>
            <div className="space-y-1 min-w-0 flex-1 overflow-hidden">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-base sm:text-xl md:text-2xl font-black text-white uppercase tracking-tight truncate max-w-full">{player.full_name}</h1>
                <div className={cn("px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-[0.15em] shadow-sm shrink-0", getStatusColor(player.status))}>
                   {PLAYER_STATUS_OPTIONS.find(o => o.value === player.status)?.label || player.status}
                </div>
              </div>
              <p className="text-xs sm:text-sm font-bold text-slate-400 truncate">
                <span className="text-emerald-500">{player.club_name}</span>
                <span className="mx-2 text-slate-700">·</span>
                <span className="uppercase text-slate-300">{calculateCategory(player.birth_year)}</span>
                <span className="mx-2 text-slate-700">·</span>
                <span>{player.birth_year} ({player.calculated_age} años)</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-4 sm:flex sm:flex-wrap items-center gap-2 w-full xl:w-auto">
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
             <button onClick={() => onAddVideo({url: '', title: ''})} className="bg-slate-900 border border-slate-800 text-purple-400 px-4 py-2.5 rounded-xl text-[10px] font-black hover:bg-purple-400/10 transition-all">
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

      {/* NAVEGACIÓN POR PESTAÑAS (Responsiva: Scroll horizontal en móvil) */}
      <div className="flex items-center gap-1 bg-slate-900/50 p-1.5 rounded-[1.5rem] border border-slate-800/50 overflow-x-auto no-scrollbar scroll-smooth">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-5 py-3 rounded-xl text-[10px] font-black transition-all whitespace-nowrap uppercase tracking-widest",
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
                  <div className="absolute top-0 right-0 p-8">
                     <div className="flex flex-col items-end gap-2">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Riesgo Captación</span>
                        <div className={cn("px-4 py-1.5 rounded-full text-xs font-black border", getRiskLabel(player.risk_level).color)}>
                          {getRiskLabel(player.risk_level).label}
                        </div>
                     </div>
                  </div>
                  <div className="flex items-center gap-3 mb-8">
                     <Target size={24} className="text-emerald-500" />
                     <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Resumen Ejecutivo</h2>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                     <div className="space-y-6">
                        <div>
                          <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-3">¿Por qué nos interesa?</h3>
                          <p className="text-slate-200 text-lg font-medium leading-relaxed italic">
                            "{player.why_interested || 'Puntualizar motivo de interés...'}"
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                           <div>
                              <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1 flex items-center gap-1"><Zap size={10}/> Fortaleza</p>
                              <p className="text-sm font-bold text-white">{player.main_strength || '---'}</p>
                           </div>
                           <div>
                              <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-1 flex items-center gap-1"><AlertCircle size={10}/> Duda</p>
                              <p className="text-sm font-bold text-white">{player.main_doubt || '---'}</p>
                           </div>
                        </div>
                     </div>
                     <div className="bg-slate-950/50 rounded-3xl p-8 border border-slate-800/50 space-y-6">
                        <div className="flex items-start gap-4">
                           <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500 shrink-0"><Star size={20} /></div>
                           <div>
                              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Talento Diferencial</p>
                              <p className="text-sm text-slate-200 font-bold mt-1">{player.differential_talent || 'Detectar talento clave...'}</p>
                           </div>
                        </div>
                        <div className="flex items-start gap-4">
                           <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500 shrink-0"><Shield size={20} /></div>
                           <div>
                              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Encaje en el Club</p>
                              <p className="text-sm text-slate-200 font-bold mt-1">{player.club_fit || 'Evaluar adaptabilidad...'}</p>
                           </div>
                        </div>
                        <div className="pt-6 border-t border-slate-800">
                          <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Próximo Paso</p>
                          <p className="text-lg font-black text-white italic mt-1 uppercase">{player.next_step || 'OBSERVACIÓN'}</p>
                        </div>
                     </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-900/30 border border-slate-800/50 rounded-[2rem] p-6">
                     <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Zap size={14} /> Fortalezas</h3>
                     <ul className="space-y-2">
                        {(player.strengths || []).map((s, i) => (
                           <li key={i} className="flex items-center gap-2 text-xs text-slate-300">
                              <CheckCircle2 size={14} className="text-emerald-500" /> {s}
                           </li>
                        ))}
                     </ul>
                  </div>
                  <div className="bg-slate-900/30 border border-slate-800/50 rounded-[2rem] p-6">
                     <h3 className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Shield size={14} /> Debilidades</h3>
                     <ul className="space-y-2">
                        {(player.weaknesses || []).map((w, i) => (
                           <li key={i} className="flex items-center gap-2 text-xs text-slate-300">
                              <XCircle size={14} className="text-rose-500" /> {w}
                           </li>
                        ))}
                     </ul>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ficha' && (
              <div className="space-y-8 animate-in fade-in duration-700">
                {/* BLOQUE SUPERIOR (Image 2 style) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                   {/* Columna Izquierda: Foto y Datos Generales */}
                   <div className="lg:col-span-2 space-y-6">
                      <div className="bg-slate-900/40 border border-slate-800/80 rounded-[2.5rem] p-8 flex flex-col md:flex-row gap-8 items-center md:items-start shadow-xl backdrop-blur-sm">
                         <div className="w-48 h-48 rounded-[2rem] bg-slate-800/50 border border-slate-700/50 overflow-hidden shrink-0 shadow-2xl group relative">
                            {player.avatar_url ? (
                              <img src={player.avatar_url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-6xl font-black text-slate-700">{player.full_name[0]}</div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-4">
                               <span className="text-[10px] font-black text-white italic tracking-widest uppercase">PERFIL SCOUTING</span>
                            </div>
                         </div>
                         
                         <div className="flex-1 grid grid-cols-2 gap-x-8 gap-y-4 w-full">
                            {[
                              { label: 'NOMBRE CORTO', value: player.short_name || player.first_name },
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
                                <span className="text-xs font-bold text-slate-200 uppercase truncate">{item.value || '---'}</span>
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
                          value={formData.status || player.status || 'TRACKING'}
                          onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
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
                        <div className="flex items-center justify-between mb-8">
                           <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em] bg-slate-950/80 px-6 py-2.5 rounded-full italic border border-slate-800">TRAYECTORIA</h3>
                           <Trophy size={18} className="text-amber-500/50" />
                        </div>
                        <div className="overflow-x-auto no-scrollbar">
                           <table className="w-full text-[10px] font-bold text-slate-400">
                             <thead>
                               <tr className="bg-slate-950/60 text-emerald-500 border border-slate-800">
                                 <th className="px-3 py-3 text-left first:rounded-l-xl">TEMP</th>
                                 <th className="px-3 py-3 text-left">EQUIPO</th>
                                 <th className="px-3 py-3 text-left">CATEG</th>
                                 <th className="px-3 py-3 text-center">MIN</th>
                                 <th className="px-3 py-3 text-center">PJ</th>
                                 <th className="px-3 py-3 text-center">TIT</th>
                                 <th className="px-3 py-3 text-center">SUP</th>
                                 <th className="px-3 py-3 text-center">GOL</th>
                                 <th className="px-3 py-3 text-center">ASIST</th>
                                 <th className="px-3 py-3 text-center">TA</th>
                                 <th className="px-3 py-3 text-center last:rounded-r-xl">TR</th>
                               </tr>
                             </thead>
                             <tbody className="divide-y divide-slate-800/50">
                               {(player.trajectory || []).length > 0 ? (
                                 player.trajectory?.map((t, i) => (
                                   <tr key={i} className="hover:bg-slate-800/20 transition-colors">
                                     <td className="px-3 py-3 whitespace-nowrap">{t.season}</td>
                                     <td className="px-3 py-3 text-white truncate max-w-[120px]">{t.team}</td>
                                     <td className="px-3 py-3 truncate max-w-[80px]">{t.category}</td>
                                     <td className="px-3 py-3 text-center">{t.minutes}</td>
                                     <td className="px-3 py-3 text-center">{t.matches_played}</td>
                                     <td className="px-3 py-3 text-center">{t.starts}</td>
                                     <td className="px-3 py-3 text-center">{t.substitutes}</td>
                                     <td className="px-3 py-3 text-center text-emerald-500">{t.goals}</td>
                                     <td className="px-3 py-3 text-center text-blue-500">{t.assists}</td>
                                     <td className="px-3 py-3 text-center text-amber-500">{t.yellow_cards}</td>
                                     <td className="px-3 py-3 text-center text-red-500">{t.red_cards}</td>
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
                   <div className="bg-slate-900/40 border border-slate-800/80 rounded-[2.5rem] p-8 shadow-xl backdrop-blur-sm flex flex-col gap-8 justify-between">
                      <div className="flex items-center justify-between">
                         <h3 className="text-[11px] font-black text-emerald-500 uppercase tracking-widest italic font-sans">DEMARCACIÓN</h3>
                         <div className="p-2 bg-slate-950 rounded-lg border border-slate-800"><MapPin size={16} className="text-emerald-500" /></div>
                      </div>
                      <PitchMap position={player.main_position} secondaryPositions={player.secondary_positions} />
                      <div className="space-y-3">
                         <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-3xl shadow-inner flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.7)] shrink-0" />
                            <div>
                               <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest opacity-70">Principal</p>
                               <p className="text-sm font-black text-white italic tracking-tight">{player.main_position}</p>
                            </div>
                         </div>
                         {(player.secondary_positions || []).filter(Boolean).map((pos, i) => (
                           <div key={i} className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-3xl shadow-inner flex items-center gap-3">
                              <div className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.7)] shrink-0" />
                              <div>
                                 <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest opacity-70">{i === 0 ? '2ª Posición' : '3ª Posición'}</p>
                                 <p className="text-sm font-black text-amber-300 italic tracking-tight">{pos}</p>
                              </div>
                           </div>
                         ))}
                         {(player.secondary_positions || []).filter(Boolean).length === 0 && (
                           <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-3xl shadow-inner">
                              <p className="text-xs text-slate-600 italic">Sin posiciones secundarias</p>
                           </div>
                         )}
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
                           fisicas:    { label:'FÍSICAS',    color:'#10b981', stroke:'#10b981', fill:'rgba(16,185,129,0.22)',  badge:'#052e16' },
                           tecnicas:   { label:'TÉCNICAS',   color:'#60a5fa', stroke:'#60a5fa', fill:'rgba(96,165,250,0.22)',  badge:'#1e3a5f' },
                           tacticas:   { label:'TÁCTICAS',   color:'#a78bfa', stroke:'#a78bfa', fill:'rgba(167,139,250,0.22)', badge:'#2e1065' },
                           cognitivas: { label:'COGNITIVAS', color:'#fbbf24', stroke:'#fbbf24', fill:'rgba(251,191,36,0.20)',  badge:'#422006' },
                         } as const;
                         const area = areaMap[catId];
                         const attrs = RATING_CATEGORIES[catId];
                         const W=560, H=600, cx=W/2, cy=H/2+10, R=155, RINGS=5;
                         const LABEL_R = R + 74, BADGE_R = R + 20;
                         const n=attrs.length, step=(2*Math.PI)/n, start=-Math.PI/2;
                         const pt=(a:number,r:number)=>({x:cx+r*Math.cos(a),y:cy+r*Math.sin(a)});
                         const vals=attrs.map(attr=>{
                           const raw=Number(formData[attr.field as keyof Player])||0;
                           return {label:attr.label, raw, norm:raw/5};
                         });
                         const polygon=vals.map((d,i)=>{
                           const a=start+i*step;
                           return `${cx+d.norm*R*Math.cos(a)},${cy+d.norm*R*Math.sin(a)}`;
                         }).join(' ');
                         const textAnch=(a:number)=>Math.cos(a)>0.2?'start':Math.cos(a)<-0.2?'end':'middle';
                         const firstDy=(a:number)=>Math.sin(a)<-0.35?'-1.1em':Math.sin(a)>0.35?'0.1em':'-0.55em';
                         return (
                           <div key={catId} className="rounded-2xl overflow-hidden border border-slate-700/30 shadow-2xl" style={{background:'#080c14'}}>
                             <div className="text-center pt-5 pb-1 px-4">
                               <p className="text-[9px] font-black uppercase tracking-[0.35em] italic" style={{color:area.color}}>Radar · {area.label}</p>
                             </div>
                             <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="block">
                               {/* Anillos */}
                               {Array.from({length:RINGS}).map((_,ri)=>(
                                 <circle key={ri} cx={cx} cy={cy} r={R*((ri+1)/RINGS)}
                                   fill="none"
                                   stroke={ri===RINGS-1?'#1e2d3d':'#111827'}
                                   strokeWidth={ri===RINGS-1?1.5:0.75}
                                   strokeDasharray={ri<RINGS-1?'2 4':''}
                                 />
                               ))}
                               {/* Escala */}
                               {[1,2,3,4,5].map(v=>(
                                 <text key={v} x={cx+5} y={cy-R*(v/5)+4}
                                   fill="#2d3f50" fontSize={8} fontWeight="800" fontFamily="system-ui,sans-serif">{v}</text>
                               ))}
                               {/* Ejes */}
                               {vals.map((_,i)=>{const a=start+i*step,o=pt(a,R);return<line key={i} x1={cx} y1={cy} x2={o.x} y2={o.y} stroke="#1f2937" strokeWidth={1}/>;}) }
                               {/* Polígono */}
                               <polygon points={polygon} fill={area.fill} stroke="none"/>
                               <polygon points={polygon} fill="none" stroke={area.stroke} strokeWidth={2.5} strokeLinejoin="round" opacity={0.95}/>
                               {/* Badges y etiquetas */}
                               {vals.map((d,i)=>{
                                 const a=start+i*step;
                                 const bp=pt(a,BADGE_R), lp=pt(a,LABEL_R);
                                 const anch=textAnch(a);
                                 const words=d.label.split(' ');
                                 return(
                                   <g key={i}>
                                     <circle cx={cx+d.norm*R*Math.cos(a)} cy={cy+d.norm*R*Math.sin(a)}
                                       r={4} fill={area.stroke} opacity={d.raw>0?1:0}/>
                                     <rect x={bp.x-15} y={bp.y-12} width={30} height={22} rx={5}
                                       fill={area.badge} stroke={area.stroke} strokeWidth={0.75}/>
                                     <text x={bp.x} y={bp.y+5} textAnchor="middle"
                                       fill="white" fontSize={11} fontWeight="900" fontFamily="system-ui,sans-serif">
                                       {d.raw||'–'}
                                     </text>
                                     <text x={lp.x} y={lp.y} textAnchor={anch}
                                       fill="#94a3b8" fontSize={9.5} fontWeight="700" fontFamily="system-ui,sans-serif">
                                       {words.length===1
                                         ?<tspan dominantBaseline="middle">{d.label}</tspan>
                                         :words.map((w,wi)=>(
                                           <tspan key={wi} x={lp.x} dy={wi===0?firstDy(a):'1.2em'}>{w}</tspan>
                                         ))
                                       }
                                     </text>
                                   </g>
                                 );
                               })}
                             </svg>
                             <p className="text-center text-[8px] font-black text-slate-800 uppercase tracking-[0.2em] pb-3">AS Pro Scout · Escala 1–5</p>
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
                      {renderDataField('Nombre Completo', 'full_name')}
                      {renderDataField('Nacionalidad', 'nationality')}
                   </div>

                   {/* Bloque Nacimiento */}
                   <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {renderDataField('Fecha Nacimiento', 'birth_date', 'date')}
                      {renderDataField('Año Nacimiento', 'birth_year', 'number')}
                      <div className="bg-slate-900/30 border border-slate-800/50 rounded-2xl p-4 space-y-3 relative group">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Edad Calculada</label>
                        <p className="text-sm font-black text-emerald-400">
                          {formData.calculated_age != null ? `${formData.calculated_age} años` : '—'}
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
                          {calculateCategory(formData.birth_year || 0)}
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
                {/* Visual Indicators Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { label: 'Valoración Global', value: player.global_rating, color: 'text-white' },
                    { label: 'Potencial Estimado', value: player.rating_potential || player.potential_rating, color: 'text-emerald-500' },
                    { label: 'Encaje en el Club', value: player.rating_club_fit, color: 'text-blue-500' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center text-center shadow-xl">
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{stat.label}</p>
                       <div className="flex items-end gap-1">
                          <p className={cn("text-4xl font-black italic", stat.color)}>{formatRating(stat.value)}</p>
                          <p className="text-xs font-black text-slate-700 mb-1">/ 5.0</p>
                       </div>
                       <div className="w-full bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(Number(stat.value) || 0) * 20}%` }}
                            className={cn("h-full rounded-full", stat.color.replace('text-', 'bg-'))} 
                          />
                       </div>
                    </div>
                  ))}
                </div>

                {/* Detailed Ratings Grid */}
                <div>
                   <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4 px-2 flex items-center gap-2">
                     <Settings size={14} className="text-emerald-500" /> Valoraciones Detalladas
                   </h3>
                   <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                      {renderRatingField('Técnica', 'rating_technical')}
                      {renderRatingField('Táctica', 'rating_tactical')}
                      {renderRatingField('Físico', 'rating_physical')}
                      {renderRatingField('Mentalidad', 'rating_mental')}
                      {renderRatingField('Competitividad', 'rating_competitive')}
                      {renderRatingField('Toma de Decisiones', 'rating_decision_making')}
                      {renderRatingField('Ritmo de Juego', 'rating_pace')}
                      {renderRatingField('Inteligencia Táctica', 'rating_intelligence')}
                      {renderRatingField('Personalidad', 'rating_personality')}
                      {renderRatingField('Potencial', 'rating_potential')}
                      {renderRatingField('Encaje Club', 'rating_club_fit')}
                   </div>
                </div>

                {/* Analysis Text Blocks */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                   {renderTextAreaField('Fortalezas', 'technical_profile', 'Análisis de virtudes técnicas/tácticas...')}
                   {renderTextAreaField('Debilidades', 'tactical_profile', 'Aspectos a corregir o mejorar...')}
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
                <div className="flex items-center justify-between mb-4">
                   <h3 className="text-xs font-black text-white uppercase tracking-widest">Informes Registrados</h3>
                   <button onClick={onCreateReport} className="text-[10px] font-black text-emerald-500 uppercase hover:text-emerald-400">Ver Detalles</button>
                </div>
                {reports.map((report) => (
                  <div key={report.id} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 flex items-center justify-between group hover:border-emerald-500/30 transition-all cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center font-black text-emerald-500 text-xl">{report.match_rating}</div>
                      <div>
                        <p className="font-bold text-white text-sm">Observador: Principal</p>
                        <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest">{format(new Date(report.report_date), "dd MMMM yyyy", { locale: es })}</p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-slate-700 group-hover:text-emerald-500 transition-all" />
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
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {videos.map(v => (
                  <div key={v.id} className="bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 group hover:border-purple-500/30 transition-all">
                    <div className="aspect-video bg-slate-950 flex items-center justify-center relative">
                      <Video size={40} className="text-slate-800 group-hover:text-purple-500/50 transition-all" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl text-[10px] font-black text-white border border-white/20">REPRODUCIR</button>
                      </div>
                    </div>
                    <div className="p-4 bg-slate-900/80">
                      <p className="text-xs font-bold text-slate-200 truncate">{v.title}</p>
                      <p className="text-[9px] font-black text-slate-500 mt-1 uppercase tracking-widest">Clip de video</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'seguimiento' && (
              <div className="bg-slate-900/50 border border-slate-800 rounded-[2rem] p-8">
                 <h3 className="text-xs font-black text-white uppercase tracking-widest mb-8 flex items-center gap-2"><TrendingUp size={16}/> Historial Seguimiento</h3>
                 <div className="space-y-8 relative before:absolute before:left-[11px] before:top-2 before:bottom-0 before:w-px before:bg-slate-800">
                    {(player.tracking_history || [
                      { date: new Date().toISOString(), note: 'Añadido inicialmente al radar tras observar potencial en partido de liga.', status: 'TRACKING' }
                    ]).map((h, i) => (
                       <div key={i} className="flex gap-6 relative">
                          <div className={cn("w-[23px] h-[23px] rounded-full border-4 border-slate-950 shrink-0 z-10", getTrafficLightColor(h.status))} />
                          <div className="space-y-2">
                             <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{format(new Date(h.date), "dd MMM yyyy", { locale: es })}</span>
                                <span className="px-2 py-0.5 rounded bg-slate-800 text-[8px] font-bold text-slate-300 uppercase">{h.status}</span>
                             </div>
                             <p className="text-sm font-medium text-slate-200 leading-relaxed italic">"{h.note}"</p>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
            )}

            {activeTab === 'decision' && (
              <div className="bg-slate-900/50 border border-slate-800 rounded-[2rem] p-8 max-w-2xl mx-auto text-center space-y-8">
                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-500">
                   <Gavel size={40} />
                </div>
                <div>
                   <h3 className="text-2xl font-black text-white uppercase italic italic tracking-tighter">Decisión del Club</h3>
                   <p className="text-slate-500 text-sm mt-2 font-bold">Evaluación final para la toma de decisiones ejecutivas</p>
                </div>
                
                <div className="p-8 bg-slate-950/50 border border-slate-800 rounded-3xl space-y-6">
                   <div className="flex items-center justify-between text-left">
                      <div>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Estado Final Candidato</p>
                        <p className="text-lg font-black text-emerald-500 uppercase mt-1 italic italic truncate">{player.decision_final || 'OBSERVACIÓN CONTINUA'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Fecha Estimada</p>
                        <p className="text-sm font-bold text-white mt-1 italic">{player.decision_date || 'PRÓXIMO MERCADO'}</p>
                      </div>
                   </div>
                   <button className="w-full py-4 bg-emerald-600 text-slate-950 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-lg active:scale-95">RECOMENDAR FICHAJE</button>
                   <button className="w-full py-4 bg-slate-900 border border-slate-800 text-slate-400 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:text-white transition-all">POSPONER DECISIÓN</button>
                </div>
              </div>
            )}

            {activeTab === 'historial' && (
              <div className="bg-slate-900/50 border border-slate-800 rounded-[2rem] p-8">
                 <h3 className="text-xs font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2"><History size={16}/> Historial de Cambios</h3>
                 {history.length > 0 && (
                   <div className="grid grid-cols-1 gap-4 mb-4">
                      {history.map((entry) => (
                        <div key={entry.id} className="flex items-start gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
                           <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center shrink-0"><MousePointer2 size={16}/></div>
                           <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-200 break-words">Se actualizÃ³ <span className="text-emerald-400">{entry.field}</span></p>
                              <p className="text-[11px] text-slate-400 mt-1 break-words">{entry.old_value || 'vacÃ­o'} {' -> '} {entry.new_value || 'vacÃ­o'}</p>
                              <p className="text-[10px] text-slate-500 mt-2 uppercase tracking-widest">{format(new Date(entry.created_at), "dd MMMM yyyy - HH:mm", { locale: es })}</p>
                           </div>
                        </div>
                      ))}
                   </div>
                 )}
                 <div className={cn("grid grid-cols-1 gap-4 opacity-50", history.length > 0 && "hidden")}>
                    <div className="flex items-center gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
                       <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center"><MousePointer2 size={16}/></div>
                       <div>
                          <p className="text-xs font-bold text-slate-200">TodavÃ­a no hay cambios registrados para este jugador</p>
                          <p className="text-[10px] text-slate-500">El historial aparecerÃ¡ aquÃ­ cuando guardes cambios del perfil</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
                       <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center"><User size={16}/></div>
                       <div>
                          <p className="text-xs font-bold text-slate-200">Nuevo informe añadido por Scout #3</p>
                          <p className="text-[10px] text-slate-500">18 MAYO 2024 - 09:12</p>
                       </div>
                    </div>
                 </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
