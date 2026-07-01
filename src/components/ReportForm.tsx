import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, Save, Star, FileText, Smartphone, Monitor, 
  Mic, Plus, Trash2, Info, LayoutDashboard, Zap, 
  Activity, Brain, Target, Sparkles, Loader2, Wand2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Player, Match, Report, TrajectoryEntry, CustomRating } from '../types';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

// ── GK Radar: 10-vertex chart combining two 5-attr GK categories ─────────────
interface GKRadarCat {
  label: string;
  color: string;       // stroke/fill color (e.g. '#06b6d4')
  textColor: string;   // tailwind class for the title
  attrs: ReadonlyArray<{ label: string; field: string }>;
}

function GKRadarChart({
  catA, catB, values,
}: { catA: GKRadarCat; catB: GKRadarCat; values: Record<string, number> }) {
  const cx = 130; const cy = 130; const r = 90;
  const N = 10;
  const allAttrs = [...catA.attrs, ...catB.attrs]; // 10 total
  const colors  = [...Array(5).fill(catA.color), ...Array(5).fill(catB.color)];

  const pt = (i: number, scale: number) => {
    const angle = (Math.PI * 2 * i) / N - Math.PI / 2;
    return { x: cx + scale * r * Math.cos(angle), y: cy + scale * r * Math.sin(angle) };
  };

  // Concentric reference circles
  const refs = [0.2, 0.4, 0.6, 0.8, 1.0];

  // Polygon for actual values
  const polyPts = allAttrs.map((a, i) => {
    const v = Math.min(Math.max(Number(values[a.field]) || 0, 0), 5) / 5;
    return pt(i, v);
  });
  const polyStr = polyPts.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <div className="bg-slate-950/60 rounded-[1.5rem] border border-slate-800/60 p-5 space-y-3">
      {/* Legend */}
      <div className="flex items-center justify-between px-1">
        <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: catA.color }}>{catA.label}</span>
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">+</span>
        <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: catB.color }}>{catB.label}</span>
      </div>
      <svg viewBox="0 0 260 260" className="w-full max-w-[260px] mx-auto">
        {/* Reference rings */}
        {refs.map(s => (
          <polygon
            key={s}
            points={Array.from({length: N}, (_, i) => { const p = pt(i, s); return `${p.x},${p.y}`; }).join(' ')}
            fill="none" stroke="#1e293b" strokeWidth="1"
          />
        ))}
        {/* Axis lines */}
        {allAttrs.map((_, i) => {
          const end = pt(i, 1);
          return <line key={i} x1={cx} y1={cy} x2={end.x} y2={end.y} stroke="#1e293b" strokeWidth="1" />;
        })}
        {/* Axis dots colored by category */}
        {allAttrs.map((_, i) => {
          const end = pt(i, 1.05);
          return <circle key={i} cx={end.x} cy={end.y} r="3" fill={colors[i]} opacity="0.6" />;
        })}
        {/* Value polygon */}
        <polygon
          points={polyStr}
          fill={catA.color}
          fillOpacity="0.12"
          stroke={catA.color}
          strokeWidth="1.5"
          strokeOpacity="0.7"
        />
        {/* Dots on vertices */}
        {polyPts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill={colors[i]} opacity="0.9" />
        ))}
        {/* Labels */}
        {allAttrs.map((a, i) => {
          const lp = pt(i, 1.28);
          const short = a.label.length > 12 ? a.label.substring(0, 11) + '…' : a.label;
          return (
            <text
              key={i}
              x={lp.x}
              y={lp.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="7"
              fontWeight="700"
              fill={colors[i]}
              opacity="0.85"
            >
              {short}
            </text>
          );
        })}
        {/* Center value avg */}
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize="9" fontWeight="900" fill="#94a3b8">
          {(allAttrs.reduce((s, a) => s + (Number(values[a.field]) || 0), 0) / N).toFixed(1)}
        </text>
      </svg>
    </div>
  );
}

const OBSERVER_ROLE_OPTIONS = [
  { value: 'SCOUT',     label: 'Scout General' },
  { value: 'SCOUT_F11', label: 'Scout F11' },
  { value: 'SCOUT_F8',  label: 'Scout F8' },
  { value: 'ENTREN',    label: 'Entrenador' },
  { value: 'COORD',     label: 'Coordinador' },
  { value: 'COORD_F11', label: 'Coordinador F11' },
  { value: 'COORD_F8',  label: 'Coordinador F8' },
  { value: 'PRESID',    label: 'Presidente' },
  { value: 'ADMIN',     label: 'Administrador' },
];

const POSITION_OPTIONS = [
  { value: 'POR', label: 'POR – Portero' },
  { value: 'DFC', label: 'DFC – Defensa Central' },
  { value: 'LD',  label: 'LD – Lateral Derecho' },
  { value: 'LI',  label: 'LI – Lateral Izquierdo' },
  { value: 'MCD', label: 'MCD – Mediocentro Defensivo' },
  { value: 'MC',  label: 'MC – Mediocentro' },
  { value: 'MCO', label: 'MCO – Mediapunta' },
  { value: 'ED',  label: 'ED – Extremo Derecho' },
  { value: 'EI',  label: 'EI – Extremo Izquierdo' },
  { value: 'SD',  label: 'SD – Segunda Delantero' },
  { value: 'DC',  label: 'DC – Delantero Centro' },
];

