import type React from 'react';
import { Shield, Users, Mail, Bell, Key, Database, RefreshCw, Save, Trash2, CheckCircle, AlertCircle, UserPlus, Sliders, Upload } from 'lucide-react';
import { motion } from 'motion/react';
import { useState, useRef, useEffect } from 'react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';

export function SettingsPanel() {
  const [activeTab, setActiveTab] = useState('usuarios');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [clubName, setClubName] = useState('U.D. SANTA MARIÑA');
  const [season, setSeason] = useState('2026/2027');
  const [clubId, setClubId] = useState<string | null>(null);
  
  const [weights, setWeights] = useState([
    { id: 'tecnica', label: 'Técnica', weight: 20 },
    { id: 'tactica', label: 'Táctica', weight: 20 },
    { id: 'fisico', label: 'Físico', weight: 15 },
    { id: 'mentalidad', label: 'Mentalidad', weight: 15 },
    { id: 'potencial', label: 'Potencial', weight: 20 },
    { id: 'encaje', label: 'Encaje Club', weight: 10 },
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data: club } = await supabase
        .from('clubs')
        .select('*')
        .eq('name', 'U.D. SANTA MARIÑA')
        .single();
      if (club) {
        setClubId(club.id);
        setClubName(club.name);
        setSeason(club.current_season);
        setLogoPreview(club.logo_url);
      }

      if (club) {
        const { data: rw } = await supabase.from('rating_weights').select('*').eq('club_id', club.id).maybeSingle();
        if (rw) {
           setWeights([
             { id: 'tecnica', label: 'Técnica', weight: Number(rw.technique_weight) * 100 },
             { id: 'tactica', label: 'Táctica', weight: Number(rw.tactics_weight) * 100 },
             { id: 'fisico', label: 'Físico', weight: Number(rw.physical_weight) * 100 },
             { id: 'mentalidad', label: 'Mentalidad', weight: Number(rw.mentality_weight) * 100 },
             { id: 'potencial', label: 'Potencial', weight: Number(rw.potential_weight) * 100 },
             { id: 'encaje', label: 'Encaje Club', weight: Number(rw.club_fit_weight) * 100 },
           ]);
        }
      }
    } catch (err) {
      console.error('Error loading settings:', err);
    }
  };

  const totalWeight = weights.reduce((sum, item) => sum + item.weight, 0);
  const isValidTotal = Math.abs(totalWeight - 100) < 0.01;

  const handleWeightChange = (id: string, value: number) => {
    setWeights(prev => prev.map(w => w.id === id ? { ...w, weight: value } : w));
  };

  const handleSaveWeights = async () => {
    if (!isValidTotal) {
      alert('El total de los pesos debe ser exactamente 100%');
      return;
    }
    
    if (!clubId) {
      alert('No se encontró club para asociar los pesos.');
      return;
    }

    try {
      const payload = {
        club_id: clubId,
        technique_weight: weights[0].weight / 100,
        tactics_weight: weights[1].weight / 100,
        physical_weight: weights[2].weight / 100,
        mentality_weight: weights[3].weight / 100,
        potential_weight: weights[4].weight / 100,
        club_fit_weight: weights[5].weight / 100,
        active: true
      };

      const { data: existing } = await supabase.from('rating_weights').select('id').eq('club_id', clubId).maybeSingle();
      
      let error;
      if (existing) {
        ({ error } = await supabase.from('rating_weights').update(payload).eq('id', existing.id));
      } else {
        ({ error } = await supabase.from('rating_weights').insert([payload]));
      }

      if (error) throw error;
      alert('Pesos de valoración actualizados correctamente.');
    } catch (err: any) {
      alert('Error al guardar pesos: ' + err.message);
    }
  };

  const handleSaveClubInfo = async () => {
    try {
      const payload = {
        name: clubName,
        current_season: season,
        logo_url: logoPreview
      };

      let error;
      if (clubId) {
        ({ error } = await supabase.from('clubs').update(payload).eq('id', clubId));
      } else {
        const { data, error: err } = await supabase.from('clubs').insert([payload]).select().single();
        if (data) setClubId(data.id);
        error = err;
      }

      if (error) throw error;
      alert('Información del club actualizada correctamente.');
    } catch (err: any) {
      alert('Error al guardar info del club: ' + err.message);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const tabs = [
    { id: 'usuarios', label: 'Usuarios y Roles', icon: Users },
    { id: 'club', label: 'Configuración Club', icon: Shield },
    { id: 'ratings', label: 'Pesos Valoración', icon: Sliders },
    { id: 'database', label: 'Base de Datos', icon: Database },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Configuración del Sistema</h1>
        <p className="text-slate-400">Administra los parámetros globales de la base de datos de scouting.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="w-full lg:w-64 flex-shrink-0 space-y-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm",
                activeTab === tab.id 
                  ? "bg-emerald-600 text-slate-900 shadow-lg shadow-emerald-600/20" 
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
              )}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-slate-900/50 border border-slate-800 rounded-3xl p-6 md:p-8 backdrop-blur-sm">
           {activeTab === 'usuarios' && (
             <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-100">Gestión de Usuarios</h3>
                  <button className="flex items-center gap-2 py-2 px-4 bg-emerald-600/10 text-emerald-500 border border-emerald-500/20 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-600/20 transition-all">
                    <UserPlus size={14} />
                    Invitar Usuario
                  </button>
                </div>

                <div className="space-y-4">
                  {[
                    { name: 'Soto Da Silva', role: 'Superadmin', email: 'admin@club.com', status: 'Activo' },
                    { name: 'Manolo García', role: 'Scout Senior', email: 'manolo@club.com', status: 'Activo' },
                    { name: 'Juan Entrenador', role: 'Entrenador Filial', email: 'juan@club.com', status: 'Inactivo' },
                  ].map((user, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-2xl hover:border-slate-700 transition-all group">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-slate-500 group-hover:text-emerald-500 transition-colors">
                            {user.name[0]}
                          </div>
                          <div>
                            <p className="font-bold text-slate-200">{user.name}</p>
                            <p className="text-xs text-slate-500">{user.email}</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-6">
                          <div className="text-right">
                             <p className="text-xs font-black text-slate-200 uppercase tracking-tighter">{user.role}</p>
                             <span className={cn("text-[10px] font-bold uppercase", user.status === 'Activo' ? "text-emerald-500" : "text-rose-500")}>
                               {user.status}
                             </span>
                          </div>
                          <button className="p-2 text-slate-600 hover:text-slate-200 transition-colors">
                            <Sliders size={16} />
                          </button>
                       </div>
                    </div>
                  ))}
                </div>
             </div>
           )}

           {activeTab === 'ratings' && (
              <div className="space-y-8">
                 <div>
                    <h3 className="text-xl font-bold text-slate-100">Pesos de Valoración</h3>
                    <p className="text-sm text-slate-500">Define cómo se calcula la valoración global (Media Ponderada).</p>
                 </div>

                 <div className="space-y-6">
                    {weights.map((item) => (
                      <div key={item.id} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-bold text-slate-300">{item.label}</label>
                          <span className={cn("text-xs font-black", isValidTotal ? "text-emerald-500" : "text-rose-500")}>
                            {item.weight}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={item.weight}
                          onChange={(e) => handleWeightChange(item.id, Number(e.target.value))}
                          className="w-full h-2 bg-slate-950 rounded-full border border-slate-800 appearance-none cursor-pointer accent-emerald-500 focus:outline-none"
                        />
                      </div>
                    ))}
                 </div>

                 <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-full border transition-colors",
                      isValidTotal 
                        ? "text-emerald-500 border-emerald-500/20 bg-emerald-500/5" 
                        : "text-rose-500 border-rose-500/20 bg-rose-500/5"
                    )}>
                       {isValidTotal ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                       <span className="text-xs font-bold uppercase tracking-widest">
                         TOTAL: {totalWeight}% {isValidTotal ? '(VÁLIDO)' : '(DEBE SER 100%)'}
                       </span>
                    </div>
                    <button 
                      onClick={handleSaveWeights}
                      disabled={!isValidTotal}
                      className={cn(
                        "flex items-center gap-2 py-3 px-6 font-black rounded-xl transition-all shadow-lg active:scale-95",
                        isValidTotal 
                          ? "bg-emerald-600 text-slate-900 hover:bg-emerald-500" 
                          : "bg-slate-800 text-slate-500 cursor-not-allowed"
                      )}
                    >
                      <Save size={18} />
                      GUARDAR CAMBIOS
                    </button>
                 </div>
              </div>
           )}

           {activeTab === 'club' && (
              <div className="space-y-8">
                 <div>
                    <h3 className="text-xl font-bold text-slate-100">Información del Club</h3>
                    <p className="text-sm text-slate-500">Configura la identidad visual y parámetros base del club.</p>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                       <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Nombre Comercial</label>
                       <input 
                         type="text" 
                         value={clubName}
                         onChange={(e) => setClubName(e.target.value)}
                         className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-emerald-500 transition-all font-bold" 
                       />
                    </div>
                    <div className="space-y-3">
                       <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Temporada por Defecto</label>
                       <input 
                         type="text" 
                         value={season}
                         onChange={(e) => setSeason(e.target.value)}
                         className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-emerald-500 transition-all font-bold" 
                       />
                    </div>
                 </div>
                 
                 <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center py-4 bg-slate-950/50 p-6 rounded-2xl border border-slate-800/50">
                    <div className="w-24 h-24 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center overflow-hidden group/logo relative shadow-inner">
                       {logoPreview ? (
                         <img src={logoPreview} alt="Logo preview" className="w-full h-full object-contain p-2" />
                       ) : (
                         <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-slate-700">
                           <Shield size={32} strokeWidth={1.5} />
                           <span className="text-[10px] font-black uppercase text-slate-800">No Logo</span>
                         </div>
                       )}
                       <div className="absolute inset-0 bg-emerald-600/20 opacity-0 group-hover/logo:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                         <Upload size={20} className="text-emerald-500" />
                       </div>
                    </div>

                    <div className="space-y-4 flex-1">
                       <div>
                          <p className="text-sm font-bold text-slate-200">Logo del Club</p>
                          <p className="text-xs text-slate-500">Se usará en informes y barra lateral (Formatos: PNG, JPG, SVG).</p>
                       </div>
                       
                       <input 
                         type="file" 
                         ref={fileInputRef}
                         onChange={handleLogoChange}
                         accept="image/*"
                         className="hidden"
                       />

                       <button 
                         onClick={() => fileInputRef.current?.click()}
                         className="flex items-center gap-2 py-3 px-6 bg-slate-800 text-slate-200 font-black rounded-xl hover:bg-slate-700 transition-all active:scale-95"
                       >
                          <Upload size={18} />
                          Actualizar Logo
                       </button>
                    </div>
                 </div>

                 <div className="pt-6 border-t border-slate-800 flex justify-end">
                    <button 
                      onClick={handleSaveClubInfo}
                      className="flex items-center gap-2 py-3 px-6 bg-emerald-600 text-slate-900 font-black rounded-xl hover:bg-emerald-500 transition-all shadow-lg active:scale-95"
                    >
                      <Save size={18} />
                      GUARDAR CAMBIOS
                    </button>
                 </div>
              </div>
           )}
        </div>
      </div>
    </div>
  );
}
