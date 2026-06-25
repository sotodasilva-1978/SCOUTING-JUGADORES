import { Search, Filter, Plus, Eye, FileText, Trash2, ChevronLeft, ChevronRight, User, X, SlidersHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatRating, getStatusColor, getStatusLabel, calculateCategory, sortPositions, POSITION_ORDER } from '../lib/utils';
import { memo, useMemo, useState, ReactNode } from 'react';
import { Player } from '../types';

export const PlayerList = memo(function PlayerList({ 
  players, 
  onSelectPlayer, 
  onNewPlayer, 
  onDeletePlayer 
}: { 
  players: Player[], 
  onSelectPlayer: (player: Player, tab?: string) => void, 
  onNewPlayer: () => void,
  onDeletePlayer?: (id: string) => void
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [posFilter, setPosFilter] = useState('ALL');
  const [catFilter, setCatFilter] = useState('ALL');
  const [clubFilter, setClubFilter] = useState('ALL');
  const [ratingFilter, setRatingFilter] = useState('ALL');
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [activeHeaderMenu, setActiveHeaderMenu] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Extract unique values for filters
  const positions = useMemo(() => sortPositions(['ALL', ...new Set(players.filter(Boolean).map(p => p.main_position))]), [players]);
  const categories = useMemo(() => ['ALL', ...new Set(players.filter(Boolean).map(p => calculateCategory(p.birth_year)))].sort(), [players]);
  const clubs = useMemo(() => ['ALL', ...new Set(players.filter(Boolean).map(p => p.club_name).filter(Boolean) as string[])].sort(), [players]);
  const statuses = useMemo(() => ['ALL', 'NEW', 'PRIORITY', 'TRACKING', 'DISCARDED', 'OBSERVED', 'INTERESTING', 'VERY_INTERESTING', 'CONTACTED', 'ON_TRIAL', 'SIGNED', 'NOT_AVAILABLE'], []);

  const filteredPlayers = useMemo(() => {
    let result = players.filter(Boolean).filter(p => {
      const pFullName = p.full_name || '';
      const pClubName = p.club_name || '';
      const pPosition = p.main_position || '';
      
      const matchesSearch = pFullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           pClubName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           pPosition.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
      const matchesPos = posFilter === 'ALL' || p.main_position === posFilter;
      const matchesCat = catFilter === 'ALL' || calculateCategory(p.birth_year) === catFilter;
      const matchesClub = clubFilter === 'ALL' || p.club_name === clubFilter;
      
      let matchesRating = true;
      if (ratingFilter !== 'ALL') {
        const rating = p.global_rating || 0;
        if (ratingFilter === '4+') matchesRating = rating >= 4;
        else if (ratingFilter === '3-4') matchesRating = rating >= 3 && rating < 4;
        else if (ratingFilter === '3-') matchesRating = rating < 3;
      }

      return matchesSearch && matchesStatus && matchesPos && matchesCat && matchesRating && matchesClub;
    });

    if (sortConfig) {
      result.sort((a, b) => {
        let aValue: any = a[sortConfig.key as keyof Player];
        let bValue: any = b[sortConfig.key as keyof Player];

        // Custom handling for derived/nested fields
        if (sortConfig.key === 'age') {
          aValue = a.birth_year || 0;
          bValue = b.birth_year || 0;
        } else if (sortConfig.key === 'category') {
          aValue = calculateCategory(a.birth_year);
          bValue = calculateCategory(b.birth_year);
        } else if (sortConfig.key === 'main_position') {
          aValue = POSITION_ORDER[a.main_position] || 99;
          bValue = POSITION_ORDER[b.main_position] || 99;
        }

        if (aValue === undefined || aValue === null) return 1;
        if (bValue === undefined || bValue === null) return -1;

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [players, searchTerm, statusFilter, posFilter, catFilter, ratingFilter, clubFilter, sortConfig]);

  const totalPages = Math.ceil(filteredPlayers.length / itemsPerPage);
  
  const paginatedPlayers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredPlayers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredPlayers, currentPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) return <SlidersHorizontal size={10} className="opacity-30" />;
    return sortConfig.direction === 'asc' ? <ChevronLeft size={10} className="rotate-90 text-emerald-500" /> : <ChevronLeft size={10} className="-rotate-90 text-emerald-500" />;
  };

  const HeaderCell = ({ label, sortKey, filterKey, filterValue, options, setFilter, renderOption, noFilter = false }: { 
    label: string, 
    sortKey?: string, 
    filterKey?: string,
    filterValue?: string, 
    options?: string[], 
    setFilter?: (val: string) => void,
    renderOption?: (val: string) => ReactNode,
    noFilter?: boolean
  }) => (
    <th className="pb-4 pt-1 px-4 relative group">
      <div className="flex items-center gap-2">
        <button 
          onClick={() => sortKey && requestSort(sortKey)}
          className={cn(
            "flex items-center gap-1.5 font-black text-[10px] uppercase tracking-[0.2em] transition-colors relative",
            sortKey ? "hover:text-emerald-400 cursor-pointer" : "cursor-default text-slate-500",
            sortConfig?.key === sortKey ? "text-emerald-500" : "text-slate-500"
          )}
        >
          {label}
          {sortKey && getSortIcon(sortKey)}
        </button>
        
        {!noFilter && filterKey && setFilter && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setActiveHeaderMenu(activeHeaderMenu === filterKey ? null : filterKey);
            }}
            className={cn(
              "p-1 rounded-md transition-all",
              filterValue !== 'ALL' ? "bg-emerald-500/20 text-emerald-500" : "text-slate-600 hover:text-slate-300"
            )}
          >
            <Filter size={10} />
          </button>
        )}
      </div>

      <AnimatePresence>
        {!noFilter && activeHeaderMenu === filterKey && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setActiveHeaderMenu(null)} />
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute left-4 top-full mt-1 z-50 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl min-w-[180px] py-2 overflow-hidden"
            >
              <div className="px-3 py-1.5 border-b border-slate-800/50 mb-1">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Filtrar por {label}</p>
              </div>
              <div className="max-h-[250px] overflow-y-auto custom-scrollbar">
                {options?.map(opt => (
                  <button
                    key={opt}
                    onClick={() => {
                      setFilter(opt);
                      setActiveHeaderMenu(null);
                      setCurrentPage(1);
                    }}
                    className={cn(
                      "w-full text-left px-4 py-2 text-[10px] font-bold transition-all flex items-center justify-between group/opt",
                      filterValue === opt ? "text-emerald-400 bg-emerald-500/5" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                    )}
                  >
                    {renderOption ? renderOption(opt) : opt.toUpperCase()}
                    {filterValue === opt && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />}
                  </button>
                ))}
              </div>
              {filterValue !== 'ALL' && (
                <button 
                  onClick={() => {
                    setFilter('ALL');
                    setActiveHeaderMenu(null);
                  }}
                  className="w-full text-center py-2 mt-1 border-t border-slate-800/50 text-[9px] font-black text-rose-500 hover:bg-rose-500/5 transition-all"
                >
                  LIMPIAR FILTRO
                </button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </th>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-100 tracking-tight">BASE DE DATOS</h1>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <User size={12} className="text-emerald-500" /> {players.length} JUGADORES REGISTRADOS
          </p>
        </div>
        <button 
          onClick={onNewPlayer}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-600 rounded-xl text-slate-950 hover:bg-emerald-500 transition-all font-black shadow-lg shadow-emerald-600/20 active:scale-95 text-xs tracking-widest"
        >
          <Plus className="w-4 h-4" />
          AÑADIR JUGADOR
        </button>
      </div>

      <div className="bg-slate-900/40 border border-slate-800/60 rounded-[2rem] p-6 backdrop-blur-sm shadow-2xl relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] pointer-events-none" />
        
        <div className="flex flex-col gap-6 mb-8 relative">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Buscar por nombre, equipo o posición..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all placeholder:text-slate-600 font-medium"
              />
            </div>
            {(searchTerm || statusFilter !== 'ALL' || posFilter !== 'ALL' || catFilter !== 'ALL' || ratingFilter !== 'ALL' || clubFilter !== 'ALL') && (
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('ALL');
                  setPosFilter('ALL');
                  setCatFilter('ALL');
                  setRatingFilter('ALL');
                  setClubFilter('ALL');
                  setSortConfig(null);
                }}
                className="flex items-center gap-2 px-5 py-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-500 text-[10px] font-black tracking-widest uppercase hover:bg-rose-500/20 transition-all"
              >
                <X size={16} />
                LIMPIAR TODOS LOS FILTROS
              </button>
            )}
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/50">
                <HeaderCell 
                  label="Jugador" 
                  sortKey="full_name"
                  noFilter
                />
                <HeaderCell 
                  label="Edad" 
                  sortKey="birth_year"
                  noFilter
                />
                <HeaderCell 
                  label="Equipo" 
                  sortKey="club_name"
                  filterKey="club"
                  filterValue={clubFilter}
                  options={clubs}
                  setFilter={setClubFilter}
                />
                <HeaderCell 
                  label="Categoría" 
                  sortKey="category"
                  filterKey="cat"
                  filterValue={catFilter}
                  options={categories}
                  setFilter={setCatFilter}
                />
                <HeaderCell 
                  label="Posición" 
                  sortKey="main_position"
                  filterKey="pos"
                  filterValue={posFilter}
                  options={positions}
                  setFilter={setPosFilter}
                />
                <HeaderCell 
                  label="Estado" 
                  sortKey="status"
                  filterKey="status"
                  filterValue={statusFilter}
                  options={statuses}
                  setFilter={setStatusFilter}
                  renderOption={(opt) => (
                    <span className="flex items-center gap-2 uppercase">
                      <span className={cn("w-1.5 h-1.5 rounded-full", getStatusColor(opt))} />
                      {getStatusLabel(opt)}
                    </span>
                  )}
                />
                <HeaderCell 
                  label="Rating" 
                  sortKey="global_rating"
                  filterKey="rating"
                  filterValue={ratingFilter}
                  options={['ALL', '4+', '3-4', '3-']}
                  setFilter={setRatingFilter}
                  renderOption={(opt) => (
                    <span className="uppercase">
                      {opt === 'ALL' ? 'Todos' : opt === '4+' ? 'Excelente (4+)' : opt === '3-4' ? 'Bueno (3-4)' : 'A mejorar (<3)'}
                    </span>
                  )}
                />
                <th className="pb-4 pt-1 font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 px-4 text-right">Ficha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/30">
              {paginatedPlayers.map(player => (
                <tr 
                  key={player.id} 
                  onClick={() => onSelectPlayer(player)}
                  className="group hover:bg-slate-800/20 transition-all cursor-pointer relative"
                >
                  <td className="py-5 px-4 relative">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-emerald-500 scale-y-0 group-hover:scale-y-100 transition-transform origin-center rounded-r-full" />
                    <div className="flex items-center gap-4">
                       <div className="w-11 h-11 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-slate-400 overflow-hidden shadow-inner group-hover:border-emerald-500/30 transition-colors">
                         {player.avatar_url ? <img src={player.avatar_url} alt="" className="w-full h-full object-cover" /> : <User className="w-6 h-6 opacity-40" />}
                       </div>
                       <div>
                         <p className="font-black text-slate-100 group-hover:text-emerald-400 transition-colors tracking-tight">{player.full_name}</p>
                         {player.ref_code && <span className="ref-chip mt-1"><span className="text-slate-600 mr-1">ID</span>{player.ref_code}</span>}
                       </div>
                    </div>
                  </td>
                  <td className="py-5 px-4">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      {player.birth_year ? `${player.birth_year} • ${player.calculated_age}A` : 'N/R'}
                    </p>
                  </td>
                  <td className="py-5 px-4">
                    <p className="text-slate-300 font-bold tracking-tight text-sm">{player.club_name || 'Sin equipo'}</p>
                  </td>
                  <td className="py-5 px-4">
                    <p className="text-[9px] text-emerald-500 uppercase font-black tracking-[0.1em]">{calculateCategory(player.birth_year)}</p>
                  </td>
                  <td className="py-5 px-4">
                    <span className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-[10px] font-black text-slate-400 group-hover:text-emerald-400 group-hover:border-emerald-500/20 transition-all shadow-sm">
                      {player.main_position}
                    </span>
                  </td>
                  <td className="py-5 px-4">
                    <span className={cn(
                      "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.1em] block w-fit shadow-lg shadow-black/20 border border-white/5", 
                      getStatusColor(player.status)
                    )}>
                      {getStatusLabel(player.status)}
                    </span>
                  </td>
                  <td className="py-5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 shadow-sm">
                        <span className="text-sm font-black text-emerald-400 italic">{formatRating(player.global_rating)}</span>
                      </div>
                      <div className="text-[9px] text-slate-500 font-black tracking-widest">
                        <p className="leading-none text-blue-400/80">P: {formatRating(player.potential_rating)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectPlayer(player, 'resumen');
                        }}
                        className="p-2.5 text-slate-500 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-xl transition-all border border-transparent hover:border-emerald-500/20 shadow-sm" 
                        title="Ver Perfil"
                      >
                        <Eye size={20} />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectPlayer(player, 'informes');
                        }}
                        className="p-2.5 text-slate-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-xl transition-all border border-transparent hover:border-blue-500/20 shadow-sm" 
                        title="Informes"
                      >
                        <FileText size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View - Cards */}
        <div className="lg:hidden space-y-4">
           {paginatedPlayers.map(player => (
             <div 
               key={player.id} 
               onClick={() => onSelectPlayer(player)}
               className="bg-slate-950 border border-slate-800 rounded-[2rem] p-6 space-y-5 active:scale-[0.98] transition-all relative overflow-hidden group shadow-xl"
             >
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-[50px] group-hover:bg-emerald-500/10" />
                
                <div className="flex items-center justify-between relative">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-slate-400 shadow-inner group-active:border-emerald-500/50 transition-colors">
                      {player.avatar_url ? <img src={player.avatar_url} alt="" className="w-full h-full object-cover rounded-2xl" /> : <User className="w-8 h-8 opacity-20" />}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-100 tracking-tight group-hover:text-emerald-400 transition-colors">{player.full_name}</h4>
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">
                        {player.main_position} • {calculateCategory(player.birth_year)} • {player.birth_year || 'N/R'} ({player.calculated_age}A)
                      </p>
                      {player.ref_code && <span className="ref-chip mt-1.5"><span className="text-slate-600 mr-1">ID</span>{player.ref_code}</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-end gap-1">
                      <p className="text-emerald-500 font-black text-2xl italic leading-none">{formatRating(player.global_rating)}</p>
                    </div>
                    <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest mt-1">RATING</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-5 border-t border-slate-800/50 relative">
                  <span className={cn(
                    "px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.1em] shadow-lg shadow-black/20 border border-white/5", 
                    getStatusColor(player.status)
                  )}>
                    {getStatusLabel(player.status)}
                  </span>
                  <div className="flex items-center gap-3">
                     <button 
                       onClick={(e) => {
                         e.stopPropagation();
                         onSelectPlayer(player, 'informes');
                       }}
                       className="p-3 bg-slate-900/50 border border-slate-800 rounded-2xl text-slate-500 hover:text-blue-400 transition-all active:scale-90"
                     >
                       <FileText size={20}/>
                     </button>
                     <button 
                       onClick={(e) => {
                         e.stopPropagation();
                         onSelectPlayer(player, 'resumen');
                       }}
                       className="p-3 bg-emerald-600/10 border border-emerald-600/20 rounded-2xl text-emerald-500 font-bold active:scale-90"
                     >
                       <Eye size={20}/>
                     </button>
                  </div>
                </div>
             </div>
           ))}
        </div>

        {/* Empty State */}
        {filteredPlayers.length === 0 && (
          <div className="py-20 text-center space-y-4">
            <div className="w-20 h-20 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-700">
               <User size={32} />
            </div>
            <p className="text-slate-400 font-bold">No se encontraron jugadores con los filtros seleccionados.</p>
            <button 
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('ALL');
                setPosFilter('ALL');
                setCatFilter('ALL');
                setRatingFilter('ALL');
                setSortConfig(null);
              }} 
              className="text-emerald-500 font-black text-xs uppercase tracking-widest hover:underline px-4 py-2"
            >
              Limpiar todos los filtros
            </button>
          </div>
        )}

        {/* Pagination */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-slate-800 pt-8">
          <p className="text-xs text-slate-500 font-black uppercase tracking-wider">
            Mostrando <span className="text-slate-300">{filteredPlayers.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-{Math.min(currentPage * itemsPerPage, filteredPlayers.length)}</span> de <span className="text-emerald-500">{filteredPlayers.length}</span> talentos
          </p>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-500 hover:text-slate-200 disabled:opacity-20 transition-all hover:bg-slate-900"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex gap-2">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button 
                  key={i + 1} 
                  onClick={() => handlePageChange(i + 1)}
                  className={cn(
                    "w-9 h-9 rounded-xl text-[10px] font-black transition-all border", 
                    currentPage === i + 1 
                      ? "bg-emerald-600 border-emerald-500 text-slate-950 shadow-lg shadow-emerald-600/20" 
                      : "bg-slate-950 border-slate-800 text-slate-500 hover:bg-slate-900 hover:text-slate-300"
                  )}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button 
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-500 hover:text-slate-200 disabled:opacity-20 transition-all hover:bg-slate-900"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