const GK_RATING_CATEGORIES = {
  gk_bajo_palos: {
    label: 'BAJO PALOS',
    color: 'bg-cyan-500/80',
    textColor: 'text-cyan-400',
    attrs: [
      { label: 'Reflejos',                field: 'rating_velo_reac',   tooltip: 'Velocidad de reacción ante el disparo.' },
      { label: 'Agilidad bajo palos',     field: 'rating_agil',        tooltip: 'Capacidad de desplazarse y cubrir el ángulo.' },
      { label: 'Colocación / posición',   field: 'rating_posic',       tooltip: 'Posicionamiento óptimo según el peligro.' },
      { label: 'Potencia de salto',       field: 'rating_poten',       tooltip: 'Explosividad en el salto para cubrir el arco.' },
      { label: 'Coordinación',            field: 'rating_coord',       tooltip: 'Sincronía de cuerpo y manos en la parada.' },
    ],
  },
  gk_con_balon: {
    label: 'CON EL BALÓN',
    color: 'bg-blue-500/80',
    textColor: 'text-blue-400',
    attrs: [
      { label: 'Juego pie (corto)',        field: 'rating_pase_corto',    tooltip: 'Construcción en corto con el pie.' },
      { label: 'Saque largo / distrib.',   field: 'rating_pase_largo',    tooltip: 'Precisión en envíos largos para iniciar jugada.' },
      { label: 'Control / amortiguación',  field: 'rating_ctrl_balon',    tooltip: 'Calidad del primer toque en balones en juego.' },
      { label: 'Despeje / puñetazo',       field: 'rating_despeje',       tooltip: 'Calidad del despeje bajo presión.' },
      { label: 'Pierna no dominante',      field: 'rating_pierna_menos',  tooltip: 'Pie contrario en situaciones de construcción.' },
    ],
  },
  gk_salidas: {
    label: 'SALIDAS Y AÉREO',
    color: 'bg-violet-500/80',
    textColor: 'text-violet-400',
    attrs: [
      { label: 'Dominio del área',          field: 'rating_juego_aereo',   tooltip: 'Reclamación segura de centros.' },
      { label: 'Lectura de salidas',         field: 'rating_dom_espacios',  tooltip: 'Capacidad de leer cuándo salir o quedarse.' },
      { label: 'Posición en 1vs1',           field: 'rating_marcajes',      tooltip: 'Posicionamiento ante remates en mano a mano.' },
      { label: 'Fortaleza en choques',       field: 'rating_fuerza',        tooltip: 'Resistencia física en salidas con contacto.' },
      { label: 'Resistencia / concentr.',    field: 'rating_resis',         tooltip: 'Mantener el nivel y foco los 90 minutos.' },
    ],
  },
  gk_mental: {
    label: 'MENTAL Y LIDERAZGO',
    color: 'bg-amber-500/80',
    textColor: 'text-amber-400',
    attrs: [
      { label: 'Liderazgo defensivo',  field: 'rating_liderazgo',    tooltip: 'Capacidad de organizar y dirigir la línea defensiva.' },
      { label: 'Comunicación',         field: 'rating_comunicacion', tooltip: 'Órdenes verbales claras y constantes a la defensa.' },
      { label: 'Mentalidad / foco',    field: 'rating_mentalidad',   tooltip: 'Concentración y respuesta tras encajar un gol.' },
      { label: 'Competitividad',       field: 'rating_competitiv',   tooltip: 'Actitud ante la adversidad y situaciones de tensión.' },
      { label: 'Personalidad',         field: 'rating_personalidad', tooltip: 'Seguridad en sí mismo y presencia en el campo.' },
    ],
  },
};

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

