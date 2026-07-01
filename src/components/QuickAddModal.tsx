import { X, Save, User, MapPin, Target, Star, Calculator, Trophy, Info, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import React, { useState } from 'react';
import { cn } from '../lib/utils';
import { Match } from '../types';

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

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initialData?: any;
  matches?: Match[];
  currentMatchId?: string;
}

export function QuickAddModal({ isOpen, onClose, onSave, initialData, matches = [], currentMatchId }: QuickAddModalProps) {
  const [addMode, setAddMode] = useState<'quick' | 'complete'>('quick');
  
  const [formData, setFormData] = useState({
    name: '',
    team: '',
    category: '',
    position: '',
    dorsal: '',
    rating: '3',
    potential_rating: '4',
    birth_year: '2005',
    dominant_foot: 'RIGHT',
    status: 'TRACKING',
    reason: '',
    matchId: currentMatchId || '',
    videoUrl: '',
    avatarUrl: '',
    // Additional for complete
    height: '',
    technical_profile: '',
    tactical_profile: '',
    physical_profile: '',
    mental_profile: '',
    strengths: '',
    weaknesses: '',
    next_step: '',
    why_interested: '',
    main_strength: '',
    main_doubt: '',
    differential_talent: '',
    risk_level: 'LOW'
  });

  React.useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        name: initialData.full_name || '',
        team: initialData.club_name || '',
        category: initialData.category_id || '',
        position: initialData.main_position || '',
        dorsal: initialData.usual_number || '',
        rating: String(initialData.global_rating || '3'),
        potential_rating: String(initialData.potential_rating || '4'),
        birth_year: String(initialData.birth_year || '2005'),
        dominant_foot: initialData.dominant_foot || 'RIGHT',
        status: initialData.status || 'TRACKING',
        reason: initialData.strengths?.[0] || '',
        avatarUrl: initialData.avatar_url || '',
        height: String(initialData.approximate_height || ''),
        technical_profile: initialData.technical_profile || '',
        tactical_profile: initialData.tactical_profile || '',
        physical_profile: initialData.physical_profile || '',
        mental_profile: initialData.mental_profile || '',
        strengths: (initialData.strengths || []).join(', '),
        weaknesses: (initialData.weaknesses || []).join(', '),
        next_step: initialData.next_step || '',
        why_interested: initialData.why_interested || '',
        main_strength: initialData.main_strength || '',
        main_doubt: initialData.main_doubt || '',
        differential_talent: initialData.differential_talent || '',
        risk_level: initialData.risk_level || 'LOW'
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        name: '',
        team: '',
        category: '',
        position: '',
        dorsal: '',
        rating: '3',
        potential_rating: '4',
        birth_year: '2005',
        dominant_foot: 'RIGHT',
        status: 'TRACKING',
        reason: '',
        matchId: currentMatchId || '',
        videoUrl: '',
        avatarUrl: ''
      }));
    }
  }, [initialData, isOpen, currentMatchId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="px-8 py-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50 shrink-0">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                    <User size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-100 tracking-tighter">ALTA DE JUGADOR</h2>
                    <div className="flex gap-4 mt-1">
                      <button 
                        type="button"
                        onClick={() => setAddMode('quick')}
                        className={cn("text-[10px] font-black uppercase tracking-widest transition-all", addMode === 'quick' ? "text-emerald-500" : "text-slate-500 hover:text-slate-300")}
                      >
                        Alta Rápida
                      </button>
                      <button 
                        type="button"
                        onClick={() => setAddMode('complete')}
                        className={cn("text-[10px] font-black uppercase tracking-widest transition-all", addMode === 'complete' ? "text-emerald-500" : "text-slate-500 hover:text-slate-300")}
                      >
                        Alta Completa
                      </button>
                    </div>
                  </div>
               </div>
               <button onClick={onClose} className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-500 hover:text-slate-200 transition-colors shadow-inner">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
              {/* Common Basic Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-full">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Nombre y Apellidos</label>
                  <input
                    required
                    type="text"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-emerald-500/50 font-bold"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Equipo Actual</label>
                  <input
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-emerald-500/50"
                    value={formData.team}
                    onChange={(e) => setFormData({...formData, team: e.target.value})}
                  />
                </div>

                <div>
                   <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Posición Principal</label>
                   <select
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 outline-none appearance-none focus:border-emerald-500/50"
                    value={formData.position}
                    onChange={(e) => setFormData({...formData, position: e.target.value})}
                  >
                    <option value="">Seleccionar posición...</option>
                    {POSITION_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Partido Observado</label>
                  <select
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 outline-none appearance-none focus:border-emerald-500/50"
                    value={formData.matchId}
                    onChange={(e) => setFormData({...formData, matchId: e.target.value})}
                  >
                    <option value="">Ninguno / Scout Externo</option>
                    {matches.map(m => (
                      <option key={m.id} value={m.id}>{m.home_team} vs {m.away_team}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Estado Seguimiento</label>
                  <select
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 outline-none appearance-none focus:border-emerald-500/50"
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as any})}
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

              {addMode === 'quick' ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Dorsal</label>
                      <input className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 outline-none" value={formData.dorsal} onChange={e => setFormData({...formData, dorsal: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Año Nacimiento</label>
                      <input type="number" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 outline-none" value={formData.birth_year} onChange={e => setFormData({...formData, birth_year: e.target.value})} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Motivo por el que destaca</label>
                    <textarea rows={3} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 outline-none resize-none" value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Valoración Rápida (1-5)</label>
                    <div className="flex gap-2 p-2 bg-slate-950 border border-slate-800 rounded-xl">
                      {[1,2,3,4,5].map(v => (
                        <button 
                          key={v}
                          type="button" 
                          onClick={() => setFormData({...formData, rating: String(v)})}
                          className={cn("flex-1 py-1.5 rounded-lg font-black text-sm transition-all", Number(formData.rating) >= v ? "bg-yellow-500/10 text-yellow-500" : "text-slate-700 hover:text-slate-500")}
                        >
                          <Star size={16} className={cn("inline-block", Number(formData.rating) >= v && "fill-current")} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">URL Vídeo Opcional</label>
                    <input className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 outline-none" value={formData.videoUrl} onChange={e => setFormData({...formData, videoUrl: e.target.value})} />
                  </div>
                </div>
              ) : (
                <div className="space-y-8 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Perfil Técnico</label>
                      <textarea className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 outline-none" rows={3} value={formData.technical_profile} onChange={e => setFormData({...formData, technical_profile: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Perfil Táctico</label>
                      <textarea className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 outline-none" rows={3} value={formData.tactical_profile} onChange={e => setFormData({...formData, tactical_profile: e.target.value})} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Potencial (1-5)</label>
                      <input type="range" min="1" max="5" step="0.5" className="w-full accent-emerald-500" value={formData.potential_rating} onChange={e => setFormData({...formData, potential_rating: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Riesgo Captación</label>
                      <select
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 outline-none appearance-none focus:border-emerald-500/50"
                        value={formData.risk_level}
                        onChange={(e) => setFormData({...formData, risk_level: e.target.value as any})}
                      >
                        <option value="LOW">Bajo</option>
                        <option value="MEDIUM">Medio</option>
                        <option value="HIGH">Alto</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">¿Por qué nos interesa?</label>
                      <textarea className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 outline-none" rows={2} value={formData.why_interested} onChange={e => setFormData({...formData, why_interested: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Fortaleza Principal</label>
                        <input className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 outline-none" value={formData.main_strength} onChange={e => setFormData({...formData, main_strength: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Principal Duda</label>
                        <input className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 outline-none" value={formData.main_doubt} onChange={e => setFormData({...formData, main_doubt: e.target.value})} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Talento Diferencial</label>
                      <input className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 outline-none" value={formData.differential_talent} onChange={e => setFormData({...formData, differential_talent: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Próximo Paso</label>
                      <input className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 outline-none" value={formData.next_step} onChange={e => setFormData({...formData, next_step: e.target.value})} />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-8 sticky bottom-0 bg-slate-900 py-4 border-t border-slate-800 mt-auto shrink-0">
                <button type="button" onClick={onClose} className="flex-1 py-4 bg-slate-950 border border-slate-800 text-slate-400 font-black text-xs rounded-2xl hover:text-white transition-all shadow-inner">CANCELAR</button>
                <button type="submit" className="flex-1 py-4 bg-emerald-600 text-slate-950 font-black text-xs rounded-2xl hover:bg-emerald-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 active:scale-95">
                  <Save size={16} />
                  GUARDAR JUGADOR
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
