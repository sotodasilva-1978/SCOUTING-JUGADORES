import { ArrowLeft, Calendar, MapPin, Trophy, Users, FileText, Video as VideoIcon, Plus, ChevronRight, UserPlus, UserMinus } from 'lucide-react';
import { Match, Player, Report, Video } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState } from 'react';
import { cn } from '../lib/utils';

interface MatchDetailProps {
  match: Match;
  players: Player[];
  reports: Report[];
  videos: Video[];
  onBack: () => void;
  onAddPlayer: () => void;
  onLinkPlayer: () => void;
  onUnlinkPlayer: (playerId: string) => void;
  onCreateReport: (playerId: string, mode: 'RAPID' | 'COMPLETE') => void;
  onAddVideo: (video: Partial<Video>) => void;
  onSelectPlayer: (player: Player) => void;
}

export function MatchDetail({ 
  match, 
  players, 
  reports, 
  videos, 
  onBack, 
  onAddPlayer, 
  onLinkPlayer,
  onUnlinkPlayer,
  onCreateReport, 
  onAddVideo,
  onSelectPlayer 
}: MatchDetailProps) {
  const [activeTab, setActiveTab] = useState('jugadores');

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <button 
          onClick={onBack}
          className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 hover:text-white transition-all"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">
              {match.competition}
            </span>
            <span className="text-[10px] font-bold text-slate-500 font-mono">
              {format(new Date(match.date), "PPP", { locale: es })}
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-100">{match.home_team} {match.score} {match.away_team}</h1>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Observados</p>
          <p className="text-2xl font-black text-emerald-500">{players.length}</p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Informes</p>
          <p className="text-2xl font-black text-blue-500">{reports.length}</p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Vídeos</p>
          <p className="text-2xl font-black text-purple-500">{videos.length}</p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Sede</p>
          <p className="text-sm font-bold text-slate-100 truncate">{match.venue || 'No especificada'}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-900/50 p-1 rounded-2xl w-fit border border-slate-800">
        {[
          { id: 'jugadores', label: 'Jugadores', icon: Users },
          { id: 'informes', label: 'Informes', icon: FileText },
          { id: 'multimedia', label: 'Multimedia', icon: VideoIcon }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all",
              activeTab === tab.id 
                ? "bg-slate-800 text-emerald-500 shadow-inner" 
                : "text-slate-500 hover:text-slate-300"
            )}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-[400px]">
        {activeTab === 'jugadores' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-100 flex items-center gap-2">
                <Users size={18} className="text-emerald-500" />
                Jugadores Observados
              </h3>
              <button 
                onClick={onAddPlayer}
                className="flex items-center gap-2 text-xs font-black text-emerald-500 hover:text-emerald-400 transition-colors"
              >
                <Plus size={16} />
                Añadir Jugador
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {players.map(player => (
                <div 
                  key={player.id}
                  onClick={() => onSelectPlayer(player)}
                  className="group bg-slate-900/50 border border-slate-800 rounded-3xl p-5 hover:border-emerald-500/30 transition-all cursor-pointer flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-emerald-500 text-lg">
                    {player.full_name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-100 truncate group-hover:text-emerald-500 transition-colors">{player.full_name}</h4>
                    <p className="text-xs text-slate-500">{player.main_position} • {player.club_name}</p>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onCreateReport(player.id, 'RAPID');
                    }}
                    className="p-2 text-slate-400 hover:text-emerald-500 bg-slate-950 border border-slate-800 rounded-xl transition-all"
                    title="Crear informe"
                  >
                    <FileText size={18} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUnlinkPlayer(player.id);
                    }}
                    className="p-2 text-slate-600 hover:text-red-500 bg-slate-950 border border-slate-800 rounded-xl transition-all"
                    title="Desvincular jugador"
                  >
                    <UserMinus size={18} />
                  </button>
                  <ChevronRight size={20} className="text-slate-700 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                </div>
              ))}
              {players.length === 0 && (
                <div className="col-span-full py-12 text-center bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-3xl">
                  <UserPlus size={48} className="mx-auto text-slate-800 mb-4" />
                  <p className="text-slate-500 font-bold">No hay jugadores vinculados a este partido</p>
                  <button onClick={onLinkPlayer} className="mt-4 text-emerald-500 font-black text-xs hover:underline">Vincular primer jugador</button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'informes' && (
          <div className="space-y-6">
             <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-100 flex items-center gap-2">
                <FileText size={18} className="text-blue-500" />
                Informes del Encuentro
              </h3>
              <button 
                onClick={() => onCreateReport('', 'RAPID')}
                className="flex items-center gap-2 text-xs font-black text-blue-500 hover:text-blue-400 transition-colors"
              >
                <Plus size={16} />
                Nuevo Informe
              </button>
            </div>
            <div className="space-y-4">
              {reports.map(report => (
                <div key={report.id} className="bg-slate-900/50 border border-slate-800 rounded-3xl p-5 flex items-center gap-6">
                   <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center font-black text-blue-500 text-xl">
                      {report.match_rating}
                   </div>
                   <div className="flex-1">
                      <p className="font-bold text-slate-100">{players.find(p => p.id === report.player_id)?.full_name || 'Jugador'}</p>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">{report.recommendation} • {report.technical_comment}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Fecha</p>
                      <p className="text-xs font-bold text-slate-400 font-mono">{format(new Date(report.report_date), "dd/MM/yyyy")}</p>
                   </div>
                </div>
              ))}
              {reports.length === 0 && (
                <div className="py-12 text-center bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-3xl">
                  <FileText size={48} className="mx-auto text-slate-800 mb-4" />
                  <p className="text-slate-500 font-bold">No se han redactado informes aún</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'multimedia' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-100 flex items-center gap-2">
                <VideoIcon size={18} className="text-purple-500" />
                Colección de Vídeos
              </h3>
              <button 
                onClick={() => onAddVideo({ url: 'https://youtube.com', title: 'Nuevo Vídeo' })}
                className="flex items-center gap-2 text-xs font-black text-purple-500 hover:text-purple-400 transition-colors"
              >
                <Plus size={16} />
                Vincular Vídeo
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map(video => (
                <div key={video.id} className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden group">
                  <div className="aspect-video bg-slate-950 flex items-center justify-center relative">
                    <VideoIcon size={32} className="text-slate-800 group-hover:text-purple-500/30 transition-colors" />
                    <button className="absolute inset-0 flex items-center justify-center bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-all">
                       <span className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-black border border-white/20">Reproducir</span>
                    </button>
                  </div>
                  <div className="p-4">
                    <h4 className="font-bold text-slate-200 line-clamp-1">{video.title}</h4>
                    <p className="text-[10px] text-slate-500 mt-2 font-black uppercase tracking-widest">{video.platform}</p>
                  </div>
                </div>
              ))}
              {videos.length === 0 && (
                <div className="col-span-full py-12 text-center bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-3xl">
                  <VideoIcon size={48} className="mx-auto text-slate-800 mb-4" />
                  <p className="text-slate-500 font-bold">Sin multimedia asociada</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
