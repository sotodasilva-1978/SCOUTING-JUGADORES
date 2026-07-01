import type React from 'react';
import {
  Search, Filter, ChevronRight, User, Smartphone,
  Monitor, Trash2, Edit2, CheckSquare, Square, Merge, X, SlidersHorizontal
} from 'lucide-react';
import { Report, Player, Match } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState, useMemo } from 'react';
import { Trophy } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface ReportListProps {
  reports: Report[];
  players: Player[];
  matches: Match[];
  onNewReport: (mode: 'RAPID' | 'COMPLETE') => void;
  onEditReport: (report: Report) => void;
  onDeleteReport: (reportId: string) => void;
  onMergeReports: (reportIds: string[]) => void;
  onSelectPlayer: (player: Player) => void;
  userRole?: string;
  userId?: string;
}

export function ReportList({ 
  reports, 
  players, 
  matches, 
  onNewReport, 
  onEditReport,
  onDeleteReport,
  onMergeReports,
  onSelectPlayer
}: ReportListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filterRecommendation, setFilterRecommendation] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [filterRating, setFilterRating] = useState('ALL');

  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      const player = players.find(p => p.id === report.player_id);
      const searchLower = searchTerm.toLowerCase();

      const matchesSearch =
        player?.full_name.toLowerCase().includes(searchLower) ||
        report.recommendation.toLowerCase().includes(searchLower);

      const matchesRecommendation =
        filterRecommendation === 'ALL' || report.recommendation === filterRecommendation;

      const matchesType =
        filterType === 'ALL' ||
        (filterType === 'RAPID' && (report.minutes_observed ?? 0) <= 45) ||
        (filterType === 'COMPLETE' && (report.minutes_observed ?? 0) > 45);

      const matchesRating =
        filterRating === 'ALL' ||
        (filterRating === '5' && report.match_rating === 5) ||
        (filterRating === '4+' && report.match_rating >= 4) ||
        (filterRating === '3-' && report.match_rating <= 3);

      return matchesSearch && matchesRecommendation && matchesType && matchesRating;
    });
  }, [reports, players, searchTerm, filterRecommendation, filterType, filterRating]);

  const activeFilterCount = [filterRecommendation, filterType, filterRating].filter(f => f !== 'ALL').length;

  const clearFilters = () => {
    setFilterRecommendation('ALL');
    setFilterType('ALL');
    setFilterRating('ALL');
  };

  const handleToggleSelect = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedReports(prev => 
      prev.includes(id) ? prev.filter(rId => rId !== id) : [...prev, id]
    );
  };

  const selectedReportsData = reports.filter(r => selectedReports.includes(r.id));
  const canMerge = selectedReports.length >= 2 && 
    new Set(selectedReportsData.map(r => r.player_id)).size === 1;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-100 tracking-tight italic">Últimos Informes</h1>
          <p className="text-slate-500 font-medium">Historial de evaluaciones de observadores</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => onNewReport('RAPID')}
            className="group bg-slate-100 hover:bg-white text-slate-950 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95 border-b-4 border-slate-300"
          >
            <Smartphone size={18} className="text-slate-600 group-hover:scale-110 transition-transform" />
            Informe de Campo
          </button>
          <button 
            onClick={() => onNewReport('COMPLETE')}
            className="group bg-blue-600 hover:bg-blue-500 text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-900/20 active:scale-95 border-b-4 border-blue-800"
          >
            <Monitor size={18} className="text-blue-200 group-hover:scale-110 transition-transform" />
            Análisis Completo
          </button>
        </div>
      </div>

      <AnimatePresence>
        {selectedReports.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-emerald-600 p-4 rounded-2xl flex items-center justify-between shadow-2xl"
          >
            <div className="flex items-center gap-4">
              <CheckSquare className="text-slate-950" size={20} />
              <p className="font-black text-slate-950 uppercase tracking-widest text-xs">
                {selectedReports.length} Informes seleccionados
              </p>
            </div>
            <div className="flex items-center gap-3">
              {canMerge && (
                <button 
                  onClick={() => {
                    onMergeReports(selectedReports);
                    setSelectedReports([]);
                  }}
                  className="bg-slate-950 text-emerald-500 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-900 transition-colors"
                >
                  <Merge size={14} />
                  Unificar Informes
                </button>
              )}
              <button 
                onClick={() => setSelectedReports([])}
                className="text-slate-950 hover:text-white transition-colors"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-900/30">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Buscar por jugador u observador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-2 text-sm focus:border-blue-500 outline-none transition-all"
            />
          </div>
          <div className="relative">
            <button
              onClick={() => setShowFilters(v => !v)}
              className={cn(
                "relative p-2.5 border rounded-xl transition-all",
                showFilters || activeFilterCount > 0
                  ? "border-blue-500/50 text-blue-400 bg-blue-500/10"
                  : "border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700"
              )}
            >
              <SlidersHorizontal size={18} />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-blue-500 text-white text-[9px] font-black flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-72 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                      <Filter size={12} /> Filtros
                    </span>
                    <div className="flex items-center gap-2">
                      {activeFilterCount > 0 && (
                        <button onClick={clearFilters} className="text-[9px] font-black text-blue-400 uppercase tracking-wider hover:text-blue-300 transition-colors">
                          Limpiar
                        </button>
                      )}
                      <button onClick={() => setShowFilters(false)} className="text-slate-600 hover:text-slate-300 transition-colors">
                        <X size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="p-4 space-y-4">
                    {/* Recomendación */}
                    <div>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Recomendación</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          { value: 'ALL', label: 'Todos' },
                          { value: 'PRIORITY', label: 'Prioridad' },
                          { value: 'TRACKING', label: 'Seguimiento' },
                          { value: 'INTERESTING', label: 'Interesante' },
                          { value: 'DISCARD', label: 'Descartar' },
                        ].map(opt => (
                          <button
                            key={opt.value}
                            onClick={() => setFilterRecommendation(opt.value)}
                            className={cn(
                              "px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all text-left",
                              filterRecommendation === opt.value
                                ? "bg-blue-500/20 text-blue-400 border border-blue-500/40"
                                : "bg-slate-950 text-slate-500 border border-slate-800 hover:border-slate-700 hover:text-slate-300"
                            )}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Score */}
                    <div>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Score del partido</p>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[
                          { value: 'ALL', label: 'Todos' },
                          { value: '5', label: '★ 5' },
                          { value: '4+', label: '4+' },
                          { value: '3-', label: '≤ 3' },
                        ].map(opt => (
                          <button
                            key={opt.value}
                            onClick={() => setFilterRating(opt.value)}
                            className={cn(
                              "px-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all text-center",
                              filterRating === opt.value
                                ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                                : "bg-slate-950 text-slate-500 border border-slate-800 hover:border-slate-700 hover:text-slate-300"
                            )}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="divide-y divide-slate-800">
          {filteredReports.map((report) => {
            const player = players.find(p => p.id === report.player_id);
            const match = matches.find(m => m.id === report.match_id);
            const isSelected = selectedReports.includes(report.id);
            
            return (
              <div 
                key={report.id}
                onClick={() => onEditReport(report)}
                className={cn(
                  "group p-5 hover:bg-slate-800/30 transition-all cursor-pointer flex flex-col md:flex-row md:items-center gap-4",
                  isSelected && "bg-blue-500/5 border-l-4 border-l-blue-500"
                )}
              >
                <div 
                  onClick={(e) => handleToggleSelect(e, report.id)}
                  className="shrink-0 p-2 -ml-2 rounded-xl hover:bg-slate-700/50 transition-colors cursor-pointer group/check"
                >
                  {isSelected ? (
                    <CheckSquare size={20} className="text-emerald-500" />
                  ) : (
                    <Square size={20} className="text-slate-700 group-hover/check:text-slate-500 transition-colors" />
                  )}
                </div>

                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center font-black text-blue-500 text-lg group-hover:border-blue-500/50 transition-colors">
                    {report.match_rating}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-100 group-hover:text-blue-400 transition-colors">
                      {player?.full_name || 'Jugador Desconocido'}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                       <span className={cn(
                         "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md",
                         report.recommendation === 'PRIORITY' ? "bg-emerald-500/10 text-emerald-500" : 
                         report.recommendation === 'TRACKING' ? "bg-blue-500/10 text-blue-500" :
                         "bg-slate-800 text-slate-500"
                       )}>
                         {report.recommendation}
                       </span>
                       <span className="text-[10px] text-slate-600">•</span>
                       <span className="text-xs text-slate-500 font-medium">Scout Principal</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-1 md:justify-center">
                  {match ? (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950 rounded-xl border border-slate-800 max-w-[240px]">
                      <Trophy size={14} className="text-slate-600 shrink-0" />
                      <p className="text-xs font-medium text-slate-400 truncate">{match.home_team} vs {match.away_team}</p>
                    </div>
                  ) : (
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">Informe General</span>
                  )}
                </div>

                <div className="flex items-center justify-between md:justify-end gap-3 md:w-72">
                  <div className="text-right mr-4 hidden sm:block">
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Fecha</p>
                    <p className="text-xs font-bold text-slate-400 font-mono">{format(new Date(report.report_date), "dd MMM yy", { locale: es })}</p>
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    {player && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectPlayer(player);
                        }}
                        className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-500 hover:text-emerald-400 hover:border-emerald-500/30 transition-all"
                        title="Ver Ficha Jugador"
                      >
                        <User size={14} />
                      </button>
                    )}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditReport(report);
                      }}
                      className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-500 hover:text-blue-400 hover:border-blue-500/30 transition-all"
                      title="Editar Informe"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('¿Estás seguro de eliminar este informe?')) {
                          onDeleteReport(report.id);
                        }
                      }}
                      className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-500 hover:text-rose-400 hover:border-rose-500/30 transition-all"
                      title="Borrar Informe"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (player) onSelectPlayer(player);
                    }}
                    className="ml-2 text-slate-800 hover:text-blue-500 transition-all"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
