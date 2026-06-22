import { 
  ArrowLeft, User, Star, Video, ClipboardList, Shield, Edit3, Trash2, 
  Calendar, Target, Zap, AlertCircle, ChevronRight, Plus, Trophy, 
  History, Settings, Fingerprint, Image as ImageIcon, CheckCircle2,
  TrendingUp, XCircle, Info, Ruler, Footprints, Hash, Eye, FastForward,
  MapPin, Briefcase, FileText, Scale, Gavel, MousePointer2, Loader2,
  LayoutDashboard, Smartphone, Monitor
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Player, Report, Match, Video as VideoType, TrajectoryEntry } from '../types';
import { cn, formatRating, getStatusColor, calculateCategory } from '../lib/utils';
import { useMemo, useState, useRef, ChangeEvent, FormEvent } from 'react';
import imageCompression from 'browser-image-compression';
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

const PitchMap = ({ position }: { position: string }) => (
  <div className="relative w-full aspect-[3/4] bg-emerald-950/40 rounded-2xl border border-emerald-500/20 overflow-hidden shadow-inner group">
    {/* Field markings */}
    <div className="absolute inset-0 border-[1.5px] border-white/20 m-3 rounded-lg" />
    <div className="absolute top-1/2 left-0 right-0 h-px bg-white/20" />
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 border-[1.5px] border-white/20 rounded-full" />
    
    <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-12 border-x-[1.5px] border-b-[1.5px] border-white/20" />
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-24 h-12 border-x-[1.5px] border-t-[1.5px] border-white/20" />
    
    {/* Dot for position */}
    <div className={cn(
      "absolute w-5 h-5 rounded-full bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.6)] border-2 border-white/50 transition-all duration-700",
      position === 'DC' ? 'top-[15%] left-1/2 -translate-x-1/2' :
      position === 'ED' ? 'top-[25%] right-[15%]' :
      position === 'EI' ? 'top-[25%] left-[15%]' :
      position === 'MCO' ? 'top-[35%] left-1/2 -translate-x-1/2' :
      position === 'MC' ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' :
      position === 'DFC' ? 'bottom-[15%] left-1/2 -translate-x-1/2' :
      position === 'POR' ? 'bottom-[5%] left-1/2 -translate-x-1/2' :
      'top-1/2 left-1/2'
    )} />

    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 to-transparent pointer-events-none" />
  </div>
);

interface PlayerDetailProps {
  player: Player;
  reports: Report[];
  matches: Match[];
  videos: VideoType[];
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
  const [isCompressing, setIsCompressing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    const options = {
      maxSizeMB: 0.1,
      maxWidthOrHeight: 800,
      useWebWorker: true,
    };

    try {
      const compressedFile = await imageCompression(file, options);
      const reader = new FileReader();
      reader.readAsDataURL(compressedFile);
      reader.onloadend = () => {
        const base64data = reader.result as string;
        if (onUpdatePlayer) {
          onUpdatePlayer({ ...player, avatar_url: base64data });
        }
        setIsCompressing(false);
      };
    } catch (error) {
      console.error("Error compressing image:", error);
      setIsCompressing(false);
    }
  };

