import { memo, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Plus, ChevronRight, Star, Video, Calendar, ArrowUpRight, 
  Users, ClipboardList, Shield, Trophy, CheckCircle2, XCircle, Clock, MapPin, MousePointer2, User, FileText, Play
} from 'lucide-react';
import { Player, Match, Report, Video as VideoType } from '../types';
import { cn, formatRating, getStatusColor } from '../lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface DashboardProps {
  onSelectPlayer: (player: Player) => void;
  onSelectMatch: (match: Match) => void;
  onTabChange: (tab: string) => void;
  players: Player[];
  matches: Match[];
  reports: Report[];
  videos: VideoType[];
}

const ScoutSummaryCard = memo(({ players }: { players: Player[] }) => {
  const positionDistribution = useMemo(() => {
    const dist = { strikers: 0, midfielders: 0, defenders: 0, keepers: 0 };
    players.forEach(p => {
      if (!p) return;
      const pos = (p.main_position || '').toUpperCase();
      if (['ST', 'CF', 'LW', 'RW', 'EXT', 'DEL'].some(m => pos.includes(m))) dist.strikers++;
      else if (['CDM', 'CM', 'CAM', 'RM', 'LM', 'MC', 'MCO', 'MCD'].some(m => pos.includes(m))) dist.midfielders++;
      else if (['CB', 'LB', 'RB', 'LWB', 'RWB', 'DFC', 'DEF'].some(m => pos.includes(m))) dist.defenders++;
      else if (['GK', 'POR'].some(m => pos.includes(m))) dist.keepers++;
      else dist.midfielders++;
    });
    return [
      { name: 'Delanteros', value: dist.strikers, color: '#3b82f6' },
      { name: 'Centrocamp.', value: dist.midfielders, color: '#10b981' },
      { name: 'Defensas', value: dist.defenders, color: '#f59e0b' },
      { name: 'Porteros', value: dist.keepers, color: '#ef4444' }
    ];
  }, [players]);

  const categoryDistribution = useMemo(() => {
    const dist: Record<string, number> = { 
      'cat-senior': 0, 'cat-juvenil': 0, 'cat-cadete': 0, 
      'cat-infantil': 0, 'cat-alevin': 0, 'cat-benjamin': 0, 'cat-prebenjamin': 0 
    };
    players.forEach(p => {
      if (!p) return;
      if (dist[p.category_id] !== undefined) dist[p.category_id]++;
      else dist['cat-senior']++;
    });
    return [
      { name: 'Senior', value: dist['cat-senior'], color: '#8b5cf6' },
      { name: 'Juvenil', value: dist['cat-juvenil'], color: '#ec4899' },
      { name: 'Cadete', value: dist['cat-cadete'], color: '#06b6d4' },
      { name: 'Infantil', value: dist['cat-infantil'], color: '#f87171' },
      { name: 'Alevin+', value: dist['cat-alevin'] + dist['cat-benjamin'] + dist['cat-prebenjamin'], color: '#fbbf24' }
    ];
  }, [players]);

  const statusDistribution = useMemo(() => {
    const dist = { priority: 0, tracking: 0, interesting: 0, new: 0 };
    players.forEach(p => {
      if (!p) return;
      const s = (p.status || '').toUpperCase();
      if (s === 'PRIORITY') dist.priority++;
      else if (s === 'TRACKING') dist.tracking++;
      else if (s === 'INTERESTING') dist.interesting++;
      else dist.new++;
    });
    return [
      { name: 'Prioridad', value: dist.priority, color: '#10b981' },
      { name: 'Seguimiento', value: dist.tracking, color: '#3b82f6' },
      { name: 'Interesante', value: dist.interesting, color: '#8b5cf6' },
      { name: 'Nuevo', value: dist.new, color: '#64748b' }
    ];
  }, [players]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900/40 border border-slate-800/80 rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden backdrop-blur-sm"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
        {/* Posiciones */}
        <div className="bg-slate-950/40 border border-slate-800/50 p-6 rounded-[2.5rem] hover:border-emerald-500/10 transition-all group backdrop-blur-md">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-24 h-24 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <PieChart>
                  <Pie data={positionDistribution} innerRadius={28} outerRadius={40} paddingAngle={6} dataKey="value" stroke="none">
                    {positionDistribution.map((entry, index) => <Cell key={`cell-p-${index}`} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full">
              <p className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-4 italic">Posiciones</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {positionDistribution.map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-[9px] font-bold text-slate-500 uppercase">{item.name}</span>
                    </div>
                    <span className="text-[10px] font-black text-slate-200">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Categorías */}
        <div className="bg-slate-950/40 border border-slate-800/50 p-6 rounded-[2.5rem] hover:border-emerald-500/10 transition-all group backdrop-blur-md">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-24 h-24 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <PieChart>
                  <Pie data={categoryDistribution} innerRadius={28} outerRadius={40} paddingAngle={6} dataKey="value" stroke="none">
                    {categoryDistribution.map((entry, index) => <Cell key={`cell-c-${index}`} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full">
              <p className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-4 italic">Niveles</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {categoryDistribution.map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-[9px] font-bold text-slate-500 uppercase">{item.name}</span>
                    </div>
                    <span className="text-[10px] font-black text-slate-200">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Estados */}
        <div className="bg-slate-950/40 border border-slate-800/50 p-6 rounded-[2.5rem] hover:border-emerald-500/10 transition-all group backdrop-blur-md">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-24 h-24 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <PieChart>
                  <Pie data={statusDistribution} innerRadius={28} outerRadius={40} paddingAngle={6} dataKey="value" stroke="none">
                    {statusDistribution.map((entry, index) => <Cell key={`cell-s-${index}`} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full">
              <p className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-4 italic">Estatus</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {statusDistribution.map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-[9px] font-bold text-slate-500 uppercase">{item.name}</span>
                    </div>
                    <span className="text-[10px] font-black text-slate-200">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

export const Dashboard = memo(function Dashboard({ 
  onSelectPlayer, 
  onSelectMatch,
  onTabChange,
  players, 
  matches, 
  reports, 
  videos 
}: DashboardProps) {
  
  const stats = useMemo(() => [
    { 
      id: 'total',
      label: 'Total Players', 
      value: players.length, 
      icon: Users, 
      color: 'text-white', 
      bgColor: 'bg-emerald-500' 
    },
    { 
      id: 'players',
      label: 'En Seguimiento', 
      value: players.filter(p => !['DISCARDED'].includes(p.status || '')).length, 
      valueReal: players.length, 
      icon: Users, 
      color: 'text-blue-500', 
      bgColor: 'bg-blue-500/10' 
    },
    { 
      id: 'matches',
      label: 'Partidos', 
      value: matches.length, 
      icon: Calendar, 
      color: 'text-emerald-500', 
      bgColor: 'bg-emerald-500/10' 
    },
    { 
      id: 'reports',
      label: 'Informes', 
      value: reports.length, 
      icon: ClipboardList, 
      color: 'text-amber-500', 
      bgColor: 'bg-amber-500/10' 
    },
    { 
      id: 'stars',
      label: 'Prioritarios', 
      value: players.filter(p => p.status === 'PRIORITY').length, 
      icon: Star, 
      color: 'text-purple-500', 
      bgColor: 'bg-purple-500/10' 
    },
  ], [players, matches, reports]);

  const topPlayers = useMemo(() => 
    [...players]
      .sort((a,b) => (b.global_rating || 0) - (a.global_rating || 0))
      .slice(0, 4)
  , [players]);

  const recentMatches = useMemo(() => matches.slice(0, 4), [matches]);
  const recentReports = useMemo(() => reports.slice(0, 4), [reports]);
  const recentVideos = useMemo(() => videos.slice(0, 3), [videos]);

  return (
    <div className="space-y-10 animate-in fade-in duration-1000 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-800/50">
        <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
        >
          <h1 className="text-6xl font-black text-white tracking-tighter italic uppercase leading-[0.85]">
            U.D. SANTA MARIÑA
            <span className="block text-emerald-500 text-2xl mt-4 not-italic font-black tracking-[0.3em] uppercase opacity-90">
              - AS SCOUT -
            </span>
          </h1>
        </motion.div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-2xl text-[10px] font-black text-slate-500 uppercase tracking-widest">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Sync
          </div>
        </div>
      </div>

      <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {stats.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => onTabChange(stat.id === 'stars' ? 'players' : stat.id as any)}
            className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-[2rem] cursor-pointer hover:border-white/10 transition-all group active:scale-95 shadow-lg flex flex-col justify-between"
          >
            <div className={cn("w-10 h-10 rounded-xl mb-4 flex items-center justify-center transition-transform group-hover:scale-110", stat.bgColor)}>
              <stat.icon size={18} className={stat.color} />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{stat.label}</p>
              <p className="text-3xl font-black text-white italic tabular-nums leading-none mt-1">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </section>

      <ScoutSummaryCard players={players} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10">
        <div className="lg:col-span-8 space-y-10">
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
                <h3 className="text-xl font-black text-slate-100 italic tracking-tight uppercase">NOTAS DE CAMPO</h3>
              </div>
              <button onClick={() => onTabChange('reports')} className="text-[10px] font-black text-slate-600 uppercase tracking-widest hover:text-white transition-colors">Ver Archivo</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {recentReports.map((report, idx) => {
                const player = players.find(p => p.id === report.player_id);
                return (
                  <motion.div 
                    key={report.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    onClick={() => player && onSelectPlayer(player)}
                    className="group bg-slate-900/40 border border-slate-800/80 p-5 rounded-[2rem] hover:border-amber-500/30 transition-all cursor-pointer relative overflow-hidden active:scale-95 shadow-lg"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 group-hover:border-amber-500/50 transition-colors flex items-center justify-center font-black text-amber-500 italic">
                        {player?.full_name[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-black text-white italic tracking-tight uppercase truncate">{player?.full_name}</p>
                        <p className="text-[9px] font-bold text-slate-500 uppercase">{player?.club_name}</p>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2 italic leading-relaxed mb-4">"{report.general_notes || report.technical_comment}"</p>
                    <div className="flex items-center justify-between">
                      <div className="px-2 py-0.5 bg-slate-950 text-[9px] font-black text-amber-500 rounded-lg border border-slate-800 italic">
                        SCORE: {report.match_rating || 'N/A'}
                      </div>
                      <span className="text-[9px] font-black text-slate-700 uppercase tabular-nums">
                         {format(new Date(report.created_at), 'dd MMM yy')}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                <h3 className="text-xl font-black text-slate-100 italic tracking-tight uppercase">CALENDARIO ACTIVO</h3>
              </div>
              <button onClick={() => onTabChange('matches')} className="text-[10px] font-black text-slate-600 uppercase tracking-widest hover:text-white transition-colors">Expandir Agenda</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {recentMatches.map((match, idx) => (
                <motion.div 
                  key={match.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => onSelectMatch(match)}
                  className="group bg-slate-900/40 border border-slate-800/80 rounded-[2rem] p-5 hover:bg-emerald-500/[0.03] hover:border-emerald-500/30 transition-all cursor-pointer active:scale-95 shadow-lg"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-2 py-0.5 bg-slate-950 text-[9px] font-black text-emerald-500 rounded-lg border border-slate-800 uppercase tabular-nums">
                      {format(new Date(match.date), 'dd MMM')}
                    </span>
                    <ArrowUpRight size={14} className="text-slate-800 group-hover:text-emerald-500 transition-all" />
                  </div>
                  <div className="space-y-1 mb-4">
                    <p className="text-[11px] font-black text-white italic tracking-tight uppercase truncate">{match.home_team_name || match.home_team}</p>
                    <div className="flex items-center gap-2">
                       <div className="h-px flex-1 bg-slate-800" />
                       <span className="text-[9px] font-black text-slate-800 italic">VS</span>
                       <div className="h-px flex-1 bg-slate-800" />
                    </div>
                    <p className="text-[11px] font-black text-white italic tracking-tight uppercase truncate">{match.home_team_name || match.away_team}</p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/50">
                     <span className="text-[9px] font-black text-slate-600 uppercase italic truncate">{match.stadium || match.venue}</span>
                     <p className="text-[10px] font-black text-slate-100 italic tabular-nums">{match.score || 'VS'}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        </div>

        <div className="lg:col-span-4 space-y-10">
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
              <h3 className="text-xl font-black text-slate-100 italic tracking-tight uppercase">RANKING PRO</h3>
            </div>
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-[2.5rem] p-6 space-y-4 shadow-2xl">
              {topPlayers.map((player, i) => (
                <motion.div 
                  key={player.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => onSelectPlayer(player)}
                  className="flex items-center gap-4 group cursor-pointer p-3 rounded-2xl hover:bg-blue-500/[0.05] transition-all active:scale-95"
                >
                  <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center font-black text-blue-500 text-lg group-hover:border-blue-500/50 transition-colors shadow-inner shrink-0">
                    {player.full_name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-black text-white italic tracking-tight uppercase truncate">{player.full_name}</h4>
                    <p className="text-[9px] font-bold text-slate-600 uppercase truncate">{player.main_position} • {player.club_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-blue-500 italic tabular-nums shadow-blue-500/20">{formatRating(player.global_rating || 0)}</p>
                  </div>
                </motion.div>
              ))}
              <button onClick={() => onTabChange('players')} className="w-full py-4 bg-slate-950/50 rounded-2xl text-[10px] font-black text-slate-600 hover:text-blue-400 hover:border-blue-500/30 transition-all border border-slate-800 uppercase tracking-[0.2em] mt-4">Database Global</button>
            </div>
          </section>

          <section className="bg-slate-900/40 border border-slate-800/80 rounded-[2.5rem] p-6 space-y-5 shadow-2xl overflow-hidden relative group">
             <div className="flex items-center justify-between relative z-10">
               <h3 className="text-xs font-black text-slate-100 italic tracking-tight uppercase flex items-center gap-2">
                 <Video size={14} className="text-purple-500" /> RECURSOS MULTIMEDIA
               </h3>
             </div>
             <div className="space-y-4 relative z-10">
                {recentVideos.map((video) => (
                  <div key={video.id} className="group/vid bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden cursor-pointer relative" onClick={() => video.player_id && players.find(p => p.id === video.player_id) && onSelectPlayer(players.find(p => p.id === video.player_id)!)}>
                     <div className="aspect-video bg-slate-900 flex items-center justify-center relative">
                        <Video size={24} className="text-slate-800 group-hover/vid:text-purple-500/50 transition-colors" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent opacity-80" />
                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                           <p className="text-[9px] font-black text-white italic uppercase tracking-tight truncate flex-1">
                              {players.find(p => p.id === video.player_id)?.full_name || video.title}
                           </p>
                           <Play size={10} className="text-purple-500 fill-purple-500" />
                        </div>
                     </div>
                  </div>
                ))}
             </div>
          </section>
        </div>
      </div>
    </div>
  );
});
