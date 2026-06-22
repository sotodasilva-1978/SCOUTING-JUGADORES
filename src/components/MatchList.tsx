import { Calendar, MapPin, ChevronRight, Trophy } from 'lucide-react';
import { Match } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface MatchListProps {
  matches: Match[];
  onSelectMatch: (match: Match) => void;
  onNewMatch: () => void;
}

export function MatchList({ matches, onSelectMatch, onNewMatch }: MatchListProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-100 tracking-tight">Partidos Observados</h1>
          <p className="text-slate-500 font-medium">Gestiona y analiza los encuentros grabados</p>
        </div>
        <button 
          onClick={onNewMatch}
          className="bg-emerald-600 hover:bg-emerald-500 text-slate-900 px-6 py-3 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 active:scale-95"
        >
          <Calendar size={18} />
          Nuevo Partido
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {matches.map((match) => (
          <div 
            key={match.id}
            onClick={() => onSelectMatch(match)}
            className="group bg-slate-900/50 border border-slate-800 rounded-3xl p-6 hover:border-emerald-500/30 transition-all cursor-pointer hover:shadow-2xl hover:shadow-emerald-900/10"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-emerald-500 group-hover:border-emerald-500/50 transition-colors">
                <Trophy size={20} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-800/50 px-3 py-1 rounded-full">
                {match.competition}
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-center">
                <div className="flex-1">
                  <p className="text-xs font-black text-slate-500 uppercase tracking-tighter mb-1">Local</p>
                  <p className="font-bold text-slate-100 truncate">{match.home_team}</p>
                </div>
                <div className="px-4">
                  <span className="text-2xl font-black text-emerald-500">{match.score || 'vs'}</span>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-black text-slate-500 uppercase tracking-tighter mb-1">Visitante</p>
                  <p className="font-bold text-slate-100 truncate">{match.away_team}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs text-slate-400 font-medium font-mono">
                  <Calendar size={14} className="text-slate-600" />
                  {format(new Date(match.date), "PPP", { locale: es })}
                </div>
                {match.venue && (
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                    <MapPin size={14} className="text-slate-600" />
                    {match.venue}
                  </div>
                )}
              </div>

              <div className="pt-4 flex items-center justify-between">
                <p className="text-xs font-bold text-slate-500">
                  <span className="text-emerald-500">{match.observed_players_ids.length}</span> Jugadores observados
                </p>
                <ChevronRight size={18} className="text-slate-600 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