  const getTrafficLightColor = (status: string) => {
    switch (status) {
      case 'PRIORITY': return 'bg-emerald-500';
      case 'TRACKING': return 'bg-amber-500';
      case 'DISCARDED': return 'bg-rose-500';
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
            <span className={cn("text-[8px] font-black uppercase px-2 py-0.5 rounded", getVerificationColor(status))}>
              {getVerificationLabel(status)}
            </span>
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
            {isArray ? (value as string[] || []).join(', ') : (value || 'No registrado')}
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
      <div className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-xl border border-slate-800 rounded-[2.5rem] p-6 shadow-2xl">
        <div className="flex flex-col xl:flex-row gap-6 items-start">
          <div className="flex items-center gap-6 flex-1">
            <button 
              onClick={onBack}
              className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-slate-500 hover:text-white transition-all shadow-inner"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="relative">
              <div className="w-20 h-20 rounded-3xl bg-slate-800 border-2 border-slate-700 flex items-center justify-center font-black text-3xl text-emerald-500 shadow-2xl overflow-hidden">
                {player.avatar_url ? (
                  <img src={player.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : player.full_name[0]}
              </div>
              <div className={cn("absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-slate-950 shadow-lg", getTrafficLightColor(player.status))} />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black text-white uppercase tracking-tighter">{player.full_name}</h1>
                <div className={cn("px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-[0.2em] shadow-sm", getStatusColor(player.status))}>
                   {player.status.replace('_', ' ')}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-400 text-sm font-bold">
                <span className="text-emerald-500">{player.club_name}</span>
                <span>•</span>
                <span className="uppercase text-slate-300">{calculateCategory(player.birth_year)}</span>
                <span>•</span>
                <span>{player.birth_year} ({player.calculated_age} años)</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
             <button onClick={onEdit} className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-all"><Edit3 size={16} /></button>
             
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
                disabled={isCompressing}
                className="bg-slate-900 border border-slate-800 text-slate-400 px-4 py-2.5 rounded-xl text-[10px] font-black hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isCompressing ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin text-emerald-500" />
                    PROCESANDO...
                  </>
                ) : (
                  'IMAGEN'
                )}
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
                               <span className="text-[10px] font-black text-white italic tracking-widest uppercase">SCOUT PROFILE</span>
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
                              { label: 'FECHA NACIMIENTO', value: player.birth_date ? format(new Date(player.birth_date), 'dd/MM/yyyy') : player.birth_year },
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
                      <PitchMap position={player.main_position} />
                      <div className="space-y-4">
                         <div className="p-5 bg-slate-950/60 border border-slate-800/80 rounded-3xl shadow-inner">
                            <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-2 opacity-70">Posición Principal</p>
                            <p className="text-sm font-black text-white italic tracking-tight">{player.main_position}</p>
                         </div>
                         <div className="p-5 bg-slate-950/60 border border-slate-800/80 rounded-3xl shadow-inner">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 opacity-70">Posiciones Secundarias</p>
                            <p className="text-sm font-black text-slate-400 italic tracking-tight">{(player.secondary_positions || []).join(', ') || 'NINGUNA'}</p>
                         </div>
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

                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
                      {Object.entries(RATING_CATEGORIES).map(([catId, attributes]) => (
                        <div key={catId} className="space-y-5 bg-slate-950/40 p-6 rounded-[2.5rem] border border-slate-800/50 hover:border-emerald-500/20 transition-all group">
                           <div className="bg-slate-900/80 py-3 px-2 rounded-2xl border border-slate-800 text-center shadow-lg group-hover:bg-emerald-500/5 transition-colors">
                              <h4 className="text-[11px] font-black text-white uppercase tracking-[0.3em] italic">{catId}</h4>
                           </div>
                           <div className="space-y-3">
                              {attributes.map((attr, i) => {
                                const val = Number(formData[attr.field as keyof Player]) || 0;
                                return (
                                  <div key={i} className="flex items-center justify-between gap-3 group/row relative py-0.5">
                                    <div className="flex items-center gap-1.5 min-w-0 group/tip relative cursor-help">
                                      <span className="text-[10px] font-bold text-slate-500 uppercase truncate group-hover/row:text-slate-300 transition-colors leading-none tracking-tight border-b border-dotted border-slate-800">
                                        {attr.label}
                                      </span>
                                      <Info size={10} className="text-slate-800 group-hover/row:text-slate-600 transition-colors shrink-0" />
                                      
                                      {/* Tooltip Overlay */}
                                      <div className="absolute left-0 bottom-full mb-2 w-48 p-3 bg-slate-950 border border-slate-800 rounded-xl text-[9px] text-slate-400 invisible group-hover/tip:visible z-50 shadow-2xl leading-relaxed animate-in fade-in slide-in-from-bottom-1">
                                        <div className="text-slate-200 font-bold mb-1 uppercase tracking-widest text-[8px]">{attr.label}</div>
                                        {(attr as any).tooltip}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                       <div className={cn(
                                         "w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-black transition-all shadow-lg",
                                         val >= 4.5 ? "bg-emerald-500 text-slate-950 scale-110 rotate-3" :
                                         val >= 4 ? "bg-emerald-600 text-slate-950" : 
                                         val >= 3 ? "bg-blue-600 text-slate-950" :
                                         val >= 2 ? "bg-amber-600 text-slate-950" :
                                         val >= 0.5 ? "bg-rose-600 text-slate-950" :
                                         "bg-slate-800 text-slate-500 border border-slate-700/50"
                                       )}>
                                         {val || 0}
                                       </div>
                                    </div>
                                  </div>
                                );
                              })}
                              
                              {/* Custom Ratings in especificas column */}
                              {catId === 'especificas' && (player.custom_ratings || []).map((cr, idx) => (
                                <div key={`custom-${idx}`} className="flex items-center justify-between gap-3 group/row">
                                  <span className="text-[10px] font-bold text-amber-500 uppercase truncate group-hover/row:text-amber-300 transition-colors leading-none tracking-tight">{cr.label}</span>
                                  <div className="flex items-center gap-1 shrink-0">
                                     <div className={cn(
                                       "w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-black transition-all shadow-lg",
                                       cr.value >= 4.5 ? "bg-amber-500 text-slate-950 scale-110 rotate-3" :
                                       cr.value >= 4 ? "bg-amber-600 text-slate-950" : 
                                       cr.value >= 3 ? "bg-amber-700 text-slate-950" :
                                       cr.value >= 0.5 ? "bg-amber-800 text-slate-950" :
                                       "bg-slate-800 text-slate-500 border border-slate-700/50"
                                     )}>
                                       {cr.value || 0}
                                     </div>
                                  </div>
                                </div>
                              ))}
                           </div>
                        </div>
                      ))}
                   </div>

                   {/* Graficas Comparativas */}
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center pt-16 border-t border-slate-800/50">
                      <div className="h-[400px] w-full flex flex-col items-center justify-center bg-slate-950/40 rounded-[3rem] border border-slate-800/50 p-8 shadow-inner relative overflow-hidden group">
                        <div className="absolute top-8 left-8">
                           <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest italic mb-1">Radar de Atributos</p>
                           <h4 className="text-xl font-black text-white italic tracking-tighter">PERFIL DINÁMICO</h4>
                        </div>
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                           <RadarChart cx="50%" cy="50%" outerRadius="80%" data={
                              Object.entries(RATING_CATEGORIES).map(([catId, attrs]) => ({
                                name: catId.toUpperCase(),
                                value: attrs.reduce((acc, a) => acc + (Number(formData[a.field as keyof Player]) || 0), 0) / attrs.length
                              }))
                           }>
                             <PolarGrid stroke="#1e293b" />
                             <PolarAngleAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'black' }} />
                             <Radar
                               name="Jugador"
                               dataKey="value"
                               stroke="#10b981"
                               fill="#10b981"
                               fillOpacity={0.3}
                               strokeWidth={3}
                               animationDuration={1500}
                             />
                           </RadarChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="h-[400px] w-full bg-slate-950/40 rounded-[3rem] border border-slate-800/50 p-10 shadow-inner flex flex-col justify-center group">
                        <div className="mb-8">
                           <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest italic mb-1">Distribución por Áreas</p>
                           <h4 className="text-xl font-black text-white italic tracking-tighter uppercase">Potencial Sectorial</h4>
                        </div>
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                           <BarChart layout="vertical" data={
                              Object.entries(RATING_CATEGORIES).map(([catId, attrs]) => ({
                                name: catId.toUpperCase(),
                                value: attrs.reduce((acc, a) => acc + (Number(formData[a.field as keyof Player]) || 0), 0) / attrs.length
                              }))
                           } margin={{ left: 60, right: 20 }}>
                             <XAxis type="number" domain={[0, 5]} hide />
                             <YAxis 
                               dataKey="name" 
                               type="category" 
                               axisLine={false} 
                               tickLine={false} 
                               tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'black' }}
                             />
                             <Tooltip 
                                cursor={{ fill: 'rgba(255,255,255,0.03)', radius: 10 }}
                                contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '16px', fontSize: '11px', fontWeight: 'bold', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                             />
                             <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={28}>
                               {Object.entries(RATING_CATEGORIES).map((_, i) => (
                                 <Cell key={`cell-${i}`} fill={['#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'][i % 5]} />
                               ))}
                             </Bar>
                           </BarChart>
                        </ResponsiveContainer>
                        <div className="mt-6 flex justify-end">
                           <span className="text-[9px] font-black text-slate-700 uppercase tracking-[0.3em]">Scout Analysis Data Engine</span>
                        </div>
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
                      {renderDataField('Edad Calculada', 'calculated_age', 'number')}
                      {renderDataField('Ciudad / Zona', 'area')}
                   </div>

                   {/* Bloque Club/Competición */}
                   <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {renderDataField('Equipo Actual', 'club_name')}
                      <div className="bg-slate-900/30 border border-slate-800/50 rounded-2xl p-4 space-y-3 relative group">
                        <label className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Cat. Federativa (Auto)</label>
                        <p className="text-sm font-black text-emerald-400">
                          {calculateCategory(formData.birth_year || 0)}
                        </p>
                      </div>
                      {renderDataField('División / Nivel', 'category_id')}
                      {renderDataField('Liga / Competición', 'league')}
                   </div>

                   {/* Bloque Futbolístico */}
                   <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {renderDataField('Dorsal Habitual', 'usual_number')}
                      {renderDataField('Posición Ppal.', 'main_position')}
                      {renderDataField('Posiciones Sec.', 'secondary_positions', 'text', [], true)}
                      {renderDataField('Pierna Dominante', 'dominant_foot', 'select', [
                        {value: 'RIGHT', label: 'Diestro'},
                        {value: 'LEFT', label: 'Zurdo'},
                        {value: 'BOTH', label: 'Ambidiestro'},
                        {value: 'UNKNOWN', label: 'Desconocido'}
                      ])}
                   </div>

                   {/* Bloque Físico */}
                   <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {renderDataField('Altura aprox (cm)', 'approximate_height', 'number')}
                      {renderDataField('Peso aprox (kg)', 'weight_kg', 'number')}
                      {renderDataField('Fuente Info', 'info_source')}
                   </div>

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
                 <div className="grid grid-cols-1 gap-4 opacity-50">
                    <div className="flex items-center gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
                       <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center"><MousePointer2 size={16}/></div>
                       <div>
                          <p className="text-xs font-bold text-slate-200">Jugador actualizado por Scout Principal</p>
                          <p className="text-[10px] text-slate-500">22 JUNIO 2024 - 14:32</p>
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