const SpeechToTextButton = ({ onTranscript, className }: { onTranscript: (text: string) => void, className?: string }) => {
  const [isListening, setIsListening] = useState(false);
  const [errorVisible, setErrorVisible] = useState(false);
  
  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Tu navegador no soporta reconocimiento de voz.");
      return;
    }
    
    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'es-ES';
      recognition.continuous = false;
      recognition.interimResults = false;
      
      recognition.onstart = () => {
        setIsListening(true);
        setErrorVisible(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setErrorVisible(true);
          setTimeout(() => setErrorVisible(false), 5000);
        }
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onTranscript(transcript);
      };
      
      recognition.start();
    } catch (err) {
      console.error('Failed to start recognition', err);
      setIsListening(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={startListening}
        className={cn(
          "p-2 rounded-lg transition-all flex items-center justify-center",
          isListening ? "bg-rose-500 text-white animate-pulse" : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700",
          className
        )}
        title="Dictado por voz"
      >
        <Mic size={14} className={cn(isListening && "animate-bounce")} />
      </button>
      
      <AnimatePresence>
        {errorVisible && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute right-0 bottom-full mb-2 w-48 p-2 bg-rose-950 border border-rose-500/30 rounded-lg text-[8px] font-bold text-rose-200 z-50 shadow-2xl leading-tight"
          >
            Permiso denegado. Pulsa el candado en la barra de direcciones y permite el micrófono.
          </motion.div>
        )}
        {isListening && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2 py-1 bg-emerald-600 text-slate-950 rounded-md text-[8px] font-black uppercase tracking-tighter whitespace-nowrap z-50"
          >
            Escuchando...
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface ReportFormProps {
  initialPlayerId?: string;
  initialMatchId?: string;
  initialMode?: 'RAPID' | 'COMPLETE';
  initialReport?: Report | null;
  players: Player[];
  matches: Match[];
  onSave: (data: Partial<Report> & Partial<Player>) => void;
  onCancel: () => void;
  userRole?: string;
  userId?: string;
}

export function ReportForm({
  initialPlayerId,
  initialMatchId,
  initialMode = 'RAPID',
  initialReport,
  players,
  matches,
  onSave,
  onCancel,
  userRole,
}: ReportFormProps) {
  const [editorMode, setEditorMode] = useState<'RAPID' | 'COMPLETE'>(initialMode);
  const [isListening, setIsListening] = useState(false);
  const [newAttr, setNewAttr] = useState('');
  
  const selectedPlayer = useMemo(() => 
    players.find(p => p.id === (initialPlayerId || '')), 
  [players, initialPlayerId]);

  const [formData, setFormData] = useState({
    player_id: initialReport?.player_id || initialPlayerId || '',
    match_id: initialReport?.match_id || initialMatchId || '',
    report_date: initialReport?.report_date 
      ? initialReport.report_date.split('T')[0] 
      : new Date().toISOString().split('T')[0],
    observer_role: (initialReport as any)?.observer_role || userRole || '',
    position_played: initialReport?.position_played || selectedPlayer?.main_position || '',
    minutes_observed: initialReport?.minutes_observed || 90,
    match_context: initialReport?.match_context || '',
    technical_comment: initialReport?.technical_comment || '',
    tactical_comment: initialReport?.tactical_comment || '',
    physical_comment: initialReport?.physical_comment || '',
    mental_comment: initialReport?.mental_comment || '',
    strengths: Array.isArray(initialReport?.strengths) ? initialReport.strengths.join(', ') : '',
    weaknesses: Array.isArray(initialReport?.weaknesses) ? initialReport.weaknesses.join(', ') : '',
    key_actions: initialReport?.key_actions || '',
    doubts: initialReport?.doubts || '',
    recommendation: (initialReport?.recommendation || 'TRACKING') as any,
    match_rating: initialReport?.match_rating || 3,
    next_step: initialReport?.next_step || '',
    // Family ratings for rapid mode
    rating_technical: initialReport?.rating_technical || selectedPlayer?.rating_technical || 0,
    rating_tactical: initialReport?.rating_tactical || selectedPlayer?.rating_tactical || 0,
    rating_physical: initialReport?.rating_physical || selectedPlayer?.rating_physical || 0,
    rating_mental: initialReport?.rating_mental || selectedPlayer?.rating_mental || 0,
    custom_ratings: (initialReport?.custom_ratings || selectedPlayer?.custom_ratings || []) as CustomRating[],
    // Personal Details (Ficha)
    lateralidad: selectedPlayer?.lateralidad || '',
    approximate_height: selectedPlayer?.approximate_height || '',
    weight_kg: selectedPlayer?.weight_kg || '',
    short_name: selectedPlayer?.short_name || '',
    competition: selectedPlayer?.competition || '',
    // All Ratings — individual attrs live on the Player record, not on the Report
    ...Object.values(RATING_CATEGORIES).flat().reduce((acc, attr) => ({
      ...acc,
      [attr.field]: selectedPlayer ? (selectedPlayer as any)[attr.field] || 0 : 0
    }), {}),
    ...Object.values(GK_RATING_CATEGORIES).flatMap(cat => cat.attrs).reduce((acc, attr) => ({
      ...acc,
      [attr.field]: selectedPlayer ? (selectedPlayer as any)[attr.field] || 0 : 0
    }), {})
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData as any);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto pb-40">
      <div className="flex flex-col md:flex-row md:items-center justify-between sticky top-0 bg-slate-950/90 backdrop-blur-xl py-4 md:py-6 z-40 border-b border-slate-800/80 gap-4 md:gap-6">
        <div className="flex items-center gap-4 md:gap-6 min-w-0">
          <button 
            type="button"
            onClick={onCancel}
            className="p-3 md:p-3.5 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 hover:text-white transition-all hover:bg-slate-800 shadow-xl shrink-0"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="space-y-1.5 min-w-0">
            <h1 className="text-lg md:text-2xl font-black text-slate-100 italic tracking-tighter">
              EDITOR DE INFORME
            </h1>
            <span className={cn(
              "inline-block text-[10px] font-black not-italic px-3 py-1 rounded-full border",
              editorMode === 'RAPID' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-blue-500/10 text-blue-500 border-blue-500/20"
            )}>
              {editorMode === 'RAPID' ? 'PIE DE CAMPO' : 'ANÁLISIS POSTERIORI'}
            </span>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest px-1 mt-1">
              {selectedPlayer ? selectedPlayer.full_name : 'Nuevo Registro'} • {formData.report_date}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-4">
          <div className="bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 flex shadow-inner">
            <button
              type="button"
              onClick={() => setEditorMode('RAPID')}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-[0.8rem] text-[10px] font-black uppercase tracking-widest transition-all",
                editorMode === 'RAPID' ? "bg-emerald-600 text-slate-950 shadow-lg" : "text-slate-500 hover:text-slate-300"
              )}
            >
              <Smartphone size={14} />
              Rápido
            </button>
            <button
              type="button"
              onClick={() => setEditorMode('COMPLETE')}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-[0.8rem] text-[10px] font-black uppercase tracking-widest transition-all",
                editorMode === 'COMPLETE' ? "bg-blue-600 text-slate-950 shadow-lg" : "text-slate-500 hover:text-slate-300"
              )}
            >
              <Monitor size={14} />
              Completo
            </button>
          </div>
          
          <button 
            type="submit"
            className="bg-slate-100 hover:bg-white text-slate-950 px-5 md:px-8 py-3.5 md:py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 md:gap-3 shadow-2xl active:scale-95 group whitespace-nowrap"
          >
            <Save size={18} className="group-hover:scale-110 transition-transform" />
            Finalizar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Basic Context Section */}
        <section className="lg:col-span-1 bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-8 space-y-8 backdrop-blur-sm">
          <div className="flex items-center gap-4 mb-4">
             <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                <Target size={20} />
             </div>
             <h3 className="text-xs font-black text-slate-100 uppercase tracking-widest">Contexto Base</h3>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Jugador</label>
              <select
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-slate-200 outline-none focus:border-emerald-500/50 appearance-none font-bold text-sm shadow-inner"
                value={formData.player_id}
                onChange={(e) => setFormData({...formData, player_id: e.target.value})}
              >
                <option value="">Seleccionar...</option>
                {players.map(p => (
                  <option key={p.id} value={p.id}>{p.full_name} ({p.club_name})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Partido / Match</label>
              <select
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-slate-200 outline-none focus:border-emerald-500/50 appearance-none font-bold text-xs shadow-inner"
                value={formData.match_id}
                onChange={(e) => setFormData({...formData, match_id: e.target.value})}
              >
                <option value="">General / Scouting</option>
                {matches.map(m => (
                  <option key={m.id} value={m.id}>{m.home_team} vs {m.away_team} ({format(new Date(m.date), "dd/MM/yy")})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Rol del Observador</label>
              <select
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-slate-200 outline-none focus:border-emerald-500/50 appearance-none font-bold text-xs shadow-inner"
                value={formData.observer_role}
                onChange={(e) => setFormData({...formData, observer_role: e.target.value})}
              >
                <option value="">— Sin especificar —</option>
                {OBSERVER_ROLE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Minutos</label>
                <input
                  type="number"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-slate-200 outline-none focus:border-emerald-500/50 font-black text-sm shadow-inner"
                  value={formData.minutes_observed}
                  onChange={(e) => setFormData({...formData, minutes_observed: Number(e.target.value)})}
                />
              </div>
              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">
                  Posición
                  {formData.position_played === 'POR' && (
                    <span className="ml-2 px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded-full text-[8px] tracking-widest animate-pulse">● PORTERO</span>
                  )}
                </label>
                <select
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-slate-200 outline-none focus:border-emerald-500/50 font-black text-sm shadow-inner appearance-none"
                  value={formData.position_played}
                  onChange={(e) => setFormData({...formData, position_played: e.target.value})}
                >
                  <option value="">— Seleccionar posición —</option>
                  {POSITION_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Rating Partido</label>
              <div className="flex justify-between items-center bg-slate-950/80 p-3 rounded-2xl border border-slate-800/50 shadow-inner">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setFormData({...formData, match_rating: val})}
                    className={cn(
                      "w-9 h-9 flex items-center justify-center rounded-xl transition-all",
                      formData.match_rating >= val ? "text-amber-500 bg-amber-500/10 shadow-lg" : "text-slate-700 hover:text-slate-500"
                    )}
                  >
                    <Star size={18} className={cn(formData.match_rating >= val && "fill-current")} />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Recomendación</label>
              <select
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-slate-200 outline-none focus:border-emerald-500/50 appearance-none font-bold text-xs shadow-inner"
                value={formData.recommendation}
                onChange={(e) => setFormData({...formData, recommendation: e.target.value as any})}
              >
                <option value="">Seleccionar estado...</option>
                <option value="NUEVO">Nuevo</option>
                <option value="PRIORIDAD">Prioridad</option>
                <option value="EN_SEGUIMIENTO">En Seguimiento</option>
                <option value="DESCARTADO">Descartado</option>
                <option value="OBSERVADO">Observado</option>
                <option value="INTERESANTE">Interesante</option>
                <option value="MUY_INTERESANTE">Muy Interesante</option>
                <option value="CONTACTADO">Contactado</option>
                <option value="EN_PRUEBA">En Prueba</option>
                <option value="FICHADO">Fichado</option>
                <option value="NO_DISPONIBLE">No Disponible</option>
              </select>
            </div>
          </div>
        </section>

        {/* Narrative Section (Rapid Mode / Left side of Complete) */}
        <section className={cn(
          "bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-10 backdrop-blur-sm relative overflow-hidden",
          editorMode === 'RAPID' ? 'lg:col-span-2' : 'lg:col-span-2'
        )}>
          {editorMode === 'RAPID' ? (
             <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="flex items-center gap-4 mb-2">
                   <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                      <Smartphone size={20} />
                   </div>
                   <h3 className="text-xs font-black text-slate-100 uppercase tracking-widest">Observaciones Rápidas</h3>
                </div>
                
                <div className="grid grid-cols-1 gap-6">
                   <div className="space-y-3">
                      <div className="flex items-center justify-between px-1">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Anotaciones Generales / Acciones Clave</label>
                        <SpeechToTextButton 
                          onTranscript={(t) => setFormData(prev => ({ ...prev, technical_comment: prev.technical_comment ? prev.technical_comment + ' ' + t : t }))} 
                        />
                      </div>
                      <textarea
                        placeholder="Describe acciones clave del jugador en el campo..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-3xl px-8 py-6 text-slate-200 outline-none focus:border-emerald-500/40 min-h-[180px] leading-relaxed text-sm shadow-inner placeholder:text-slate-800"
                        value={formData.technical_comment}
                        onChange={(e) => setFormData({...formData, technical_comment: e.target.value})}
                      />
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                         <div className="flex items-center justify-between px-1">
                           <label className="block text-[10px] font-black text-emerald-500 uppercase tracking-widest">Fortalezas detectadas</label>
                           <SpeechToTextButton 
                             onTranscript={(t) => setFormData(prev => ({ ...prev, strengths: prev.strengths ? prev.strengths + ', ' + t : t }))} 
                           />
                         </div>
                         <textarea
                           placeholder="Bullet points..."
                           className="w-full bg-slate-950 border border-emerald-500/10 rounded-3xl px-6 py-5 text-slate-200 outline-none focus:border-emerald-500/40 min-h-[120px] text-xs shadow-inner"
                           value={formData.strengths}
                           onChange={(e) => setFormData({...formData, strengths: e.target.value})}
                         />
                      </div>
                      <div className="space-y-3">
                         <div className="flex items-center justify-between px-1">
                           <label className="block text-[10px] font-black text-rose-500 uppercase tracking-widest">Dudas / Debilidades</label>
                           <SpeechToTextButton 
                             onTranscript={(t) => setFormData(prev => ({ ...prev, weaknesses: prev.weaknesses ? prev.weaknesses + ', ' + t : t }))} 
                           />
                         </div>
                         <textarea
                           placeholder="Aspectos a mejorar..."
                           className="w-full bg-slate-950 border border-rose-500/10 rounded-3xl px-6 py-5 text-slate-200 outline-none focus:border-rose-500/40 min-h-[120px] text-xs shadow-inner"
                           value={formData.weaknesses}
                           onChange={(e) => setFormData({...formData, weaknesses: e.target.value})}
                         />
                      </div>
                   </div>

                   {/* Family Overview Ratings for RAPID mode */}
                   <div className="pt-6 border-t border-slate-800/50">
                      <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4 px-1 italic">Valoración por Familias (Campo)</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                          { label: 'Técnico', field: 'rating_technical', icon: Zap, color: 'text-blue-400', bgColor: 'bg-blue-500' },
                          { label: 'Táctico', field: 'rating_tactical', icon: Activity, color: 'text-emerald-400', bgColor: 'bg-emerald-500' },
                          { label: 'Físico', field: 'rating_physical', icon: Zap, color: 'text-amber-400', bgColor: 'bg-amber-500' },
                          { label: 'Mental', field: 'rating_mental', icon: Brain, color: 'text-purple-400', bgColor: 'bg-purple-500' },
                        ].map((family) => (
                          <div key={family.field} className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/50 shadow-inner">
                             <div className="flex items-center gap-2 mb-3">
                                <family.icon size={12} className={family.color} />
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{family.label}</span>
                             </div>
                             <div className="flex gap-1">
                                {[1,2,3,4,5].map(v => (
                                  <button
                                     key={v}
                                     type="button"
                                     onClick={() => setFormData({...formData, [family.field]: v})}
                                     className={cn(
                                       "flex-1 h-2 rounded-full transition-all",
                                       (formData as any)[family.field] >= v ? family.bgColor : "bg-slate-800"
                                     )}
                                  />
                                ))}
                             </div>
                          </div>
                        ))}
                      </div>
                   </div>

                   {/* GK mini-ratings in RAPID mode */}
                   {formData.position_played === 'POR' && (
                     <div className="pt-6 border-t border-cyan-500/20 space-y-3">
                       <div className="flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                         <h4 className="text-[9px] font-black text-cyan-400 uppercase tracking-widest italic">Valoración Portero — Familias</h4>
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                         {[
                           { label: 'Bajo Palos', field: 'rating_velo_reac', color: 'text-cyan-400', bgColor: 'bg-cyan-500' },
                           { label: 'Con Balón',  field: 'rating_pase_corto', color: 'text-blue-400', bgColor: 'bg-blue-500' },
                           { label: 'Salidas',    field: 'rating_juego_aereo', color: 'text-violet-400', bgColor: 'bg-violet-500' },
                           { label: 'Liderazgo',  field: 'rating_liderazgo', color: 'text-amber-400', bgColor: 'bg-amber-500' },
                         ].map((family) => (
                           <div key={family.field} className="bg-slate-950/60 p-4 rounded-2xl border border-cyan-500/10 shadow-inner">
                             <div className="flex items-center gap-2 mb-3">
                               <span className={cn('text-[9px] font-black uppercase tracking-widest', family.color)}>{family.label}</span>
                             </div>
                             <div className="flex gap-1">
                               {[1,2,3,4,5].map(v => (
                                 <button
                                   key={v}
                                   type="button"
                                   onClick={() => setFormData({...formData, [family.field]: v})}
                                   className={cn('flex-1 h-2 rounded-full transition-all', (formData as any)[family.field] >= v ? family.bgColor : 'bg-slate-800')}
                                 />
                               ))}
                             </div>
                           </div>
                         ))}
                       </div>
                     </div>
                   )}

                   <div className="space-y-3 pt-4">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Plan de Seguimiento</label>
                      <input
                        placeholder="Ej: Volver a ver contra..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-slate-200 outline-none focus:border-emerald-500/40 text-xs shadow-inner"
                        value={formData.next_step}
                        onChange={(e) => setFormData({...formData, next_step: e.target.value})}
                      />
                   </div>
                </div>
             </div>
          ) : (
             <div className="space-y-12 animate-in fade-in slide-in-from-left-4 duration-700">
                <div className="flex items-center justify-between border-b border-slate-800 pb-8">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                         <Monitor size={20} />
                      </div>
                      <h3 className="text-sm font-black text-slate-100 uppercase tracking-[0.2em] italic">Análisis Profundo</h3>
                   </div>
                   <div className="flex items-center gap-2 px-4 py-2 bg-slate-950 rounded-full border border-slate-800">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Escala 1-5</span>
                   </div>
                </div>

                {/* All rating categories for Complete editor */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                   {Object.entries(RATING_CATEGORIES).map(([catId, attributes]) => (
                      <div key={catId} className="space-y-6 bg-slate-950/40 p-8 rounded-[2rem] border border-slate-800/60 shadow-xl group">
                         <div className="flex items-center gap-3 mb-2">
                           <h4 className="text-[11px] font-black text-slate-100 uppercase tracking-[0.3em] bg-slate-900 px-4 py-2 rounded-xl italic border border-slate-800">{catId}</h4>
                         </div>
                         <div className="space-y-5">
                            {attributes.map((attr, i) => {
                               const val = (formData as any)[attr.field] || 0;
                               return (
                               <div key={i} className="space-y-2 group/row relative">
                                   <div className="flex items-center justify-between px-1">
                                      <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover/row:text-slate-300 transition-colors border-b border-dotted border-slate-800">{attr.label}</span>
                                        <div className="group/tip relative">
                                           <Info size={10} className="text-slate-700 hover:text-slate-500 cursor-help" />
                                           <div className="absolute left-0 bottom-full mb-2 w-48 p-2 bg-slate-950 border border-slate-800 rounded-lg text-[9px] text-slate-400 invisible group-hover/tip:visible z-50 shadow-2xl">
                                              {(attr as any).tooltip}
                                           </div>
                                        </div>
                                      </div>
                                      <span className="text-xs font-black text-blue-500 font-mono italic">{val}</span>
                                   </div>
                                   <div className="flex gap-1.5">
                                      {[1, 2, 3, 4, 5].map(v => (
                                         <button
                                           key={v}
                                           type="button"
                                           onClick={() => setFormData({...formData, [attr.field]: v})}
                                           className={cn(
                                             "flex-1 h-3.5 rounded-full transition-all border border-slate-800/50",
                                             val >= v ? "bg-blue-500/80 shadow-[0_0_10px_rgba(59,130,246,0.3)] border-blue-400/20" : "bg-slate-900 border-slate-800/20 hover:bg-slate-800"
                                           )}
                                         />
                                      ))}
                                   </div>
                                 </div>
                               );
                            })}

                            {/* Custom Attributes for Especificas */}
                            {catId === 'especificas' && (
                              <div className="pt-6 border-t border-slate-800/50 mt-6 space-y-4">
                                <div className="flex items-center gap-2">
                                   <input 
                                     placeholder="Nueva característica..."
                                     className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-[10px] font-bold text-white outline-none focus:border-blue-500/50"
                                     value={newAttr}
                                     onChange={(e) => setNewAttr(e.target.value)}
                                   />
                                   <button 
                                     type="button"
                                     onClick={() => {
                                       if (newAttr.trim()) {
                                         setFormData({
                                           ...formData,
                                           custom_ratings: [...(formData.custom_ratings || []), { label: newAttr.trim(), value: 0 }]
                                         });
                                         setNewAttr('');
                                       }
                                     }}
                                     className="px-4 py-2 bg-blue-600 text-slate-950 rounded-xl text-[9px] font-black hover:bg-blue-500 transition-all shadow-lg"
                                   >
                                     AÑADIR
                                   </button>
                                </div>
                                
                                <div className="space-y-4">
                                  {(formData.custom_ratings || []).map((cr, idx) => (
                                    <div key={idx} className="space-y-2 group/row">
                                      <div className="flex items-center justify-between px-1">
                                        <span className="text-[10px] font-black text-amber-500 truncate">{cr.label}</span>
                                        <div className="flex items-center gap-4">
                                           <span className="text-xs font-black text-amber-500 font-mono italic">{cr.value}</span>
                                           <button 
                                             type="button" 
                                             onClick={() => {
                                               const updated = [...(formData.custom_ratings || [])];
                                               updated.splice(idx, 1);
                                               setFormData({...formData, custom_ratings: updated});
                                             }}
                                             className="text-slate-700 hover:text-red-500"
                                           >
                                             <Trash2 size={12} />
                                           </button>
                                        </div>
                                      </div>
                                      <div className="flex gap-1.5">
                                        {[1, 2, 3, 4, 5].map(v => (
                                          <button
                                            key={v}
                                            type="button"
                                            onClick={() => {
                                              const updated = [...(formData.custom_ratings || [])];
                                              updated[idx] = { ...updated[idx], value: v };
                                              setFormData({...formData, custom_ratings: updated});
                                            }}
                                            className={cn(
                                              "flex-1 h-3 rounded-full transition-all border border-slate-800/50",
                                              cr.value >= v ? "bg-amber-500/80 shadow-[0_0_8px_rgba(245,158,11,0.2)]" : "bg-slate-900 border-slate-800/20"
                                            )}
                                          />
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                         </div>
                      </div>
                   ))}
                </div>

                {/* ── BLOQUE ESPECÍFICO PORTERO ─────────────────────────── */}
                {formData.position_played === 'POR' && (
                  <div className="space-y-6 pt-8 border-t border-cyan-500/20">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 px-4 py-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-full">
                        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                        <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.25em]">Análisis específico de portero</span>
                      </div>
                    </div>
                    {/* GK Radar Charts: Bajo Palos+Salidas / Con Balón+Mental */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                      <GKRadarChart
                        catA={{ ...GK_RATING_CATEGORIES.gk_bajo_palos, color: '#06b6d4', textColor: 'text-cyan-400' }}
                        catB={{ ...GK_RATING_CATEGORIES.gk_salidas,    color: '#8b5cf6', textColor: 'text-violet-400' }}
                        values={formData as any}
                      />
                      <GKRadarChart
                        catA={{ ...GK_RATING_CATEGORIES.gk_con_balon, color: '#3b82f6', textColor: 'text-blue-400' }}
                        catB={{ ...GK_RATING_CATEGORIES.gk_mental,    color: '#f59e0b', textColor: 'text-amber-400' }}
                        values={formData as any}
                      />
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                      {Object.entries(GK_RATING_CATEGORIES).map(([catId, cat]) => (
                        <div key={catId} className="space-y-6 bg-slate-950/40 p-8 rounded-[2rem] border border-slate-800/60 shadow-xl">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className={cn('text-[11px] font-black uppercase tracking-[0.3em] bg-slate-900 px-4 py-2 rounded-xl italic border border-slate-800', cat.textColor)}>{cat.label}</h4>
                          </div>
                          <div className="space-y-5">
                            {cat.attrs.map((attr, i) => {
                              const val = (formData as any)[attr.field] || 0;
                              return (
                                <div key={i} className="space-y-2 group/row relative">
                                  <div className="flex items-center justify-between px-1">
                                    <div className="flex items-center gap-2">
                                      <span className={cn('text-[10px] font-black uppercase tracking-widest group-hover/row:text-slate-300 transition-colors border-b border-dotted border-slate-800', val > 0 ? cat.textColor : 'text-slate-500')}>{attr.label}</span>
                                      <div className="group/tip relative">
                                        <Info size={10} className="text-slate-700 hover:text-slate-500 cursor-help" />
                                        <div className="absolute left-0 bottom-full mb-2 w-48 p-2 bg-slate-950 border border-slate-800 rounded-lg text-[9px] text-slate-400 invisible group-hover/tip:visible z-50 shadow-2xl">
                                          {attr.tooltip}
                                        </div>
                                      </div>
                                    </div>
                                    <span className={cn('text-xs font-black font-mono italic', cat.textColor)}>{val}</span>
                                  </div>
                                  <div className="flex gap-1.5">
                                    {[1, 2, 3, 4, 5].map(v => (
                                      <button
                                        key={v}
                                        type="button"
                                        onClick={() => setFormData({...formData, [attr.field]: v})}
                                        className={cn(
                                          'flex-1 h-3.5 rounded-full transition-all border border-slate-800/50',
                                          val >= v ? `${cat.color} shadow-inner border-transparent` : 'bg-slate-900 border-slate-800/20 hover:bg-slate-800'
                                        )}
                                      />
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

                {/* Additional Narrative for Complete */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 pt-8 border-t border-slate-800">
                    {[
                      { label: 'Perfil Técnico Extendido', field: 'technical_comment', color: 'text-blue-400' },
                      { label: 'Perfil Táctico Extendido', field: 'tactical_comment', color: 'text-emerald-400' },
                      { label: 'Perfil Físico Extendido', field: 'physical_comment', color: 'text-amber-400' },
                      { label: 'Perfil Mental/Cognitivo', field: 'mental_comment', color: 'text-purple-400' },
                    ].map(section => (
                      <div key={section.field} className="space-y-4">
                         <div className="flex items-center justify-between px-1">
                            <label className={cn("block text-[10px] font-black uppercase tracking-widest", section.color)}>{section.label}</label>
                            <SpeechToTextButton 
                              onTranscript={(t) => setFormData(prev => ({ 
                                ...prev, 
                                [section.field]: (prev as any)[section.field] ? (prev as any)[section.field] + ' ' + t : t 
                              }))} 
                            />
                         </div>
                         <textarea 
                           className="w-full bg-slate-950 border border-slate-800 rounded-3xl px-6 py-5 text-slate-200 outline-none focus:border-blue-500/30 text-xs min-h-[120px] shadow-inner leading-relaxed"
                           value={(formData as any)[section.field]}
                           onChange={(e) => setFormData({...formData, [section.field]: e.target.value})}
                         />
                      </div>
                    ))}
                </div>
             </div>
          )}
        </section>
      </div>

      {/* Trajectory / Ficha Block (Only in Complete Mode) */}
      {editorMode === 'COMPLETE' && (
         <section className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-10 backdrop-blur-sm animate-in slide-in-from-bottom-8 duration-700">
            <div className="flex items-center gap-4 mb-10">
               <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                  <LayoutDashboard size={20} />
               </div>
               <h3 className="text-xs font-black text-slate-100 uppercase tracking-widest">Detalle de Ficha y Estructura</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
               {[
                 { label: 'NOMBRE CORTO', field: 'short_name' },
                 { label: 'COMPETICIÓN', field: 'competition' },
                 { label: 'LATERALIDAD', field: 'lateralidad' },
                 { label: 'ALTURA (CM)', field: 'approximate_height', type: 'number' },
                 { label: 'PESO (KG)', field: 'weight_kg', type: 'number' }
               ].map((field, i) => (
                 <div key={i}>
                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">{field.label}</label>
                    <input 
                      type={field.type || 'text'}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-slate-200 outline-none focus:border-amber-500/30 font-black text-xs shadow-inner"
                      value={(formData as any)[field.field]}
                      onChange={(e) => setFormData({...formData, [field.field]: e.target.value})}
                    />
                 </div>
               ))}
            </div>

            {/* Trajectory Editor */}
            <div className="mt-12 pt-10 border-t border-slate-800/50">
               <div className="flex items-center justify-between mb-8">
                  <div className="space-y-1">
                     <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Actualización de Trayectoria</h4>
                     <p className="text-xs font-bold text-slate-400 italic">Añade hitos de temporadas pasadas o la actual</p>
                  </div>
                  <div className="px-3 py-1 bg-slate-950 border border-slate-800 rounded-lg text-[9px] font-black text-amber-500 uppercase italic">Historial</div>
               </div>
               
               <div className="bg-slate-950/40 p-8 rounded-[2rem] border border-slate-800/80 shadow-inner grid grid-cols-2 md:grid-cols-5 gap-6">
                  {[
                    { label: 'TEMPORADA', placeholder: '2025/26' },
                    { label: 'EQUIPO', placeholder: 'Real Madrid...' },
                    { label: 'CATEGORÍA', placeholder: '1ª RFEF' },
                    { label: 'PJ', placeholder: '18' },
                    { label: 'GOL', placeholder: '4' }
                  ].map((field, i) => (
                    <div key={i}>
                       <label className="block text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1.5 px-0.5">{field.label}</label>
                       <input 
                         className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-[10px] font-bold text-slate-300 outline-none focus:border-emerald-500/30" 
                         placeholder={field.placeholder}
                       />
                    </div>
                  ))}
               </div>
            </div>
         </section>
      )}
    </form>
  );
}
