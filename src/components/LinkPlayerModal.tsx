import { X, Search, UserCheck, Link } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useMemo } from 'react';
import { Player } from '../types';

interface LinkPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  allPlayers: Player[];
  alreadyLinkedIds: string[];
  onLink: (playerId: string) => void;
}

export function LinkPlayerModal({ isOpen, onClose, allPlayers, alreadyLinkedIds, onLink }: LinkPlayerModalProps) {
  const [search, setSearch] = useState('');

  const available = useMemo(() => {
    const notLinked = allPlayers.filter(p => !alreadyLinkedIds.includes(p.id));
    if (!search.trim()) return notLinked;
    const q = search.toLowerCase();
    return notLinked.filter(p =>
      p.full_name.toLowerCase().includes(q) ||
      (p.club_name || '').toLowerCase().includes(q) ||
      (p.main_position || '').toLowerCase().includes(q)
    );
  }, [allPlayers, alreadyLinkedIds, search]);

  const handleLink = (playerId: string) => {
    onLink(playerId);
    onClose();
    setSearch('');
  };

  const handleClose = () => {
    onClose();
    setSearch('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-md shadow-2xl flex flex-col max-h-[80vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-900/30 p-2.5 rounded-xl border border-emerald-700/40">
                  <Link size={18} className="text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-100">Vincular Jugador</h2>
                  <p className="text-xs text-slate-500 font-medium">Selecciona un jugador en seguimiento</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="text-slate-500 hover:text-slate-300 bg-slate-800 hover:bg-slate-700 p-2 rounded-xl transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Search */}
            <div className="relative mb-4 flex-shrink-0">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por nombre, club o posición..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                autoFocus
              />
            </div>

            {/* Player list */}
            <div className="overflow-y-auto flex-1 space-y-2 pr-1">
              {available.length === 0 && (
                <div className="py-10 text-center">
                  <UserCheck size={36} className="mx-auto text-slate-700 mb-3" />
                  <p className="text-slate-500 text-sm font-bold">
                    {allPlayers.length === alreadyLinkedIds.length
                      ? 'Todos los jugadores ya están vinculados'
                      : 'No se encontraron jugadores'}
                  </p>
                </div>
              )}
              {available.map(player => (
                <button
                  key={player.id}
                  onClick={() => handleLink(player.id)}
                  className="w-full flex items-center gap-3 p-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-emerald-500/40 rounded-2xl transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-700 border border-slate-600 flex items-center justify-center font-black text-emerald-400 text-base flex-shrink-0">
                    {player.full_name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-100 text-sm truncate group-hover:text-emerald-400 transition-colors">{player.full_name}</p>
                    <p className="text-xs text-slate-500 truncate">{player.main_position} {player.club_name ? `• ${player.club_name}` : ''}</p>
                  </div>
                  <span className="text-[10px] font-black text-slate-500 bg-slate-700 px-2 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0">
                    {player.status === 'TRACKING' ? 'Seguimiento' : player.status === 'SIGNED' ? 'Fichado' : player.status || ''}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
