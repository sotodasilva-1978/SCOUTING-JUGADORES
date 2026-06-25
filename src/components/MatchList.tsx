import { Calendar, MapPin, ChevronRight, Trophy, Users } from 'lucide-react';
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
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 active:scale-95"
        >
          <Calendar size={18} />
          Nuevo Partido
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {matches.map((match) => (
          <div
            key={match.id}
            onClick={() => onSelectMatch(match)}
            className="group bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden hover:border-emerald-500/40 transition-all cursor-pointer hover:shadow-xl hover:shadow-emerald-900/10"
          >
            {/* Escalón 1 — Competición + Fecha */}
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <div className="flex items-center gap-2">
                <div className="bg-emerald-500/10 p-1.5 rounded-lg border border-emerald-500/20">
                  <Trophy size={13} className="text-emerald-500" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-widest text-emerald-500">
                  {match.competition}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                <Calendar size={12} className="text-slate-600" />
                {format(new Date(match.date), "d MMM yyyy", { locale: es })}
              </div>
            </div>

            {/* Escalón 2 — Enfrentamiento */}
            <div className="flex items-center gap-4 px-5 py-3 border-t border-slate-800/60">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-0.5">Local</p>
                <p className="font-black text-slate-100 text-base truncate leading-tight">{match.home_team}</p>
              </div>
              <div className="flex-shrink-0 text-center px-3">
                <span className="text-2xl font-black text-emerald-400 tracking-tight leading-none">
                  {match.score || 'vs'}
                </span>
              </div>
              <div className="flex-1 min-w-0 text-right">
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-0.5">Visitante</p>
                <p className="font-black text-slate-100 text-base truncate leading-tight">{match.away_team}</p>
              </div>
            </div>

            {/* Escalón 3 — Sede + Observados + Flecha */}
            <div className="flex items-center justify-between px-5 py-2.5 border-t border-slate-800/60 bg-slate-950/30">
              <div className="flex items-center gap-4">
                {match.venue && (
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                    <MapPin size={12} className="text-slate-600" />
                    <span className="truncate max-w-[140px]">{match.venue}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-[11px] font-bold">
                  <Users size={12} className="text-slate-600" />
                  <span className="text-emerald-500">{match.observed_players_ids.length}</span>
                  <span className="text-slate-500">observados</span>
                </div>
              </div>
              <ChevronRight
                size={16}
                className="text-slate-700 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all flex-shrink-0"
              />
            </div>
          </div>
        ))}

        {matches.length === 0 && (
          <div className="py-20 text-center border-2 border-dashed border-slate-800 rounded-2xl">
            <Trophy size={40} className="mx-auto text-slate-800 mb-3" />
            <p className="text-slate-500 font-bold">No hay partidos registrados</p>
            <button onClick={onNewMatch} className="mt-3 text-emerald-500 text-xs font-black hover:underline">
              Registrar primer partido
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
