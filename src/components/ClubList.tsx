import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Shield,
  MapPin,
  Users,
  ChevronRight,
  Search,
  Loader2,
  Building2,
  Plus,
  X,
  LayoutGrid,
  List as ListIcon,
  Eye,
  EyeOff,
  Rows3,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { findOrCreateClub, normalizeClubName } from '../lib/clubs';
import { fetchClubsWithVisibility, setClubVisibilityForClient } from '../lib/clubVisibility';
import { calculateCategory } from '../lib/utils';

type CategoryStat = { id: string; count: number };

type ClubCard = {
  name: string;
  id?: string;
  ref_code?: string;
  location?: string;
  province?: string;
  autonomous_community?: string;
  country?: string;
  logo_url?: string;
  is_visible: boolean;
  categories: CategoryStat[];
  total_players: number;
};

const CATEGORY_COLORS: Record<string, string> = {
  SENIOR: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  JUVENIL: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  CADETE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  INFANTIL: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  'ALEVÃN': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  'BENJAMÃN': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  'PRE-BENJAMÃN': 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

export function ClubList({
  onSelectClub,
  onViewPlayers,
  ownerClubId,
}: {
  onSelectClub: (clubName: string) => void;
  onViewPlayers?: (clubName: string) => void;
  ownerClubId?: string | null;
}) {
  const [clubs, setClubs] = useState<ClubCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showNewClub, setShowNewClub] = useState(false);
  const [newClubName, setNewClubName] = useState('');
  const [creating, setCreating] = useState(false);
  const newClubInputRef = useRef<HTMLInputElement>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [cityFilter, setCityFilter] = useState('');
  const [provinceFilter, setProvinceFilter] = useState('');
  const [communityFilter, setCommunityFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [togglingClubId, setTogglingClubId] = useState<string | null>(null);
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'visible' | 'hidden'>('all');

  useEffect(() => {
    fetchClubs();
  }, [ownerClubId]);

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
      const club = await findOrCreateClub(trimmed);
      if (!club) throw new Error('No se pudo crear el club.');
      setShowNewClub(false);
      onSelectClub(club.name);
    } catch (err: any) {
      alert('Error al crear el club: ' + (err?.message || err));
    } finally {
      setCreating(false);
    }
  };

  const fetchClubs = async () => {
    setLoading(true);
    try {
      let clubsData = await fetchClubsWithVisibility(ownerClubId);

      let playersQuery = supabase
        .from('players')
        .select('club_name, birth_year')
        .not('club_name', 'is', null)
        .neq('club_name', '');
      if (ownerClubId) playersQuery = playersQuery.eq('owner_club_id', ownerClubId);
      const { data: playersData } = await playersQuery;

      const clubMap = new Map<string, Map<string, number>>();
      const displayNameByKey = new Map<string, string>();
      for (const p of playersData || []) {
        if (!p.club_name) continue;
        const key = normalizeClubName(p.club_name);
        if (!key) continue;
        if (!clubMap.has(key)) clubMap.set(key, new Map());
        if (!displayNameByKey.has(key)) displayNameByKey.set(key, p.club_name);
        const cats = clubMap.get(key)!;
        const cat = calculateCategory(p.birth_year, (p as any).birth_date);
        cats.set(cat, (cats.get(cat) || 0) + 1);
      }

      const registeredKeys = new Set(clubsData.map((c) => normalizeClubName(c.name)));
      for (const [key, displayName] of displayNameByKey) {
        if (!registeredKeys.has(key)) {
          clubsData.push({
            id: undefined as any,
            name: displayName,
            location: null,
            province: null,
            autonomous_community: null,
            country: null,
            logo_url: null,
            ref_code: null,
            is_visible: true,
          });
        }
      }

      const result: ClubCard[] = clubsData
        .map((c) => {
          const catsMap = clubMap.get(normalizeClubName(c.name));
          const categories = catsMap
            ? Array.from(catsMap.entries()).map(([id, count]) => ({ id, count }))
            : [];
          return {
            name: c.name,
            id: c.id ?? undefined,
            ref_code: (c as any).ref_code ?? undefined,
            location: c.location ?? undefined,
            province: (c as any).province ?? undefined,
            autonomous_community: (c as any).autonomous_community ?? undefined,
            country: (c as any).country ?? undefined,
            logo_url: c.logo_url ?? undefined,
            is_visible: c.is_visible ?? true,
            categories,
            total_players: categories.reduce((s, cat) => s + cat.count, 0),
          };
        })
        .sort((a, b) => b.total_players - a.total_players);

      setClubs(result);
    } catch (err) {
      console.error('Error fetching clubs:', err);
    } finally {
      setLoading(false);
    }
  };

  const countryOptions = useMemo(
    () => Array.from(new Set(clubs.map((c) => c.country).filter(Boolean))).sort() as string[],
    [clubs],
  );

  const communityOptions = useMemo(
    () =>
      Array.from(
        new Set(
          clubs
            .filter((c) => !countryFilter || c.country === countryFilter)
            .map((c) => c.autonomous_community)
            .filter(Boolean),
        ),
      ).sort() as string[],
    [clubs, countryFilter],
  );

  const provinceOptions = useMemo(
    () =>
      Array.from(
        new Set(
          clubs
            .filter((c) => !countryFilter || c.country === countryFilter)
            .filter((c) => !communityFilter || c.autonomous_community === communityFilter)
            .map((c) => c.province)
            .filter(Boolean),
        ),
      ).sort() as string[],
    [clubs, countryFilter, communityFilter],
  );

  const cityOptions = useMemo(
    () =>
      Array.from(
        new Set(
          clubs
            .filter((c) => !countryFilter || c.country === countryFilter)
            .filter((c) => !communityFilter || c.autonomous_community === communityFilter)
            .filter((c) => !provinceFilter || c.province === provinceFilter)
            .map((c) => c.location)
            .filter(Boolean),
        ),
      ).sort() as string[],
    [clubs, countryFilter, communityFilter, provinceFilter],
  );

  const handleCountryFilterChange = (value: string) => {
    setCountryFilter(value);
    if (communityFilter && !clubs.some((c) => c.autonomous_community === communityFilter && (!value || c.country === value))) {
      setCommunityFilter('');
    }
    if (provinceFilter && !clubs.some((c) => c.province === provinceFilter && (!value || c.country === value))) {
      setProvinceFilter('');
    }
    if (cityFilter && !clubs.some((c) => c.location === cityFilter && (!value || c.country === value))) {
      setCityFilter('');
    }
  };

  const handleCommunityFilterChange = (value: string) => {
    setCommunityFilter(value);
    if (provinceFilter && !clubs.some((c) => c.province === provinceFilter && (!value || c.autonomous_community === value))) {
      setProvinceFilter('');
    }
    if (cityFilter && !clubs.some((c) => c.location === cityFilter && (!value || c.autonomous_community === value))) {
      setCityFilter('');
    }
  };

  const handleProvinceFilterChange = (value: string) => {
    setProvinceFilter(value);
    if (cityFilter && !clubs.some((c) => c.location === cityFilter && (!value || c.province === value))) {
      setCityFilter('');
    }
  };

  const filtered = clubs.filter((c) => {
    const matchesSearch = search
      ? c.name.toLowerCase().includes(search.toLowerCase()) || (c.location || '').toLowerCase().includes(search.toLowerCase())
      : true;
    const matchesCity = cityFilter ? c.location === cityFilter : true;
    const matchesProvince = provinceFilter ? c.province === provinceFilter : true;
    const matchesCommunity = communityFilter ? c.autonomous_community === communityFilter : true;
    const matchesCountry = countryFilter ? c.country === countryFilter : true;
    const matchesVisibility =
      visibilityFilter === 'all'
        ? true
        : visibilityFilter === 'visible'
          ? c.is_visible
          : !c.is_visible;
    return matchesSearch && matchesCity && matchesProvince && matchesCommunity && matchesCountry && matchesVisibility;
  });

  const hasActiveFilters = !!(cityFilter || provinceFilter || communityFilter || countryFilter);
  const clearFilters = () => {
    setCityFilter('');
    setProvinceFilter('');
    setCommunityFilter('');
    setCountryFilter('');
  };

  const handleToggleVisibility = async (club: ClubCard) => {
    if (!ownerClubId || !club.id) return;
    const nextVisible = !club.is_visible;

    setTogglingClubId(club.id);
    setClubs((prev) => prev.map((item) => (item.id === club.id ? { ...item, is_visible: nextVisible } : item)));
    try {
      await setClubVisibilityForClient(ownerClubId, club.id, nextVisible);
    } catch (err: any) {
      setClubs((prev) => prev.map((item) => (item.id === club.id ? { ...item, is_visible: !nextVisible } : item)));
      alert('Error al cambiar la visibilidad del club: ' + (err?.message || err));
    } finally {
      setTogglingClubId(null);
    }
  };

  const renderVisibilityButton = (club: ClubCard) => {
    if (!club.id || !ownerClubId) return null;
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          void handleToggleVisibility(club);
        }}
        title={club.is_visible ? 'Ocultar este club para tu entidad' : 'Mostrar este club para tu entidad'}
        className={`p-2 rounded-xl border transition-colors ${
          club.is_visible
            ? 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
            : 'border-slate-700 text-slate-500 hover:bg-slate-800'
        }`}
      >
        {togglingClubId === club.id ? (
          <Loader2 size={14} className="animate-spin" />
        ) : club.is_visible ? (
          <Eye size={14} />
        ) : (
          <EyeOff size={14} />
        )}
      </button>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Estructura de Clubes</h1>
          <p className="text-slate-400 text-sm mt-1">
            Catálogo global de clubes. Cada entidad puede decidir cuáles ve activos.
          </p>
        </div>
        <button
          onClick={handleOpenNewClub}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 shrink-0"
        >
          <Plus size={14} />
          Nuevo Club
        </button>
      </div>

      {showNewClub && (
        <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-5 flex items-center gap-3 shadow-lg shadow-emerald-500/10">
          <Shield size={18} className="text-emerald-500 shrink-0" />
          <input
            ref={newClubInputRef}
            value={newClubName}
            onChange={(e) => setNewClubName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateClub();
              if (e.key === 'Escape') setShowNewClub(false);
            }}
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

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar club o ciudad..."
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500/50 transition-colors"
          />
        </div>

        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-2xl p-1 shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            title="Vista de cuadrícula"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              viewMode === 'grid' ? 'bg-emerald-600 text-slate-950' : 'text-slate-500 hover:text-white'
            }`}
          >
            <LayoutGrid size={13} />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            title="Vista de listado"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              viewMode === 'list' ? 'bg-emerald-600 text-slate-950' : 'text-slate-500 hover:text-white'
            }`}
          >
            <ListIcon size={13} />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="ml-auto flex items-center bg-slate-900 border border-slate-800 rounded-2xl p-1">
          <button
            type="button"
            onClick={() => setVisibilityFilter('all')}
            title="Ver todos"
            className={`p-2 rounded-xl transition-all ${
              visibilityFilter === 'all' ? 'bg-emerald-600 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Rows3 size={14} />
          </button>
          <button
            type="button"
            onClick={() => setVisibilityFilter('visible')}
            title="Ver visibles"
            className={`p-2 rounded-xl transition-all ${
              visibilityFilter === 'visible' ? 'bg-emerald-600 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Eye size={14} />
          </button>
          <button
            type="button"
            onClick={() => setVisibilityFilter('hidden')}
            title="Ver ocultos"
            className={`p-2 rounded-xl transition-all ${
              visibilityFilter === 'hidden' ? 'bg-emerald-600 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            <EyeOff size={14} />
          </button>
        </div>
        <select
          value={countryFilter}
          onChange={(e) => handleCountryFilterChange(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500/50 transition-colors"
        >
          <option value="">Todos los países</option>
          {countryOptions.map((co) => (
            <option key={co} value={co}>
              {co}
            </option>
          ))}
        </select>
        <select
          value={communityFilter}
          onChange={(e) => handleCommunityFilterChange(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500/50 transition-colors"
        >
          <option value="">Todas las comunidades</option>
          {communityOptions.map((cc) => (
            <option key={cc} value={cc}>
              {cc}
            </option>
          ))}
        </select>
        <select
          value={provinceFilter}
          onChange={(e) => handleProvinceFilterChange(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500/50 transition-colors"
        >
          <option value="">Todas las provincias</option>
          {provinceOptions.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500/50 transition-colors"
        >
          <option value="">Todas las ciudades</option>
          {cityOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-emerald-400 transition-colors"
          >
            <X size={12} />
            Limpiar filtros
          </button>
        )}
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
            {clubs.length === 0 ? 'Añade jugadores con su club para verlos aquí' : 'No se encontraron clubes con ese nombre'}
          </p>
        </div>
      ) : viewMode === 'list' ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden divide-y divide-slate-800">
          {filtered.map((club) => (
            <button
              key={club.name}
              onClick={() => onSelectClub(club.name)}
              className="w-full flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 hover:bg-slate-800/40 transition-colors text-left group"
            >
              <div className="w-10 h-10 shrink-0 flex items-center justify-center">
                {club.logo_url ? (
                  <img src={club.logo_url} alt={club.name} className="w-10 h-10 object-contain drop-shadow-md" />
                ) : (
                  <Shield size={22} className="text-emerald-500/60" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-black text-slate-100 group-hover:text-emerald-400 transition-colors uppercase tracking-tight truncate">
                  {club.name}
                </h3>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-slate-500 text-[11px] font-semibold">
                  {club.location && (
                    <span className="flex items-center gap-1">
                      <MapPin size={11} className="shrink-0" />
                      {club.location}
                    </span>
                  )}
                  {club.province && <span>{club.province}</span>}
                  {club.autonomous_community && <span className="text-slate-600">{club.autonomous_community}</span>}
                  {club.country && <span className="text-slate-700">{club.country}</span>}
                  {!club.location && !club.province && !club.autonomous_community && !club.country && (
                    <span className="italic text-slate-700">Sin localización</span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 shrink-0">
                {club.categories.map((cat) => (
                  <span
                    key={cat.id}
                    className={`px-2 py-0.5 text-[9px] font-black rounded-lg border ${
                      CATEGORY_COLORS[cat.id] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                    }`}
                  >
                    {cat.id}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {renderVisibilityButton(club)}
                {onViewPlayers && club.total_players > 0 ? (
                  <span
                    role="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewPlayers(club.name);
                    }}
                    className="flex items-center gap-1.5 text-slate-500 hover:text-emerald-400 transition-colors"
                  >
                    <Users size={12} />
                    <span className="text-[10px] font-black uppercase tracking-tighter underline-offset-2 hover:underline">
                      {club.total_players} jugador{club.total_players !== 1 ? 'es' : ''}
                    </span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <Users size={12} />
                    <span className="text-[10px] font-black uppercase tracking-tighter">
                      {club.total_players} jugador{club.total_players !== 1 ? 'es' : ''}
                    </span>
                  </span>
                )}
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-black uppercase tracking-wider ${club.is_visible ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {club.is_visible ? 'Visible' : 'Oculto'}
                  </span>
                  <ChevronRight size={14} className="text-slate-600 group-hover:text-emerald-400 transition-colors" />
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((club) => (
            <button
              key={club.name}
              onClick={() => onSelectClub(club.name)}
              className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden hover:border-emerald-500/40 transition-all group relative text-left flex flex-col"
            >
              <div className="flex items-start gap-4 px-6 pt-6 pb-4">
                <div className="w-16 h-16 shrink-0 flex items-center justify-center">
                  {club.logo_url ? (
                    <img src={club.logo_url} alt={club.name} className="w-16 h-16 object-contain drop-shadow-md" />
                  ) : (
                    <Shield size={38} className="text-emerald-500/60" />
                  )}
                </div>

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

              <div className="px-6 pb-4 flex flex-wrap gap-1.5">
                {club.categories.map((cat) => (
                  <span
                    key={cat.id}
                    className={`px-2 py-0.5 text-[9px] font-black rounded-lg border ${
                      CATEGORY_COLORS[cat.id] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                    }`}
                  >
                    {cat.id}
                  </span>
                ))}
              </div>

              <div className="mt-auto px-6 py-3 border-t border-slate-800/50 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {renderVisibilityButton(club)}
                  {onViewPlayers && club.total_players > 0 ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewPlayers(club.name);
                      }}
                      className="flex items-center gap-1.5 text-slate-500 hover:text-emerald-400 transition-colors group/btn"
                    >
                      <Users size={12} />
                      <span className="text-[10px] font-black uppercase tracking-tighter group-hover/btn:underline underline-offset-2">
                        {club.total_players} jugador{club.total_players !== 1 ? 'es' : ''}
                      </span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Users size={12} />
                      <span className="text-[10px] font-black uppercase tracking-tighter">
                        {club.total_players} jugador{club.total_players !== 1 ? 'es' : ''}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 text-slate-600 group-hover:text-emerald-400 transition-colors">
                  <span className={`text-[9px] font-black uppercase tracking-wider ${club.is_visible ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {club.is_visible ? 'Visible' : 'Oculto'}
                  </span>
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
