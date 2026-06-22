import { useState, FormEvent, useEffect, memo } from 'react';
import { Search, Plus, Shield, MapPin, Users, ChevronRight, Globe, Trophy, Trash2, X, Loader2 } from 'lucide-react';
import { MOCK_TEAMS } from '../mockData';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';

export const TeamList = memo(function TeamList() {
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newTeam, setNewTeam] = useState({ name: '', club_name: '', season: '2024/25', category_id: 'cat-senior' });

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTeams(data || []);
    } catch (err) {
      console.error('Error fetching teams:', err);
      // Fallback
      if (teams.length === 0) setTeams(MOCK_TEAMS);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTeam = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('teams')
        .insert([newTeam])
        .select();

      if (error) throw error;
      
      if (data) {
        setTeams([data[0], ...teams]);
      }
      setIsAdding(false);
      setNewTeam({ name: '', club_name: '', season: '2024/25', category_id: 'cat-senior' });
    } catch (err) {
      console.error('Error adding team:', err);
      alert('Error al añadir el equipo. Asegúrate de haber ejecutado el script SQL.');
    }
  };

  const handleDeleteTeam = async (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este equipo?')) {
      try {
        const { error } = await supabase
          .from('teams')
          .delete()
          .eq('id', id);

        if (error) throw error;
        setTeams(teams.filter(t => t.id !== id));
      } catch (err) {
        console.error('Error deleting team:', err);
        alert('Error al eliminar el equipo.');
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Gestión de Equipos</h1>
          <p className="text-slate-400">Administra los clubes y equipos en seguimiento.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-600 rounded-xl text-slate-900 hover:bg-emerald-500 transition-all font-black shadow-lg shadow-emerald-600/20 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          NUEVO EQUIPO
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-slate-900 border border-slate-800 rounded-[2rem] p-8 shadow-2xl relative"
          >
            <button 
              onClick={() => setIsAdding(false)}
              className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-black text-white uppercase italic tracking-tighter mb-6">Añadir Nuevo Equipo</h2>
            <form onSubmit={handleAddTeam} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-2">Nombre del Equipo</label>
                <input 
                  required
                  value={newTeam.name}
                  onChange={e => setNewTeam({...newTeam, name: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-emerald-500/50"
                  placeholder="Ej: Juvenil A"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-2">Club</label>
                <input 
                  required
                  value={newTeam.club_name}
                  onChange={e => setNewTeam({...newTeam, club_name: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-emerald-500/50"
                  placeholder="Ej: Real Madrid"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-2">Temporada</label>
                <input 
                  required
                  value={newTeam.season}
                  onChange={e => setNewTeam({...newTeam, season: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-emerald-500/50"
                  placeholder="Ej: 2024/25"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-2">Categoría</label>
                <select 
                  value={newTeam.category_id}
                  onChange={e => setNewTeam({...newTeam, category_id: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-emerald-500/50 uppercase font-bold"
                >
                  <option value="cat-senior">SENIOR</option>
                  <option value="cat-juvenil">JUVENIL</option>
                  <option value="cat-cadete">CADETE</option>
                  <option value="cat-infantil">INFANTIL</option>
                  <option value="cat-alevin">ALEVIN</option>
                  <option value="cat-benjamin">BENJAMIN</option>
                  <option value="cat-prebenjamin">PRE-BENJAMIN</option>
                </select>
              </div>
              <div className="lg:col-span-4 pt-4">
                <button type="submit" className="w-full py-4 bg-emerald-600 text-slate-950 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-500/20">
                  GUARDAR EQUIPO
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Cargando equipos...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map(team => (
            <div key={team.id} className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 hover:border-emerald-500/50 transition-all group overflow-hidden relative">
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-14 h-14 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform shadow-inner">
                    <Shield size={28} />
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest">{team.season}</p>
                        <button 
                          onClick={() => handleDeleteTeam(team.id)}
                          className="p-1.5 text-slate-600 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                    </div>
                    <span className="inline-block px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] font-black rounded-lg border border-blue-500/20">
                      {team.category_id?.replace('cat-', '').toUpperCase()}
                    </span>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-100 mb-1 group-hover:text-emerald-400 transition-colors">{team.name}</h3>
                  <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-tighter">
                    <Shield size={12} />
                    <span>{team.club_name}</span>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-800/50 grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-slate-600" />
                    <div>
                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">Jugadores</p>
                      <p className="text-sm font-bold text-slate-300">{team.member_count || 0}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Trophy size={16} className="text-slate-600" />
                    <div>
                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">Informes</p>
                      <p className="text-sm font-bold text-slate-300">{team.report_count || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
