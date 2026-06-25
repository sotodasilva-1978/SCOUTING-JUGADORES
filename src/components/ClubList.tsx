import { useState, useEffect, useRef } from 'react';
import { Shield, MapPin, Users, ChevronRight, Search, Loader2, Building2, Plus, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { calculateCategory } from '../lib/utils';

type CategoryStat = { id: string; count: number };

type ClubCard = {
  name: string;
  id?: string;
  ref_code?: string;
  location?: string;
  logo_url?: string;
  categories: CategoryStat[];
  total_players: number;
};

const CATEGORY_COLORS: Record<string, string> = {
  'SENIOR': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'JUVENIL': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'CADETE': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'INFANTIL': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  'ALEVÍN': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  'BENJAMÍN': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  'PRE-BENJAMÍN': 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

export function ClubList({ onSelectClub }: { onSelectClub: (clubName: string) => void }) {
  const [clubs, setClubs] = useState<ClubCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showNewClub, setShowNewClub] = useState(false);
  const [newClubName, setNewClubName] = useState('');
  const [creating, setCreating] = useState(false);
  const newClubInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchClubs();
  }, []);

  const handleOpenNewClub = () => {
    setNewClubName('');
    setShowNewClub(true);
    setTimeout(() => newClubInputRef.current?.focus(), 50);
  };

  const handleCreateClub = async () => {
    const trimmed = newClubName.trim();
    if (!trimmed) return;
    setCreating(true);
    try {
      // Check if already exists
      const { data: existing } = await supabase
        .from('clubs')
        .select('id, name')
        .eq('name', trimmed)
        .maybeSingle();
      if (existing) {
        // Already exists → navigate to it
        setShowNewClub(false);
        onSelectClub(existing.name);
        return;
      }
      // Create new
      const { data, error } = await supabase
        .from('clubs')
        .insert([{ name: trimmed, current_season: '2026/2027' }])
        .select('name')
        .single();
      if (error) throw error;
      setShowNewClub(false);
      onSelectClub(data.name);
    } catch (err: any) {
      alert('Error al crear el club: ' + (err?.message || err));
    } finally {
      setCreating(false);
    }
  };

  const fetchClubs = async () => {
    setLoading(true);
    try {
      // 1. Fetch ALL clubs from the clubs table (including those without players)
      const { data: clubsData } = await supabase
        .from('clubs')
        .select('id, name, location, logo_url, ref_code')
        .order('name', { ascending: true });

      // 2. Fetch players to compute category stats per club
      const { data: playersData } = await supabase
        .from('players')
        .select('club_name, birth_year')
        .not('club_name', 'is', null)
        .neq('club_name', '');

      // Group players by club_name → category counts
      const clubMap = new Map<string, Map<string, number>>();
      for (const p of (playersData || [])) {
        if (!p.club_name) continue;
        if (!clubMap.has(p.club_name)) clubMap.set(p.club_name, new Map());
        const cats = clubMap.get(p.club_name)!;
        const cat = calculateCategory(p.birth_year);
        cats.set(cat, (cats.get(cat) || 0) + 1);
      }

      // 3. Merge: start from clubs table (all registered clubs),
      //    then add any club that only exists via players (club_name text)
      const registeredNames = new Set((clubsData || []).map(c => c.name));

      // Add player-only clubs not yet in the clubs table
      for (const pName of clubMap.keys()) {
        if (!registeredNames.has(pName)) {
          (clubsData || []).push({ id: undefined as any, name: pName, location: null, logo_url: null, ref_code: null });
        }
      }

      const result: ClubCard[] = (clubsData || []).map(c => {
        const catsMap = clubMap.get(c.name);
        const categories = catsMap
          ? Array.from(catsMap.entries()).map(([id, count]) => ({ id, count }))
          : [];
        return {
          name: c.name,
          id: c.id ?? undefined,
          ref_code: (c as any).ref_code ?? undefined,
          location: c.location ?? undefined,
          logo_url: c.logo_url ?? undefined,
          categories,
          total_players: categories.reduce((s, cat) => s + cat.count, 0),
        };
      }).sort((a, b) => b.total_players - a.total_players);

      setClubs(result);
    } catch (err) {
      console.error('Error fetching clubs:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = search
    ? clubs.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || (c.location || '').toLowerCase().includes(search.toLowerCase()))
    : clubs;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Estructura de Clubes</h1>
          <p className="text-slate-400 text-sm mt-1">Clubes registrados. Pulsa uno para editarlo.</p>
        </div>
        <button
          onClick={handleOpenNewClub}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 shrink-0"
        >
          <Plus size={14} />
          Nuevo Club
        </button>
      </div>

      {/* Nuevo Club modal */}
      {showNewClub && (
        <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-5 flex items-center gap-3 shadow-lg shadow-emerald-500/10">
          <Shield size={18} className="text-emerald-500 shrink-0" />
          <input
            ref={newClubInputRef}
            value={newClubName}
            onChange={e => setNewClubName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleCreateClub(); if (e.key === 'Escape') setShowNewClub(false); }}
            placeholder="Nombre del nuevo club..."
            className="flex-1 bg-transparent text-white text-sm font-bold outline-none placeholder-slate-600"
          />
          <button
            onClick={handleCreateClub}
            disabled={!newClubName.trim() || creating}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-slate-950 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
          >
            {creating ? <Loader2 size={12} className="animate-spin" /> : 'Crear'}
          </button>
          <button onClick={() => setShowNewClub(false)} className="p-1.5 text-slate-500 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar club o ciudad..."
          className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500/50 transition-colors"
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Cargando clubes...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Building2 className="w-16 h-16 text-slate-700" />
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs text-center">
            {clubs.length === 0
              ? 'Añade jugadores con su club para verlos aquí'
              : 'No se encontraron clubes con ese nombre'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(club => (
            <button
              key={club.name}
              onClick={() => onSelectClub(club.name)}
              className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden hover:border-emerald-500/40 transition-all group relative text-left flex flex-col"
            >
              {/* Shield + name */}
              <div className="flex items-start gap-4 px-6 pt-6 pb-4">
                {/* Shield — sin recuadro, fondo transparente */}
                <div className="w-16 h-16 shrink-0 flex items-center justify-center">
                  {club.logo_url ? (
                    <img
                      src={club.logo_url}
                      alt={club.name}
                      className="w-16 h-16 object-contain drop-shadow-md"
                    />
                  ) : (
                    <Shield size={38} className="text-emerald-500/60" />
                  )}
                </div>

                {/* Name + location — sin truncar */}
                <div className="flex-1">
                  <h3 className="text-sm font-black text-slate-100 group-hover:text-emerald-400 transition-colors uppercase tracking-tight leading-snug break-words">
                    {club.name}
                  </h3>
                  {club.location ? (
                    <div className="flex items-center gap-1.5 mt-1.5 text-slate-500 text-[11px] font-semibold">
                      <MapPin size={11} className="shrink-0" />
                      <span>{club.location}</span>
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-700 mt-1.5 italic">Sin localización</p>
                  )}
                </div>
              </div>

              {/* Category tags */}
              <div className="px-6 pb-4 flex flex-wrap gap-1.5">
                {club.categories.map(cat => (
                  <span
                    key={cat.id}
                    className={`px-2 py-0.5 text-[9px] font-black rounded-lg border ${CATEGORY_COLORS[cat.id] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}
                  >
                    {cat.id}
                  </span>
                ))}
              </div>

              {/* Footer */}
              <div className="mt-auto px-6 py-3 border-t border-slate-800/50 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Users size={12} />
                  <span className="text-[10px] font-black uppercase tracking-tighter">
                    {club.total_players} jugador{club.total_players !== 1 ? 'es' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-slate-600 group-hover:text-emerald-400 transition-colors">
                  <span className="text-[9px] font-black uppercase tracking-wider">Ver club</span>
                  <ChevronRight size={12} />
                </div>
              </div>

              <div className="absolute top-0 right-0 -mr-6 -mt-6 w-28 h-28 bg-emerald-500/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
